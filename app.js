const API_URL = "/api";

// App State
let currentUser = null;
let token = localStorage.getItem("KOFS_AUTH_TOKEN") || null;
let currentTheme = localStorage.getItem("KOFS_THEME") || "dark";

let appData = {
  accounts: [],
  projects: [],
  transactions: [],
  loans: []
};

let activeDetailProjectId = null;
window.currentActiveView = "overview";

// ==========================================
// THEME CONTROLLER (Dark / Light Mode)
// ==========================================
function applyTheme(theme) {
  currentTheme = theme;
  localStorage.setItem("KOFS_THEME", theme);
  const icon = document.getElementById("themeIcon");
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
    if (icon) icon.className = "fa-solid fa-sun text-brand-400";
  } else {
    document.documentElement.classList.remove("dark");
    if (icon) icon.className = "fa-solid fa-moon text-slate-700";
  }
  if (currentUser) renderCharts();
}

const btnToggleTheme = document.getElementById("btnToggleTheme");
if (btnToggleTheme) {
  btnToggleTheme.onclick = () => {
    applyTheme(currentTheme === "dark" ? "light" : "dark");
  };
}

// Safe API Fetch Client
async function apiFetch(endpoint, options = {}) {
  try {
    const res = await fetch(endpoint, options);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(`Server Error (${res.status}): ${text || "Empty response from server. Check MongoDB IP Access."}`);
    }
    if (!res.ok) throw new Error(data.error || `Request failed with status ${res.status}`);
    return data;
  } catch (err) {
    throw err;
  }
}

// Password Eye Toggle
window.togglePasswordVisibility = (inputId, iconId) => {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  if (!input || !icon) return;
  if (input.type === "password") {
    input.type = "text";
    icon.className = "fa-regular fa-eye-slash";
  } else {
    input.type = "password";
    icon.className = "fa-regular fa-eye";
  }
};

// Copy Discord Handle Helper & 1-Click Launch
window.copyDiscordHandle = () => {
  const handle = "_kofs_";
  navigator.clipboard.writeText(handle).then(() => {
    showToast(`Discord ID '${handle}' copied to clipboard! Opening Discord...`);
    setTimeout(() => {
      window.open("https://discord.com/users", "_blank");
    }, 600);
  }).catch(() => {
    prompt("Copy Discord handle:", handle);
  });
};

// DOM Elements
const authGatekeeper = document.getElementById("authGatekeeper");
const appContainer = document.getElementById("appContainer");
const totalNetWorthEl = document.getElementById("totalNetWorth");
const totalProjectInflowEl = document.getElementById("totalProjectInflow");
const totalProjectExpenseEl = document.getElementById("totalProjectExpense");
const totalLentPendingEl = document.getElementById("totalLentPending");
const accountsGridEl = document.getElementById("accountsGrid");
const projectsGridEl = document.getElementById("projectsGrid");
const loansTableBodyEl = document.getElementById("loansTableBody");
const txTableBodyEl = document.getElementById("txTableBody");
const filterProjectEl = document.getElementById("filterProject");
const filterAccountEl = document.getElementById("filterAccount");
const txSearchEl = document.getElementById("txSearch");
const displayUserNameEl = document.getElementById("displayUserName");

// Modals
const modalProfile = document.getElementById("modalProfile");
const modalForgotPass = document.getElementById("modalForgotPass");
const modalTx = document.getElementById("modalTx");
const modalAccount = document.getElementById("modalAccount");
const modalProject = document.getElementById("modalProject");
const modalLoan = document.getElementById("modalLoan");
const modalTransfer = document.getElementById("modalTransfer");
const modalProjectDetails = document.getElementById("modalProjectDetails");
const modalLoanSettle = document.getElementById("modalLoanSettle");
const modalAddFunds = document.getElementById("modalAddFunds");
const modalLentHistory = document.getElementById("modalLentHistory");

// Open Modal Triggers
if (document.getElementById("btnOpenTxModal")) document.getElementById("btnOpenTxModal").onclick = () => { resetTxForm(); openModal(modalTx); };
if (document.getElementById("btnOpenAccountModal")) document.getElementById("btnOpenAccountModal").onclick = () => { resetAccountForm(); openModal(modalAccount); };
if (document.getElementById("btnOpenProjectModal")) document.getElementById("btnOpenProjectModal").onclick = () => { resetProjectForm(); openModal(modalProject); };
if (document.getElementById("btnOpenLoanModal")) document.getElementById("btnOpenLoanModal").onclick = () => openModal(modalLoan);
if (document.getElementById("btnOpenTransferModal")) document.getElementById("btnOpenTransferModal").onclick = () => openModal(modalTransfer);
if (document.getElementById("btnOpenProfileModal")) document.getElementById("btnOpenProfileModal").onclick = () => openProfileModal();

if (document.getElementById("btnForgotPassTrigger")) {
  document.getElementById("btnForgotPassTrigger").onclick = () => {
    openModal(modalForgotPass);
  };
}

document.querySelectorAll(".modal-close").forEach(btn => {
  btn.onclick = (e) => e.target.closest(".modal-backdrop").classList.add("hidden");
});

function openModal(modal) {
  if (!modal) return;
  modal.classList.remove("hidden");
  const today = new Date().toISOString().split("T")[0];
  const txDate = document.getElementById("txDate");
  const loanDate = document.getElementById("loanDate");
  const transferDate = document.getElementById("transferDate");
  const settleDate = document.getElementById("settleDate");
  const depositDate = document.getElementById("depositDate");
  if (txDate && !txDate.value) txDate.value = today;
  if (loanDate && !loanDate.value) loanDate.value = today;
  if (transferDate && !transferDate.value) transferDate.value = today;
  if (settleDate && !settleDate.value) settleDate.value = today;
  if (depositDate && !depositDate.value) depositDate.value = today;
}

function showToast(msg, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const t = document.createElement("div");
  const bg = type === "success" ? "bg-emerald-600 text-white" : type === "error" ? "bg-rose-600 text-white" : "bg-brand-500 text-slate-950 font-bold";
  t.className = `${bg} px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0 pointer-events-auto border border-white/10`;
  t.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-check' : 'fa-info'}"></i> <span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => t.classList.remove("translate-y-2", "opacity-0"), 10);
  setTimeout(() => {
    t.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => t.remove(), 300);
  }, 2500);
}

function formatBDT(amount) {
  const num = Number(amount) || 0;
  return "৳" + num.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Brand visual badge helper
function getProviderBadge(type) {
  const mfsTypes = ["bKash", "Nagad", "Rocket", "Upay", "Cellfin", "Tap", "mCash"];
  if (type === "bKash") return { bg: "bg-pink-500/10 text-pink-500 border border-pink-500/20", icon: "fa-mobile-screen" };
  if (type === "Nagad") return { bg: "bg-amber-500/10 text-amber-500 border border-amber-500/20", icon: "fa-mobile-screen" };
  if (type === "Rocket") return { bg: "bg-purple-500/10 text-purple-500 border border-purple-500/20", icon: "fa-mobile-screen" };
  if (type === "Upay") return { bg: "bg-sky-500/10 text-sky-500 border border-sky-500/20", icon: "fa-mobile-screen" };
  if (mfsTypes.includes(type)) return { bg: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20", icon: "fa-mobile-screen" };
  if (type && type.includes("Bank")) return { bg: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20", icon: "fa-building-columns" };
  if (type === "Cash") return { bg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20", icon: "fa-money-bill-wave" };
  return { bg: "bg-slate-500/10 text-slate-400 border border-slate-500/20", icon: "fa-wallet" };
}

// ==========================================
// STRICT GATEKEEPER & AUTHENTICATION
// ==========================================
let isRegisterMode = false;
const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const authNameGroup = document.getElementById("authNameGroup");
const btnAuthSubmit = document.getElementById("btnAuthSubmit");

if (tabLogin) tabLogin.onclick = () => setAuthMode(false);
if (tabRegister) tabRegister.onclick = () => setAuthMode(true);

function setAuthMode(register) {
  isRegisterMode = register;
  if (register) {
    if (tabRegister) tabRegister.className = "flex-1 py-2 text-xs font-bold rounded-lg transition bg-white dark:bg-brand-500 dark:text-slate-950 text-brand-600 shadow-sm";
    if (tabLogin) tabLogin.className = "flex-1 py-2 text-xs font-bold rounded-lg transition text-slate-500 dark:text-slate-400";
    if (authNameGroup) authNameGroup.classList.remove("hidden");
    if (btnAuthSubmit) btnAuthSubmit.querySelector("span").textContent = "Register";
  } else {
    if (tabLogin) tabLogin.className = "flex-1 py-2 text-xs font-bold rounded-lg transition bg-white dark:bg-brand-500 dark:text-slate-950 text-brand-600 shadow-sm";
    if (tabRegister) tabRegister.className = "flex-1 py-2 text-xs font-bold rounded-lg transition text-slate-500 dark:text-slate-400";
    if (authNameGroup) authNameGroup.classList.add("hidden");
    if (btnAuthSubmit) btnAuthSubmit.querySelector("span").textContent = "Login";
  }
}

const formAuth = document.getElementById("formAuth");
if (formAuth) {
  formAuth.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value.trim();
    const name = document.getElementById("authName") ? document.getElementById("authName").value.trim() : "";

    const endpoint = isRegisterMode ? `${API_URL}/register?action=register` : `${API_URL}/login?action=login`;
    const body = isRegisterMode ? { name, email, password } : { email, password };

    if (btnAuthSubmit) {
      btnAuthSubmit.disabled = true;
      btnAuthSubmit.querySelector("span").textContent = "Authenticating...";
    }

    try {
      const data = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      token = data.token;
      currentUser = data.user;
      localStorage.setItem("KOFS_AUTH_TOKEN", token);
      localStorage.setItem("KOFS_AUTH_USER", JSON.stringify(currentUser));

      unlockApplication();
      showToast(`Welcome back, ${currentUser.name}!`);
      loadUserData();
    } catch (err) {
      alert(err.message);
    } finally {
      if (btnAuthSubmit) {
        btnAuthSubmit.disabled = false;
        btnAuthSubmit.querySelector("span").textContent = isRegisterMode ? "Register" : "Login";
      }
    }
  };
}

function unlockApplication() {
  if (authGatekeeper) authGatekeeper.classList.add("hidden");
  if (appContainer) appContainer.classList.remove("hidden");
  updateUserDisplay();
  window.switchView("overview");
}

function lockApplication() {
  if (authGatekeeper) authGatekeeper.classList.remove("hidden");
  if (appContainer) appContainer.classList.add("hidden");
}

const btnLogout = document.getElementById("btnLogout");
if (btnLogout) {
  btnLogout.onclick = () => {
    if (confirm("Logout from KofsLedger?")) {
      localStorage.removeItem("KOFS_AUTH_TOKEN");
      localStorage.removeItem("KOFS_AUTH_USER");
      token = null;
      currentUser = null;
      lockApplication();
    }
  };
}

function updateUserDisplay() {
  const storedUser = localStorage.getItem("KOFS_AUTH_USER");
  if (storedUser) currentUser = JSON.parse(storedUser);
  if (!currentUser) return;

  if (displayUserNameEl) displayUserNameEl.textContent = currentUser.name;

  // Print Statement Details
  const printUserName = document.getElementById("printUserName");
  if (printUserName) printUserName.textContent = currentUser.name || "N/A";

  const printUserEmail = document.getElementById("printUserEmail");
  if (printUserEmail) printUserEmail.textContent = currentUser.email || "N/A";

  const printUserPhone = document.getElementById("printUserPhone");
  if (printUserPhone) printUserPhone.textContent = currentUser.phone || "N/A";

  const printUserAddress = document.getElementById("printUserAddress");
  if (printUserAddress) printUserAddress.textContent = currentUser.address || "N/A";

  const printDate = document.getElementById("printDate");
  if (printDate) {
    printDate.textContent = new Date().toLocaleDateString("en-BD", { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });
  }

  const headerAvatarContainer = document.getElementById("headerAvatarContainer");
  const modalAvatarPreview = document.getElementById("modalAvatarPreview");

  if (currentUser.avatar) {
    if (headerAvatarContainer) headerAvatarContainer.innerHTML = `<img src="${currentUser.avatar}" class="w-full h-full object-cover" />`;
    if (modalAvatarPreview) modalAvatarPreview.innerHTML = `<img src="${currentUser.avatar}" class="w-full h-full object-cover" />`;
  } else {
    const initial = (currentUser.name || "U").charAt(0).toUpperCase();
    if (headerAvatarContainer) headerAvatarContainer.innerHTML = `<span>${initial}</span>`;
    if (modalAvatarPreview) modalAvatarPreview.innerHTML = `<span>${initial}</span>`;
  }
}

// ==========================================
// PROFILE & PHOTO UPLOAD
// ==========================================
function openProfileModal() {
  if (!currentUser) return;
  document.getElementById("profName").value = currentUser.name || "";
  document.getElementById("profEmail").value = currentUser.email || "";
  document.getElementById("profPhone").value = currentUser.phone || "";
  document.getElementById("profAddress").value = currentUser.address || "";
  document.getElementById("profRecoveryPin").value = currentUser.recoveryPin || "123456";
  document.getElementById("profAvatarBase64").value = currentUser.avatar || "";
  openModal(modalProfile);
}

const profAvatarInput = document.getElementById("profAvatarInput");
if (profAvatarInput) {
  profAvatarInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      return alert("Image size must be under 1.5MB");
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      document.getElementById("profAvatarBase64").value = base64;
      const modalAvatarPreview = document.getElementById("modalAvatarPreview");
      if (modalAvatarPreview) modalAvatarPreview.innerHTML = `<img src="${base64}" class="w-full h-full object-cover" />`;
    };
    reader.readAsDataURL(file);
  };
}

const formProfile = document.getElementById("formProfile");
if (formProfile) {
  formProfile.onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById("profName").value.trim();
    const phone = document.getElementById("profPhone").value.trim();
    const address = document.getElementById("profAddress").value.trim();
    const recoveryPin = document.getElementById("profRecoveryPin").value.trim();
    const avatar = document.getElementById("profAvatarBase64").value;

    const btnSave = document.getElementById("btnSaveProfile");
    if (btnSave) {
      btnSave.disabled = true;
      btnSave.textContent = "Saving...";
    }

    try {
      const data = await apiFetch(`${API_URL}/profile?action=profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name, phone, address, recoveryPin, avatar })
      });

      currentUser = data.user;
      localStorage.setItem("KOFS_AUTH_USER", JSON.stringify(currentUser));
      updateUserDisplay();
      showToast("Profile & Photo updated successfully!");
      if (modalProfile) modalProfile.classList.add("hidden");
    } catch (err) {
      alert(err.message);
    } finally {
      if (btnSave) {
        btnSave.disabled = false;
        btnSave.textContent = "Save Profile Changes";
      }
    }
  };
}

const formForgotPass = document.getElementById("formForgotPass");
if (formForgotPass) {
  formForgotPass.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById("resetEmail").value.trim();
    const recoveryPin = document.getElementById("resetPin").value.trim();
    const newPassword = document.getElementById("resetNewPass").value.trim();

    const btnReset = document.getElementById("btnSubmitReset");
    if (btnReset) {
      btnReset.disabled = true;
      btnReset.textContent = "Resetting...";
    }

    try {
      const res = await apiFetch(`${API_URL}/reset-password?action=reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, recoveryPin, newPassword })
      });

      showToast(res.message);
      if (modalForgotPass) modalForgotPass.classList.add("hidden");
      setAuthMode(false);
      document.getElementById("authEmail").value = email;
    } catch (err) {
      alert(err.message);
    } finally {
      if (btnReset) {
        btnReset.disabled = false;
        btnReset.textContent = "Reset Password";
      }
    }
  };
}

// ==========================================
// MONGODB DATA SYNC
// ==========================================
async function loadUserData() {
  if (!token) {
    lockApplication();
    return;
  }
  try {
    const data = await apiFetch(`${API_URL}/data?action=data`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    appData = {
      accounts: data.accounts || [],
      projects: data.projects || [],
      transactions: data.transactions || [],
      loans: data.loans || []
    };
    updateDropdowns();
    render();
  } catch (err) {
    if (err.message && (err.message.includes("401") || err.message.includes("Unauthorized"))) {
      localStorage.removeItem("KOFS_AUTH_TOKEN");
      lockApplication();
    } else {
      console.error("Fetch data error:", err);
    }
  }
}

async function syncToMongoDB() {
  render();
  if (!token) return;
  try {
    await apiFetch(`${API_URL}/data?action=data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(appData)
    });
  } catch (err) {
    console.error("Sync error:", err);
  }
}

// ==========================================
// CHARTS & STATS
// ==========================================
let projectChartInstance = null;
let trendChartInstance = null;

function renderCharts() {
  const isDark = document.documentElement.classList.contains("dark");
  const textColor = isDark ? "#94a3b8" : "#64748b";
  const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";

  const projExpenseMap = {};
  appData.transactions.filter(t => t.type === "EXPENSE").forEach(t => {
    const proj = appData.projects.find(p => p.id === t.projectId);
    const name = proj ? proj.name : "General / Personal";
    projExpenseMap[name] = (projExpenseMap[name] || 0) + Number(t.amount);
  });

  const labels = Object.keys(projExpenseMap);
  const data = Object.values(projExpenseMap);
  const noChartMsg = document.getElementById("noProjectChartMsg");

  if (projectChartInstance) projectChartInstance.destroy();

  const canvasPie = document.getElementById("projectChart");
  if (canvasPie) {
    if (labels.length === 0) {
      if (noChartMsg) noChartMsg.classList.remove("hidden");
    } else {
      if (noChartMsg) noChartMsg.classList.add("hidden");
      const ctx = canvasPie.getContext("2d");
      projectChartInstance = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: ["#00d2ff", "#f43f5e", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { boxWidth: 10, color: textColor, font: { size: 10 } } }
          }
        }
      });
    }
  }

  const last6Months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    last6Months.push(d.toISOString().slice(0, 7));
  }

  const incomeData = last6Months.map(m => appData.transactions.filter(t => t.type === "INCOME" && t.date.startsWith(m)).reduce((s, t) => s + Number(t.amount), 0));
  const expenseData = last6Months.map(m => appData.transactions.filter(t => t.type === "EXPENSE" && t.date.startsWith(m)).reduce((s, t) => s + Number(t.amount), 0));
  const monthLabels = last6Months.map(m => {
    const [y, mon] = m.split("-");
    return new Date(y, mon - 1).toLocaleString("default", { month: "short" });
  });

  if (trendChartInstance) trendChartInstance.destroy();
  const canvasTrend = document.getElementById("trendChart");
  if (canvasTrend) {
    const trendCtx = canvasTrend.getContext("2d");
    trendChartInstance = new Chart(trendCtx, {
      type: "bar",
      data: {
        labels: monthLabels,
        datasets: [
          { label: "Income", data: incomeData, backgroundColor: "#10b981", borderRadius: 6 },
          { label: "Expense", data: expenseData, backgroundColor: "#f43f5e", borderRadius: 6 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: textColor, font: { size: 11, weight: 'bold' } } } },
        scales: {
          y: { ticks: { color: textColor, callback: v => "৳" + v }, grid: { color: gridColor } },
          x: { ticks: { color: textColor }, grid: { display: false } }
        }
      }
    });
  }
}

function render() {
  const netWorth = appData.accounts.reduce((acc, a) => acc + (Number(a.balance) || 0), 0);
  if (totalNetWorthEl) totalNetWorthEl.textContent = formatBDT(netWorth);
  const accountCountLabel = document.getElementById("accountCountLabel");
  if (accountCountLabel) accountCountLabel.textContent = `Across ${appData.accounts.length} accounts`;

  let projIn = 0, projOut = 0;
  appData.transactions.forEach(t => {
    if (t.projectId && t.projectId !== "NONE") {
      if (t.type === "INCOME") projIn += Number(t.amount);
      if (t.type === "EXPENSE") projOut += Number(t.amount);
    }
  });
  if (totalProjectInflowEl) totalProjectInflowEl.textContent = formatBDT(projIn);
  if (totalProjectExpenseEl) totalProjectExpenseEl.textContent = formatBDT(projOut);

  // Print Statement Figures
  const totalTxExpense = appData.transactions
    .filter(t => t.type === "EXPENSE")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalTxIncome = appData.transactions
    .filter(t => t.type === "INCOME")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const printTotalBalance = document.getElementById("printTotalBalance");
  if (printTotalBalance) printTotalBalance.textContent = formatBDT(netWorth);

  const printTotalExpense = document.getElementById("printTotalExpense");
  if (printTotalExpense) printTotalExpense.textContent = formatBDT(totalTxExpense);

  const printTotalInflow = document.getElementById("printTotalInflow");
  if (printTotalInflow) printTotalInflow.textContent = formatBDT(totalTxIncome);

  const pendingLent = appData.loans
    .filter(l => l.status !== "REPAID")
    .reduce((acc, l) => acc + (Number(l.remainingAmount ?? l.amount) || 0), 0);
  if (totalLentPendingEl) totalLentPendingEl.textContent = formatBDT(pendingLent);

  renderAccounts();
  renderProjects();
  renderLoans();
  renderTransactions();
  renderCharts();

  if (activeDetailProjectId) refreshProjectDetails(activeDetailProjectId);
}

function updateDropdowns() {
  const accOpts = appData.accounts.map(a => `<option value="${a.id}">${a.name} [${a.type}] (${formatBDT(a.balance)})</option>`).join("");
  const txAccount = document.getElementById("txAccount");
  if (txAccount) txAccount.innerHTML = accOpts;
  const loanAccount = document.getElementById("loanAccount");
  if (loanAccount) loanAccount.innerHTML = accOpts;
  const transferFrom = document.getElementById("transferFrom");
  if (transferFrom) transferFrom.innerHTML = accOpts;
  const settleDepositAccount = document.getElementById("settleDepositAccount");
  if (settleDepositAccount) settleDepositAccount.innerHTML = accOpts;

  const transferTo = document.getElementById("transferTo");
  if (transferTo) transferTo.innerHTML = accOpts + `<option value="EXTERNAL">+ Send to External Recipient</option>`;
  if (filterAccountEl) filterAccountEl.innerHTML = `<option value="ALL">All Accounts</option>` + appData.accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join("");

  const projOpts = `<option value="NONE">General / Personal (No Project)</option>` + 
    appData.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join("");
  const txProject = document.getElementById("txProject");
  if (txProject) txProject.innerHTML = projOpts;
  if (filterProjectEl) filterProjectEl.innerHTML = `<option value="ALL">All Projects</option>` + appData.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join("");
}

const transferToEl = document.getElementById("transferTo");
if (transferToEl) {
  transferToEl.onchange = (e) => {
    const extGroup = document.getElementById("externalRecipientGroup");
    const extNameInput = document.getElementById("transferExternalName");
    if (!extGroup) return;
    if (e.target.value === "EXTERNAL") {
      extGroup.classList.remove("hidden");
      if (extNameInput) extNameInput.required = true;
    } else {
      extGroup.classList.add("hidden");
      if (extNameInput) extNameInput.required = false;
    }
  };
}

// ==========================================
// ACCOUNTS & DIRECT DEPOSIT
// ==========================================
function renderAccounts() {
  if (!accountsGridEl) return;
  if (appData.accounts.length === 0) {
    accountsGridEl.innerHTML = `<div class="col-span-full py-6 text-center text-slate-400 bg-slate-50 dark:bg-darkbg-elevated border border-dashed border-slate-200 dark:border-darkbg-border rounded-2xl text-xs">No accounts added yet. Click "+ Add Account".</div>`;
    return;
  }
  accountsGridEl.innerHTML = appData.accounts.map(a => {
    const badge = getProviderBadge(a.type);
    return `
      <div class="bg-white dark:bg-darkbg-card p-5 rounded-2xl border border-slate-200/80 dark:border-darkbg-border shadow-sm flex flex-col justify-between hover:border-brand-500/50 transition">
        <div>
          <div class="flex justify-between items-start">
            <span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${badge.bg}">
              <i class="fa-solid ${badge.icon}"></i>
              <span>${a.type}</span>
            </span>
            <div class="flex items-center gap-1">
              <button onclick="window.editAccount('${a.id}')" class="p-1.5 text-slate-400 hover:text-brand-400 transition text-xs" title="Edit Account">
                <i class="fa-regular fa-pen-to-square"></i>
              </button>
              <button onclick="window.deleteAccount('${a.id}')" class="p-1.5 text-slate-400 hover:text-rose-500 transition text-xs" title="Delete Account">
                <i class="fa-regular fa-trash-can"></i>
              </button>
            </div>
          </div>
          <h4 class="font-extrabold text-slate-800 dark:text-white text-base mt-2">${a.name}</h4>
          <p class="text-2xl font-black text-brand-500 mt-1">${formatBDT(a.balance)}</p>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-100 dark:border-darkbg-border flex items-center justify-between">
          <span class="text-[10px] font-bold text-slate-400">Available Balance</span>
          <button onclick="window.openDepositModal('${a.id}')" class="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black px-3 py-1.5 rounded-xl border border-emerald-500/30 transition flex items-center gap-1.5 active:scale-95">
            <i class="fa-solid fa-circle-plus"></i> Add Money
          </button>
        </div>
      </div>
    `;
  }).join("");
}

window.openDepositModal = (accId) => {
  const acc = appData.accounts.find(a => a.id === accId);
  if (!acc) return;
  document.getElementById("depositTargetAccountId").value = acc.id;
  document.getElementById("depositTargetAccountName").textContent = `${acc.name} [${acc.type}] (Current: ${formatBDT(acc.balance)})`;
  document.getElementById("depositAmount").value = "";
  document.getElementById("depositNote").value = "";
  openModal(modalAddFunds);
};

const formAddFunds = document.getElementById("formAddFunds");
if (formAddFunds) {
  formAddFunds.onsubmit = async (e) => {
    e.preventDefault();
    const accId = document.getElementById("depositTargetAccountId").value;
    const amount = parseFloat(document.getElementById("depositAmount").value) || 0;
    const note = document.getElementById("depositNote").value.trim();
    const date = document.getElementById("depositDate").value;

    const target = appData.accounts.find(a => a.id === accId);
    if (!target) return alert("Target account not found");
    if (amount <= 0) return alert("Enter a valid deposit amount");

    target.balance = Number(target.balance) + amount;

    appData.transactions.unshift({
      id: "tx_" + Date.now(),
      type: "INCOME",
      accountId: accId,
      projectId: "NONE",
      amount,
      note: `Deposit: ${note}`,
      date
    });

    await syncToMongoDB();
    showToast(`Added ${formatBDT(amount)} to ${target.name}!`);
    if (modalAddFunds) modalAddFunds.classList.add("hidden");
  };
}

const formAccount = document.getElementById("formAccount");
if (formAccount) {
  formAccount.onsubmit = async (e) => {
    e.preventDefault();
    const editId = document.getElementById("editAccountId").value;
    const name = document.getElementById("accName").value.trim();
    const type = document.getElementById("accType").value;
    const balance = parseFloat(document.getElementById("accBalance").value) || 0;

    if (editId) {
      const acc = appData.accounts.find(a => a.id === editId);
      if (acc) {
        acc.name = name;
        acc.type = type;
        acc.balance = balance;
      }
      showToast("Account details updated!");
    } else {
      appData.accounts.push({ id: "acc_" + Date.now(), name, type, balance });
      showToast("Account created successfully!");
    }

    updateDropdowns();
    await syncToMongoDB();
    if (modalAccount) modalAccount.classList.add("hidden");
    resetAccountForm();
  };
}

function resetAccountForm() {
  const form = document.getElementById("formAccount");
  if (form) form.reset();
  const editId = document.getElementById("editAccountId");
  if (editId) editId.value = "";
  const title = document.getElementById("accountModalTitle");
  if (title) title.textContent = "Add Account / Wallet";
}

window.editAccount = (id) => {
  const acc = appData.accounts.find(a => a.id === id);
  if (!acc) return;
  document.getElementById("editAccountId").value = acc.id;
  document.getElementById("accName").value = acc.name;
  document.getElementById("accType").value = acc.type;
  document.getElementById("accBalance").value = acc.balance;
  document.getElementById("accountModalTitle").textContent = "Edit Account Details";
  openModal(modalAccount);
};

window.deleteAccount = async (id) => {
  if (!confirm("Delete this account?")) return;
  appData.accounts = appData.accounts.filter(a => a.id !== id);
  updateDropdowns();
  await syncToMongoDB();
  showToast("Account removed");
};

// ==========================================
// PROJECTS & LEDGER
// ==========================================
function renderProjects() {
  if (!projectsGridEl) return;
  if (appData.projects.length === 0) {
    projectsGridEl.innerHTML = `<div class="col-span-full py-6 text-center text-slate-400 bg-slate-50 dark:bg-darkbg-elevated border border-dashed border-slate-200 dark:border-darkbg-border rounded-2xl text-xs">No projects created yet.</div>`;
    return;
  }
  projectsGridEl.innerHTML = appData.projects.map(p => {
    const pTxs = appData.transactions.filter(t => t.projectId === p.id);
    const pIn = pTxs.filter(t => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
    const pOut = pTxs.filter(t => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);
    const pNet = pIn - pOut;
    const budget = Number(p.budget) || 0;
    const progressPercent = budget > 0 ? Math.min(Math.round((pOut / budget) * 100), 100) : 0;

    return `
      <div class="bg-white dark:bg-darkbg-card p-5 rounded-2xl border border-slate-200/80 dark:border-darkbg-border shadow-sm flex flex-col justify-between hover:border-brand-500/50 transition">
        <div>
          <div class="flex justify-between items-start">
            <h4 class="font-bold text-slate-900 dark:text-white text-base">${p.name}</h4>
            <div class="flex items-center gap-1">
              <button onclick="window.editProject('${p.id}')" class="p-1 text-slate-400 hover:text-brand-400 text-xs" title="Edit">
                <i class="fa-regular fa-pen-to-square"></i>
              </button>
              <button onclick="window.deleteProject('${p.id}')" class="p-1 text-slate-400 hover:text-rose-500 text-xs" title="Delete">
                <i class="fa-regular fa-trash-can"></i>
              </button>
            </div>
          </div>
          ${p.notes ? `<p class="text-xs text-slate-400 mt-1">${p.notes}</p>` : ""}

          ${budget > 0 ? `
            <div class="mt-3">
              <div class="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1">
                <span>Spent: ${progressPercent}%</span>
                <span>Budget: ${formatBDT(budget)}</span>
              </div>
              <div class="w-full bg-slate-100 dark:bg-darkbg-elevated rounded-full h-2 overflow-hidden">
                <div class="h-2 rounded-full ${progressPercent > 90 ? 'bg-rose-500' : 'bg-brand-500'}" style="width: ${progressPercent}%"></div>
              </div>
            </div>
          ` : ""}

          <div class="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-darkbg-border text-xs">
            <div>
              <span class="text-slate-400">Total Inflow:</span>
              <p class="font-bold text-emerald-500">+${formatBDT(pIn)}</p>
            </div>
            <div>
              <span class="text-slate-400">Total Spent:</span>
              <p class="font-bold text-rose-500">-${formatBDT(pOut)}</p>
            </div>
          </div>
        </div>
        
        <div class="mt-4 pt-3 border-t border-slate-100 dark:border-darkbg-border flex justify-between items-center">
          <div>
            <span class="text-[10px] text-slate-400 uppercase font-semibold">Net Balance</span>
            <p class="font-black text-sm ${pNet >= 0 ? 'text-emerald-500' : 'text-rose-500'}">
              ${pNet >= 0 ? '+' : ''}${formatBDT(pNet)}
            </p>
          </div>
          <button onclick="window.openProjectDetails('${p.id}')" class="bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-bold px-3 py-1.5 rounded-xl border border-brand-500/30 transition flex items-center gap-1.5">
            <i class="fa-solid fa-list-check"></i> View Ledger
          </button>
        </div>
      </div>
    `;
  }).join("");
}

window.openProjectDetails = (projectId) => {
  activeDetailProjectId = projectId;
  refreshProjectDetails(projectId);
  openModal(modalProjectDetails);
};

function refreshProjectDetails(projectId) {
  const p = appData.projects.find(proj => proj.id === projectId);
  if (!p) return;

  document.getElementById("pDetailName").textContent = p.name;
  document.getElementById("pDetailNotes").textContent = p.notes || "No description";
  document.getElementById("pDetailBudget").textContent = formatBDT(p.budget || 0);

  const pTxs = appData.transactions.filter(t => t.projectId === p.id);
  const pIn = pTxs.filter(t => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
  const pOut = pTxs.filter(t => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);
  const pNet = pIn - pOut;

  document.getElementById("pDetailInflow").textContent = `+${formatBDT(pIn)}`;
  document.getElementById("pDetailExpense").textContent = `-${formatBDT(pOut)}`;
  const netEl = document.getElementById("pDetailNet");
  netEl.textContent = `${pNet >= 0 ? '+' : ''}${formatBDT(pNet)}`;
  netEl.className = `text-lg font-black mt-1 ${pNet >= 0 ? 'text-emerald-500' : 'text-rose-500'}`;

  const btnAddTx = document.getElementById("pDetailBtnAddTx");
  if (btnAddTx) {
    btnAddTx.onclick = () => {
      resetTxForm();
      document.getElementById("txProject").value = p.id;
      openModal(modalTx);
    };
  }

  const tbody = document.getElementById("pDetailTxTableBody");
  if (!tbody) return;
  if (pTxs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-400">No project transactions recorded.</td></tr>`;
    return;
  }

  tbody.innerHTML = pTxs.map(t => {
    const isIncome = t.type === "INCOME";
    const acc = appData.accounts.find(a => a.id === t.accountId);
    return `
      <tr class="hover:bg-slate-50 dark:hover:bg-darkbg-elevated/50 transition border-b border-slate-100 dark:border-darkbg-border">
        <td class="p-3 pl-4">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isIncome ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}">
            ${isIncome ? 'Credit / Inflow' : 'Debit / Outflow'}
          </span>
        </td>
        <td class="p-3 font-semibold text-slate-800 dark:text-slate-200">${t.note}</td>
        <td class="p-3 text-slate-500 dark:text-slate-400">${acc ? `${acc.name} (${acc.type})` : 'N/A'}</td>
        <td class="p-3 font-bold text-right ${isIncome ? 'text-emerald-500' : 'text-rose-500'}">
          ${isIncome ? '+' : '-'}${formatBDT(t.amount)}
        </td>
        <td class="p-3 text-slate-500 dark:text-slate-400">${t.date}</td>
        <td class="p-3 pr-4 text-right space-x-1">
          <button onclick="window.editTransaction('${t.id}')" class="text-slate-400 hover:text-brand-400 p-1" title="Edit">
            <i class="fa-regular fa-pen-to-square"></i>
          </button>
          <button onclick="window.deleteTransaction('${t.id}', '${t.type}', ${t.amount}, '${t.accountId}')" class="text-slate-400 hover:text-rose-500 p-1" title="Delete">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

const formProject = document.getElementById("formProject");
if (formProject) {
  formProject.onsubmit = async (e) => {
    e.preventDefault();
    const editId = document.getElementById("editProjectId").value;
    const name = document.getElementById("projName").value.trim();
    const budget = parseFloat(document.getElementById("projBudget").value) || 0;
    const notes = document.getElementById("projNotes").value.trim();

    if (editId) {
      const proj = appData.projects.find(p => p.id === editId);
      if (proj) {
        proj.name = name;
        proj.budget = budget;
        proj.notes = notes;
      }
      showToast("Project updated!");
    } else {
      appData.projects.push({ id: "proj_" + Date.now(), name, budget, notes });
      showToast("Project created!");
    }

    updateDropdowns();
    await syncToMongoDB();
    if (modalProject) modalProject.classList.add("hidden");
    resetProjectForm();
  };
}

function resetProjectForm() {
  const form = document.getElementById("formProject");
  if (form) form.reset();
  const editId = document.getElementById("editProjectId");
  if (editId) editId.value = "";
  const title = document.getElementById("projectModalTitle");
  if (title) title.textContent = "Create Project";
}

window.editProject = (id) => {
  const proj = appData.projects.find(p => p.id === id);
  if (!proj) return;
  document.getElementById("editProjectId").value = proj.id;
  document.getElementById("projName").value = proj.name;
  document.getElementById("projBudget").value = proj.budget;
  document.getElementById("projNotes").value = proj.notes || "";
  document.getElementById("projectModalTitle").textContent = "Edit Project";
  openModal(modalProject);
};

window.deleteProject = async (id) => {
  if (!confirm("Delete this project?")) return;
  appData.projects = appData.projects.filter(p => p.id !== id);
  updateDropdowns();
  await syncToMongoDB();
  showToast("Project removed");
};

// ==========================================
// TRANSFERS
// ==========================================
const formTransfer = document.getElementById("formTransfer");
if (formTransfer) {
  formTransfer.onsubmit = async (e) => {
    e.preventDefault();
    const fromId = document.getElementById("transferFrom").value;
    const toVal = document.getElementById("transferTo").value;
    const amount = parseFloat(document.getElementById("transferAmount").value) || 0;
    const date = document.getElementById("transferDate").value;

    const fromAcc = appData.accounts.find(a => a.id === fromId);
    if (!fromAcc) return alert("Select source account");

    if (toVal === "EXTERNAL") {
      const extName = document.getElementById("transferExternalName").value.trim();
      fromAcc.balance = Number(fromAcc.balance) - amount;
      appData.transactions.unshift({
        id: "tx_" + Date.now(),
        type: "EXPENSE",
        accountId: fromId,
        projectId: "NONE",
        amount,
        note: `Transfer to: ${extName}`,
        date
      });
      showToast(`Transferred ${formatBDT(amount)} to ${extName}!`);
    } else {
      if (fromId === toVal) return alert("Source and destination accounts cannot be identical!");
      const toAcc = appData.accounts.find(a => a.id === toVal);
      if (!toAcc) return;

      fromAcc.balance = Number(fromAcc.balance) - amount;
      toAcc.balance = Number(toAcc.balance) + amount;

      appData.transactions.unshift({
        id: "tx_" + Date.now(),
        type: "EXPENSE",
        accountId: fromId,
        projectId: "NONE",
        amount,
        note: `Transfer to ${toAcc.name}`,
        date
      });
      appData.transactions.unshift({
        id: "tx_" + (Date.now() + 1),
        type: "INCOME",
        accountId: toVal,
        projectId: "NONE",
        amount,
        note: `Transfer from ${fromAcc.name}`,
        date
      });
      showToast(`Transferred ${formatBDT(amount)} from ${fromAcc.name} to ${toAcc.name}!`);
    }

    await syncToMongoDB();
    if (modalTransfer) modalTransfer.classList.add("hidden");
    formTransfer.reset();
    const extGroup = document.getElementById("externalRecipientGroup");
    if (extGroup) extGroup.classList.add("hidden");
  };
}

// ==========================================
// LENT (DEBT TRACKER & PHONE LEDGER)
// ==========================================
function renderLoans() {
  if (!loansTableBodyEl) return;
  if (appData.loans.length === 0) {
    loansTableBodyEl.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-400 text-xs">No debt records. Click "+ Lend Money".</td></tr>`;
    return;
  }
  loansTableBodyEl.innerHTML = appData.loans.map(l => {
    const acc = appData.accounts.find(a => a.id === l.accountId);
    const totalAmount = Number(l.amount) || 0;
    const remainingDue = Number(l.remainingAmount ?? l.amount) || 0;
    const isRepaid = l.status === "REPAID" || remainingDue <= 0;
    const isPartial = !isRepaid && remainingDue < totalAmount;

    let badgeClass = "bg-amber-500/10 text-amber-500 border border-amber-500/20";
    let statusText = "Pending";
    if (isRepaid) {
      badgeClass = "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
      statusText = "Fully Repaid";
    } else if (isPartial) {
      badgeClass = "bg-cyan-500/10 text-cyan-500 border border-cyan-500/20";
      statusText = "Partially Paid";
    }

    return `
      <tr class="hover:bg-slate-50 dark:hover:bg-darkbg-elevated/50 transition border-b border-slate-100 dark:border-darkbg-border">
        <td class="p-3.5 pl-4">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center font-bold text-xs">
              <i class="fa-solid fa-user"></i>
            </div>
            <div>
              <h5 class="font-extrabold text-slate-900 dark:text-white">${l.friendName}</h5>
              <p class="text-[11px] font-bold text-brand-500 flex items-center gap-1">
                <i class="fa-solid fa-phone text-[9px]"></i> ${l.phone || 'N/A'}
              </p>
            </div>
          </div>
        </td>
        <td class="p-3.5 font-black text-rose-500">${formatBDT(remainingDue)}</td>
        <td class="p-3.5 text-xs text-slate-400">${formatBDT(totalAmount)}</td>
        <td class="p-3.5 text-xs text-slate-400">${acc ? `${acc.name} [${acc.type}]` : "N/A"}</td>
        <td class="p-3.5 text-xs text-slate-400">${l.date}</td>
        <td class="p-3.5">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black ${badgeClass}">
            ${statusText}
          </span>
        </td>
        <td class="p-3.5 pr-4 text-right space-x-1.5">
          <button onclick="window.viewLentPersonHistory('${l.phone || ''}', '${l.friendName}')" class="text-xs bg-slate-100 dark:bg-darkbg-elevated hover:text-brand-500 text-slate-700 dark:text-slate-300 font-bold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-darkbg-border transition" title="View History with this person">
            <i class="fa-solid fa-clock-rotate-left"></i> History
          </button>
          ${!isRepaid ? `
            <button onclick="window.openLoanSettle('${l.id}')" class="text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black px-3 py-1.5 rounded-xl transition shadow-md shadow-emerald-500/20">
              <i class="fa-solid fa-hand-holding-dollar mr-1"></i> Receive
            </button>
          ` : ""}
          <button onclick="window.deleteLoan('${l.id}')" class="text-slate-400 hover:text-rose-500 text-xs p-1" title="Delete">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

window.viewLentPersonHistory = (phone, name) => {
  const matchingLoans = appData.loans.filter(l => (phone && l.phone === phone) || l.friendName.toLowerCase() === name.toLowerCase());
  
  const totalLent = matchingLoans.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  const totalDue = matchingLoans.reduce((sum, l) => sum + (Number(l.remainingAmount ?? l.amount) || 0), 0);
  const totalReturned = totalLent - totalDue;

  document.getElementById("lentHistFriendName").textContent = name;
  document.getElementById("lentHistPhone").textContent = phone || "Not Provided";
  document.getElementById("lentHistTotal").textContent = formatBDT(totalLent);
  document.getElementById("lentHistReturned").textContent = formatBDT(totalReturned);
  document.getElementById("lentHistDue").textContent = formatBDT(totalDue);

  const tbody = document.getElementById("lentHistTableBody");
  if (!tbody) return;
  if (matchingLoans.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400">No records found.</td></tr>`;
  } else {
    tbody.innerHTML = matchingLoans.map(l => {
      const acc = appData.accounts.find(a => a.id === l.accountId);
      const isRepaid = l.status === "REPAID" || (Number(l.remainingAmount ?? l.amount) <= 0);
      return `
        <tr class="hover:bg-slate-50 dark:hover:bg-darkbg-elevated/50 transition border-b border-slate-100 dark:border-darkbg-border">
          <td class="p-3 pl-4 font-semibold text-slate-800 dark:text-slate-200">${acc ? `${acc.name} [${acc.type}]` : 'N/A'}</td>
          <td class="p-3 font-bold text-slate-700 dark:text-slate-300">${formatBDT(l.amount)}</td>
          <td class="p-3 font-black text-rose-500">${formatBDT(l.remainingAmount ?? l.amount)}</td>
          <td class="p-3 text-slate-400">${l.date}</td>
          <td class="p-3 pr-4 text-right">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isRepaid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}">
              ${isRepaid ? 'Fully Repaid' : 'Pending'}
            </span>
          </td>
        </tr>
      `;
    }).join("");
  }

  openModal(modalLentHistory);
};

window.openLoanSettle = (loanId) => {
  const loan = appData.loans.find(l => l.id === loanId);
  if (!loan) return;

  const remainingDue = Number(loan.remainingAmount ?? loan.amount) || 0;
  document.getElementById("settleLoanId").value = loan.id;
  document.getElementById("settleFriendName").textContent = `${loan.friendName} (${loan.phone || 'No phone'})`;
  document.getElementById("settleRemainingDue").textContent = formatBDT(remainingDue);

  document.getElementById("radioFullSettle").checked = true;
  document.getElementById("partialAmountGroup").classList.add("hidden");
  document.getElementById("settleReceivedAmount").value = remainingDue;
  document.getElementById("settleReceivedAmount").max = remainingDue;

  openModal(modalLoanSettle);
};

const radioFullSettle = document.getElementById("radioFullSettle");
if (radioFullSettle) {
  radioFullSettle.onchange = () => {
    const group = document.getElementById("partialAmountGroup");
    if (group) group.classList.add("hidden");
  };
}

const radioPartialSettle = document.getElementById("radioPartialSettle");
if (radioPartialSettle) {
  radioPartialSettle.onchange = () => {
    const group = document.getElementById("partialAmountGroup");
    if (group) group.classList.remove("hidden");
    const loanId = document.getElementById("settleLoanId").value;
    const loan = appData.loans.find(l => l.id === loanId);
    const remainingDue = Number(loan?.remainingAmount ?? loan?.amount) || 0;
    const receivedInput = document.getElementById("settleReceivedAmount");
    if (receivedInput) receivedInput.value = Math.floor(remainingDue / 2) || 1;
  };
}

const formLoanSettle = document.getElementById("formLoanSettle");
if (formLoanSettle) {
  formLoanSettle.onsubmit = async (e) => {
    e.preventDefault();
    const loanId = document.getElementById("settleLoanId").value;
    const settleType = document.querySelector('input[name="settleType"]:checked').value;
    const depositAccId = document.getElementById("settleDepositAccount").value;
    const date = document.getElementById("settleDate").value;

    const loan = appData.loans.find(l => l.id === loanId);
    const targetAcc = appData.accounts.find(a => a.id === depositAccId);
    if (!loan || !targetAcc) return alert("Invalid account or loan selection");

    const remainingDue = Number(loan.remainingAmount ?? loan.amount) || 0;
    let receivedAmount = remainingDue;

    if (settleType === "PARTIAL") {
      receivedAmount = parseFloat(document.getElementById("settleReceivedAmount").value) || 0;
      if (receivedAmount <= 0 || receivedAmount > remainingDue) {
        return alert(`Enter valid amount between ৳1 and ${formatBDT(remainingDue)}`);
      }
    }

    targetAcc.balance = Number(targetAcc.balance) + receivedAmount;

    const newDue = remainingDue - receivedAmount;
    loan.remainingAmount = newDue;
    if (newDue <= 0) {
      loan.status = "REPAID";
      loan.remainingAmount = 0;
    } else {
      loan.status = "PARTIALLY_PAID";
    }

    appData.transactions.unshift({
      id: "tx_" + Date.now(),
      type: "INCOME",
      accountId: depositAccId,
      projectId: "NONE",
      amount: receivedAmount,
      note: `Debt received from ${loan.friendName} (${settleType === 'PARTIAL' ? 'Partial' : 'Full'})`,
      date
    });

    await syncToMongoDB();
    showToast(`Received ${formatBDT(receivedAmount)} from ${loan.friendName}!`);
    if (modalLoanSettle) modalLoanSettle.classList.add("hidden");
  };
}

const formLoan = document.getElementById("formLoan");
if (formLoan) {
  formLoan.onsubmit = async (e) => {
    e.preventDefault();
    const friendName = document.getElementById("loanFriendName").value.trim();
    const phone = document.getElementById("loanFriendPhone") ? document.getElementById("loanFriendPhone").value.trim() : "";
    const amount = parseFloat(document.getElementById("loanAmount").value) || 0;
    const accountId = document.getElementById("loanAccount").value;
    const date = document.getElementById("loanDate").value;

    const targetAccount = appData.accounts.find(a => a.id === accountId);
    if (!targetAccount) return alert("Select source account");

    targetAccount.balance = Number(targetAccount.balance) - amount;
    appData.loans.unshift({ 
      id: "loan_" + Date.now(), 
      friendName, 
      phone,
      amount, 
      remainingAmount: amount, 
      accountId, 
      date, 
      status: "PENDING" 
    });

    await syncToMongoDB();
    showToast("Lent transaction recorded successfully!");
    if (modalLoan) modalLoan.classList.add("hidden");
    formLoan.reset();
  };
}

window.deleteLoan = async (id) => {
  if (!confirm("Delete debt record?")) return;
  appData.loans = appData.loans.filter(l => l.id !== id);
  await syncToMongoDB();
  showToast("Debt deleted");
};

// ==========================================
// TRANSACTIONS
// ==========================================
function renderTransactions() {
  if (!txTableBodyEl) return;
  const pFilter = filterProjectEl ? filterProjectEl.value : "ALL";
  const aFilter = filterAccountEl ? filterAccountEl.value : "ALL";
  const search = (txSearchEl ? txSearchEl.value.trim().toLowerCase() : "");

  const filtered = appData.transactions.filter(t => {
    if (pFilter !== "ALL" && t.projectId !== pFilter) return false;
    if (aFilter !== "ALL" && t.accountId !== aFilter) return false;
    if (search && !t.note.toLowerCase().includes(search)) return false;
    return true;
  });

  if (filtered.length === 0) {
    txTableBodyEl.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-400 text-xs">No transactions found.</td></tr>`;
    return;
  }

  txTableBodyEl.innerHTML = filtered.map(t => {
    const isIncome = t.type === "INCOME";
    const acc = appData.accounts.find(a => a.id === t.accountId);
    const proj = appData.projects.find(p => p.id === t.projectId);

    return `
      <tr class="hover:bg-slate-50 dark:hover:bg-darkbg-elevated/50 transition border-b border-slate-100 dark:border-darkbg-border">
        <td class="p-3.5 pl-4">
          <span class="px-2 py-0.5 rounded text-[10px] font-black ${isIncome ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}">
            ${isIncome ? 'Income' : 'Expense'}
          </span>
        </td>
        <td class="p-3.5 font-semibold text-slate-800 dark:text-slate-200">${t.note}</td>
        <td class="p-3.5 text-xs text-slate-400">${acc ? `${acc.name} [${acc.type}]` : "N/A"}</td>
        <td class="p-3.5 text-xs text-slate-400">${proj ? proj.name : '<span class="text-slate-600">-</span>'}</td>
        <td class="p-3.5 font-black text-right ${isIncome ? 'text-emerald-500' : 'text-rose-500'}">
          ${isIncome ? '+' : '-'}${formatBDT(t.amount)}
        </td>
        <td class="p-3.5 text-xs text-slate-400">${t.date}</td>
        <td class="p-3.5 pr-4 text-right space-x-1 no-print">
          <button onclick="window.editTransaction('${t.id}')" class="text-slate-400 hover:text-brand-400 text-xs p-1" title="Edit">
            <i class="fa-regular fa-pen-to-square"></i>
          </button>
          <button onclick="window.deleteTransaction('${t.id}', '${t.type}', ${t.amount}, '${t.accountId}')" class="text-slate-400 hover:text-rose-500 text-xs p-1" title="Delete">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

if (filterProjectEl) filterProjectEl.onchange = renderTransactions;
if (filterAccountEl) filterAccountEl.onchange = renderTransactions;
if (txSearchEl) txSearchEl.oninput = renderTransactions;

const formTx = document.getElementById("formTx");
if (formTx) {
  formTx.onsubmit = async (e) => {
    e.preventDefault();
    const editId = document.getElementById("editTxId").value;
    const type = document.getElementById("txType").value;
    const accountId = document.getElementById("txAccount").value;
    const projectId = document.getElementById("txProject").value;
    const amount = parseFloat(document.getElementById("txAmount").value) || 0;
    const note = document.getElementById("txNote").value.trim();
    const date = document.getElementById("txDate").value;

    const targetAccount = appData.accounts.find(a => a.id === accountId);
    if (!targetAccount) return alert("Select an account");

    if (editId) {
      const oldTx = appData.transactions.find(t => t.id === editId);
      if (oldTx) {
        const oldAcc = appData.accounts.find(a => a.id === oldTx.accountId);
        if (oldAcc) {
          oldAcc.balance = oldTx.type === "INCOME" ? Number(oldAcc.balance) - Number(oldTx.amount) : Number(oldAcc.balance) + Number(oldTx.amount);
        }
        oldTx.type = type;
        oldTx.accountId = accountId;
        oldTx.projectId = projectId;
        oldTx.amount = amount;
        oldTx.note = note;
        oldTx.date = date;
      }
    } else {
      appData.transactions.unshift({ id: "tx_" + Date.now(), type, accountId, projectId, amount, note, date });
    }

    targetAccount.balance = type === "INCOME" ? Number(targetAccount.balance) + amount : Number(targetAccount.balance) - amount;

    await syncToMongoDB();
    showToast(editId ? "Transaction updated!" : "Transaction saved!");
    if (modalTx) modalTx.classList.add("hidden");
    resetTxForm();
  };
}

function resetTxForm() {
  const form = document.getElementById("formTx");
  if (form) form.reset();
  const editId = document.getElementById("editTxId");
  if (editId) editId.value = "";
  const title = document.getElementById("txModalTitle");
  if (title) title.textContent = "Add Transaction";
}

window.editTransaction = (id) => {
  const tx = appData.transactions.find(t => t.id === id);
  if (!tx) return;
  document.getElementById("editTxId").value = tx.id;
  document.getElementById("txType").value = tx.type;
  document.getElementById("txAccount").value = tx.accountId;
  document.getElementById("txProject").value = tx.projectId || "NONE";
  document.getElementById("txAmount").value = tx.amount;
  document.getElementById("txNote").value = tx.note;
  document.getElementById("txDate").value = tx.date;
  document.getElementById("txModalTitle").textContent = "Edit Transaction";
  openModal(modalTx);
};

window.deleteTransaction = async (txId, type, amount, accountId) => {
  if (!confirm("Delete transaction? Account balance will revert.")) return;
  const target = appData.accounts.find(a => a.id === accountId);
  if (target) {
    target.balance = type === "INCOME" ? Number(target.balance) - Number(amount) : Number(target.balance) + Number(amount);
  }
  appData.transactions = appData.transactions.filter(t => t.id !== txId);
  await syncToMongoDB();
  showToast("Transaction deleted");
};

// ==========================================
// SPA VIEW SWITCHER SYSTEM
// ==========================================
window.switchView = (viewName) => {
  window.currentActiveView = viewName;
  
  document.querySelectorAll(".app-view").forEach(el => el.classList.add("hidden"));
  
  document.querySelectorAll("#appSidebar nav button").forEach(btn => {
    btn.classList.remove("bg-brand-500/10", "text-brand-500");
  });

  const targetMap = {
    overview: "viewOverview",
    accounts: "viewAccounts",
    projects: "viewProjects",
    loans: "viewLoans",
    transactions: "viewTransactions"
  };

  const targetId = targetMap[viewName] || "viewOverview";
  const targetEl = document.getElementById(targetId);
  if (targetEl) targetEl.classList.remove("hidden");

  const activeBtn = document.getElementById(`nav-${viewName}`);
  if (activeBtn) activeBtn.classList.add("bg-brand-500/10", "text-brand-500");

  if (viewName === "overview") {
    setTimeout(renderCharts, 50);
  }

  window.closeSidebar();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// Sidebar Handlers
const appSidebar = document.getElementById("appSidebar");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
const btnOpenSidebar = document.getElementById("btnOpenSidebar");
const btnCloseSidebar = document.getElementById("btnCloseSidebar");

window.openSidebar = () => {
  if (!appSidebar || !sidebarBackdrop) return;
  sidebarBackdrop.classList.remove("hidden");
  setTimeout(() => appSidebar.classList.remove("-translate-x-full"), 10);
};

window.closeSidebar = () => {
  if (!appSidebar || !sidebarBackdrop) return;
  appSidebar.classList.add("-translate-x-full");
  setTimeout(() => sidebarBackdrop.classList.add("hidden"), 300);
};

if (btnOpenSidebar) btnOpenSidebar.onclick = window.openSidebar;
if (btnCloseSidebar) btnCloseSidebar.onclick = window.closeSidebar;
if (sidebarBackdrop) sidebarBackdrop.onclick = window.closeSidebar;

// ==========================================
// INITIAL BOOTSTRAP
// ==========================================
applyTheme(currentTheme);

if (token) {
  unlockApplication();
  loadUserData();
} else {
  lockApplication();
}