import pandas as pd
import yfinance as yf

REQUIRED_COLUMNS = [
    "Open",
    "High",
    "Low",
    "Close",
    "Volume",
]

def _clean_yfinance_dataframe(df):
#    Normalize yfinance output into a simple OHLCV dataframe.
    if df is None or df.empty:
        return pd.DataFrame()

    # yfinance may return MultiIndex columns such as:
    # ('Close', 'SPY'), ('High', 'SPY'), ...
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    # Remove duplicate columns if any
    df = df.loc[:, ~df.columns.duplicated()].copy()

    # Make sure index is datetime
    df.index = pd.to_datetime(df.index)

    # Normalize timezone if present
    if getattr(df.index, "tz", None) is not None:
        df.index = df.index.tz_localize(None)

    return df


def _download(ticker, start=None, end=None, period=None):
    """
    Single Yahoo Finance download attempt.
    """

    kwargs = {
        "tickers": ticker,
        "interval": "1d",
        "auto_adjust": True,
        "progress": False,
        "threads": False,
        "timeout": 60,
    }

    if period is not None:
        kwargs["period"] = period
    else:
        kwargs["start"] = start
        kwargs["end"] = end

    df = yf.download(**kwargs)

    return _clean_yfinance_dataframe(df)


def get_market_data(
    ticker="SPY",
    start="2015-01-01",
    end=None
):
    
    ticker = ticker.upper().strip()
    # original historical range
    try:
        df=_download(ticker=ticker,start=start,end=end,)
        if not df.empty:
            missing = [
                col for col in REQUIRED_COLUMNS
                if col not in df.columns
            ]
            if not missing:
                return df

    except Exception as e:
        print(
            f"Historical Yahoo download failed for {ticker}: {e}"
        )

    print(
        f"Using recent-data fallback for {ticker}..."
    )

    try:
        df = _download(
            ticker=ticker,
            period="2y",
        )
        if df.empty:
            raise ValueError(
                f"Yahoo Finance returned no data for {ticker}."
            )
        missing = [
            col for col in REQUIRED_COLUMNS
            if col not in df.columns
        ]
        if missing:
            raise ValueError(
                f"Yahoo Finance data is missing columns: {missing}"
            )

        return df

    except Exception as e:
        raise RuntimeError(
            f"Unable to download market data for "
            f"{ticker} from Yahoo Finance. "
            f"Original and fallback requests failed. "
            f"Error: {e}"
        ) from e
