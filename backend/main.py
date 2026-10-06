from pathlib import Path
from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from services.prediction import model, FEATURES, REGIME_NAMES  # noqa: F401 (used in /health)
from services import ui_adapter as ui


app = FastAPI(
    title="MarketPulse API",
    description="Explainable Market Regime Detection API",
    version="1.0.0",
)

# CORS: needed ONLY if the frontend is served from a different origin
# (e.g. VS Code Live Server on :5500 during development). Harmless otherwise.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "model_classes": [int(x) for x in model.classes_],
        "feature_count": len(FEATURES),
    }


@app.get("/predict/{ticker}")
def predict_market(ticker: str):
    try:
        return ui.predict_response(ticker)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# NEW: frontend API contract  (js/data.js calls these with ?symbol=SPX etc.)
# =============================================================================

def _symbol_or_404(symbol: str):
    try:
        return symbol.upper().strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/market")
def api_market(symbol: str = Query("SPX")):
    try:
        return ui.market_payload(_symbol_or_404(symbol))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/regime")
def api_regime(symbol: str = Query("SPX")):
    try:
        return ui.regime_payload(_symbol_or_404(symbol))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/why")
def api_why(symbol: str = Query("SPX")):
    try:
        return ui.why_payload(_symbol_or_404(symbol))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/what-changed")
def api_what_changed(symbol: str = Query("SPX")):
    try:
        return ui.what_changed_payload(_symbol_or_404(symbol))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/risk")
def api_risk(symbol: str = Query("SPX")):
    try:
        return ui.risk_payload(_symbol_or_404(symbol))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/watchlist")
def api_watchlist():
    try:
        return ui.watchlist_rows()
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

FRONTEND_DIR = Path(__file__).parent.parent / "frontend"
if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
else:
    @app.get("/")
    def home():
        return {
            "message": "MarketPulse API is running",
            "note": f"Frontend folder not found at {FRONTEND_DIR} — create it to serve the UI at /",
        }

