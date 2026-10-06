
import { getTimelineSeries } from "./data.js";

const REGIME_COLORS = {
  value: {
    stroke: "#35D07F",
    fillTop: "rgba(53, 208, 127, 0.16)",
    fillBottom: "rgba(53, 208, 127, 0.01)",
    zoneBg: "rgba(53, 208, 127, 0.045)"
  },
  hype: {
    stroke: "#A970FF",
    fillTop: "rgba(169, 112, 255, 0.16)",
    fillBottom: "rgba(169, 112, 255, 0.01)",
    zoneBg: "rgba(169, 112, 255, 0.05)"
  },
  panic: {
    stroke: "#FF5C67",
    fillTop: "rgba(255, 92, 103, 0.16)",
    fillBottom: "rgba(255, 92, 103, 0.01)",
    zoneBg: "rgba(255, 92, 103, 0.05)"
  }
};

let activeChartState = {
  symbol: "SPX",
  timeframe: "6M",
  data: null,
  hoverIndex: null
};

/**
 * Initializes and renders the Regime Timeline Chart and timeframe buttons
 */
export function initRegimeTimelineChart(symbol = "SPX", timeframe = "6M") {
  const canvas = document.getElementById("regime-timeline-canvas");
  if (!canvas) return;

  activeChartState.symbol = symbol;
  activeChartState.timeframe = timeframe;
  activeChartState.data = getTimelineSeries(symbol, timeframe);
  activeChartState.hoverIndex = null;

  renderRegimeStepRibbon(activeChartState.data.zones);
  drawTimelineCanvas();

  if (!canvas.dataset.bound) {
    canvas.dataset.bound = "true";

    canvas.addEventListener("mousemove", (e) => {
      handleCanvasPointer(e, canvas);
    });

    canvas.addEventListener("mouseleave", () => {
      activeChartState.hoverIndex = null;
      hideTooltip();
      drawTimelineCanvas();
    });

    canvas.addEventListener(
      "touchmove",
      (e) => {
        if (e.touches.length > 0) {
          handleCanvasPointer(e.touches[0], canvas);
        }
      },
      { passive: true }
    );

    window.addEventListener("resize", () => {
      drawTimelineCanvas();
    });
  }

  // Bind Timeframe buttons (1D, 1W, 1M, 3M, 6M, 1Y, 5Y)
  const tfButtons = document.querySelectorAll(".tf-btn");
  tfButtons.forEach((btn) => {
    const tf = btn.dataset.tf;
    btn.classList.toggle("active", tf === activeChartState.timeframe);
    if (!btn.dataset.bound) {
      btn.dataset.bound = "true";
      btn.addEventListener("click", () => {
        const nextTf = btn.dataset.tf;
        tfButtons.forEach((b) => b.classList.toggle("active", b.dataset.tf === nextTf));
        activeChartState.timeframe = nextTf;
        activeChartState.data = getTimelineSeries(activeChartState.symbol, nextTf);
        activeChartState.hoverIndex = null;
        renderRegimeStepRibbon(activeChartState.data.zones);
        hideTooltip();
        drawTimelineCanvas();
      });
    }
  });
}

function handleCanvasPointer(pointerEvent, canvas) {
  const rect = canvas.getBoundingClientRect();
  const relX = pointerEvent.clientX - rect.left;
  const padLeft = 16;
  const padRight = 64;
  const plotW = Math.max(10, rect.width - padLeft - padRight);
  const series = activeChartState.data?.series || [];
  if (!series.length) return;

  const ratio = Math.min(1, Math.max(0, (relX - padLeft) / plotW));
  const idx = Math.round(ratio * (series.length - 1));
  activeChartState.hoverIndex = idx;

  drawTimelineCanvas();
  showTooltip(series[idx], relX, rect.width);
}

function showTooltip(point, cursorX, canvasWidth) {
  const tt = document.getElementById("chart-tooltip");
  if (!tt || !point) return;

  const dateEl = document.getElementById("tt-date");
  const priceEl = document.getElementById("tt-price");
  const regimeEl = document.getElementById("tt-regime");
  const confEl = document.getElementById("tt-confidence");
  const driverEl = document.getElementById("tt-driver");

  if (dateEl) dateEl.textContent = point.date;
  if (priceEl) {
    const prefix = point.price < 1000 && activeChartState.symbol !== "VIX" ? "$" : "";
    priceEl.textContent = `${prefix}${point.price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }
  if (regimeEl) {
    regimeEl.textContent = point.regime;
    regimeEl.className = `tt-val regime-text-${point.regimeKey}`;
  }
  if (confEl) confEl.textContent = `${point.confidence}%`;
  if (driverEl) driverEl.textContent = point.driver;

  tt.classList.add("visible");

  const ttWidth = 225;
  let leftPos = cursorX + 18;
  if (leftPos + ttWidth > canvasWidth - 14) {
    leftPos = Math.max(12, cursorX - ttWidth - 18);
  }
  tt.style.left = `${leftPos}px`;
}

function hideTooltip() {
  const tt = document.getElementById("chart-tooltip");
  if (tt) tt.classList.remove("visible");
}

function renderRegimeStepRibbon(zones) {
  const ribbon = document.getElementById("regime-step-ribbon");
  if (!ribbon || !zones) return;

  ribbon.innerHTML = zones
    .map((z) => {
      const widthPct = ((z.end - z.start) * 100).toFixed(1);
      return `
        <div class="ribbon-segment ${z.key}" data-width="${widthPct}" title="${z.regime} (${z.conf}% Confidence) — ${z.driver}">
          <span>${z.regime}</span>
          <span class="tabular">${z.conf}%</span>
        </div>
      `;
    })
    .join("");

  ribbon.querySelectorAll(".ribbon-segment").forEach((seg) => {
    seg.style.width = `${seg.dataset.width}%`;
  });
}

export function drawTimelineCanvas() {
  const canvas = document.getElementById("regime-timeline-canvas");
  if (!canvas || !activeChartState.data) return;

  const rect = canvas.parentElement.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(300, rect.width);
  const height = Math.max(200, rect.height);

  canvas.width = width * dpr;
  canvas.height = height * dpr;

  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  const { series, zones } = activeChartState.data;
  if (!series || !series.length) return;

  const padLeft = 16;
  const padRight = 64;
  const padTop = 24;
  const padBottom = 28;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const prices = series.map((d) => d.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const rangeP = Math.max(0.01, maxP - minP);

  const getX = (i) => padLeft + (i / (series.length - 1)) * plotW;
  const getY = (price) => padTop + plotH - ((price - minP) / rangeP) * plotH;

  // 1. Draw Regime Background Zones & Transition Dividers
  zones.forEach((zone, zIdx) => {
    const xStart = padLeft + zone.start * plotW;
    const xEnd = padLeft + zone.end * plotW;
    const palette = REGIME_COLORS[zone.key] || REGIME_COLORS.value;

    ctx.fillStyle = palette.zoneBg;
    ctx.fillRect(xStart, padTop, xEnd - xStart, plotH);

    // Transition vertical line
    if (zIdx > 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(139, 150, 168, 0.28)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(xStart, padTop);
      ctx.lineTo(xStart, padTop + plotH);
      ctx.stroke();

      // Transition marker pill at top
      ctx.fillStyle = "#111722";
      ctx.strokeStyle = palette.stroke;
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
      const tagText = `→ ${zone.regime.toUpperCase()}`;
      ctx.font = "600 10px Inter, sans-serif";
      const textW = ctx.measureText(tagText).width + 10;
      const pillX = Math.min(width - padRight - textW, Math.max(padLeft + 4, xStart + 4));
      ctx.fillRect(pillX, padTop + 4, textW, 16);
      ctx.strokeRect(pillX, padTop + 4, textW, 16);
      ctx.fillStyle = palette.stroke;
      ctx.fillText(tagText, pillX + 5, padTop + 15);
      ctx.restore();
    }
  });

  // 2. Horizontal Grid Lines & Right Axis Price Labels
  const gridRows = 4;
  ctx.font = "500 11px 'JetBrains Mono', monospace";
  ctx.textAlign = "left";
  for (let g = 0; g <= gridRows; g++) {
    const y = padTop + (g / gridRows) * plotH;
    const val = maxP - (g / gridRows) * rangeP;

    ctx.strokeStyle = "rgba(32, 41, 56, 0.75)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(padLeft + plotW, y);
    ctx.stroke();

    ctx.fillStyle = "#8B96A8";
    ctx.fillText(
      val.toLocaleString("en-US", {
        minimumFractionDigits: val < 100 ? 2 : 0,
        maximumFractionDigits: val < 100 ? 2 : 0
      }),
      padLeft + plotW + 8,
      y + 4
    );
  }

  // 3. Bottom X-Axis Date Labels
  ctx.fillStyle = "#566174";
  ctx.font = "500 10px Inter, sans-serif";
  ctx.textAlign = "center";
  const xTicks = 5;
  for (let t = 0; t < xTicks; t++) {
    const idx = Math.round((t / (xTicks - 1)) * (series.length - 1));
    const pt = series[idx];
    const x = Math.min(padLeft + plotW - 24, Math.max(padLeft + 24, getX(idx)));
    ctx.fillText(pt.date, x, height - 8);
  }

  // 4. Draw Regime-Colored Price Path & Subtle Fill
  for (let i = 0; i < series.length - 1; i++) {
    const p1 = series[i];
    const p2 = series[i + 1];
    const x1 = getX(i);
    const y1 = getY(p1.price);
    const x2 = getX(i + 1);
    const y2 = getY(p2.price);
    const palette = REGIME_COLORS[p2.regimeKey] || REGIME_COLORS.value;

    // Area slice
    const grad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
    grad.addColorStop(0, palette.fillTop);
    grad.addColorStop(1, palette.fillBottom);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x2, padTop + plotH);
    ctx.lineTo(x1, padTop + plotH);
    ctx.closePath();
    ctx.fill();

    // Price stroke segment
    ctx.strokeStyle = palette.stroke;
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // 5. Hover Crosshair & Active Point Highlight
  if (activeChartState.hoverIndex !== null && series[activeChartState.hoverIndex]) {
    const hIdx = activeChartState.hoverIndex;
    const hPt = series[hIdx];
    const hx = getX(hIdx);
    const hy = getY(hPt.price);
    const palette = REGIME_COLORS[hPt.regimeKey] || REGIME_COLORS.value;

    ctx.save();
    ctx.strokeStyle = "rgba(245, 247, 250, 0.35)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(hx, padTop);
    ctx.lineTo(hx, padTop + plotH);
    ctx.moveTo(padLeft, hy);
    ctx.lineTo(padLeft + plotW, hy);
    ctx.stroke();
    ctx.restore();

    // Outer & Inner Dot
    ctx.beginPath();
    ctx.arc(hx, hy, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = "#080B12";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = palette.stroke;
    ctx.stroke();
  }
}

/**
 * Generates an inline SVG sparkline for Mini Market Cards
 */
export function buildSparklineSvg(values = [], regimeKey = "value") {
  if (!values.length) return "";
  const width = 78;
  const height = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(0.001, max - min);

  const strokeMap = {
    value: "#35D07F",
    hype: "#A970FF",
    panic: "#FF5C67"
  };
  const stroke = strokeMap[regimeKey] || "#35D07F";

  const coords = values.map((v, idx) => {
    const x = (idx / (values.length - 1)) * (width - 4) + 2;
    const y = height - 4 - ((v - min) / range) * (height - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return `
    <svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" fill="none" aria-hidden="true">
      <polyline points="${coords.join(" ")}" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
}
