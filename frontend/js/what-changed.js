export function renderWhatChangedAndRisk(payload) {
  if (!payload) return;

  // 1. Render Delta Grid (Momentum, Sentiment, Volume, Volatility)
  const deltaGrid = document.getElementById("what-changed-deltas");
  if (deltaGrid && payload.deltas) {
    deltaGrid.innerHTML = payload.deltas
      .map((item) => {
        const toneClass =
          item.tone === "up"
            ? "dir-up"
            : item.tone === "down"
            ? "dir-down"
            : "dir-warn";

        return `
          <div class="delta-card">
            <span class="delta-name">${item.name}</span>
            <span class="delta-val tabular ${toneClass}">${item.arrow} ${item.change}</span>
            <span class="delta-sub">${item.period || "Recent session delta"}</span>
          </div>
        `;
      })
      .join("");
  }

  // 2. Render Regime Pressure Bars (Value-Driven 72, Hype 38, Panic 14)
  if (payload.regimePressure) {
    const { value, hype, panic } = payload.regimePressure;
    updatePressureBar("value", value);
    updatePressureBar("hype", hype);
    updatePressureBar("panic", panic);
  }

  const changedSummary = document.getElementById("what-changed-summary");
  if (changedSummary && payload.summary) {
    changedSummary.textContent = payload.summary;
  }

  // 3. Render Risk Thermometer (Current: 42 / 100 + Volatility, Drawdown, Volume, Sentiment)
  if (payload.risk) {
    renderRiskThermometer(payload.risk);
  }
}

function updatePressureBar(key, score) {
  const fillEl = document.getElementById(`pressure-fill-${key}`);
  const valEl = document.getElementById(`pressure-val-${key}`);
  if (fillEl) {
    fillEl.style.width = `${Math.min(100, Math.max(0, score))}%`;
  }
  if (valEl) {
    valEl.textContent = String(score);
  }
}

export function renderRiskThermometer(risk) {
  const scoreEl = document.getElementById("risk-score-val");
  const markerEl = document.getElementById("risk-marker-dot");
  const badgeEl = document.getElementById("risk-level-badge");
  const subListEl = document.getElementById("risk-submetrics-list");
  const summaryEl = document.getElementById("risk-summary-text");
  if (scoreEl) {
    scoreEl.textContent = `${risk.score}`;
  }
  if (markerEl) {
    markerEl.style.left = `${Math.min(98, Math.max(2, risk.score))}%`;
  }
  if (badgeEl) {
    const badgeTone = risk.score < 45 ? "value" : risk.score < 68 ? "warning" : "panic";
    badgeEl.className = `regime-badge ${badgeTone}`;
    badgeEl.textContent = risk.label || (risk.score < 45 ? "LOW RISK" : "ELEVATED");
  }
  if (summaryEl && risk.summary) {
    summaryEl.textContent = risk.summary;
  }
  if (subListEl && risk.factors) {
    const toneClassMap = {
      value: "regime-text-value",
      warning: "regime-text-warning",
      hype: "regime-text-hype",
      panic: "regime-text-panic"
    };

    subListEl.innerHTML = risk.factors
      .map(
        (f) => `
        <div class="risk-sub-row">
          <span class="risk-sub-name">${f.name}</span>
          <span class="risk-sub-level ${toneClassMap[f.tone] || ""}">${f.level}</span>
        </div>
      `
      )
      .join("");
  }
}
