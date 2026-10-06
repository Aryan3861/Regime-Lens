from main import build_latest_model_input
from services.prediction import apply_hype_threshold, model, REGIME_NAMES


df, X = build_latest_model_input("SPY")
predictions, probabilities = apply_hype_threshold(X)

print("Rows after preprocessing:", len(df))
print("Features:", list(X.columns))
print("Shape:", X.shape)
print("Prediction:", int(predictions[0]), REGIME_NAMES[int(predictions[0])])
print("Probabilities:", {
    REGIME_NAMES[int(c)]: round(float(probabilities[0, i]) * 100, 2)
    for i, c in enumerate(model.classes_)
})
