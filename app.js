const API_URL = "/api";

// App State
let currentUser = null;
let token = localStorage.getItem("KOFS_AUTH_TOKEN") || null;

let appData = {
  accounts: [],
  projects: [],
  transactions: [],
  loans: []
};

let activeDetailProjectId = null;

// Safe API Client
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
    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    throw err;
  }
}

// Eye Toggle Helper for Passwords
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

// DOM Elements
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
const modalAuth = document.getElementById("modalAuth");
const modalProfile = document.getElementById("modalProfile");
const modalForgotPass = document.getElementById("modalForgotPass");
const modalTx = document.getElementById("modalTx");
const modalAccount = document.getElementById("modalAccount");
const modalProject = document.getElementById("modalProject");
const modalLoan = document.getElementById("modalLoan");
const modalTransfer = document.getElementById("modalTransfer");
const modalProjectDetails = document.getElementById("modalProjectDetails");
const modalLoanSettle = document.getElementById("modalLoanSettle");

// Open Modals
document.getElementById("btnOpenTxModal").onclick = () => { resetTxForm(); openModal(modalTx); };
document.getElementById("btnOpenAccountModal").onclick = () => { resetAccountForm(); openModal(modalAccount); };
document.getElementById("btnOpenProjectModal").onclick = () => { resetProjectForm(); openModal(modalProject); };
document.getElementById("btnOpenLoanModal").onclick = () => openModal(modalLoan);
document.getElementById("btnOpenTransferModal").onclick = () => openModal(modalTransfer);

// Profile & Forgot Password Open
document.getElementById("btnOpenProfileModal").onclick = () => openProfileModal();
document.getElementById("btnForgotPassTrigger").onclick = () => {
  modalAuth.classList.add("hidden");
  openModal(modalForgotPass);
};

document.querySelectorAll(".modal-close").forEach(btn => {
  btn.onclick = (e) => e.target.closest(".modal-backdrop").classList.add("hidden");
});

function openModal(modal) {
  modal.classList.remove("hidden");
  const today = new Date().toISOString().split("T")[0];
  const txDate = document.getElementById("txDate");
  const loanDate = document.getElementById("loanDate");
  const transferDate = document.getElementById("transferDate");
  const settleDate = document.getElementById("settleDate");
  if (txDate && !txDate.value) txDate.value = today;
  if (loanDate && !loanDate.value) loanDate.value = today;
  if (transferDate && !transferDate.value) transferDate.value = today;
  if (settleDate && !settleDate.value) settleDate.value = today;
}

function showToast(msg, type = "success") {
  const container = document.getElementById("toastContainer");
  const t = document.createElement("div");
  const bg = type === "success" ? "bg-emerald-600" : type === "error" ? "bg-rose-600" : "bg-indigo-600";
  t.className = `${bg} text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0 pointer-events-auto`;
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

// ==========================================
// USER AUTHENTICATION & LOGIN/REGISTER
// ==========================================
let isRegisterMode = false;
const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const authNameGroup = document.getElementById("authNameGroup");
const btnAuthSubmit = document.getElementById("btnAuthSubmit");
const authModalTitle = document.getElementById("authModalTitle");

tabLogin.onclick = () => setAuthMode(false);
tabRegister.onclick = () => setAuthMode(true);

function setAuthMode(register) {
  isRegisterMode = register;
  if (register) {
    tabRegister.className = "flex-1 py-1.5 text-xs font-bold rounded-lg transition bg-white text-indigo-600 shadow-sm";
    tabLogin.className = "flex-1 py-1.5 text-xs font-bold rounded-lg transition text-slate-500";
    authNameGroup.classList.remove("hidden");
    btnAuthSubmit.textContent = "Register";
    authModalTitle.textContent = "Create an Account";
  } else {
    tabLogin.className = "flex-1 py-1.5 text-xs font-bold rounded-lg transition bg-white text-indigo-600 shadow-sm";
    tabRegister.className = "flex-1 py-1.5 text-xs font-bold rounded-lg transition text-slate-500";
    authNameGroup.classList.add("hidden");
    btnAuthSubmit.textContent = "Login";
    authModalTitle.textContent = "Welcome Back";
  }
}

document.getElementById("formAuth").onsubmit = async (e) => {
  e.preventDefault();
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value.trim();
  const name = document.getElementById("authName").value.trim();

  const endpoint = isRegisterMode ? `${API_URL}/register?action=register` : `${API_URL}/login?action=login`;
  const body = isRegisterMode ? { name, email, password } : { email, password };

  btnAuthSubmit.disabled = true;
  btnAuthSubmit.textContent = "Processing...";

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

    modalAuth.classList.add("hidden");
    showToast(`Welcome back, ${currentUser.name}!`);
    updateUserDisplay();
    loadUserData();
  } catch (err) {
    alert(err.message);
  } finally {
    btnAuthSubmit.disabled = false;
    btnAuthSubmit.textContent = isRegisterMode ? "Register" : "Login";
  }
};

document.getElementById("btnLogout").onclick = () => {
  if (confirm("Logout from tracker by kofs?")) {
    localStorage.removeItem("KOFS_AUTH_TOKEN");
    localStorage.removeItem("KOFS_AUTH_USER");
    token = null;
    currentUser = null;
    location.reload();
  }
};

function updateUserDisplay() {
  const storedUser = localStorage.getItem("KOFS_AUTH_USER");
  if (storedUser) currentUser = JSON.parse(storedUser);
  if (currentUser) {
    displayUserNameEl.textContent = currentUser.name;
    document.getElementById("printUserName").textContent = currentUser.name;
  }
  document.getElementById("printDate").textContent = new Date().toLocaleDateString("en-BD");
}

// ==========================================
// PROFILE UPDATE & PASSWORD RECOVERY
// ==========================================
function openProfileModal() {
  if (!currentUser) return;
  document.getElementById("profName").value = currentUser.name || "";
  document.getElementById("profEmail").value = currentUser.email || "";
  document.getElementById("profPhone").value = currentUser.phone || "";
  document.getElementById("profAddress").value = currentUser.address || "";
  document.getElementById("profRecoveryPin").value = currentUser.recoveryPin || "123456";
  openModal(modalProfile);
}

document.getElementById("formProfile").onsubmit = async (e) => {
  e.preventDefault();
  const name = document.getElementById("profName").value.trim();
  const phone = document.getElementById("profPhone").value.trim();
  const address = document.getElementById("profAddress").value.trim();
  const recoveryPin = document.getElementById("profRecoveryPin").value.trim();

  const btnSave = document.getElementById("btnSaveProfile");
  btnSave.disabled = true;
  btnSave.textContent = "Saving...";

  try {
    const data = await apiFetch(`${API_URL}/profile?action=profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name, phone, address, recoveryPin })
    });

    currentUser = data.user;
    localStorage.setItem("KOFS_AUTH_USER", JSON.stringify(currentUser));
    updateUserDisplay();
    showToast("Profile updated successfully!");
    modalProfile.classList.add("hidden");
  } catch (err) {
    alert(err.message);
  } finally {
    btnSave.disabled = false;
    btnSave.textContent = "Save Profile Changes";
  }
};

document.getElementById("formForgotPass").onsubmit = async (e) => {
  e.preventDefault();
  const email = document.getElementById("resetEmail").value.trim();
  const recoveryPin = document.getElementById("resetPin").value.trim();
  const newPassword = document.getElementById("resetNewPass").value.trim();

  const btnReset = document.getElementById("btnSubmitReset");
  btnReset.disabled = true;
  btnReset.textContent = "Resetting...";

  try {
    const res = await apiFetch(`${API_URL}/reset-password?action=reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, recoveryPin, newPassword })
    });

    showToast(res.message);
    modalForgotPass.classList.add("hidden");
    setAuthMode(false);
    document.getElementById("authEmail").value = email;
    openModal(modalAuth);
  } catch (err) {
    alert(err.message);
  } finally {
    btnReset.disabled = false;
    btnReset.textContent = "Reset Password";
  }
};

// ==========================================
// MONGODB DATA SYNC
// ==========================================
async function loadUserData() {
  if (!token) {
    openModal(modalAuth);
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
    if (err.message.includes("401") || err.message.includes("Unauthorized")) {
      localStorage.removeItem("KOFS_AUTH_TOKEN");
      openModal(modalAuth);
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
// CHARTS & CALCULATIONS
// ==========================================
let projectChartInstance = null;
let trendChartInstance = null;

function renderCharts() {
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

  if (labels.length === 0) {
    noChartMsg.classList.remove("hidden");
  } else {
    noChartMsg.classList.add("hidden");
    const ctx = document.getElementById("projectChart").getContext("2d");
    projectChartInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#06b6d4", "#8b5cf6"],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 10 } } } }
      }
    });
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
  const trendCtx = document.getElementById("trendChart").getContext("2d");
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
      plugins: { legend: { labels: { font: { size: 11 } } } },
      scales: {
        y: { ticks: { callback: v => "৳" + v } },
        x: { grid: { display: false } }
      }
    }
  });
}

function render() {
  const netWorth = appData.accounts.reduce((acc, a) => acc + (Number(a.balance) || 0), 0);
  totalNetWorthEl.textContent = formatBDT(netWorth);
  document.getElementById("accountCountLabel").textContent = `Across ${appData.accounts.length} accounts`;

  let projIn = 0, projOut = 0;
  appData.transactions.forEach(t => {
    if (t.projectId && t.projectId !== "NONE") {
      if (t.type === "INCOME") projIn += Number(t.amount);
      if (t.type === "EXPENSE") projOut += Number(t.amount);
    }
  });
  totalProjectInflowEl.textContent = formatBDT(projIn);
  totalProjectExpenseEl.textContent = formatBDT(projOut);

  const pendingLent = appData.loans
    .filter(l => l.status !== "REPAID")
    .reduce((acc, l) => acc + (Number(l.remainingAmount ?? l.amount) || 0), 0);
  totalLentPendingEl.textContent = formatBDT(pendingLent);

  renderAccounts();
  renderProjects();
  renderLoans();
  renderTransactions();
  renderCharts();

  if (activeDetailProjectId) {
    refreshProjectDetails(activeDetailProjectId);
  }
}

function updateDropdowns() {
  const accOpts = appData.accounts.map(a => `<option value="${a.id}">${a.name} [${a.type}] (${formatBDT(a.balance)})</option>`).join("");
  document.getElementById("txAccount").innerHTML = accOpts;
  document.getElementById("loanAccount").innerHTML = accOpts;
  document.getElementById("transferFrom").innerHTML = accOpts;
  document.getElementById("settleDepositAccount").innerHTML = accOpts;

  document.getElementById("transferTo").innerHTML = accOpts + `<option value="EXTERNAL">+ Send to Other / External Recipient</option>`;
  filterAccountEl.innerHTML = `<option value="ALL">All Accounts</option>` + appData.accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join("");

  const projOpts = `<option value="NONE">General / Personal (প্রজেক্ট ছাড়া)</option>` + 
    appData.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join("");
  document.getElementById("txProject").innerHTML = projOpts;
  filterProjectEl.innerHTML = `<option value="ALL">All Projects</option>` + appData.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join("");
}

document.getElementById("transferTo").onchange = (e) => {
  const extGroup = document.getElementById("externalRecipientGroup");
  if (e.target.value === "EXTERNAL") {
    extGroup.classList.remove("hidden");
    document.getElementById("transferExternalName").required = true;
  } else {
    extGroup.classList.add("hidden");
    document.getElementById("transferExternalName").required = false;
  }
};

function renderAccounts() {
  if (appData.accounts.length === 0) {
    accountsGridEl.innerHTML = `<div class="col-span-full py-6 text-center text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs">No accounts added yet. Click "+ Add Account".</div>`;
    return;
  }
  accountsGridEl.innerHTML = appData.accounts.map(a => `
    <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex justify-between items-center hover:border-indigo-300 transition">
      <div>
        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">${a.type}</span>
        <h4 class="font-bold text-slate-800 text-sm mt-1">${a.name}</h4>
        <p class="text-xl font-extrabold text-indigo-600 mt-1">${formatBDT(a.balance)}</p>
      </div>
      <div class="flex items-center gap-1">
        <button onclick="window.editAccount('${a.id}')" class="p-2 text-slate-400 hover:text-indigo-600 transition text-xs" title="Edit">
          <i class="fa-regular fa-pen-to-square"></i>
        </button>
        <button onclick="window.deleteAccount('${a.id}')" class="p-2 text-slate-400 hover:text-rose-600 transition text-xs" title="Delete">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </div>
    </div>
  `).join("");
}

function renderProjects() {
  if (appData.projects.length === 0) {
    projectsGridEl.innerHTML = `<div class="col-span-full py-6 text-center text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs">No projects created yet.</div>`;
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
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition">
        <div>
          <div class="flex justify-between items-start">
            <h4 class="font-bold text-slate-900 text-base">${p.name}</h4>
            <div class="flex items-center gap-1">
              <button onclick="window.editProject('${p.id}')" class="p-1 text-slate-400 hover:text-indigo-600 text-xs" title="Edit">
                <i class="fa-regular fa-pen-to-square"></i>
              </button>
              <button onclick="window.deleteProject('${p.id}')" class="p-1 text-slate-400 hover:text-rose-600 text-xs" title="Delete">
                <i class="fa-regular fa-trash-can"></i>
              </button>
            </div>
          </div>
          ${p.notes ? `<p class="text-xs text-slate-400 mt-1">${p.notes}</p>` : ""}

          ${budget > 0 ? `
            <div class="mt-3">
              <div class="flex justify-between text-[11px] text-slate-500 font-semibold mb-1">
                <span>Spent: ${progressPercent}%</span>
                <span>Budget: ${formatBDT(budget)}</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div class="h-2 rounded-full ${progressPercent > 90 ? 'bg-rose-500' : 'bg-indigo-600'}" style="width: ${progressPercent}%"></div>
              </div>
            </div>
          ` : ""}

          <div class="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
            <div>
              <span class="text-slate-400">Total Inflow:</span>
              <p class="font-bold text-emerald-600">+${formatBDT(pIn)}</p>
            </div>
            <div>
              <span class="text-slate-400">Total Outflow:</span>
              <p class="font-bold text-rose-600">-${formatBDT(pOut)}</p>
            </div>
          </div>
        </div>
        
        <div class="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
          <div>
            <span class="text-[10px] text-slate-400 uppercase font-semibold">Net Balance</span>
            <p class="font-black text-sm ${pNet >= 0 ? 'text-emerald-600' : 'text-rose-600'}">
              ${pNet >= 0 ? '+' : ''}${formatBDT(pNet)}
            </p>
          </div>
          <button onclick="window.openProjectDetails('${p.id}')" class="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-200/60 transition flex items-center gap-1.5">
            <i class="fa-solid fa-list-check"></i> View Ledger
          </button>
        </div>
      </div>
    `;
  }).join("");
}

// Project Details & Purpose Ledger Modal
window.openProjectDetails = (projectId) => {
  activeDetailProjectId = projectId;
  refreshProjectDetails(projectId);
  openModal(modalProjectDetails);
};

function refreshProjectDetails(projectId) {
  const p = appData.projects.find(proj => proj.id === projectId);
  if (!p) return;

  document.getElementById("pDetailName").textContent = p.name;
  document.getElementById("pDetailNotes").textContent = p.notes || "No additional description";
  document.getElementById("pDetailBudget").textContent = formatBDT(p.budget || 0);

  const pTxs = appData.transactions.filter(t => t.projectId === p.id);
  const pIn = pTxs.filter(t => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
  const pOut = pTxs.filter(t => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);
  const pNet = pIn - pOut;

  document.getElementById("pDetailInflow").textContent = `+${formatBDT(pIn)}`;
  document.getElementById("pDetailExpense").textContent = `-${formatBDT(pOut)}`;
  const netEl = document.getElementById("pDetailNet");
  netEl.textContent = `${pNet >= 0 ? '+' : ''}${formatBDT(pNet)}`;
  netEl.className = `text-lg font-black mt-0.5 ${pNet >= 0 ? 'text-emerald-600' : 'text-rose-600'}`;

  document.getElementById("pDetailBtnAddTx").onclick = () => {
    resetTxForm();
    document.getElementById("txProject").value = p.id;
    openModal(modalTx);
  };

  const tbody = document.getElementById("pDetailTxTableBody");
  if (pTxs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-400">No transactions recorded for this project yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = pTxs.map(t => {
    const isIncome = t.type === "INCOME";
    const acc = appData.accounts.find(a => a.id === t.accountId);
    return `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100">
        <td class="p-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">
            ${isIncome ? 'Credit / Inflow' : 'Debit / Outflow'}
          </span>
        </td>
        <td class="p-3 font-semibold text-slate-800">${t.note}</td>
        <td class="p-3 text-slate-500">${acc ? `${acc.name} (${acc.type})` : 'N/A'}</td>
        <td class="p-3 font-bold text-right ${isIncome ? 'text-emerald-600' : 'text-rose-600'}">
          ${isIncome ? '+' : '-'}${formatBDT(t.amount)}
        </td>
        <td class="p-3 text-slate-500">${t.date}</td>
        <td class="p-3 text-right space-x-1">
          <button onclick="window.editTransaction('${t.id}')" class="text-slate-400 hover:text-indigo-600 p-1" title="Edit">
            <i class="fa-regular fa-pen-to-square"></i>
          </button>
          <button onclick="window.deleteTransaction('${t.id}', '${t.type}', ${t.amount}, '${t.accountId}')" class="text-slate-400 hover:text-rose-600 p-1" title="Delete">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

// Loans
function renderLoans() {
  if (appData.loans.length === 0) {
    loansTableBodyEl.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-400 text-xs">কোনো ধারের রেকর্ড নেই (No debts recorded).</td></tr>`;
    return;
  }
  loansTableBodyEl.innerHTML = appData.loans.map(l => {
    const acc = appData.accounts.find(a => a.id === l.accountId);
    const totalAmount = Number(l.amount) || 0;
    const remainingDue = Number(l.remainingAmount ?? l.amount) || 0;
    const isRepaid = l.status === "REPAID" || remainingDue <= 0;
    const isPartial = !isRepaid && remainingDue < totalAmount;

    let badgeClass = "bg-amber-100 text-amber-800";
    let statusText = "Pending (বাকি)";
    if (isRepaid) {
      badgeClass = "bg-emerald-100 text-emerald-800";
      statusText = "Fully Repaid";
    } else if (isPartial) {
      badgeClass = "bg-blue-100 text-blue-800";
      statusText = "Partially Paid";
    }

    return `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100">
        <td class="p-3 font-semibold text-slate-900">${l.friendName}</td>
        <td class="p-3 font-black text-rose-600">${formatBDT(remainingDue)}</td>
        <td class="p-3 text-xs text-slate-500 font-medium">${formatBDT(totalAmount)}</td>
        <td class="p-3 text-xs text-slate-500">${acc ? acc.name : "N/A"}</td>
        <td class="p-3 text-xs text-slate-500">${l.date}</td>
        <td class="p-3">
          <span class="px-2 py-0.5 rounded text-[11px] font-bold ${badgeClass}">
            ${statusText}
          </span>
        </td>
        <td class="p-3 text-right space-x-1.5">
          ${!isRepaid ? `
            <button onclick="window.openLoanSettle('${l.id}')" class="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl transition shadow-md shadow-emerald-600/20">
              <i class="fa-solid fa-hand-holding-dollar mr-1"></i> Receive Money
            </button>
          ` : ""}
          <button onclick="window.deleteLoan('${l.id}')" class="text-slate-400 hover:text-rose-600 text-xs p-1" title="Delete">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

window.openLoanSettle = (loanId) => {
  const loan = appData.loans.find(l => l.id === loanId);
  if (!loan) return;

  const remainingDue = Number(loan.remainingAmount ?? loan.amount) || 0;
  document.getElementById("settleLoanId").value = loan.id;
  document.getElementById("settleFriendName").textContent = loan.friendName;
  document.getElementById("settleRemainingDue").textContent = formatBDT(remainingDue);

  document.getElementById("radioFullSettle").checked = true;
  document.getElementById("partialAmountGroup").classList.add("hidden");
  document.getElementById("settleReceivedAmount").value = remainingDue;
  document.getElementById("settleReceivedAmount").max = remainingDue;

  openModal(modalLoanSettle);
};

document.getElementById("radioFullSettle").onchange = () => {
  document.getElementById("partialAmountGroup").classList.add("hidden");
};
document.getElementById("radioPartialSettle").onchange = () => {
  const group = document.getElementById("partialAmountGroup");
  group.classList.remove("hidden");
  const loanId = document.getElementById("settleLoanId").value;
  const loan = appData.loans.find(l => l.id === loanId);
  const remainingDue = Number(loan?.remainingAmount ?? loan?.amount) || 0;
  document.getElementById("settleReceivedAmount").value = Math.floor(remainingDue / 2) || 1;
};

document.getElementById("formLoanSettle").onsubmit = async (e) => {
  e.preventDefault();
  const loanId = document.getElementById("settleLoanId").value;
  const settleType = document.querySelector('input[name="settleType"]:checked').value;
  const depositAccId = document.getElementById("settleDepositAccount").value;
  const date = document.getElementById("settleDate").value;

  const loan = appData.loans.find(l => l.id === loanId);
  const targetAcc = appData.accounts.find(a => a.id === depositAccId);
  if (!loan || !targetAcc) return alert("Invalid loan or target account");

  const remainingDue = Number(loan.remainingAmount ?? loan.amount) || 0;
  let receivedAmount = remainingDue;

  if (settleType === "PARTIAL") {
    receivedAmount = parseFloat(document.getElementById("settleReceivedAmount").value) || 0;
    if (receivedAmount <= 0 || receivedAmount > remainingDue) {
      return alert(`Please enter a valid partial amount between ৳1 and ${formatBDT(remainingDue)}`);
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
    note: `Loan repayment from ${loan.friendName} (${settleType === 'PARTIAL' ? 'Partial' : 'Full'})`,
    date
  });

  await syncToMongoDB();
  showToast(`Received ${formatBDT(receivedAmount)} from ${loan.friendName}!`);
  modalLoanSettle.classList.add("hidden");
};

function renderTransactions() {
  const pFilter = filterProjectEl.value;
  const aFilter = filterAccountEl.value;
  const search = (txSearchEl ? txSearchEl.value.trim().toLowerCase() : "");

  const filtered = appData.transactions.filter(t => {
    if (pFilter !== "ALL" && t.projectId !== pFilter) return false;
    if (aFilter !== "ALL" && t.accountId !== aFilter) return false;
    if (search && !t.note.toLowerCase().includes(search)) return false;
    return true;
  });

  if (filtered.length === 0) {
    txTableBodyEl.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-400 text-xs">No transactions recorded.</td></tr>`;
    return;
  }

  txTableBodyEl.innerHTML = filtered.map(t => {
    const isIncome = t.type === "INCOME";
    const acc = appData.accounts.find(a => a.id === t.accountId);
    const proj = appData.projects.find(p => p.id === t.projectId);

    return `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100">
        <td class="p-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">
            ${isIncome ? 'Income / Credit' : 'Expense / Debit'}
          </span>
        </td>
        <td class="p-3 font-medium text-slate-800">${t.note}</td>
        <td class="p-3 text-xs text-slate-500">${acc ? `${acc.name} (${acc.type})` : "N/A"}</td>
        <td class="p-3 text-xs text-slate-500">${proj ? proj.name : '<span class="text-slate-300">-</span>'}</td>
        <td class="p-3 font-bold text-right ${isIncome ? 'text-emerald-600' : 'text-rose-600'}">
          ${isIncome ? '+' : '-'}${formatBDT(t.amount)}
        </td>
        <td class="p-3 text-xs text-slate-500">${t.date}</td>
        <td class="p-3 text-right space-x-1 no-print">
          <button onclick="window.editTransaction('${t.id}')" class="text-slate-400 hover:text-indigo-600 text-xs p-1" title="Edit">
            <i class="fa-regular fa-pen-to-square"></i>
          </button>
          <button onclick="window.deleteTransaction('${t.id}', '${t.type}', ${t.amount}, '${t.accountId}')" class="text-slate-400 hover:text-rose-600 text-xs p-1" title="Delete">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

filterProjectEl.onchange = renderTransactions;
filterAccountEl.onchange = renderTransactions;
txSearchEl.oninput = renderTransactions;

// Form Handlers
document.getElementById("formTx").onsubmit = async (e) => {
  e.preventDefault();
  const editId = document.getElementById("editTxId").value;
  const type = document.getElementById("txType").value;
  const accountId = document.getElementById("txAccount").value;
  const projectId = document.getElementById("txProject").value;
  const amount = parseFloat(document.getElementById("txAmount").value) || 0;
  const note = document.getElementById("txNote").value.trim();
  const date = document.getElementById("txDate").value;

  const targetAccount = appData.accounts.find(a => a.id === accountId);
  if (!targetAccount) return alert("Select a valid account");

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
  modalTx.classList.add("hidden");
  resetTxForm();
};

function resetTxForm() {
  document.getElementById("formTx").reset();
  document.getElementById("editTxId").value = "";
  document.getElementById("txModalTitle").textContent = "Add Transaction";
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

document.getElementById("formAccount").onsubmit = async (e) => {
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
    showToast("Account updated!");
  } else {
    appData.accounts.push({ id: "acc_" + Date.now(), name, type, balance });
    showToast("Account created!");
  }

  updateDropdowns();
  await syncToMongoDB();
  modalAccount.classList.add("hidden");
  resetAccountForm();
};

function resetAccountForm() {
  document.getElementById("formAccount").reset();
  document.getElementById("editAccountId").value = "";
  document.getElementById("accountModalTitle").textContent = "Add Account / Wallet";
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

document.getElementById("formProject").onsubmit = async (e) => {
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
  modalProject.classList.add("hidden");
  resetProjectForm();
};

function resetProjectForm() {
  document.getElementById("formProject").reset();
  document.getElementById("editProjectId").value = "";
  document.getElementById("projectModalTitle").textContent = "Create Project";
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

document.getElementById("formTransfer").onsubmit = async (e) => {
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
      note: `Payment to: ${extName}`,
      date
    });
    showToast(`Transferred ${formatBDT(amount)} to ${extName}!`);
  } else {
    if (fromId === toVal) return alert("Source and destination accounts must be different!");
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
  modalTransfer.classList.add("hidden");
  document.getElementById("formTransfer").reset();
  document.getElementById("externalRecipientGroup").classList.add("hidden");
};

document.getElementById("formLoan").onsubmit = async (e) => {
  e.preventDefault();
  const friendName = document.getElementById("loanFriendName").value.trim();
  const amount = parseFloat(document.getElementById("loanAmount").value) || 0;
  const accountId = document.getElementById("loanAccount").value;
  const date = document.getElementById("loanDate").value;

  const targetAccount = appData.accounts.find(a => a.id === accountId);
  if (!targetAccount) return alert("Select an account");

  targetAccount.balance = Number(targetAccount.balance) - amount;
  appData.loans.unshift({ 
    id: "loan_" + Date.now(), 
    friendName, 
    amount, 
    remainingAmount: amount, 
    accountId, 
    date, 
    status: "PENDING" 
  });

  await syncToMongoDB();
  showToast("Loan recorded!");
  modalLoan.classList.add("hidden");
  document.getElementById("formLoan").reset();
};

window.deleteTransaction = async (txId, type, amount, accountId) => {
  if (!confirm("Delete transaction? Balance will revert.")) return;
  const target = appData.accounts.find(a => a.id === accountId);
  if (target) {
    target.balance = type === "INCOME" ? Number(target.balance) - Number(amount) : Number(target.balance) + Number(amount);
  }
  appData.transactions = appData.transactions.filter(t => t.id !== txId);
  await syncToMongoDB();
  showToast("Transaction deleted");
};

window.deleteAccount = async (id) => {
  if (!confirm("Delete this account?")) return;
  appData.accounts = appData.accounts.filter(a => a.id !== id);
  updateDropdowns();
  await syncToMongoDB();
  showToast("Account removed");
};

window.deleteProject = async (id) => {
  if (!confirm("Delete this project?")) return;
  appData.projects = appData.projects.filter(p => p.id !== id);
  updateDropdowns();
  await syncToMongoDB();
  showToast("Project removed");
};

window.deleteLoan = async (id) => {
  if (!confirm("Delete loan record?")) return;
  appData.loans = appData.loans.filter(l => l.id !== id);
  await syncToMongoDB();
  showToast("Loan deleted");
};

// Start App
updateUserDisplay();
loadUserData();