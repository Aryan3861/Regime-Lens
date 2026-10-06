/* ==========================================================================
   REGIME AI — Interactive Watchlist Module (js/watchlist.js)
   ========================================================================== */

let currentWatchlist = [];
let activeFilter = "ALL";
let activeSort = { key: null, asc: false };
let onSymbolSelectCallback = null;

export function initWatchlist(items, onSelectSymbol) {
  currentWatchlist = Array.isArray(items) ? [...items] : [];
  onSymbolSelectCallback = onSelectSymbol;

  renderWatchlistRows();
  bindWatchlistControls();
}

function renderWatchlistRows(selectedSymbol = "SPX") {
  const tbody = document.getElementById("watchlist-tbody");
  if (!tbody) return;

  let filtered = currentWatchlist.filter((item) => {
    if (activeFilter === "ALL") return true;
    return item.regime === activeFilter;
  });

  if (activeSort.key) {
    filtered.sort((a, b) => {
      const valA = a[activeSort.key];
      const valB = b[activeSort.key];
      if (typeof valA === "number" && typeof valB === "number") {
        return activeSort.asc ? valA - valB : valB - valA;
      }
      return activeSort.asc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="wl-empty-cell">
          No watchlist symbols match the selected regime filter.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered
    .map((row) => {
      const isPositive = row.change >= 0;
      const changeSign = isPositive ? "+" : "";
      const changeClass = isPositive ? "dir-up" : "dir-down";
      const trendClass = row.trend === "↑" ? "dir-up" : "dir-down";
      const riskClass =
        row.risk === "LOW"
          ? "regime-text-value"
          : row.risk === "MED"
          ? "regime-text-warning"
          : "regime-text-panic";

      return `
        <tr class="watchlist-row ${row.symbol === selectedSymbol ? "selected-row" : ""}"
            data-symbol="${row.symbol}"
            tabindex="0"
            role="button"
            aria-label="Inspect ${row.symbol} ${row.name}, Regime ${row.regime}, Confidence ${row.confidence}%">
          <td>
            <div class="wl-symbol-cell">
              <span class="wl-ticker">${row.symbol}</span>
              <span class="wl-company">${row.name}</span>
            </div>
          </td>
          <td class="tabular">$${row.price.toFixed(2)}</td>
          <td class="tabular fw-600 ${changeClass}">${changeSign}${row.change.toFixed(2)}%</td>
          <td>
            <span class="regime-badge ${row.regimeKey}">${row.regime}</span>
          </td>
          <td class="tabular fw-600">${row.confidence}%</td>
          <td class="${riskClass} wl-risk-cell">${row.risk}</td>
          <td class="${trendClass} fw-700">${row.trend}</td>
        </tr>
      `;
    })
    .join("");

  // Bind hover & click events for each row
  const rowEls = tbody.querySelectorAll(".watchlist-row");
  rowEls.forEach((tr) => {
    const sym = tr.dataset.symbol;
    const item = currentWatchlist.find((x) => x.symbol === sym);

    tr.addEventListener("mouseenter", () => {
      updateHoverDetailBar(item);
    });

    tr.addEventListener("focus", () => {
      updateHoverDetailBar(item);
    });

    tr.addEventListener("click", () => {
      rowEls.forEach((r) => r.classList.remove("selected-row"));
      tr.classList.add("selected-row");
      if (onSymbolSelectCallback) {
        onSymbolSelectCallback(sym);
      }
    });

    tr.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        tr.click();
      }
    });
  });

  // Initialize hover detail with first row
  if (filtered[0]) {
    updateHoverDetailBar(filtered[0]);
  }
}

function updateHoverDetailBar(item) {
  const detailEl = document.getElementById("watchlist-hover-detail");
  if (!detailEl || !item) return;

  detailEl.innerHTML = `
    <div>
      <strong>${item.symbol}</strong>
      <span class="wl-detail-sep">•</span>
      <span class="supporting-text">Key driver: ${item.driverSummary}</span>
    </div>
    <div class="wl-detail-right">
      <span class="tabular supporting-text">Volume Δ: <strong>${item.volumeDelta}</strong></span>
      <span class="meta-text">Click row to load full regime intelligence →</span>
    </div>
  `;
}

function bindWatchlistControls() {
  const filterBtns = document.querySelectorAll("[data-wl-filter]");
  filterBtns.forEach((btn) => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = "true";
    btn.addEventListener("click", () => {
      activeFilter = btn.dataset.wlFilter;
      filterBtns.forEach((b) => b.classList.toggle("active", b.dataset.wlFilter === activeFilter));
      renderWatchlistRows();
    });
  });

  const sortHeaders = document.querySelectorAll("[data-wl-sort]");
  sortHeaders.forEach((th) => {
    if (th.dataset.bound) return;
    th.dataset.bound = "true";
    th.addEventListener("click", () => {
      const key = th.dataset.wlSort;
      if (activeSort.key === key) {
        activeSort.asc = !activeSort.asc;
      } else {
        activeSort.key = key;
        activeSort.asc = false;
      }
      renderWatchlistRows();
    });
  });
}
