import pandas as pd

from .prediction import REGIME_NAMES, model


def describe_change(feature, today_value, yesterday_value):
    change = today_value - yesterday_value

    if feature == "momentum_20d":
        if change > 0.01:
            return "20-day momentum strengthened significantly."
        elif change > 0:
            return "20-day momentum strengthened slightly."
        elif change < -0.01:
            return "20-day momentum weakened significantly."
        elif change < 0:
            return "20-day momentum weakened slightly."
        else:
            return "20-day momentum was largely unchanged."

    elif feature == "return_20d":
        if change > 0.02:
            return "20-day return improved significantly."
        elif change > 0:
            return "20-day return improved."
        elif change < -0.02:
            return "20-day return deteriorated significantly."
        elif change < 0:
            return "20-day return weakened."
        else:
            return "20-day return was largely unchanged."

    elif feature == "volatility_20d":
        if change > 0.003:
            return "Market volatility increased significantly."
        elif change > 0:
            return "Market volatility increased slightly."
        elif change < -0.003:
            return "Market volatility decreased significantly."
        elif change < 0:
            return "Market volatility decreased slightly."
        else:
            return "Market volatility was largely unchanged."

    elif feature == "volume_ratio":
        if change > 0.2:
            return "Trading activity increased significantly."
        elif change > 0:
            return "Trading activity increased."
        elif change < -0.2:
            return "Trading activity decreased significantly."
        elif change < 0:
            return "Trading activity decreased."
        else:
            return "Trading activity was largely unchanged."

    elif feature == "daily_return":
        if change > 0.01:
            return "Daily market return improved significantly."
        elif change > 0:
            return "Daily market return improved."
        elif change < -0.01:
            return "Daily market return deteriorated significantly."
        elif change < 0:
            return "Daily market return weakened."
        else:
            return "Daily market return was largely unchanged."

    elif feature == "sentiment_lag1":
        if change >= 10:
            return "Market sentiment improved sharply."
        elif change >= 3:
            return "Market sentiment improved."
        elif change <= -10:
            return "Market sentiment deteriorated sharply."
        elif change <= -3:
            return "Market sentiment deteriorated."
        elif change > 0:
            return "Market sentiment improved slightly."
        elif change < 0:
            return "Market sentiment weakened slightly."
        else:
            return "Market sentiment was unchanged."

    elif feature == "sentiment_change":
        if change > 5:
            return "The change in sentiment accelerated positively."
        elif change < -5:
            return "The change in sentiment accelerated negatively."
        else:
            return "The short-term sentiment movement was relatively stable."

    elif feature == "sentiment_deviation":
        if change > 5:
            return "Sentiment moved further above its recent average."
        elif change < -5:
            return "Sentiment moved further below its recent average."
        else:
            return "Sentiment remained close to its recent average."

    elif feature == "RSI":
        if change > 5:
            return "RSI increased noticeably."
        elif change < -5:
            return "RSI decreased noticeably."
        else:
            return "RSI remained relatively stable."

    elif feature == "drawdown":
        if change < -0.03:
            return "The market moved deeper into drawdown."
        elif change > 0.03:
            return "The market recovered from its previous drawdown."
        elif change < 0:
            return "The market's drawdown increased slightly."
        elif change > 0:
            return "The market's drawdown improved slightly."
        else:
            return "Drawdown was unchanged."

    elif feature == "return_5d":
        if change > 0.02:
            return "Short-term 5-day performance improved significantly."
        elif change < -0.02:
            return "Short-term 5-day performance weakened significantly."
        elif change > 0:
            return "Short-term performance improved."
        elif change < 0:
            return "Short-term performance weakened."
        else:
            return "Short-term performance was unchanged."

    elif feature == "price_ma50_ratio":
        if change > 0.02:
            return "Price moved noticeably further above its 50-day trend."
        elif change < -0.02:
            return "Price moved noticeably closer to or below its 50-day trend."
        elif change > 0:
            return "Price moved slightly higher relative to its 50-day trend."
        elif change < 0:
            return "Price moved slightly lower relative to its 50-day trend."
        else:
            return "Price position relative to the 50-day trend was unchanged."

    elif feature == "intraday_range":
        if change > 0.005:
            return "Intraday price swings increased."
        elif change > 0:
            return "Intraday price movement increased slightly."
        elif change < -0.005:
            return "Intraday price swings decreased."
        elif change < 0:
            return "Intraday price movement became calmer."
        else:
            return "Intraday price movement remained stable."

    else:
        return "No significant change detected."


def calculate_feature_changes(df, features):
    if len(df) < 2:
        raise ValueError("At least two rows are required to compare today and yesterday")
    today = df.iloc[-1]
    yesterday = df.iloc[-2]

    changes = []

    for feature in features:
        today_value = today[feature]
        yesterday_value = yesterday[feature]
        change = today_value - yesterday_value

        changes.append({
            "Feature": feature,
            "Today": today_value,
            "Yesterday": yesterday_value,
            "Change": change,
            "Absolute_Change": abs(change)
        })

    change_df = pd.DataFrame(changes)

    change_df["Description"] = change_df.apply(
        lambda row: describe_change(
            row["Feature"],
            row["Today"],
            row["Yesterday"]
        ),
        axis=1
    )

    return change_df


def generate_what_changed_report(df, X, features, top_n=5):
    if len(df) < 2 or len(X) < 2:
        raise ValueError("At least two complete rows are required for WHAT CHANGED")
    today_date = df.index[-1]
    yesterday_date = df.index[-2]

    change_df = calculate_feature_changes(
        df, features
    )

    today_X = X.iloc[[-1]]
    yesterday_X = X.iloc[[-2]]

    today_regime = model.predict(today_X)[0]
    yesterday_regime = model.predict(yesterday_X)[0]

    important_changes = (
        change_df
        .sort_values("Absolute_Change", ascending=False)
        .head(top_n)
    )

    return {
        "today_date": str(today_date),
        "yesterday_date": str(yesterday_date),
        "today_regime": REGIME_NAMES[today_regime],
        "yesterday_regime": REGIME_NAMES[yesterday_regime],
        "regime_changed": bool(today_regime != yesterday_regime),
        "important_changes": important_changes.to_dict("records")
    }
