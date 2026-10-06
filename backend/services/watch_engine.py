from .prediction import model, REGIME_NAMES


def generate_watch_signals(df, X, features=None):
    if len(df) < 2 or len(X) < 2:
        raise ValueError("At least two complete rows are required for WATCH signals")
    today = df.iloc[-1]
    yesterday = df.iloc[-2]

    today_X = X.iloc[[-1]]
    yesterday_X = X.iloc[[-2]]

    today_regime = model.predict(today_X)[0]
    yesterday_regime = model.predict(yesterday_X)[0]

    today_name = REGIME_NAMES[today_regime]
    yesterday_name = REGIME_NAMES[yesterday_regime]

    momentum_change = (
        today["momentum_20d"] - yesterday["momentum_20d"]
    )

    volatility_change = (
        today["volatility_20d"] - yesterday["volatility_20d"]
    )

    sentiment_change = (
        today["sentiment_lag1"] - yesterday["sentiment_lag1"]
    )

    volume_change = (
        today["volume_ratio"] - yesterday["volume_ratio"]
    )

    drawdown_change = (
        today["drawdown"] - yesterday["drawdown"]
    )

    intraday_change = (
        today["intraday_range"] - yesterday["intraday_range"]
    )

    watch_signals = []

    if sentiment_change <= -10:
        watch_signals.append({
            "Signal": "Sharp sentiment deterioration",
            "Reason": f"Sentiment fell by {abs(sentiment_change):.1f} points.",
            "Severity": 3
        })
    elif sentiment_change <= -3:
        watch_signals.append({
            "Signal": "Sentiment deterioration",
            "Reason": f"Sentiment fell by {abs(sentiment_change):.1f} points.",
            "Severity": 2
        })

    if volatility_change >= 0.003:
        watch_signals.append({
            "Signal": "Sharp volatility increase",
            "Reason": "20-day volatility increased significantly.",
            "Severity": 3
        })
    elif volatility_change >= 0.001:
        watch_signals.append({
            "Signal": "Volatility increase",
            "Reason": "20-day volatility increased.",
            "Severity": 2
        })

    if momentum_change <= -0.01:
        watch_signals.append({
            "Signal": "Momentum deterioration",
            "Reason": "20-day momentum weakened significantly.",
            "Severity": 3
        })
    elif momentum_change <= -0.002:
        watch_signals.append({
            "Signal": "Momentum weakening",
            "Reason": "20-day momentum weakened.",
            "Severity": 2
        })

    if volume_change >= 0.20:
        watch_signals.append({
            "Signal": "Unusually high trading activity",
            "Reason": "Volume ratio increased significantly.",
            "Severity": 2
        })

    if drawdown_change <= -0.03:
        watch_signals.append({
            "Signal": "Drawdown worsening",
            "Reason": "The market moved significantly further below its previous peak.",
            "Severity": 3
        })
    elif drawdown_change <= -0.01:
        watch_signals.append({
            "Signal": "Drawdown increasing",
            "Reason": "The market moved further below its previous peak.",
            "Severity": 2
        })

    if intraday_change >= 0.005:
        watch_signals.append({
            "Signal": "Larger intraday price swings",
            "Reason": "Intraday price movement increased noticeably.",
            "Severity": 2
        })

    if momentum_change >= 0.01 and sentiment_change >= 5:
        watch_signals.append({
            "Signal": "Momentum and sentiment accelerating",
            "Reason": "Momentum strengthened while sentiment also improved.",
            "Severity": 2
        })

    if (
        momentum_change <= -0.01
        and sentiment_change <= -5
        and volatility_change >= 0.001
    ):
        watch_signals.append({
            "Signal": "Multiple stress signals aligned",
            "Reason": (
                "Momentum weakened, sentiment deteriorated, "
                "and volatility increased simultaneously."
            ),
            "Severity": 3
        })

    if today_regime != yesterday_regime:
        watch_signals.append({
            "Signal": "Market regime changed",
            "Reason": f"{yesterday_name} → {today_name}",
            "Severity": 3
        })

    watch_score = sum(
        signal["Severity"] for signal in watch_signals
    )

    if watch_score >= 7:
        watch_level = "HIGH"
    elif watch_score >= 4:
        watch_level = "MODERATE"
    elif watch_score >= 1:
        watch_level = "LOW"
    else:
        watch_level = "NORMAL"

    return {
        "watch_score": watch_score,
        "watch_level": watch_level,
        "signals": watch_signals,
        "today_regime": today_name,
        "yesterday_regime": yesterday_name
    }


def detect_regime_conflict(df, X):
    if len(df) < 2 or len(X) < 2:
        raise ValueError("At least two complete rows are required for regime conflict detection")
    today = df.iloc[-1]
    yesterday = df.iloc[-2]

    today_regime = model.predict(X.iloc[[-1]])[0]

    momentum_change = (
        today["momentum_20d"] - yesterday["momentum_20d"]
    )

    sentiment_change = (
        today["sentiment_lag1"] - yesterday["sentiment_lag1"]
    )

    volatility_change = (
        today["volatility_20d"] - yesterday["volatility_20d"]
    )

    stress_signals = 0

    if momentum_change < 0:
        stress_signals += 1

    if sentiment_change < 0:
        stress_signals += 1

    if volatility_change > 0:
        stress_signals += 1

    if today_regime == 0 and stress_signals >= 2:
        return True, (
            "Balanced regime, but multiple stress signals are increasing."
        )

    if today_regime == 0:
        positive_signals = 0

        if momentum_change > 0:
            positive_signals += 1

        if sentiment_change > 0:
            positive_signals += 1

        if volatility_change > 0:
            positive_signals += 1

        if positive_signals >= 2:
            return True, (
                "Balanced regime, but momentum and sentiment are strengthening."
            )

    return False, None
