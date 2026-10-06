import math
import threading
import time
from datetime import datetime, time as dtime
import numpy as np
import pandas as pd
import shap
import yfinance as yf

from .market_data import get_market_data
from .feature_engineering import create_market_features, prepare_model_input
from .sentiment import add_sentiment_features
from .prediction import apply_hype_threshold, REGIME_NAMES, FEATURES, model
from .why_engine import build_why_explanation, generate_why_report, interpret_feature
from .what_changed import generate_what_changed_report
from .watch_engine import generate_watch_signals

try:
    from scipy.stats import percentileofscore
except Exception:  # pragma: no cover - scipy is already a dependency
    percentileofscore = None


PIPELINE_CACHE_TTL_SECONDS = 600  # 10 minutes

# Frontend symbols -> Yahoo Finance tickers (the frontend uses SPX/NDX/DJI/VIX)
YF_SYMBOL_MAP = {
    "SPX": "^GSPC",
    "NDX": "^NDX",
    "DJI": "^DJI",
    "DOW": "^DJI",
    "VIX": "^VIX",
    "NASDAQ": "^IXIC",
    "RUT": "^RUT",
}

SYMBOL_NAMES = {
    "SPX": "S&P 500",
    "NDX": "NASDAQ 100",
    "DJI": "Dow Jones",
    "DOW": "Dow Jones",
    "VIX": "CBOE Volatility",
    "NASDAQ": "NASDAQ Composite",
    "RUT": "Russell 2000",
    "SPY": "SPDR S&P 500 ETF",
}

MINI_CARD_SYMBOLS = ["SPX", "NDX", "DJI", "VIX"]

WATCHLIST = [
    ("AAPL", "Apple Inc.", "Technology"),
    ("MSFT", "Microsoft Corp.", "Technology"),
    ("NVDA", "NVIDIA Corp.", "Semiconductors"),
    ("AMZN", "Amazon.com Inc.", "Consumer Discretionary"),
    ("META", "Meta Platforms", "Communication"),
    ("GOOGL", "Alphabet Inc.", "Communication"),
    ("TSLA", "Tesla Inc.", "Consumer Discretionary"),
    ("JPM", "JPMorgan Chase", "Financials"),
]


REGIME_KEY_BY_NAME = {
    "balanced": "value", "value": "value", "value-driven": "value",
    "calm": "value", "normal": "value", "neutral": "value",
    "hype": "hype", "euphoria": "hype", "greed": "hype", "speculative": "hype",
    "panic": "panic", "fear": "panic", "crisis": "panic", "stress": "panic",
}
DISPLAY_BY_KEY = {"value": "Value-Driven", "hype": "Hype", "panic": "Panic"}
SHORT_BY_KEY = {"value": "VALUE", "hype": "HYPE", "panic": "PANIC"}

FEATURE_DISPLAY = {
    "daily_return": "Daily Return", "volatility_20d": "Volatility",
    "volume_ratio": "Volume", "momentum_20d": "Momentum",
    "price_ma50_ratio": "Price vs MA50", "RSI": "RSI", "drawdown": "Drawdown",
    "return_5d": "5D Return", "return_20d": "20D Return",
    "intraday_range": "Intraday Range", "sentiment_lag1": "Sentiment",
    "sentiment_change": "Sentiment Change", "sentiment_deviation": "Sentiment Deviation",
}
FEATURE_WINDOW = {
    "daily_return": "1D", "volatility_20d": "20D Rolling Std",
    "volume_ratio": "Vol vs 20D MA", "momentum_20d": "20D ROC",
    "price_ma50_ratio": "50D SMA Spread", "RSI": "14D RSI",
    "drawdown": "Drawdown from Peak", "return_5d": "5D Rolling",
    "return_20d": "20D Rolling", "intraday_range": "Intraday (H-L)/C",
    "sentiment_lag1": "CNN F&G Lag 1D", "sentiment_change": "CNN F&G 1D Change",
    "sentiment_deviation": "CNN F&G vs 5D MA",
}
SENTIMENT_FEATURES = {"sentiment_lag1", "sentiment_change", "sentiment_deviation"}
GOOD_IF_UP = {
    "momentum_20d", "return_5d", "return_20d", "daily_return",
    "price_ma50_ratio", "sentiment_lag1", "sentiment_change",
    "sentiment_deviation", "RSI", "drawdown",
}


# =============================================================================
# PIPELINE (run once per symbol, cached)
# =============================================================================

_CACHE = {}
_KEY_LOCKS = {}
_CACHE_GUARD = threading.Lock()


def _to_native(obj):
    """Recursively convert numpy/pandas scalars to plain Python for JSON."""
    if isinstance(obj, dict):
        return {str(k): _to_native(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_to_native(v) for v in obj]
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        val = float(obj)
        return None if (math.isnan(val) or math.isinf(val)) else val
    if isinstance(obj, np.bool_):
        return bool(obj)
    if isinstance(obj, np.ndarray):
        return [_to_native(v) for v in obj.tolist()]
    if isinstance(obj, (pd.Timestamp, datetime)):
        return str(obj)
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    return obj


def regime_key_from_name(name):
    n = str(name).strip().lower()
    if n in REGIME_KEY_BY_NAME:
        return REGIME_KEY_BY_NAME[n]
    for token, key in (
        ("hype", "hype"), ("euphor", "hype"), ("greed", "hype"), ("speculat", "hype"),
        ("panic", "panic"), ("fear", "panic"), ("crisis", "panic"), ("stress", "panic"),
        ("value", "value"), ("balanced", "value"), ("calm", "value"),
    ):
        if token in n:
            return key
    return "value"


def yf_symbol(symbol):
    return YF_SYMBOL_MAP.get(symbol.upper().strip(), symbol.upper().strip())


def run_pipeline(symbol):
    """Full model pipeline — the body of your original /predict route."""
    symbol = symbol.upper().strip()
    df = get_market_data(yf_symbol(symbol))
    if df is None or df.empty:
        raise ValueError(f"No market data available for {symbol}")

    df = create_market_features(df)
    df = add_sentiment_features(df)
    if df.empty:
        raise ValueError("No rows remain after sentiment processing.")

    missing = [f for f in FEATURES if f not in df.columns]
    if missing:
        raise ValueError(f"Missing model features: {missing}")

    X = df[FEATURES].copy()
    latest_features = X.iloc[[-1]].copy()

    predictions, probabilities = apply_hype_threshold(latest_features)
    regime = int(predictions[0])
    class_ids = list(model.classes_)
    regime_idx = class_ids.index(regime)

    probability_dict_pct = {
        REGIME_NAMES[int(c)]: round(float(probabilities[0, i]) * 100, 2)
        for i, c in enumerate(class_ids)
    }
    confidence_pct = round(float(probabilities[0, regime_idx]) * 100, 2)

    # ---- SHAP (same logic as your /predict route) ----
    explainer = shap.TreeExplainer(model)
    shap_result = explainer.shap_values(latest_features)
    if isinstance(shap_result, list):
        shap_for_regime = shap_result[regime_idx][0]
    else:
        shap_arr = shap_result
        if hasattr(shap_arr, "values"):
            shap_arr = shap_arr.values
        if len(shap_arr.shape) == 3:
            shap_for_regime = shap_arr[0, :, regime_idx]
        else:
            shap_for_regime = shap_arr[0]

    explanation = build_why_explanation(X, shap_for_regime, FEATURES)
    why_report = generate_why_report(regime, probabilities[0], explanation)
    what_report = generate_what_changed_report(df, X, FEATURES, top_n=5)
    watch_report = generate_watch_signals(df, X, FEATURES)

    if "Date" in df.columns:
        latest_date = str(pd.Timestamp(df["Date"].iloc[-1]).date())
    else:
        latest_date = str(pd.Timestamp(df.index[-1]).date())

    regime_name = REGIME_NAMES[regime]
    probs_by_key = {"value": 0.0, "hype": 0.0, "panic": 0.0}
    for name, pct in probability_dict_pct.items():
        probs_by_key[regime_key_from_name(name)] += float(pct) / 100.0

    return {
        "symbol": symbol,
        "display_name": SYMBOL_NAMES.get(symbol, symbol),
        "df": df,
        "X": X,
        "latest": df.iloc[-1],
        "regime": regime,
        "regime_name": regime_name,
        "regime_key": regime_key_from_name(regime_name),
        "probability_dict_pct": probability_dict_pct,
        "probs_by_key": probs_by_key,
        "confidence_pct": confidence_pct,
        "explanation": explanation,
        "why_report": why_report,
        "what_report": what_report,
        "watch_report": watch_report,
        "latest_date": latest_date,
        "data_points": len(df),
    }


def run_pipeline_cached(symbol):
    """Thread-safe TTL cache. The frontend requests 5 endpoints in parallel —
    without this the pipeline would run 5x per page load."""
    key = symbol.upper().strip()
    now = time.time()
    hit = _CACHE.get(key)
    if hit and now - hit[0] < PIPELINE_CACHE_TTL_SECONDS:
        return hit[1]

    with _CACHE_GUARD:
        lock = _KEY_LOCKS.setdefault(key, threading.Lock())
    with lock:
        hit = _CACHE.get(key)  # double-check after acquiring the lock
        if hit and time.time() - hit[0] < PIPELINE_CACHE_TTL_SECONDS:
            return hit[1]
        result = run_pipeline(key)
        _CACHE[key] = (time.time(), result)
        return result

def _zscore_str(X, feature, value):
    col = X[feature].astype(float)
    std = float(col.std())
    if not std or math.isnan(std):
        return "+0.00σ"
    z = (float(value) - float(col.mean())) / std
    return f"{z:+.2f}σ"

def _percentile(X, feature, value):
    if percentileofscore is None:
        return 50.0
    return float(percentileofscore(X[feature].astype(float), float(value), kind="rank"))


def _fmt_change(feature, change):
    if feature in SENTIMENT_FEATURES:
        return f"{change:+.1f} pts"
    if feature == "RSI":
        return f"{change:+.1f}"
    return f"{change * 100:+.1f}%"


def _market_status_now():
    try:
        from zoneinfo import ZoneInfo
        now = datetime.now(ZoneInfo("America/New_York"))
    except Exception:
        now = datetime.utcnow()  # fallback: treat UTC as approximate ET
    if now.weekday() >= 5:
        return "Market Closed"
    return "Market Open" if dtime(9, 30) <= now.time() <= dtime(16, 0) else "Market Closed"


def _last_updated():
    try:
        from zoneinfo import ZoneInfo
        return datetime.now(ZoneInfo("America/New_York")).strftime("%H:%M:%S")
    except Exception:
        return datetime.utcnow().strftime("%H:%M:%S")


def _sparkline(series, n=30):
    vals = [float(v) for v in series.tail(n).tolist()]
    return [round(v, 2) for v in vals if not (isinstance(v, float) and math.isnan(v))]


def _risk_from_latest(latest):
    vol = float(latest.get("volatility_20d", 0.015) or 0.015)
    dd = float(latest.get("drawdown", 0.0) or 0.0)
    sent = float(latest.get("sentiment_lag1", 50.0) or 50.0)
    vol_ratio = float(latest.get("volume_ratio", 1.0) or 1.0)

    vol_score = max(0.0, min(100.0, vol / 0.04 * 100.0))
    dd_score = max(0.0, min(100.0, abs(dd) / 0.20 * 100.0))
    sent_score = max(0.0, min(100.0, (sent - 50.0) * 2.0))
    volm_score = max(0.0, min(100.0, (vol_ratio - 0.8) / 1.2 * 100.0))

    score = int(round(0.40 * vol_score + 0.30 * dd_score + 0.20 * sent_score + 0.10 * volm_score))
    if score < 35:
        label = "LOW"
    elif score < 50:
        label = "MODERATE-LOW"
    elif score < 65:
        label = "MODERATE"
    elif score < 80:
        label = "HIGH"
    else:
        label = "SEVERE"

    def band(v):
        if v < 35:
            return "LOW", "value"
        if v < 68:
            return "MEDIUM", "warning"
        return "HIGH", "panic"

    f_vol = band(vol_score)
    f_dd = band(dd_score)
    f_vm = band(volm_score)
    f_sent = band(sent_score)

    risk = {
        "score": score,
        "max": 100,
        "label": label,
        "summary": (
            f"Composite risk is {label.lower()} "
            f"(volatility {vol * 100:.1f}%, drawdown {dd * 100:.1f}%, "
            f"sentiment {sent:.0f})."
        ),
        "factors": [
            {"name": "Volatility", "level": f_vol[0], "tone": f_vol[1], "score": int(vol_score)},
            {"name": "Drawdown", "level": f_dd[0], "tone": f_dd[1], "score": int(dd_score)},
            {"name": "Volume", "level": f_vm[0], "tone": f_vm[1], "score": int(volm_score)},
            {"name": "Sentiment", "level": f_sent[0], "tone": f_sent[1], "score": int(sent_score)},
        ],
    }
    return _to_native(risk)


def market_payload(symbol):
    """GET /api/market — header bar + mini market cards."""
    p = run_pipeline_cached(symbol)
    latest = p["latest"]
    price = float(latest["Close"])
    change = float(latest["daily_return"]) * 100.0

    mini = []
    for sym in MINI_CARD_SYMBOLS:
        if sym == p["symbol"]:
            mini.append({
                "symbol": sym,
                "name": p["display_name"],
                "price": round(price, 2),
                "change": round(change, 2),
                "regime": DISPLAY_BY_KEY[p["regime_key"]],
                "regimeKey": p["regime_key"],
                "sparkline": _sparkline(p["df"]["Close"]),
            })
        else:
            try:
                mini.append(_mini_card_snapshot(sym))
            except Exception as exc:  # one bad quote must not kill the page
                print(f"mini card skip {sym}: {exc}")

    return _to_native({
        "symbol": p["symbol"],
        "name": p["display_name"],
        "price": round(price, 2),
        "change": round(change, 2),
        "marketStatus": _market_status_now(),
        "lastUpdated": _last_updated(),
        "miniCards": mini,
    })


def _mini_card_snapshot(sym):
    """Fast price + quick regime for one mini card (no SHAP)."""
    snap = quick_snapshot(sym)
    return {
        "symbol": sym,
        "name": SYMBOL_NAMES.get(sym, sym),
        "price": snap["price"],
        "change": snap["change"],
        "regime": DISPLAY_BY_KEY[snap["regime_key"]],
        "regimeKey": snap["regime_key"],
        "sparkline": snap["sparkline"],
    }


def regime_payload(symbol):
    """GET /api/regime — hero card, probability bars, story, pillars, alert."""
    p = run_pipeline_cached(symbol)
    key = p["regime_key"]
    latest = p["latest"]

    # --- story ---
    interp = list(p["explanation"]["Interpretation"].head(3))
    narrative = (
        f"Confidence is {p['confidence_pct']:.0f}%. "
        + " ".join(interp)
    )
    signals = p["watch_report"].get("signals", [])
    watch_text = (
        signals[0]["Reason"]
        if signals
        else "Watch for volatility expansion or sentiment deterioration that could signal a regime transition."
    )

    # --- transition alert ---
    regime_changed = bool(p["what_report"].get("regime_changed", False))
    alert_signal = next((s for s in signals if "regime" in s["Signal"].lower()), None)
    transition_alert = {
        "active": regime_changed,
        "from": str(p["what_report"].get("yesterday_regime", "")).upper(),
        "to": str(p["what_report"].get("today_regime", "")).upper(),
        "sectorScope": "Model-detected transition across tracked features",
        "confidence": round(p["confidence_pct"] / 100.0, 2),
        "detectedAgo": f"Latest session close ({p['latest_date']})",
        "primaryDriver": alert_signal["Reason"] if alert_signal else "Regime model transition",
    }

    # --- flow pillars ---
    mom = float(latest.get("momentum_20d", 0.0))
    senti = float(latest.get("sentiment_lag1", 50.0))
    vol = float(latest.get("volatility_20d", 0.015))

    if mom >= 0.05:
        mom_state = ("HIGH", "value")
    elif mom >= 0:
        mom_state = ("POSITIVE", "value")
    elif mom >= -0.05:
        mom_state = ("FADING", "warning")
    else:
        mom_state = ("NEGATIVE", "panic")

    if senti >= 60:
        sent_state = ("POSITIVE", "value")
    elif senti >= 45:
        sent_state = ("NEUTRAL", "controlled")
    elif senti >= 30:
        sent_state = ("WEAK", "warning")
    else:
        sent_state = ("NEGATIVE", "panic")

    if vol <= 0.012:
        vol_state = ("LOW", "controlled")
    elif vol <= 0.02:
        vol_state = ("ELEVATED", "warning")
    else:
        vol_state = ("HIGH", "panic")

    return _to_native({
        "symbol": p["symbol"],
        "current": DISPLAY_BY_KEY[key],
        "key": key,
        "confidence": round(p["confidence_pct"] / 100.0, 4),
        "probabilities": {k: round(v, 4) for k, v in p["probs_by_key"].items()},
        "story": {
            "headline": f"The market is currently {DISPLAY_BY_KEY[key]}.",
            "narrative": narrative,
            "watch": watch_text,
        },
        "flowPillars": [
            {"name": "MOMENTUM", "state": mom_state[0], "tone": mom_state[1]},
            {"name": "SENTIMENT", "state": sent_state[0], "tone": sent_state[1]},
            {"name": "VOLATILITY", "state": vol_state[0], "tone": vol_state[1]},
        ],
        "transitionAlert": transition_alert,
        "modelMetadata": model_metadata(p),
    })


def why_payload(symbol):
    """GET /api/why — driver bars from SHAP explanation."""
    p = run_pipeline_cached(symbol)
    expl = p["explanation"]
    changes = {
        r["Feature"]: float(r["Change"])
        for r in p["what_report"]["important_changes"]          # list of dicts
    }
    max_shap = float(expl["Absolute_SHAP"].max()) or 1.0
    total_shap = float(expl["Absolute_SHAP"].sum()) or 1.0

    drivers = []
    for _, row in expl.head(5).iterrows():
        feature = row["Feature"]
        shap_val = float(row["SHAP_Value"])
        change = changes.get(feature, 0.0)
        share = float(row["Absolute_SHAP"]) / total_shap

        if change > 0:
            direction, arrow = "positive", "↑"
        elif change < 0:
            direction, arrow = "negative", "↓"
        else:
            direction, arrow = "elevated", "→"

        magnitude = "HIGH" if share >= 0.25 else "MEDIUM" if share >= 0.12 else "LOW"
        bar_value = max(0.05, float(row["Absolute_SHAP"]) / max_shap)

        drivers.append({
            "name": FEATURE_DISPLAY.get(feature, feature),
            "value": round(bar_value, 2),
            "magnitude": magnitude,
            "direction": direction,
            "arrow": arrow,
            "interpretation": row["Interpretation"],
            "technical": {
                "zScore": _zscore_str(p["X"], feature, row["Feature_Value"]),
                "weight": f"{share:.2f}",
                "window": FEATURE_WINDOW.get(feature, "20D"),
            },
        })

    return _to_native({
        "symbol": p["symbol"],
        "regime": DISPLAY_BY_KEY[p["regime_key"]],
        "drivers": drivers,
        "modelMetadata": model_metadata(p),
    })


def what_changed_payload(symbol):
    """GET /api/what-changed — delta cards + regime pressure + risk thermometer."""
    p = run_pipeline_cached(symbol)
    deltas = []
    for row in p["what_report"]["important_changes"]:          # list of dicts
        feature = row["Feature"]
        change = float(row["Change"])
        good = feature in GOOD_IF_UP
        is_up = change > 0
        tone = "up" if (is_up == good) else "down"
        deltas.append({
            "name": FEATURE_DISPLAY.get(feature, feature),
            "change": _fmt_change(feature, change),
            "arrow": "↑" if change > 0 else "↓" if change < 0 else "→",
            "tone": tone,
            "period": "vs previous session",
        })

    top_desc = ""
    changes_list = p["what_report"]["important_changes"]
    if changes_list:
        top_desc = str(changes_list[0]["Description"])

    if p["what_report"].get("regime_changed"):
        summary = (
            f"Regime shifted {p['what_report']['yesterday_regime']} → "
            f"{p['what_report']['today_regime']}. {top_desc}"
        )
    else:
        summary = (
            f"Regime steady in {p['what_report']['today_regime']}. {top_desc}"
        )

    return _to_native({
        "symbol": p["symbol"],
        "deltas": deltas,
        "regimePressure": {
            "value": int(round(p["probs_by_key"]["value"] * 100)),
            "hype": int(round(p["probs_by_key"]["hype"] * 100)),
            "panic": int(round(p["probs_by_key"]["panic"] * 100)),
        },
        "summary": summary,
        "risk": _risk_from_latest(p["latest"]),
    })


def risk_payload(symbol):
    """GET /api/risk — standalone risk object (optional route)."""
    p = run_pipeline_cached(symbol)
    return _to_native({"symbol": p["symbol"], "risk": _risk_from_latest(p["latest"])})


def predict_response(symbol):
    """Legacy GET /predict/{ticker} — same shape as your original route."""
    p = run_pipeline_cached(symbol)
    return _to_native({
        "ticker": p["symbol"],
        "regime": p["regime"],
        "regime_name": p["regime_name"],
        "probabilities": p["probability_dict_pct"],
        "confidence": p["confidence_pct"],
        "data_points": p["data_points"],
        "latest_date": p["latest_date"],
        "why": p["why_report"],
        "what": p["what_report"],
        "watch": p["watch_report"],
    })


def model_metadata(p):
    return {
        "architecture": "Gradient Boosted Regime Ensemble + Hype Threshold (SHAP-explained)",
        "lookbackHorizon": f"{p['data_points']} trading days + CNN Fear & Greed sentiment",
        "ensembleAgreement": f"{p['confidence_pct']:.1f}% model confidence",
        "transitionEntropy": str(p["watch_report"].get("watch_level", "NORMAL")) + " watch level",
        "recalibrationTimestamp": f"{p['latest_date']} (latest data point)",
    }

def _batch_download(tickers, period="2y"):
    """One yfinance call for many tickers -> {ticker: OHLCV DataFrame}."""
    raw = yf.download(
        tickers=list(tickers),
        period=period,
        interval="1d",
        auto_adjust=True,
        progress=False,
        group_by="column",
        threads=True,
    )
    out = {}
    if raw is None or raw.empty:
        return out
    for t in tickers:
        try:
            if isinstance(raw.columns, pd.MultiIndex):
                try:
                    df = raw.xs(t, axis=1, level=-1, drop_level=True)
                except KeyError:
                    df = raw.xs(t, axis=1, level=0, drop_level=True)
            else:
                df = raw.copy()
            df = df.loc[:, ~df.columns.duplicated()].copy()
            df.index = pd.to_datetime(df.index)
            if getattr(df.index, "tz", None) is not None:
                df.index = df.index.tz_localize(None)
            needed = ["Open", "High", "Low", "Close", "Volume"]
            if all(c in df.columns for c in needed) and not df.empty:
                out[t] = df[needed].dropna().copy()
        except Exception as exc:  # pragma: no cover
            print(f"batch slice failed for {t}: {exc}")
    return out


def quick_snapshot(symbol):
    """Fast quote + light regime (no SHAP). Used by mini cards & watchlist.
    Result is cached with the same TTL as the full pipeline."""
    cache_key = f"quick::{symbol.upper().strip()}"
    now = time.time()
    hit = _CACHE.get(cache_key)
    if hit and now - hit[0] < PIPELINE_CACHE_TTL_SECONDS:
        return hit[1]

    symbol=symbol.upper().strip()
    frames=_batch_download([yf_symbol(symbol)])
    frame=frames.get(yf_symbol(symbol))
    if frame is None:
        raise ValueError(f"No market data available for {symbol}")

    feat = create_market_features(frame)
    feat = add_sentiment_features(feat)
    X = prepare_model_input(feat)
    pred, proba = apply_hype_threshold(X.iloc[[-1]])
    regime = int(pred[0])
    conf = float(proba[0, list(model.classes_).index(regime)])
    key = regime_key_from_name(REGIME_NAMES[regime])

    latest = feat.iloc[-1]
    price = float(latest["Close"])
    change = float(latest["daily_return"]) * 100.0

    # short human driver summary
    parts = []
    for feature in ("momentum_20d", "sentiment_lag1", "volatility_20d"):
        pct = _percentile(X, feature, latest[feature])
        parts.append(interpret_feature(feature, float(latest[feature]), pct))
    driver_summary = " ".join(parts[:2])

    risk = _risk_from_latest(latest)
    risk_short = "LOW" if risk["score"] < 40 else "MED" if risk["score"] < 65 else "HIGH"
    risk_key = "value" if risk["score"] < 40 else "warning" if risk["score"] < 65 else "panic"

    snap = _to_native({
        "symbol": symbol,
        "price": round(price, 2),
        "change": round(change, 2),
        "regime": SHORT_BY_KEY[key],
        "regimeFull": DISPLAY_BY_KEY[key],
        "regime_key": key,
        "confidence": int(round(conf * 100)),
        "risk": risk_short,
        "risk_key": risk_key,
        "trend": "↑" if change >= 0 else "↓",
        "driverSummary": driver_summary,
        "volumeDelta": f"{(float(latest.get('volume_ratio', 1.0)) - 1.0) * 100:+.1f}%",
        "sparkline": _sparkline(feat["Close"]),
    })
    _CACHE[cache_key] = (time.time(), snap)
    return snap

def watchlist_rows():
    """GET /api/watchlist — exact watchlist table shape."""
    rows = []
    for sym, name, sector in WATCHLIST:
        try:
            snap = quick_snapshot(sym)
        except Exception as exc:
            print(f"watchlist skip {sym}: {exc}")
            continue
        rows.append({
            "symbol": sym,
            "name": name,
            "sector": sector,
            "price": snap["price"],
            "change": snap["change"],
            "regime": snap["regime"],
            "regimeFull": snap["regimeFull"],
            "regimeKey": snap["regime_key"],
            "confidence": snap["confidence"],
            "risk": snap["risk"],
            "riskKey": snap["risk_key"],
            "trend": snap["trend"],
            "driverSummary": snap["driverSummary"],
            "volumeDelta": snap["volumeDelta"],
        })
    return _to_native(rows)
