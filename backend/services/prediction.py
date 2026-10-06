from pathlib import Path
import joblib

BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_PATH = BASE_DIR / "models" / "market_regime.pkl"

FEATURES = [
    "daily_return", "volatility_20d", "volume_ratio", "momentum_20d",
    "price_ma50_ratio", "RSI", "drawdown", "return_5d", "return_20d",
    "intraday_range", "sentiment_lag1", "sentiment_change", "sentiment_deviation",
]

REGIME_NAMES = {0: "Balanced", 1: "Euphoria", 2: "Panic"}
HYPE_THRESHOLD = 0.30

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

model = joblib.load(MODEL_PATH)

# Fail early if the saved model and API feature contract ever drift apart.
model_features = list(getattr(model, "feature_names_in_", []))
if model_features and model_features != FEATURES:
    raise ValueError(
        "Saved model feature order does not match FEATURES.\n"
        f"Model: {model_features}\nAPI:   {FEATURES}"
    )


def predict_regime(X):
    return model.predict(X), model.predict_proba(X)


def apply_hype_threshold(X, threshold=HYPE_THRESHOLD):
    probabilities = model.predict_proba(X)
    predictions = model.predict(X).astype(int)

    if 1 in model.classes_:
        hype_index = list(model.classes_).index(1)
        predictions[probabilities[:, hype_index] >= threshold] = 1

    return predictions, probabilities
