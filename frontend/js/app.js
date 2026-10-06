import {
  API_CONFIG,
  instrumentsCatalog,
  watchlistData,
  sectorRegimeMatrix,
  fetchMarket,
  fetchRegime,
  fetchWhy,
  fetchWhatChanged,
  fetchWatchlist
} from "./data.js";
import { renderRegimeSection } from "./regime.js";
import { initRegimeTimelineChart, buildSparklineSvg, drawTimelineCanvas } from "./charts.js";
import { renderWhyEngine } from "./why-engine.js";
import { renderWhatChangedAndRisk } from "./what-changed.js";
import { initWatchlist } from "./watchlist.js";

let currentSymbol = "SPX";

document.addEventListener("DOMContentLoaded", () => {
  initShellControls();
  initSearchOmnibox();
  initStateSimulationToolbar();
  loadDashboardSymbol(currentSymbol);
  initSecondaryPageViews();
});

/**
 * Loads all dashboard intelligence modules for a selected symbol
 * Uses FastAPI-ready async abstraction functions
 */
export async function loadDashboardSymbol(symbol = "SPX") {
  // Ensure symbol exists in catalog; if a watchlist ticker without full entry is clicked, synthesize it
  if (!instrumentsCatalog[symbol]) {
    const wlItem = watchlistData.find((w) => w.symbol === symbol);
    if (wlItem) {
      instrumentsCatalog[symbol] = buildInstrumentFromWatchlist(wlItem);
    } else {
      symbol = "SPX";
    }
  }

  currentSymbol = symbol;

  try {
    const [marketRes, regimeRes, whyRes, changedRes, wlRes] = await Promise.all([
      fetchMarket(symbol),
      fetchRegime(symbol),
      fetchWhy(symbol),
      fetchWhatChanged(symbol),
      fetchWatchlist()
    ]);

    renderMarketHeader(marketRes);
    renderMiniMarketCards(marketRes.miniCards, symbol);
    renderRegimeSection(regimeRes);
    initRegimeTimelineChart(symbol, "6M");
    renderWhyEngine(whyRes);
    renderWhatChangedAndRisk(changedRes);
    initWatchlist(wlRes, (nextSym) => {
      loadDashboardSymbol(nextSym);
    });
  } catch (err) {
    showStateBanner("error", "Market data temporarily unavailable.");
    console.error("Dashboard load error:", err);
  }
}


//  Renders the Market Header bar 
 
function renderMarketHeader(marketRes) {
  if (!marketRes) return;

  const nameEl = document.getElementById("header-instrument-name");
  const tickerEl = document.getElementById("header-instrument-ticker");
  const priceEl = document.getElementById("header-instrument-price");
  const changeEl = document.getElementById("header-instrument-change");
  const dirEl = document.getElementById("header-instrument-dir");
  const statusEl = document.getElementById("header-market-status");
  const updatedEl = document.getElementById("header-last-updated");

  if (nameEl) nameEl.textContent = marketRes.name;
  if (tickerEl) tickerEl.textContent = marketRes.symbol;

  if (priceEl) {
    const prefix = marketRes.price < 1000 && marketRes.symbol !== "VIX" ? "$" : "";
    const formattedPrice = `${prefix}${marketRes.price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
    if (priceEl.textContent !== formattedPrice) {
      priceEl.textContent = formattedPrice;
      priceEl.classList.remove("tick-flash");
      void priceEl.offsetWidth;
      priceEl.classList.add("tick-flash");
    }
  }

  const isUp = marketRes.change >= 0;
  if (changeEl) {
    changeEl.textContent = `${isUp ? "+" : ""}${marketRes.change.toFixed(2)}%`;
    changeEl.className = `pct-val ${isUp ? "dir-up" : "dir-down"}`;
  }
  if (dirEl) {
    dirEl.textContent = `${isUp ? "▲" : "▼"} Today`;
    dirEl.className = `market-today-tag ${isUp ? "dir-up" : "dir-down"}`;
  }
  if (statusEl) statusEl.textContent = marketRes.marketStatus;
  if (updatedEl) updatedEl.textContent = marketRes.lastUpdated;
}
 // Renders Mini Market Cards 
 
function renderMiniMarketCards(cards = [], activeSym = "SPX") {
  const container = document.getElementById("mini-market-cards-mount");
  if (!container || !cards.length) return;

  container.innerHTML = cards
    .map((card) => {
      const isUp = card.change >= 0;
      const changeSign = isUp ? "+" : "";
      const changeClass = isUp ? "dir-up" : "dir-down";
      const sparkSvg = buildSparklineSvg(card.sparkline, card.regimeKey);

      return `
        <button type="button"
                class="mini-market-card ${card.symbol === activeSym ? "active-card" : ""}"
                data-card-symbol="${card.symbol}"
                aria-label="${card.name}, value ${card.price}, change ${card.change}%, regime ${card.regime}">
          <div class="mini-card-top">
            <span class="mini-card-name">${card.name}</span>
            <span class="regime-badge ${card.regimeKey}">${card.regime}</span>
          </div>
          <div class="mini-card-mid">
            <div>
              <div class="mini-card-price tabular">
                ${card.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div class="mini-card-change tabular ${changeClass}">
                ${changeSign}${card.change.toFixed(2)}%
              </div>
            </div>
            <div class="mini-sparkline-wrap">
              ${sparkSvg}
            </div>
          </div>
        </button>
      `;
    })
    .join("");

  container.querySelectorAll(".mini-market-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sym = btn.dataset.cardSymbol;
      loadDashboardSymbol(sym);
    });
  });
}
 // Initializes Sidebar collapse toggle, Alert dismiss, and Settings modal
 
function initShellControls() {
  const shell = document.getElementById("app-shell");
  const sidebarToggle = document.getElementById("sidebar-toggle-btn");

  if (sidebarToggle && shell) {
    sidebarToggle.addEventListener("click", () => {
      if (window.innerWidth < 768) {
        shell.classList.toggle("mobile-nav-open");
      } else {
        shell.classList.toggle("sidebar-collapsed");
      }
      setTimeout(() => {
        drawTimelineCanvas();
      }, 260);
    });
  }

  // Alert dismiss button
  const dismissBtn = document.getElementById("alert-dismiss-btn");
  const alertBar = document.getElementById("transition-alert-bar");
  if (dismissBtn && alertBar) {
    dismissBtn.addEventListener("click", () => {
      alertBar.classList.add("hidden");
    });
  }

  // Settings / FastAPI Architecture Modal
  const settingsTriggers = document.querySelectorAll("[data-open-settings]");
  const modal = document.getElementById("settings-modal");
  const closeBtn = document.getElementById("close-settings-modal");
  const apiToggleCheckbox = document.getElementById("fastapi-live-toggle");

  settingsTriggers.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (modal) modal.classList.add("open");
    });
  });

  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("open");
    });
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("open");
    });
  }

  if (apiToggleCheckbox) {
    apiToggleCheckbox.checked = API_CONFIG.useLiveBackend;
    apiToggleCheckbox.addEventListener("change", () => {
      API_CONFIG.useLiveBackend = apiToggleCheckbox.checked;
      const modeIndicator = document.getElementById("sidebar-api-status");
      if (modeIndicator) {
        modeIndicator.textContent = API_CONFIG.useLiveBackend ? "FastAPI Live" : "Mock Schema";
      }
    });
  }
}
// Top Search Omnibox with '/' keyboard shortcut

function initSearchOmnibox() {
  const input = document.getElementById("global-search-input");
  const dropdown = document.getElementById("global-search-dropdown");
  if (!input || !dropdown) return;

  const searchableItems = [
    { symbol: "SPX", name: "S&P 500 Index", regime: "Value-Driven", key: "value", price: "6,481.52" },
    { symbol: "NDX", name: "NASDAQ 100 Index", regime: "Hype", key: "hype", price: "21,492.80" },
    { symbol: "DJI", name: "Dow Jones Industrial Average", regime: "Value-Driven", key: "value", price: "45,128.40" },
    { symbol: "VIX", name: "CBOE Volatility Index", regime: "Value-Driven", key: "value", price: "14.28" },
    ...watchlistData.map((w) => ({
      symbol: w.symbol,
      name: w.name,
      regime: w.regimeFull,
      key: w.regimeKey,
      price: `$${w.price.toFixed(2)}`
    }))
  ];

  // deduplicate by symbol
  const uniqueItems = Array.from(new Map(searchableItems.map((i) => [i.symbol, i])).values());

  function renderResults(query) {
    const q = query.trim().toLowerCase();
    const matches = q
      ? uniqueItems.filter(
          (item) =>
            item.symbol.toLowerCase().includes(q) ||
            item.name.toLowerCase().includes(q) ||
            item.regime.toLowerCase().includes(q)
        )
      : uniqueItems.slice(0, 6);

    if (!matches.length) {
      dropdown.innerHTML = `
        <div class="search-result-item search-empty-item">
          No matching symbols or regimes found.
        </div>
      `;
    } else {
      dropdown.innerHTML = matches
        .map(
          (m) => `
          <div class="search-result-item" data-search-symbol="${m.symbol}" tabindex="0">
            <div>
              <strong class="search-sym-code">${m.symbol}</strong>
              <span class="search-sym-name">${m.name}</span>
            </div>
            <div class="search-right-meta">
              <span class="tabular search-price-text">${m.price}</span>
              <span class="regime-badge ${m.key}">${m.regime}</span>
            </div>
          </div>
        `
        )
        .join("");

      dropdown.querySelectorAll("[data-search-symbol]").forEach((el) => {
        el.addEventListener("click", () => {
          const sym = el.dataset.searchSymbol;
          dropdown.classList.remove("open");
          input.value = "";
          loadDashboardSymbol(sym);
        });
      });
    }
    dropdown.classList.add("open");
  }

  input.addEventListener("focus", () => renderResults(input.value));
  input.addEventListener("input", () => renderResults(input.value));

  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove("open");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== input) {
      e.preventDefault();
      input.focus();
    } else if (e.key === "Escape") {
      dropdown.classList.remove("open");
      input.blur();
    }
  });
}

/**
 * Interactive Simulation & State Verification Controls
 * Allows testing Live Tick, Regime Transition, Skeleton Loading, Empty & API Error states
 */
function initStateSimulationToolbar() {
  const tickBtn = document.getElementById("sim-tick-btn");
  const transitionBtn = document.getElementById("sim-transition-btn");
  const skeletonBtn = document.getElementById("sim-skeleton-btn");
  const errorBtn = document.getElementById("sim-error-btn");

  if (tickBtn) {
    tickBtn.addEventListener("click", () => {
      const inst = instrumentsCatalog[currentSymbol] || instrumentsCatalog.SPX;
      const delta = (Math.random() - 0.42) * (inst.price * 0.0025);
      inst.price = Number((inst.price + delta).toFixed(2));
      inst.change = Number((inst.change + (delta > 0 ? 0.06 : -0.05)).toFixed(2));

      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];
      const updatedEl = document.getElementById("header-last-updated");
      if (updatedEl) updatedEl.textContent = timeStr;

      loadDashboardSymbol(currentSymbol);
    });
  }

  if (transitionBtn) {
    transitionBtn.addEventListener("click", () => {
      const alertBar = document.getElementById("transition-alert-bar");
      if (alertBar) {
        alertBar.classList.remove("hidden");
      }
      // Cycle symbol between SPX (Value-Driven), NDX (Hype), and TSLA (Panic) to showcase regime transition
      const cycleOrder = ["SPX", "NDX", "TSLA"];
      const nextIdx = (cycleOrder.indexOf(currentSymbol) + 1) % cycleOrder.length;
      loadDashboardSymbol(cycleOrder[nextIdx]);
    });
  }

  if (skeletonBtn) {
    skeletonBtn.addEventListener("click", () => {
      const cards = document.querySelectorAll(".panel-card, .mini-market-card");
      cards.forEach((c) => c.classList.add("skeleton"));
      setTimeout(() => {
        cards.forEach((c) => c.classList.remove("skeleton"));
      }, 1100);
    });
  }

  if (errorBtn) {
    errorBtn.addEventListener("click", () => {
      const banner = document.getElementById("state-banner");
      if (!banner) return;
      if (banner.classList.contains("visible")) {
        banner.classList.remove("visible");
      } else {
        showStateBanner("error", "Market data temporarily unavailable.");
      }
    });
  }

  const bannerClose = document.getElementById("state-banner-close");
  if (bannerClose) {
    bannerClose.addEventListener("click", () => {
      const banner = document.getElementById("state-banner");
      if (banner) banner.classList.remove("visible");
    });
  }
}

export function showStateBanner(type = "error", message = "Market data temporarily unavailable.") {
  const banner = document.getElementById("state-banner");
  const msgEl = document.getElementById("state-banner-msg");
  if (!banner || !msgEl) return;

  banner.className = `state-banner visible ${type}`;
  msgEl.textContent = message;
}

function buildInstrumentFromWatchlist(wlItem) {
  const template =
    wlItem.regimeKey === "hype"
      ? instrumentsCatalog.NVDA
      : wlItem.regimeKey === "panic"
      ? instrumentsCatalog.TSLA
      : instrumentsCatalog.AAPL;

  return {
    ...template,
    symbol: wlItem.symbol,
    name: wlItem.name,
    price: wlItem.price,
    change: wlItem.change,
    regime: wlItem.regimeFull,
    regimeKey: wlItem.regimeKey,
    confidence: wlItem.confidence / 100,
    story: {
      headline: `${wlItem.symbol} is currently ${wlItem.regimeFull}.`,
      narrative: `${wlItem.driverSummary}. Volume delta sits at ${wlItem.volumeDelta} relative to its 20-day baseline.`,
      watch: template.story.watch
    }
  };
}
 // Hydrates dedicated secondary pages (markets.html, regime.html, why.html, risk.html)
 
function initSecondaryPageViews() {
  const sectorTableBody = document.getElementById("sector-matrix-tbody");
  if (sectorTableBody) {
    sectorTableBody.innerHTML = sectorRegimeMatrix
      .map((s) => {
        const isUp = s.change >= 0;
        const changeClass = isUp ? "dir-up" : "dir-down";
        const riskClass =
          s.risk === "LOW"
            ? "regime-text-value"
            : s.risk === "MED"
            ? "regime-text-warning"
            : "regime-text-panic";

        return `
          <tr class="watchlist-row">
            <td><strong>${s.sector}</strong></td>
            <td class="tabular text-mono-sec">${s.etf}</td>
            <td class="tabular">$${s.price.toFixed(2)}</td>
            <td class="tabular fw-600 ${changeClass}">${isUp ? "+" : ""}${s.change.toFixed(2)}%</td>
            <td><span class="regime-badge ${s.key}">${s.regime}</span></td>
            <td class="tabular fw-600">${s.confidence}%</td>
            <td class="tabular">${s.momentum}</td>
            <td class="tabular">${s.volatility}</td>
            <td class="${riskClass} fw-700">${s.risk}</td>
          </tr>
        `;
      })
      .join("");
  }
}
