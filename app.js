const API_URL = "/api";

// App State
let currentUser = null;
let token = localStorage.getItem("KOFS_AUTH_TOKEN") || null;
let currentLang = localStorage.getItem("KOFS_LANG") || "en";
let currentTheme = localStorage.getItem("KOFS_THEME") || "dark";

let appData = {
  accounts: [],
  projects: [],
  transactions: [],
  loans: []
};

let activeDetailProjectId = null;

// ==========================================
// TRANSLATION DICTIONARY (i18n)
// ==========================================
const translations = {
  en: {
    tagline: "Smart Multi-Wallet & Project OS",
    your_name: "Full Name",
    email_addr: "Email Address",
    password: "Password",
    forgot_pass: "Forgot Password?",
    add_tx_btn: "Add Tx",
    net_worth: "Total Net Worth",
    proj_inflow: "Project Inflow",
    inflow_desc: "Revenue & funds added",
    proj_cost: "Project Cost",
    cost_desc: "Total expenses on projects",
    lent_friends: "Lent to Friends",
    pending_due: "Pending receivables",
    chart_pie_title: "Project Cost Breakdown",
    distribution: "Distribution",
    chart_bar_title: "Cash Flow & Monthly Burn",
    last_6_months: "Last 6 Months",
    sec_accounts: "Accounts & Wallets",
    sec_accounts_sub: "bKash, Nagad, Rocket, Bank accounts & Cash balances.",
    btn_transfer: "Transfer",
    btn_add_account: "Add Account",
    sec_projects: "Active Projects & Purpose Ledger",
    sec_projects_sub: "Track budget ceilings, debits, credits, and purpose-wise line-item costs.",
    btn_new_project: "New Project",
    sec_loans: "Lent to Friends (Personal Debts)",
    sec_loans_sub: "Track personal debt balances with real-time partial or full repayment receipt.",
    btn_lend_money: "Lend Money",
    tbl_friend: "Friend",
    tbl_remaining: "Remaining Due",
    tbl_total_lent: "Total Lent",
    tbl_source: "Source Account",
    tbl_date: "Date",
    tbl_status: "Status",
    tbl_actions: "Actions",
    sec_tx_history: "Transaction History",
    sec_tx_sub: "All credits, debit expenses, and account transfers.",
    btn_print_history: "Print Statement",
    tbl_type: "Type",
    tbl_purpose: "Purpose / Note",
    tbl_account: "Account",
    tbl_project: "Project",
    tbl_amount: "Amount (BDT)",
    prof_settings: "Profile & Settings",
    prof_sub: "Manage identity, photo & security PIN",
    upload_photo: "Profile Photo",
    phone_number: "Phone Number",
    recovery_pin: "Secret Recovery PIN (6 Digits)",
    address: "Address",
    save_profile: "Save Profile Changes",
    reset_pass_title: "Reset Account Password",
    reset_pass_sub: "Verify using your 6-digit Secret PIN",
    new_pass: "New Password",
    confirm_reset: "Reset Password"
  },
  bn: {
    tagline: "স্মার্ট মাল্টি-ওয়ালেট ও প্রজেক্ট ওএস",
    your_name: "পূর্ণ নাম",
    email_addr: "ইমেইল এড্রেস",
    password: "পাসওয়ার্ড",
    forgot_pass: "পাসওয়ার্ড ভুলে গেছেন?",
    add_tx_btn: "লেনদেন যোগ",
    net_worth: "মোট সম্পদ (Net Worth)",
    proj_inflow: "প্রজেক্ট আয় (Inflow)",
    inflow_desc: "মোট জমা ও আয়ের পরিমাণ",
    proj_cost: "প্রজেক্ট খরচ (Cost)",
    cost_desc: "প্রজেক্ট বাবদ মোট ব্যয়",
    lent_friends: "বন্ধুদের ধার (Lent)",
    pending_due: "বাকি পাওনা টাকা",
    chart_pie_title: "প্রজেক্ট ব্যয়ের পরিসংখ্যান",
    distribution: "অনুপাত",
    chart_bar_title: "মাসিক ক্যাশ-ফ্লো ও খরচ",
    last_6_months: "বিগত ৬ মাস",
    sec_accounts: "অ্যাকাউন্ট ও ওয়ালেট",
    sec_accounts_sub: "বিকাশ, নগদ, রকেট, ব্যাংক ও ক্যাশ ব্যালেন্স।",
    btn_transfer: "ট্রান্সফার",
    btn_add_account: "অ্যাকাউন্ট যোগ",
    sec_projects: "চলমান প্রজেক্ট ও লেজার",
    sec_projects_sub: "বাজেট, জমা, খরচ এবং বিস্তারিত হিসাব ট্র্যাক করুন।",
    btn_new_project: "নতুন প্রজেক্ট",
    sec_loans: "বন্ধুদের ধার (ঋণ হিসাব)",
    sec_loans_sub: "আংশিক বা সম্পূর্ণ টাকা ফেরতের হিসাব রাখুন।",
    btn_lend_money: "টাকা ধার দিন",
    tbl_friend: "বন্ধুর নাম",
    tbl_remaining: "বাকি পাওনা",
    tbl_total_lent: "মোট ধার",
    tbl_source: "প্রদানকারী ওয়ালেট",
    tbl_date: "তারিখ",
    tbl_status: "অবস্থা",
    tbl_actions: "পদক্ষেপ",
    sec_tx_history: "লেনদেনের ইতিহাস",
    sec_tx_sub: "সকল আয়, ব্যয় এবং এক ওয়ালেট থেকে অন্য ওয়ালেটের ট্রান্সফার।",
    btn_print_history: "স্টেটমেন্ট প্রিন্ট",
    tbl_type: "ধরণ",
    tbl_purpose: "বিবরণ / উদ্দেশ্য",
    tbl_account: "অ্যাকাউন্ট",
    tbl_project: "প্রজেক্ট",
    tbl_amount: "পরিমাণ (টাকা)",
    prof_settings: "প্রোফাইল সেটিংস",
    prof_sub: "ব্যক্তিগত তথ্য, ছবি ও সিকিউরিটি পিন",
    upload_photo: "প্রোফাইল ছবি",
    phone_number: "ফোন নম্বর",
    recovery_pin: "সিক্রেট রিকভারি পিন (৬ ডিজিট)",
    address: "ঠিকানা",
    save_profile: "পরিবর্তন সংরক্ষণ করুন",
    reset_pass_title: "পাসওয়ার্ড রিসেট করুন",
    reset_pass_sub: "৬ ডিজিটের সিক্রেট পিন দিয়ে রিকভার করুন",
    new_pass: "নতুন পাসওয়ার্ড",
    confirm_reset: "পাসওয়ার্ড রিসেট নিশ্চিত করুন"
  }
};

function applyTranslations(lang) {
  currentLang = lang;
  localStorage.setItem("KOFS_LANG", lang);
  document.getElementById("langLabel").textContent = lang === "en" ? "বাংলা" : "English";
  
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });
}

document.getElementById("btnToggleLang").onclick = () => {
  const nextLang = currentLang === "en" ? "bn" : "en";
  applyTranslations(nextLang);
};

// ==========================================
// THEME CONTROLLER (Dark / Light Mode)
// ==========================================
function applyTheme(theme) {
  currentTheme = theme;
  localStorage.setItem("KOFS_THEME", theme);
  const icon = document.getElementById("themeIcon");
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
    icon.className = "fa-solid fa-sun text-brand-400";
  } else {
    document.documentElement.classList.remove("dark");
    icon.className = "fa-solid fa-moon text-slate-700";
  }
  if (currentUser) renderCharts();
}

document.getElementById("btnToggleTheme").onclick = () => {
  applyTheme(currentTheme === "dark" ? "light" : "dark");
};

// Safe API Client
async function apiFetch(endpoint, options = {}) {
  try {
    const res = await fetch(endpoint, options);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(`Server Error (${res.status}): ${text || "Empty response from server."}`);
    }
    if (!res.ok) throw new Error(data.error || `Request failed with status ${res.status}`);
    return data;
  } catch (err) {
    throw err;
  }
}

// Password eye toggle
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

// Open Modal Triggers
document.getElementById("btnOpenTxModal").onclick = () => { resetTxForm(); openModal(modalTx); };
document.getElementById("btnOpenAccountModal").onclick = () => { resetAccountForm(); openModal(modalAccount); };
document.getElementById("btnOpenProjectModal").onclick = () => { resetProjectForm(); openModal(modalProject); };
document.getElementById("btnOpenLoanModal").onclick = () => openModal(modalLoan);
document.getElementById("btnOpenTransferModal").onclick = () => openModal(modalTransfer);
document.getElementById("btnOpenProfileModal").onclick = () => openProfileModal();

document.getElementById("btnForgotPassTrigger").onclick = () => {
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

// ==========================================
// STRICT GATEKEEPER & AUTH
// ==========================================
let isRegisterMode = false;
const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const authNameGroup = document.getElementById("authNameGroup");
const btnAuthSubmit = document.getElementById("btnAuthSubmit");

tabLogin.onclick = () => setAuthMode(false);
tabRegister.onclick = () => setAuthMode(true);

function setAuthMode(register) {
  isRegisterMode = register;
  if (register) {
    tabRegister.className = "flex-1 py-2 text-xs font-bold rounded-lg transition bg-white dark:bg-brand-500 dark:text-slate-950 text-brand-600 shadow-sm";
    tabLogin.className = "flex-1 py-2 text-xs font-bold rounded-lg transition text-slate-500 dark:text-slate-400";
    authNameGroup.classList.remove("hidden");
    btnAuthSubmit.querySelector("span").textContent = currentLang === "en" ? "Register" : "রেজিস্টার করুন";
  } else {
    tabLogin.className = "flex-1 py-2 text-xs font-bold rounded-lg transition bg-white dark:bg-brand-500 dark:text-slate-950 text-brand-600 shadow-sm";
    tabRegister.className = "flex-1 py-2 text-xs font-bold rounded-lg transition text-slate-500 dark:text-slate-400";
    authNameGroup.classList.add("hidden");
    btnAuthSubmit.querySelector("span").textContent = currentLang === "en" ? "Login" : "লগইন করুন";
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
  btnAuthSubmit.querySelector("span").textContent = "Authenticating...";

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
    showToast(`Welcome, ${currentUser.name}!`);
    loadUserData();
  } catch (err) {
    alert(err.message);
  } finally {
    btnAuthSubmit.disabled = false;
    btnAuthSubmit.querySelector("span").textContent = isRegisterMode ? (currentLang === "en" ? "Register" : "রেজিস্টার করুন") : (currentLang === "en" ? "Login" : "লগইন করুন");
  }
};

function unlockApplication() {
  authGatekeeper.classList.add("hidden");
  appContainer.classList.remove("hidden");
  updateUserDisplay();
}

function lockApplication() {
  authGatekeeper.classList.remove("hidden");
  appContainer.classList.add("hidden");
}

document.getElementById("btnLogout").onclick = () => {
  if (confirm(currentLang === "en" ? "Logout from KofsLedger?" : "KofsLedger থেকে লগআউট করতে চান?")) {
    localStorage.removeItem("KOFS_AUTH_TOKEN");
    localStorage.removeItem("KOFS_AUTH_USER");
    token = null;
    currentUser = null;
    lockApplication();
  }
};

function updateUserDisplay() {
  const storedUser = localStorage.getItem("KOFS_AUTH_USER");
  if (storedUser) currentUser = JSON.parse(storedUser);
  if (!currentUser) return;

  displayUserNameEl.textContent = currentUser.name;
  document.getElementById("printUserName").textContent = currentUser.name;
  document.getElementById("printDate").textContent = new Date().toLocaleDateString("en-BD");

  // Avatar rendering in header & preview
  const headerAvatarContainer = document.getElementById("headerAvatarContainer");
  const modalAvatarPreview = document.getElementById("modalAvatarPreview");

  if (currentUser.avatar) {
    headerAvatarContainer.innerHTML = `<img src="${currentUser.avatar}" class="w-full h-full object-cover" />`;
    modalAvatarPreview.innerHTML = `<img src="${currentUser.avatar}" class="w-full h-full object-cover" />`;
  } else {
    const initial = (currentUser.name || "U").charAt(0).toUpperCase();
    headerAvatarContainer.innerHTML = `<span>${initial}</span>`;
    modalAvatarPreview.innerHTML = `<span>${initial}</span>`;
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

// Convert chosen photo to base64
document.getElementById("profAvatarInput").onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Max 1.5MB validation
  if (file.size > 1.5 * 1024 * 1024) {
    return alert(currentLang === "en" ? "Image size should be under 1.5MB" : "ছবির সাইজ ১.৫ মেগাবাইট (MB) এর কম হতে হবে।");
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const base64 = event.target.result;
    document.getElementById("profAvatarBase64").value = base64;
    document.getElementById("modalAvatarPreview").innerHTML = `<img src="${base64}" class="w-full h-full object-cover" />`;
  };
  reader.readAsDataURL(file);
};

document.getElementById("formProfile").onsubmit = async (e) => {
  e.preventDefault();
  const name = document.getElementById("profName").value.trim();
  const phone = document.getElementById("profPhone").value.trim();
  const address = document.getElementById("profAddress").value.trim();
  const recoveryPin = document.getElementById("profRecoveryPin").value.trim();
  const avatar = document.getElementById("profAvatarBase64").value;

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
      body: JSON.stringify({ name, phone, address, recoveryPin, avatar })
    });

    currentUser = data.user;
    localStorage.setItem("KOFS_AUTH_USER", JSON.stringify(currentUser));
    updateUserDisplay();
    showToast("Profile & Photo updated successfully!");
    modalProfile.classList.add("hidden");
  } catch (err) {
    alert(err.message);
  } finally {
    btnSave.disabled = false;
    btnSave.textContent = currentLang === "en" ? "Save Profile Changes" : "পরিবর্তন সংরক্ষণ করুন";
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
  } catch (err) {
    alert(err.message);
  } finally {
    btnReset.disabled = false;
    btnReset.textContent = currentLang === "en" ? "Reset Password" : "পাসওয়ার্ড রিসেট করুন";
  }
};

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
    if (err.message.includes("401") || err.message.includes("Unauthorized")) {
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
// CHARTS & STATS (Dark / Light Adaptive)
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
    const name = proj ? proj.name : (currentLang === "en" ? "General / Personal" : "সাধারণ / ব্যক্তিগত");
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
        { label: currentLang === "en" ? "Income" : "আয়", data: incomeData, backgroundColor: "#10b981", borderRadius: 6 },
        { label: currentLang === "en" ? "Expense" : "ব্যয়", data: expenseData, backgroundColor: "#f43f5e", borderRadius: 6 }
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

function render() {
  const netWorth = appData.accounts.reduce((acc, a) => acc + (Number(a.balance) || 0), 0);
  totalNetWorthEl.textContent = formatBDT(netWorth);
  document.getElementById("accountCountLabel").textContent = currentLang === "en" 
    ? `Across ${appData.accounts.length} accounts` 
    : `${appData.accounts.length} টি অ্যাকাউন্টের মোট ব্যালেন্স`;

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

  if (activeDetailProjectId) refreshProjectDetails(activeDetailProjectId);
}

function updateDropdowns() {
  const accOpts = appData.accounts.map(a => `<option value="${a.id}">${a.name} [${a.type}] (${formatBDT(a.balance)})</option>`).join("");
  document.getElementById("txAccount").innerHTML = accOpts;
  document.getElementById("loanAccount").innerHTML = accOpts;
  document.getElementById("transferFrom").innerHTML = accOpts;
  document.getElementById("settleDepositAccount").innerHTML = accOpts;

  document.getElementById("transferTo").innerHTML = accOpts + `<option value="EXTERNAL">+ ${currentLang === 'en' ? 'Send to External Person' : 'অন্য কাউকে পাঠান'}</option>`;
  filterAccountEl.innerHTML = `<option value="ALL">${currentLang === 'en' ? 'All Accounts' : 'সব অ্যাকাউন্ট'}</option>` + appData.accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join("");

  const projOpts = `<option value="NONE">${currentLang === 'en' ? 'General / Personal (No Project)' : 'সাধারণ / ব্যক্তিগত'}</option>` + 
    appData.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join("");
  document.getElementById("txProject").innerHTML = projOpts;
  filterProjectEl.innerHTML = `<option value="ALL">${currentLang === 'en' ? 'All Projects' : 'সব প্রজেক্ট'}</option>` + appData.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join("");
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
    accountsGridEl.innerHTML = `<div class="col-span-full py-6 text-center text-slate-400 bg-slate-50 dark:bg-darkbg-elevated border border-dashed border-slate-200 dark:border-darkbg-border rounded-2xl text-xs">No accounts added yet.</div>`;
    return;
  }
  accountsGridEl.innerHTML = appData.accounts.map(a => `
    <div class="bg-white dark:bg-darkbg-card p-4 rounded-2xl border border-slate-200/80 dark:border-darkbg-border shadow-sm flex justify-between items-center hover:border-brand-500/50 transition">
      <div>
        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-darkbg-elevated px-2 py-0.5 rounded-full">${a.type}</span>
        <h4 class="font-bold text-slate-800 dark:text-white text-sm mt-1">${a.name}</h4>
        <p class="text-xl font-black text-brand-500 mt-1">${formatBDT(a.balance)}</p>
      </div>
      <div class="flex items-center gap-1">
        <button onclick="window.editAccount('${a.id}')" class="p-2 text-slate-400 hover:text-brand-400 transition text-xs" title="Edit">
          <i class="fa-regular fa-pen-to-square"></i>
        </button>
        <button onclick="window.deleteAccount('${a.id}')" class="p-2 text-slate-400 hover:text-rose-500 transition text-xs" title="Delete">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </div>
    </div>
  `).join("");
}

function renderProjects() {
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
              <span class="text-slate-400">${currentLang === 'en' ? 'Inflow' : 'মোট আয়'}:</span>
              <p class="font-bold text-emerald-500">+${formatBDT(pIn)}</p>
            </div>
            <div>
              <span class="text-slate-400">${currentLang === 'en' ? 'Spent' : 'মোট খরচ'}:</span>
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
            <i class="fa-solid fa-list-check"></i> ${currentLang === 'en' ? 'View Ledger' : 'লেজার দেখুন'}
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

  document.getElementById("pDetailBtnAddTx").onclick = () => {
    resetTxForm();
    document.getElementById("txProject").value = p.id;
    openModal(modalTx);
  };

  const tbody = document.getElementById("pDetailTxTableBody");
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

function renderLoans() {
  if (appData.loans.length === 0) {
    loansTableBodyEl.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-400 text-xs">কোনো ধারের রেকর্ড নেই (No debt records).</td></tr>`;
    return;
  }
  loansTableBodyEl.innerHTML = appData.loans.map(l => {
    const acc = appData.accounts.find(a => a.id === l.accountId);
    const totalAmount = Number(l.amount) || 0;
    const remainingDue = Number(l.remainingAmount ?? l.amount) || 0;
    const isRepaid = l.status === "REPAID" || remainingDue <= 0;
    const isPartial = !isRepaid && remainingDue < totalAmount;

    let badgeClass = "bg-amber-500/10 text-amber-500 border border-amber-500/20";
    let statusText = currentLang === 'en' ? "Pending" : "বাকি";
    if (isRepaid) {
      badgeClass = "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
      statusText = currentLang === 'en' ? "Fully Repaid" : "পরিশোধিত";
    } else if (isPartial) {
      badgeClass = "bg-cyan-500/10 text-cyan-500 border border-cyan-500/20";
      statusText = currentLang === 'en' ? "Partially Paid" : "আংশিক শোধ";
    }

    return `
      <tr class="hover:bg-slate-50 dark:hover:bg-darkbg-elevated/50 transition border-b border-slate-100 dark:border-darkbg-border">
        <td class="p-3.5 pl-4 font-semibold text-slate-900 dark:text-white">${l.friendName}</td>
        <td class="p-3.5 font-black text-rose-500">${formatBDT(remainingDue)}</td>
        <td class="p-3.5 text-xs text-slate-400">${formatBDT(totalAmount)}</td>
        <td class="p-3.5 text-xs text-slate-400">${acc ? acc.name : "N/A"}</td>
        <td class="p-3.5 text-xs text-slate-400">${l.date}</td>
        <td class="p-3.5">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black ${badgeClass}">
            ${statusText}
          </span>
        </td>
        <td class="p-3.5 pr-4 text-right space-x-1.5">
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
            ${isIncome ? (currentLang === 'en' ? 'Income' : 'আয়') : (currentLang === 'en' ? 'Expense' : 'ব্যয়')}
          </span>
        </td>
        <td class="p-3.5 font-semibold text-slate-800 dark:text-slate-200">${t.note}</td>
        <td class="p-3.5 text-xs text-slate-400">${acc ? `${acc.name} (${acc.type})` : "N/A"}</td>
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

filterProjectEl.onchange = renderTransactions;
filterAccountEl.onchange = renderTransactions;
txSearchEl.oninput = renderTransactions;

// Form Submit Handlers
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
  if (!targetAccount) return alert("Select source account");

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
  showToast("Debt recorded successfully!");
  modalLoan.classList.add("hidden");
  document.getElementById("formLoan").reset();
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
  if (!confirm("Delete debt record?")) return;
  appData.loans = appData.loans.filter(l => l.id !== id);
  await syncToMongoDB();
  showToast("Debt deleted");
};

// ==========================================
// INITIAL BOOTSTRAP
// ==========================================
applyTheme(currentTheme);
applyTranslations(currentLang);

if (token) {
  unlockApplication();
  loadUserData();
} else {
  lockApplication();
}