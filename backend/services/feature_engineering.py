import pandas as pd

FEATURES = [
    "daily_return", "volatility_20d", "volume_ratio", "momentum_20d",
    "price_ma50_ratio", "RSI", "drawdown", "return_5d", "return_20d",
    "intraday_range", "sentiment_lag1", "sentiment_change", "sentiment_deviation",
]


def create_market_features(df):
    df = df.copy()

    df["daily_return"] = df["Close"].pct_change()
    df["volatility_20d"] = df["daily_return"].rolling(20).std()
    df["volume_change"] = df["Volume"].pct_change()
    df["volume_ma20"] = df["Volume"].rolling(20).mean()
    df["volume_ratio"] = df["Volume"] / df["volume_ma20"]
    df["momentum_20d"] = df["Close"] / df["Close"].shift(20) - 1
    df["MA50"] = df["Close"].rolling(50).mean()
    df["price_ma50_ratio"] = df["Close"] / df["MA50"]

    delta = df["Close"].diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.rolling(14).mean()
    avg_loss = loss.rolling(14).mean()
    rs = avg_gain / avg_loss
    df["RSI"] = 100 - (100 / (1 + rs))

    df["rolling_max"] = df["Close"].cummax()
    df["drawdown"] = df["Close"] / df["rolling_max"] - 1
    df["return_5d"] = df["Close"] / df["Close"].shift(5) - 1
    df["return_20d"] = df["Close"] / df["Close"].shift(20) - 1
    df["intraday_range"] = (df["High"] - df["Low"]) / df["Close"]

    return df.dropna().copy()


def prepare_model_input(df):
    missing = [f for f in FEATURES if f not in df.columns]
    if missing:
        raise ValueError(f"Missing model features: {missing}")
    clean = df.dropna(subset=FEATURES).copy()
    return clean[FEATURES]
