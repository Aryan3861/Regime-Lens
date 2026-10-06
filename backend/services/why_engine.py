import numpy as np
import pandas as pd
from scipy.stats import percentileofscore

from .prediction import REGIME_NAMES


def interpret_feature(feature, value, percentile):
    if feature == "momentum_20d":
        if percentile >= 80:
            return "20-day momentum is unusually strong."
        elif percentile <= 20:
            return "20-day momentum is unusually weak."
        else:
            return "20-day momentum is within its normal historical range."

    elif feature == "return_20d":
        if percentile >= 80:
            return "The 20-day return is unusually strong."
        elif percentile <= 20:
            return "The 20-day return is unusually weak."
        else:
            return "The 20-day return is within its normal historical range."

    elif feature == "volatility_20d":
        if percentile >= 80:
            return "20-day volatility is unusually high."
        elif percentile <= 20:
            return "20-day volatility is relatively low."
        else:
            return "20-day volatility is within its normal range."

    elif feature == "price_ma50_ratio":
        if value >= 1.05:
            return "Price is significantly above its 50-day moving average."
        elif value <= 0.95:
            return "Price is significantly below its 50-day moving average."
        elif value > 1:
            return "Price is slightly above its 50-day moving average."
        else:
            return "Price is slightly below its 50-day moving average."

    elif feature == "daily_return":
        if percentile >= 80:
            return "Today's return is unusually positive."
        elif percentile <= 20:
            return "Today's return is unusually negative."
        else:
            return "Today's return is within its normal historical range."

    elif feature == "volume_ratio":
        if value >= 1.5:
            return "Trading volume is significantly above its 20-day average."
        elif value >= 1.2:
            return "Trading volume is above its 20-day average."
        elif value <= 0.8:
            return "Trading volume is below its 20-day average."
        else:
            return "Trading volume is close to its normal level."

    elif feature == "RSI":
        if value >= 70:
            return "RSI indicates an overbought market."
        elif value <= 30:
            return "RSI indicates an oversold market."
        else:
            return "RSI is in a neutral range."

    elif feature == "drawdown":
        if value <= -0.20:
            return "The market is more than 20% below its previous peak."
        elif value <= -0.10:
            return "The market is experiencing a notable drawdown."
        elif value < 0:
            return "The market is slightly below its previous peak."
        else:
            return "The market is at or near its previous peak."

    elif feature == "return_5d":
        if percentile >= 80:
            return "The recent 5-day return is unusually strong."
        elif percentile <= 20:
            return "The recent 5-day return is unusually weak."
        else:
            return "The recent 5-day return is within its normal range."

    elif feature == "intraday_range":
        if percentile >= 80:
            return "Intraday price movement is unusually large."
        elif percentile <= 20:
            return "Intraday price movement is relatively calm."
        else:
            return "Intraday price movement is within its normal range."

    elif feature == "sentiment_lag1":
        if value >= 75:
            return "Previous-day market sentiment was strongly positive."
        elif value >= 55:
            return "Previous-day market sentiment was moderately positive."
        elif value <= 25:
            return "Previous-day market sentiment was strongly negative."
        elif value <= 45:
            return "Previous-day market sentiment was moderately negative."
        else:
            return "Previous-day market sentiment was relatively neutral."

    elif feature == "sentiment_change":
        if value >= 10:
            return "Market sentiment improved sharply."
        elif value <= -10:
            return "Market sentiment deteriorated sharply."
        elif value > 0:
            return "Market sentiment improved slightly."
        elif value < 0:
            return "Market sentiment weakened slightly."
        else:
            return "Market sentiment was unchanged."

    elif feature == "sentiment_deviation":
        if value >= 10:
            return "Sentiment is well above its recent average."
        elif value <= -10:
            return "Sentiment is well below its recent average."
        else:
            return "Sentiment is close to its recent average."

    else:
        return "Signal is within the model's analysis."


def build_why_explanation(X, shap_values_for_prediction, features):
    """
    Build the SHAP + historical percentile + human interpretation table.
    """
    latest_X = X.iloc[[-1]]
    latest_values = latest_X.iloc[0]

    latest_explanation = pd.DataFrame({
        "Feature": features,
        "SHAP_Value": shap_values_for_prediction,
        "Feature_Value": latest_values.values
    })

    latest_explanation["Absolute_SHAP"] = np.abs(
        latest_explanation["SHAP_Value"]
    )

    latest_explanation = latest_explanation.sort_values(
        "Absolute_SHAP",
        ascending=False
    )

    percentile_results = []

    for feature in features:
        current_value = latest_values[feature]

        percentile = percentileofscore(
            X[feature],
            current_value,
            kind="rank"
        )

        percentile_results.append({
            "Feature": feature,
            "Current_Value": current_value,
            "Percentile": percentile
        })

    percentile_df = pd.DataFrame(percentile_results)

    explanation = latest_explanation.copy()

    explanation["Percentile"] = explanation["Feature"].apply(
        lambda feature: percentile_df.loc[
            percentile_df["Feature"] == feature,
            "Percentile"
        ].iloc[0]
    )

    explanation["Interpretation"] = explanation.apply(
        lambda row: interpret_feature(
            row["Feature"],
            row["Feature_Value"],
            row["Percentile"]
        ),
        axis=1
    )

    return explanation


def generate_why_report(regime, probabilities, explanation):
    confidence = probabilities[regime]

    top_features = explanation.head(5)

    return {
        "current_regime": REGIME_NAMES[regime],
        "confidence": float(confidence),
        "why": [
            row["Interpretation"]
            for _, row in top_features.iterrows()
        ],
        "top_contributing_signals": [
            {
                "feature": row["Feature"],
                "shap": float(row["SHAP_Value"])
            }
            for _, row in top_features.head(3).iterrows()
        ]
    }
