/* ==========================================================================
   REGIME AI — Hero Regime, Market Story & Regime Flow Module (js/regime.js)
   ========================================================================== */

/**
 * Renders the Hero Current Market Regime card, Probability bars,
 * Market Story narrative + WATCH box, Regime Flow diagram, and Transition Alert.
 */
export function renderRegimeSection(regimePayload) {
  if (!regimePayload) return;

  // 1. Hero Current Regime Card
  const heroCard = document.getElementById("hero-regime-card");
  const regimeNameEl = document.getElementById("hero-regime-name");
  const confidenceValEl = document.getElementById("hero-confidence-val");
  const regimeBadgeEl = document.getElementById("hero-regime-badge");

  if (heroCard) {
    heroCard.classList.remove("regime-state-value", "regime-state-hype", "regime-state-panic");
    heroCard.classList.add(`regime-state-${regimePayload.key}`);
  }

  if (regimeNameEl) {
    regimeNameEl.textContent = regimePayload.current.toUpperCase();
    regimeNameEl.className = `hero-regime-name regime-text-${regimePayload.key}`;
  }

  const confPct = Math.round(regimePayload.confidence * 100);
  if (confidenceValEl) {
    animateNumericText(confidenceValEl, `${confPct}%`);
  }

  if (regimeBadgeEl) {
    regimeBadgeEl.className = `regime-badge ${regimePayload.key}`;
    regimeBadgeEl.textContent = `${regimePayload.current} • ${confPct}%`;
  }

  // 2. Three Probability Bars (Value-Driven, Hype, Panic)
  const probs = regimePayload.probabilities || { value: 0.91, hype: 0.06, panic: 0.03 };
  updateProbabilityRow("value", Math.round(probs.value * 100), regimePayload.key === "value");
  updateProbabilityRow("hype", Math.round(probs.hype * 100), regimePayload.key === "hype");
  updateProbabilityRow("panic", Math.round(probs.panic * 100), regimePayload.key === "panic");

  // 3. Market Story Card
  const storyHeadline = document.getElementById("story-headline");
  const storyNarrative = document.getElementById("story-narrative");
  const storyWatch = document.getElementById("story-watch-text");

  if (storyHeadline && regimePayload.story) {
    storyHeadline.textContent = `"${regimePayload.story.headline}"`;
  }
  if (storyNarrative && regimePayload.story) {
    storyNarrative.textContent = regimePayload.story.narrative;
  }
  if (storyWatch && regimePayload.story) {
    storyWatch.textContent = regimePayload.story.watch;
  }

  // 4. Unique Visual Feature: REGIME FLOW Diagram
  renderRegimeFlowDiagram(regimePayload);

  // 5. Subtle Inline Regime Transition Alert
  renderTransitionAlert(regimePayload.transitionAlert);
}

function updateProbabilityRow(key, pct, isActive) {
  const rowEl = document.getElementById(`prob-row-${key}`);
  const fillEl = document.getElementById(`prob-fill-${key}`);
  const pctEl = document.getElementById(`prob-pct-${key}`);

  if (rowEl) {
    rowEl.classList.toggle("active-prob", Boolean(isActive));
  }
  if (fillEl) {
    fillEl.style.width = `${pct}%`;
  }
  if (pctEl) {
    pctEl.textContent = `${pct}%`;
  }
}

/**
 * Renders the signature REGIME FLOW visual explanation:
 * CURRENT MARKET -> [VALUE-DRIVEN 91%] -> MOMENTUM / SENTIMENT / VOLATILITY
 */
export function renderRegimeFlowDiagram(regimePayload) {
  const container = document.getElementById("regime-flow-mount");
  if (!container) return;

  const confPct = Math.round(regimePayload.confidence * 100);
  const pillars = regimePayload.flowPillars || [
    { name: "MOMENTUM", state: "HIGH", tone: "value" },
    { name: "SENTIMENT", state: "POSITIVE", tone: "value" },
    { name: "VOLATILITY", state: "LOW", tone: "controlled" }
  ];

  const toneClassMap = {
    value: "regime-text-value",
    hype: "regime-text-hype",
    panic: "regime-text-panic",
    warning: "regime-text-warning",
    controlled: "dir-up"
  };

  container.innerHTML = `
    <div class="flow-node-top">CURRENT MARKET (${regimePayload.symbol || "SPX"})</div>
    <div class="flow-stem-vertical" aria-hidden="true"></div>
    <div class="flow-core-box ${regimePayload.key}">
      <div class="flow-core-regime regime-text-${regimePayload.key}">${regimePayload.current.toUpperCase()}</div>
      <div class="flow-core-conf tabular">${confPct}% Confidence</div>
    </div>
    <svg class="flow-branch-svg" viewBox="0 0 300 28" fill="none" aria-hidden="true">
      <path d="M150 0 L150 12 M48 12 L252 12 M48 12 L48 24 M150 12 L150 24 M252 12 L252 24" stroke="#3B4A63" stroke-width="1.4"/>
      <polygon points="48,27 44.5,21 51.5,21" fill="#8B96A8"/>
      <polygon points="150,27 146.5,21 153.5,21" fill="#8B96A8"/>
      <polygon points="252,27 248.5,21 255.5,21" fill="#8B96A8"/>
    </svg>
    <div class="flow-pillars-grid">
      ${pillars
        .map(
          (p) => `
        <div class="flow-pillar-card">
          <span class="flow-pillar-name">${p.name}</span>
          <span class="flow-pillar-state ${toneClassMap[p.tone] || ""}">${p.state}</span>
        </div>
      `
        )
        .join("")}
    </div>
    <div class="flow-caption">
      Causal classification pathway from real-time factor states
    </div>
  `;
}

/**
 * Renders the subtle inline Regime Transition Alert bar
 */
export function renderTransitionAlert(alertData) {
  const bar = document.getElementById("transition-alert-bar");
  if (!bar || !alertData) return;

  const fromEl = document.getElementById("alert-from-regime");
  const toEl = document.getElementById("alert-to-regime");
  const confEl = document.getElementById("alert-confidence");
  const timeEl = document.getElementById("alert-detected");
  const driverEl = document.getElementById("alert-driver");

  if (fromEl) fromEl.textContent = alertData.from;
  if (toEl) toEl.textContent = alertData.to;
  if (confEl) confEl.textContent = `${Math.round(alertData.confidence * 100)}%`;
  if (timeEl) timeEl.textContent = alertData.detectedAgo;
  if (driverEl) driverEl.textContent = alertData.primaryDriver;
}

function animateNumericText(el, nextText) {
  if (el.textContent !== nextText) {
    el.textContent = nextText;
    el.classList.remove("tick-flash");
    void el.offsetWidth;
    el.classList.add("tick-flash");
  }
}
