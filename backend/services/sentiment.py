import pandas as pd
import requests
import certifi
from functools import lru_cache

CNN_START_DATE = "2021-02-01"
FEATURES = [
    "sentiment_lag1",
    "sentiment_change",
    "sentiment_deviation",
]
# Get CNN Fear & Greed historical data
def _get_cnn_sentiment_cached(start_date=CNN_START_DATE):
    url = ("https://production.dataviz.cnn.io/index/fearandgreed/graphdata/"f"{start_date}")
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/153.0 Safari/537.36"
        ),
        "Accept": "application/json, text/plain, */*",
        "Origin": "https://www.cnn.com",
        "Referer": "https://www.cnn.com/",
    }
    response=requests.get(url,headers=headers,verify=certifi.where(),timeout=30)
    response.raise_for_status()
    data=response.json()
    historical=data["fear_and_greed_historical"]["data"]
    sentiment_df=pd.DataFrame(historical)

    # Rename CNN fields
    sentiment_df = sentiment_df.rename(
        columns={
            "x": "timestamp",
            "y": "sentiment_score",
            "rating": "sentiment_rating",
        }
    )
    # Convert timestamp -> Date
    sentiment_df["Date"] = (
        pd.to_datetime(sentiment_df["timestamp"],unit="ms",utc=True).dt.date)
    sentiment_df["Date"]=pd.to_datetime(sentiment_df["Date"])

    # Keep only required columns
    sentiment_df = sentiment_df[["Date","sentiment_score","sentiment_rating"]]

    # Remove duplicate dates
    sentiment_df=sentiment_df.drop_duplicates(subset="Date")

    # Sort by date
    sentiment_df=sentiment_df.sort_values("Date")

    return sentiment_df

def get_cnn_sentiment(start_date=CNN_START_DATE):
    return _get_cnn_sentiment_cached(start_date).copy()


# Add sentiment features to market dataframe
def add_sentiment_features(market):
    market=market.copy()
    # 1. Create Date column
    if "Date" not in market.columns:
        market["Date"]=pd.to_datetime(market.index).normalize()
    else:
        market["Date"]=pd.to_datetime(market["Date"]).dt.normalize()
 
    # remove data from index 'Date' is both an index level and a column label
    market=market.reset_index(drop=True)

    # 3. Get CNN sentiment data
    sentiment_df = get_cnn_sentiment()

    # Make absolutely sure sentiment Date is normalized
    sentiment_df["Date"] = pd.to_datetime(sentiment_df["Date"]).dt.normalize()

    # 4. Merge market + sentiment
    merged = market.merge(
        sentiment_df,
        on="Date",
        how="left",
        sort=True
    )

    #  Fill missing sentiment values
    merged["sentiment_score"] = (
        merged["sentiment_score"].ffill()
    )
    merged["sentiment_rating"] = (
        merged["sentiment_rating"].ffill()
    )

    # This avoids using same-day sentiment directly.
    merged["sentiment_lag1"] = (
        merged["sentiment_score"].shift(1)
    )
    # 7. Sentiment change
    merged["sentiment_change"] = (
        merged["sentiment_score"].diff()
    )
# 5-day sentiment moving average
    merged["sentiment_ma5"]=(
        merged["sentiment_score"]
        .rolling(5)
        .mean()
    )
    merged["sentiment_deviation"]=(merged["sentiment_score"]-merged["sentiment_ma5"])
    # 10. Remove rows where required sentiment features  are still missing
    merged=merged.dropna(subset=FEATURES)
    merged=merged.reset_index(drop=True)
    return merged
