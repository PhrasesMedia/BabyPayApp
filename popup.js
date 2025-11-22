// ======================================
// popup.js (BabyPay v3.8 + live updates)
// ======================================

let lastAction = null;      // 'babyPay' or 'return'
let lastReturnDays = null;  // stores days for return-to-work

// ——— Utility functions ———

function formatCurrency(amount) {
  return "$" + amount.toLocaleString(undefined, { maximumFractionDigits: 0 }) + "/month";
}

function calculateTax(annualIncome) {
  if (annualIncome <= 18200)  return 0;
  if (annualIncome <= 45000)  return (annualIncome - 18200) * 0.16;
  if (annualIncome <= 135000) return 4288 + (annualIncome - 45000) * 0.30;
  if (annualIncome <= 190000) return 31288 + (annualIncome - 135000) * 0.37;
  return 51688 + (annualIncome - 190000) * 0.45;
}

function getDisplayIncome(monthlyGross, showAfterTax) {
  if (!showAfterTax) return monthlyGross;
  const annualGross = monthlyGross * 12;
  const annualTax   = calculateTax(annualGross);
  return (annualGross - annualTax) / 12;
}

// ——— Render breakdown cards ———

function renderBreakdown(
  title,
  nonPrimaryDisplay,
  primaryDisplay,
  totalDisplay,
  note = "",
  showAfterTax = false,
  hasInfo = false,
  nonPrimaryGross = 0,
  primaryGross = 0
) {
  const labelType = showAfterTax ? "Net" : "Gross";
  const totalGross = nonPrimaryGross + primaryGross;

  const makeIcon = (grossAmt, tip) => `
    <img
      src="information.png"
      alt="Info"
      title="${tip}"
      class="info-icon"
      data-value="${grossAmt}"
      style="width:14px;height:14px;cursor:pointer;margin-left:4px;vertical-align:middle;"
    />
  `;

  return `
    <div style="border:1px solid #ddd;padding:8px;margin:8px 0;border-radius:4px;text-align:left;">
      <div style="font-weight:bold;margin-bottom:6px;">${title}</div>
      <div style="font-size:12px;margin-bottom:4px;">
        Non-Primary (${labelType}): ${formatCurrency(Math.round(nonPrimaryDisplay))}
        ${hasInfo ? makeIcon(nonPrimaryGross, "Non-Primary gross value") : ""}
      </div>
      <div style="font-size:12px;margin-bottom:4px;">
        Primary (${labelType}): ${formatCurrency(Math.round(primaryDisplay))}
        ${hasInfo ? makeIcon(primaryGross, "Primary gross value") : ""}
      </div>
      <div style="font-size:12px;font-weight:bold;margin-bottom:4px;">
        Total: ${formatCurrency(Math.round(totalDisplay))}
        ${hasInfo ? makeIcon(totalGross, "Total of both values") : ""}
      </div>
      ${note ? `<div style="font-size:11px;color:#555;">${note}</div>` : ""}
    </div>
  `;
}

// ——— Info icon modal ———

function attachInfoListeners() {
  document.querySelectorAll(".info-icon").forEach(icon => {
    icon.addEventListener("click", () => {
      const gross  = parseFloat(icon.dataset.value) || 0;
      const annual = gross * 12;
      const taxMon = calculateTax(annual) / 12;
      const netMon = gross - taxMon;

      const modal   = document.getElementById("userTaxModal");
      const content = document.getElementById("userTaxModalContent");

      content.innerHTML = `
        <h3 style="margin:0 0 8px;font-size:15px;">Tax Breakdown</h3>
        <p style="margin:0;font-size:13px;line-height:1.4;">
          Gross: ${formatCurrency(Math.round(gross))}<br>
          Tax:   ${formatCurrency(Math.round(taxMon))}<br>
          Net:   ${formatCurrency(Math.round(netMon))}
        </p>
      `;
      modal.style.display = "flex";
    });
  });

  document.getElementById("userTaxModal").addEventListener("click", e => {
    if (e.target.id === "userTaxModal") e.target.style.display = "none";
  });
}

function closeInfoModal() {
  document.getElementById("infoModal").style.display = "none";
}

// ——— Calculations ———

function calculateBabyPay() {
  lastAction = 'babyPay';

  const userGross  = parseFloat(document.getElementById("userIncome").value) || 0;
  const wifeGross  = parseFloat(document.getElementById("wifeIncome").value)  || 0;
  const paidWeeks  = parseFloat(document.getElementById("paidWeeks").value)   || 0;
  const showAfter  = document.getElementById("showAfterTax").checked;
  const payRate    = document.getElementById("fullPay").checked ? 1 : 0.5;

  const govGross   = 915.80 * 52 / 12;
  const leaveGross = wifeGross * payRate;

  const displayUser  = getDisplayIncome(userGross, showAfter);
  const displayGov   = getDisplayIncome(govGross, showAfter);
  const displayLeave = getDisplayIncome(leaveGross, showAfter);

  document.getElementById("result").innerHTML =
    renderBreakdown(
      "Government Pay (24 weeks)",
      displayUser,
      displayGov,
      displayUser + displayGov,
      "Government payment rate: $915.80 per week (gross)",
      showAfter,
      true,
      userGross,
      govGross
    ) +
    renderBreakdown(
      `Paid Leave (${paidWeeks} weeks)`,
      displayUser,
      displayLeave,
      displayUser + displayLeave,
      "Non-primary caretaker remains at work; salary is unchanged.",
      showAfter,
      true,
      userGross,
      leaveGross
    );

  attachInfoListeners();
}

function calculateReturnWork(days) {
  lastAction = 'return';
  lastReturnDays = days;

  const userGross   = parseFloat(document.getElementById("userIncome").value) || 0;
  const wifeMonthly = parseFloat(document.getElementById("wifeIncome").value)  || 0;
  const showAfter   = document.getElementById("showAfterTax").checked;

  const dayGross    = (wifeMonthly * days) / 5;

  const displayUser = getDisplayIncome(userGross, showAfter);
  const displayWife = getDisplayIncome(dayGross, showAfter);

  document.getElementById("result").innerHTML =
    renderBreakdown(
      `Return to Work (${days} Days/Week)`,
      displayUser,
      displayWife,
      displayUser + displayWife,
      "(Non-primary caretaker continues full salary.)",
      showAfter,
      true,
      userGross,
      dayGross
    );

  attachInfoListeners();
}

// ——— Initialization ———

(function init() {

  // ⭐ NEW: Reveal product cards after tool is used
  const productSection = document.querySelector(".product-section");
  function revealProducts() {
    if (productSection) productSection.style.display = "inline-block";
  }

  document.getElementById("result").innerHTML = "";

  // UPDATED button listeners
  document.getElementById("calculate").addEventListener("click", () => {
    calculateBabyPay();
    revealProducts();
  });

  document.getElementById("return2").addEventListener("click", () => {
    calculateReturnWork(2);
    revealProducts();
  });

  document.getElementById("return3").addEventListener("click", () => {
    calculateReturnWork(3);
    revealProducts();
  });

  // After-tax live update
  document.getElementById("showAfterTax").addEventListener("change", () => {
    if (lastAction === 'babyPay')      calculateBabyPay();
    else if (lastAction === 'return')  calculateReturnWork(lastReturnDays);
  });

  // Live updating on input
  ['userIncome','wifeIncome','paidWeeks'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      if (lastAction === 'babyPay')      calculateBabyPay();
      else if (lastAction === 'return')  calculateReturnWork(lastReturnDays);
    });
  });

  ['fullPay','halfPay'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
      if (lastAction === 'babyPay')      calculateBabyPay();
      else if (lastAction === 'return')  calculateReturnWork(lastReturnDays);
    });
  });

  // Close government modal
  window.closeInfoModal = closeInfoModal;
  document.getElementById("infoModal").addEventListener("click", e => {
    if (e.target.id === "infoModal") closeInfoModal();
  });
})();
