export function renderWhyEngine(whyPayload) {
  if (!whyPayload || !whyPayload.drivers) return;
  const listEl = document.getElementById("why-drivers-list");
  if (listEl) {
    listEl.innerHTML = whyPayload.drivers
      .map((driver) => {
        const pct = Math.round(driver.value * 100);
        const arrowColor =
          driver.direction === "positive"
            ? "dir-up"
            : driver.direction === "elevated"
            ? "regime-text-hype"
            : driver.direction === "negative"
            ? "dir-down"
            : "dir-neutral";

        return `
          <div class="driver-item">
            <div class="driver-top">
              <div class="driver-name-group">
                <span>${driver.name}</span>
                <span class="driver-dir-arrow ${arrowColor}" aria-label="direction ${driver.direction}">${driver.arrow || "↑"}</span>
              </div>
              <span class="driver-mag-badge">${driver.magnitude}</span>
            </div>
            <div class="driver-bar-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${driver.name} model contribution">
              <div class="driver-bar-fill ${driver.direction}" data-pct="${pct}"></div>
            </div>
            <p class="driver-explanation">"${driver.interpretation}"</p>
          </div>
        `;
      })
      .join("");

    listEl.querySelectorAll(".driver-bar-fill").forEach((bar) => {
      bar.style.width = `${bar.dataset.pct}%`;
    });
  }

  // Render expandable "View technical details" drawer
  const techContent = document.getElementById("tech-details-content");
  if (techContent && whyPayload.modelMetadata) {
    const meta = whyPayload.modelMetadata;
    const driverRows = whyPayload.drivers
      .map(
        (d) => `
        <div class="tech-kv-item">
          <span>${d.name} (${d.technical?.window || "20D"})</span>
          <span class="tabular">z=${d.technical?.zScore || "+1.2σ"} | w=${d.technical?.weight || "0.20"}</span>
        </div>
      `
      )
      .join("");

    techContent.innerHTML = `
      <div class="tech-diag-title">
        Model Contribution Diagnostics (Quantitative View)
      </div>
      <div class="tech-kv-grid">
        ${driverRows}
        <div class="tech-kv-item">
          <span>Ensemble Agreement</span>
          <span class="tabular">${meta.ensembleAgreement}</span>
        </div>
        <div class="tech-kv-item">
          <span>Transition Entropy</span>
          <span class="tabular">${meta.transitionEntropy}</span>
        </div>
      </div>
    `;
  }

  // Bind technical details toggle button once
  const toggleBtn = document.getElementById("tech-toggle-btn");
  if (toggleBtn && !toggleBtn.dataset.bound) {
    toggleBtn.dataset.bound = "true";
    toggleBtn.addEventListener("click", () => {
      const expanded = toggleBtn.getAttribute("aria-expanded") === "true";
      const nextState = !expanded;
      toggleBtn.setAttribute("aria-expanded", String(nextState));
      const labelSpan = toggleBtn.querySelector(".tech-toggle-label");
      if (labelSpan) {
        labelSpan.textContent = nextState ? "Hide technical details" : "View technical details";
      }
      if (techContent) {
        techContent.classList.toggle("open", nextState);
      }
    });
  }
}
