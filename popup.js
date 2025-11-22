// ===================== GLOBAL STATE =====================

let lastAction = null;          // "babyPay" or "return"
let lastReturnDays = null;      // 2 or 3



// ===================== TAX HELPERS =====================

// Standard Australian monthly tax estimation (simple bracket logic)
function estimateMonthlyTax(incomeMonthly) {
  const annual = incomeMonthly * 12;

  let tax = 0;

  if (annual <= 18200) tax = 0;
  else if (annual <= 45000) tax = (annual - 18200) * 0.16;
  else if (annual <= 135000) tax = (45000 - 18200) * 0.16 + (annual - 45000) * 0.30;
  else tax = (45000 - 18200) * 0.16 + (135000 - 45000) * 0.30 + (annual - 135000) * 0.37;

  return tax / 12; // monthly
}

function netMonthly(grossMonthly) {
  const tax = estimateMonthlyTax(grossMonthly);
  return grossMonthly - tax;
}



// ===================== GOVERNMENT PAY =====================

// Government PPL constants
const GOV_WEEKLY = 915.80;
const GOV_MONTHLY_CONSERVATIVE = 2960; // used when after-tax mode is ON
const GOV_WEEKS = 24;


// ===================== MAIN CALCULATIONS =====================

function calculateBabyPay() {
  lastAction = 'babyPay';

  const userIncome = Number(document.getElementById("userIncome").value);
  const wifeIncome = Number(document.getElementById("wifeIncome").value);
  const paidWeeks = Number(document.getElementById("paidWeeks").value);
  const fullPay = document.getElementById("fullPay").checked;
  const halfPay = document.getElementById("halfPay").checked;
  const afterTax = document.getElementById("showAfterTax").checked;

  if (!userIncome || !wifeIncome || !paidWeeks) {
    document.getElementById("result").innerHTML = "";
    return;
  }

  // Determine primary caretaker pay type
  let workplacePayMonthly = 0;

  if (fullPay) workplacePayMonthly = wifeIncome;
  else if (halfPay) workplacePayMonthly = wifeIncome / 2;

  // Government leave (24 weeks)
  const govMonthlyGross = (GOV_WEEKLY * GOV_WEEKS) / 6;

  const govMonthlyFinal = afterTax
    ? GOV_MONTHLY_CONSERVATIVE
    : govMonthlyGross;

  // If using after-tax mode, convert the workplace pay as well
  let finalPrimaryPay = afterTax ? netMonthly(workplacePayMonthly) : workplacePayMonthly;

  // Build output
  document.getElementById("result").innerHTML = `
    <div class="breakdown">
      <h3>Primary Caretaker</h3>
      Workplace Pay (${paidWeeks} weeks): <span class="highlight">$${finalPrimaryPay.toFixed(0)}/mo</span><br>
      Government Pay: <span class="highlight">$${govMonthlyFinal.toFixed(0)}/mo</span><br><br>
      <strong>Total Monthly: $${(finalPrimaryPay + govMonthlyFinal).toFixed(0)}</strong>
    </div>
  `;
}



function calculateReturnWork(days) {
  lastAction = 'return';
  lastReturnDays = days;

  const userIncome = Number(document.getElementById("userIncome").value);
  const wifeIncome = Number(document.getElementById("wifeIncome").value);
  const afterTax = document.getElementById("showAfterTax").checked;

  if (!userIncome || !wifeIncome) {
    document.getElementById("result").innerHTML = "";
    return;
  }

  const workFraction = days / 5;
  const primaryGross = wifeIncome * workFraction;
  const primaryFinal = afterTax ? netMonthly(primaryGross) : primaryGross;

  const nonPrimaryFinal = afterTax ? netMonthly(userIncome) : userIncome;

  document.getElementById("result").innerHTML = `
    <div class="breakdown">
      <h3>Return to Work (${days} Days/Week)</h3>
      <strong>Primary (Net):</strong> $${primaryFinal.toFixed(0)}/month<br>
      <strong>Non-Primary (Net):</strong> $${nonPrimaryFinal.toFixed(0)}/month<br><br>
      <strong>Total: $${(primaryFinal + nonPrimaryFinal).toFixed(0)}/month</strong>
    </div>
  `;
}



// ===================== MODALS =====================

function closeInfoModal() {
  document.getElementById("infoModal").style.display = "none";
}



// ===================== INITIALISATION =====================

(function init() {

  // -----------------------
  // SHOW PRODUCT SECTION AFTER TOOL USE
  // -----------------------
  const productSection = document.querySelector('.product-section');

  function revealProducts() {
    if (productSection) {
      productSection.style.display = "inline-block";
    }
  }


  // -----------------------
  // CLEAR RESULT ON LOAD
  // -----------------------
  document.getElementById("result").innerHTML = "";



  // -----------------------
  // MAIN BUTTON EVENTS
  // -----------------------
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



  // -----------------------
  // AFTER-TAX TOGGLE (LIVE UPDATE)
  // -----------------------
  document.getElementById("showAfterTax").addEventListener("change", () => {
    if (lastAction === 'babyPay') calculateBabyPay();
    if (lastAction === 'return') calculateReturnWork(lastReturnDays);
  });



  // -----------------------
  // LIVE INPUT UPDATES
  // -----------------------
  ['userIncome','wifeIncome','paidWeeks'].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      if (lastAction === 'babyPay') calculateBabyPay();
      if (lastAction === 'return') calculateReturnWork(lastReturnDays);
    });
  });

  ['fullPay','halfPay'].forEach(id => {
    document.getElementById(id).addEventListener("change", () => {
      if (lastAction === 'babyPay') calculateBabyPay();
      if (lastAction === 'return') calculateReturnWork(lastReturnDays);
    });
  });



  // -----------------------
  // MODAL OUTSIDE CLICK CLOSE
  // -----------------------
  document.getElementById("infoModal").addEventListener("click", e => {
    if (e.target.id === "infoModal") closeInfoModal();
  });

})();
