import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, BarChart3, Bell, Download, LockKeyhole, LogOut, Moon, Pencil, PiggyBank, Plus, Receipt, Search, ShieldCheck, Sun, Target, Trash2, TrendingUp, Wallet, X } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import api from "./services/api";
import SpendingVisuals from "./components/SpendingVisuals";
import BudgetSettings from "./components/BudgetSettings";
import BudgetAlert from "./components/BudgetAlert";

const categories = ["Food", "Movies", "Gadgets", "Clothes", "Travel", "Shopping", "Bills", "Education", "Health", "Entertainment", "Others"];
const emptyForm = { title: "", amount: "", category: "Food", date: new Date().toISOString().slice(0, 10), description: "" };
const defaultReminderForm = { title: "", amount: "", category: "Food", frequency: "monthly", nextDate: new Date().toISOString().slice(0, 10) };
const defaultGoalForm = { title: "Emergency Fund", target: "25000", current: "5000" };

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
}

function readOfflineExpenses() {
  try {
    const stored = JSON.parse(localStorage.getItem("spendwise_offline_expenses") || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function writeOfflineExpenses(expenses) {
  localStorage.setItem("spendwise_offline_expenses", JSON.stringify(expenses));
}

function readBudgetLimit() {
  const stored = Number(localStorage.getItem("spendwise_budget_limit") || "15000");
  return Number.isFinite(stored) && stored > 0 ? stored : 15000;
}

function writeBudgetLimit(value) {
  localStorage.setItem("spendwise_budget_limit", String(value));
}

function readCategoryBudgets() {
  try {
    const stored = JSON.parse(localStorage.getItem("spendwise_category_budgets") || "{}");
    return stored && typeof stored === "object" ? stored : {};
  } catch {
    return {};
  }
}

function writeCategoryBudgets(data) {
  localStorage.setItem("spendwise_category_budgets", JSON.stringify(data));
}

function readRecurringItems() {
  try {
    const stored = JSON.parse(localStorage.getItem("spendwise_recurring_items") || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function writeRecurringItems(data) {
  localStorage.setItem("spendwise_recurring_items", JSON.stringify(data));
}

function readGoals() {
  try {
    const stored = JSON.parse(localStorage.getItem("spendwise_goals") || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function writeGoals(data) {
  localStorage.setItem("spendwise_goals", JSON.stringify(data));
}

function getNextReminderDate(frequency, fromDate) {
  const next = new Date(fromDate || new Date());
  const units = { weekly: 7, biweekly: 14, monthly: 30, yearly: 365 };
  next.setDate(next.getDate() + (units[frequency] || 30));
  return next.toISOString().slice(0, 10);
}

function Login({ onLogin }) {
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const authError = params.get("error");
    if (authError === "google_not_configured") {
      setError("Google sign-in is not configured. Add the Google OAuth credentials to the server environment.");
      window.history.replaceState({}, "", "/");
    }
    if (window.location.pathname === "/auth/callback" && token) {
      api.get("/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        .then((response) => {
          window.history.replaceState({}, "", "/");
          onLogin(token, response.data.user);
        })
        .catch(() => setError("Google sign-in could not be completed."));
    }
  }, [onLogin]);

  function googleLogin() {
    const apiUrl = import.meta.env.VITE_API_URL || "/api";
    window.location.href = `${API_URL}/api/auth/google`;
  }

  function demoLogin() {
    const demoUser = {
      _id: "demo-user-123",
      name: "Demo User",
      email: "demo@spendwise.local",
      offlineDemo: true
    };
    onLogin("offline-demo", demoUser);
  }

  return <main className="login-page"><section className="login-panel"><div className="login-brand"><div className="brand-mark"><Wallet size={21} /></div><div><strong>SpendWise</strong><span>Personal finance, without the fuss</span></div></div><div className="login-intro"><p className="eyebrow">WELCOME BACK</p><h1>Your money,<br /><em>in focus.</em></h1><p className="login-copy">A calm, clear place to understand where your money goes.</p></div><div className="login-form-shell"><div className="form-heading"><div><h2>Sign in</h2><p>Choose a secure way to continue.</p></div><LockKeyhole size={19} /></div><button className="google-login" onClick={googleLogin}><span>G</span> Continue with Google <ArrowUpRight size={16} /></button><button className="google-login" onClick={demoLogin} style={{ marginTop: "8px", backgroundColor: "#6366f1" }}><span>D</span> Demo Login <ArrowUpRight size={16} /></button>{error && <p className="error-message">{error}</p>}<div className="login-security"><ShieldCheck size={15} /><span>Your account is protected with secure verification.</span></div></div><p className="login-footnote">By continuing, you agree to keep your account details private.</p></section><aside className="login-aside"><div className="aside-topline"><span>SPENDWISE / 01</span><span>2026</span></div><div className="aside-content"><p className="eyebrow">A CLEARER MONTH STARTS HERE</p><h2>Make room<br />for what<br /><strong>matters.</strong></h2><p>See the shape of your spending, build better habits, and move through the month with less noise.</p></div><div className="money-preview"><div className="preview-header"><span>MONTHLY OVERVIEW</span><ArrowUpRight size={16} /></div><div className="preview-amount">₹24,860</div><div className="preview-meta"><span>Tracked this month</span><strong>+12.8%</strong></div><div className="preview-bars"><i /><i /><i /><i /><i /><i /><i /></div><div className="preview-footer"><span><b /> Essentials</span><span><b /> Lifestyle</span><span><b /> Goals</span></div></div><div className="aside-note"><Receipt size={18} /><span>Built for real life, not spreadsheets.</span></div></aside></main>;
}

function App() {
  const { user, loading, login, logout } = useAuth();
  const offlineDemo = Boolean(user?.offlineDemo);
  const [expenses, setExpenses] = useState([]);
  const [view, setView] = useState("overview");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [availableCategories, setAvailableCategories] = useState(categories);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [error, setError] = useState("");
  const [budgetLimit, setBudgetLimit] = useState(readBudgetLimit);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("spendwise_dark_mode") === "true");
  const [categoryBudgets, setCategoryBudgets] = useState(readCategoryBudgets);
  const [recurringItems, setRecurringItems] = useState(readRecurringItems);
  const [recurringForm, setRecurringForm] = useState(defaultReminderForm);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [goals, setGoals] = useState(readGoals);
  const [goalForm, setGoalForm] = useState(defaultGoalForm);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [budgets, setBudgets] = useState([]);
  const [budgetsLoading, setBudgetsLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem("spendwise_dark_mode", darkMode ? "true" : "false");
    document.body.classList.toggle("dark-body", darkMode);
  }, [darkMode]);

  useEffect(() => { writeCategoryBudgets(categoryBudgets); }, [categoryBudgets]);
  useEffect(() => { writeRecurringItems(recurringItems); }, [recurringItems]);
  useEffect(() => { writeGoals(goals); }, [goals]);

  async function loadExpenses() {
    if (offlineDemo) { setExpenses(readOfflineExpenses()); return; }
    try { const response = await api.get("/expenses"); setExpenses(response.data.expenses || []); }
    catch (requestError) { setError(requestError.response?.data?.message || "Could not load expenses."); }
  }

  async function loadBudgets() {
    if (offlineDemo) return; // Budgets not supported in offline demo
    setBudgetsLoading(true);
    try {
      const now = new Date();
      const response = await api.get("/budgets", {
        params: {
          month: now.getMonth() + 1,
          year: now.getFullYear()
        }
      });
      setBudgets(response.data || []);
    } catch (requestError) {
      console.error("Could not load budgets:", requestError);
    } finally {
      setBudgetsLoading(false);
    }
  }

  useEffect(() => { if (user) loadExpenses(); }, [user]);
  useEffect(() => { if (user && !offlineDemo) loadBudgets(); }, [user, offlineDemo]);
  useEffect(() => { if (user && !offlineDemo) api.get("/expenses/categories").then((response) => setAvailableCategories(response.data.categories || categories)).catch(() => {}); }, [user, offlineDemo]);

  const filteredExpenses = useMemo(() => expenses.filter((expense) => `${expense.title} ${expense.category} ${expense.description || ""}`.toLowerCase().includes(search.toLowerCase())), [expenses, search]);
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const thisMonth = expenses.filter((expense) => new Date(expense.date).getMonth() === new Date().getMonth()).reduce((sum, expense) => sum + expense.amount, 0);
  const topCategory = Object.entries(expenses.reduce((result, expense) => ({ ...result, [expense.category]: (result[expense.category] || 0) + expense.amount }), {})).sort((a, b) => b[1] - a[1])[0];
  const budgetProgress = budgetLimit > 0 ? Math.min((thisMonth / budgetLimit) * 100, 100) : 0;
  const budgetLeft = Math.max(budgetLimit - thisMonth, 0);
  const savingPotential = Math.round(total * 0.12);
  const averageSpend = expenses.length ? total / expenses.length : 0;
  const categorySummary = Object.entries(expenses.reduce((result, expense) => ({ ...result, [expense.category]: (result[expense.category] || 0) + expense.amount }), {})).sort((a, b) => b[1] - a[1]);
  const categoryBudgetData = categories
    .map((category) => {
      const spent = expenses.reduce((sum, item) => item.category === category ? sum + Number(item.amount || 0) : sum, 0);
      const limit = Number(categoryBudgets[category] || 0);
      return { category, spent, limit, remaining: limit - spent, percent: limit > 0 ? Math.min((spent / limit) * 100, 100) : 0 };
    })
    .filter((entry) => entry.limit > 0 || entry.spent > 0);
  const activeGoals = goals.map((goal) => ({ ...goal, progress: Math.min((Number(goal.current || 0) / Math.max(Number(goal.target || 1), 1)) * 100, 100), remaining: Math.max(Number(goal.target || 0) - Number(goal.current || 0), 0) }));
  const aiInsights = [
    topCategory ? `${topCategory[0]} is your strongest spending driver. Pulling back 10% there could save about ${formatCurrency(Math.round(topCategory[1] * 0.1))}.` : "Add a few more entries to unlock your spending pattern.",
    expenses.length ? `You average ${formatCurrency(averageSpend)} per transaction, which is healthy for a steady tracking routine.` : "Consistency is the key metric — log a few more purchases to build momentum.",
    budgetLimit ? `Your budget is ${budgetLeft > 0 ? `${formatCurrency(budgetLeft)} left` : "already used up"} for the month.` : "Set a monthly cap to create a clearer spending guardrail."
  ];

  async function addExpense(event) {
    event.preventDefault(); setError("");
    const amount = Number(form.amount);
    if (!form.title.trim() || !Number.isFinite(amount) || amount <= 0 || !form.date) { setError("Add a title, a valid amount, and a date."); return; }
    try {
      if (offlineDemo) {
        const stored = readOfflineExpenses();
        const expense = { ...form, title: form.title.trim(), amount, _id: editingId || `offline-${Date.now()}` };
        const next = editingId ? stored.map((item) => item._id === editingId ? expense : item) : [expense, ...stored];
        writeOfflineExpenses(next);
        setExpenses(next);
      } else if (editingId) await api.put(`/expenses/${editingId}`, { ...form, amount });
      else await api.post("/expenses", { ...form, amount });
      setForm(emptyForm); setEditingId(null); setModal(false); if (!offlineDemo) loadExpenses();
    }
    catch (requestError) { setError(requestError.response?.data?.message || "Could not save expense."); }
  }

  async function deleteExpense(id) {
    if (!window.confirm("Delete this expense?")) return;
    try {
      if (offlineDemo) {
        const next = readOfflineExpenses().filter((item) => item._id !== id);
        writeOfflineExpenses(next);
        setExpenses(next);
      } else await api.delete(`/expenses/${id}`);
      if (!offlineDemo) loadExpenses();
    } catch (requestError) { setError(requestError.response?.data?.message || "Could not delete expense."); }
  }

  function editExpense(expense) { setEditingId(expense._id); setForm({ title: expense.title, amount: expense.amount, category: expense.category, date: new Date(expense.date).toISOString().slice(0, 10), description: expense.description || "" }); setModal(true); }

  async function downloadReport() {
    if (offlineDemo) { setView("reports"); setTimeout(() => window.print(), 0); return; }
    const response = await api.get(`/reports/monthly?month=${new Date().toISOString().slice(0, 7)}`, { responseType: "blob" });
    const url = URL.createObjectURL(response.data); const link = document.createElement("a"); link.href = url; link.download = "SpendWise-monthly-report.pdf"; link.click(); URL.revokeObjectURL(url);
  }

  function saveBudget() {
    const nextValue = Number(budgetLimit);
    if (!Number.isFinite(nextValue) || nextValue <= 0) {
      setBudgetLimit(15000);
      writeBudgetLimit(15000);
      return;
    }
    writeBudgetLimit(nextValue);
  }

  function addRecurringReminder(event) {
    event.preventDefault();
    const amount = Number(recurringForm.amount);
    if (!recurringForm.title.trim() || !Number.isFinite(amount) || amount <= 0) return;
    setRecurringItems((current) => [{
      id: `reminder-${Date.now()}`,
      title: recurringForm.title.trim(),
      amount,
      category: recurringForm.category,
      frequency: recurringForm.frequency,
      nextDate: recurringForm.nextDate
    }, ...current]);
    setRecurringForm(defaultReminderForm);
    setShowReminderForm(false);
  }

  function advanceRecurring(itemId) {
    setRecurringItems((current) => current.map((item) => item.id === itemId ? { ...item, nextDate: getNextReminderDate(item.frequency, item.nextDate) } : item));
  }

  function removeRecurring(itemId) {
    setRecurringItems((current) => current.filter((item) => item.id !== itemId));
  }

  function addSavingsGoal(event) {
    event.preventDefault();
    const target = Number(goalForm.target);
    const current = Number(goalForm.current);
    if (!goalForm.title.trim() || !Number.isFinite(target) || target <= 0) return;
    setGoals((currentGoals) => [{
      id: `goal-${Date.now()}`,
      title: goalForm.title.trim(),
      target,
      current: Number.isFinite(current) && current > 0 ? current : 0
    }, ...currentGoals]);
    setGoalForm(defaultGoalForm);
    setShowGoalForm(false);
  }

  function updateCategoryBudget(category, value) {
    const parsed = Number(value);
    setCategoryBudgets((current) => ({ ...current, [category]: Number.isFinite(parsed) && parsed >= 0 ? parsed : 0 }));
  }

  if (loading) return <div className="loading-screen">Loading SpendWise...</div>;
  if (!user) return <Login onLogin={login} />;

  return <div className={`app-shell ${darkMode ? "dark-mode" : ""}`}>
    <aside className="sidebar">
      <div className="sidebar-brand"><div className="brand-mark"><Wallet size={19} /></div><strong>SpendWise</strong></div>
      <p className="nav-label">WORKSPACE</p>
      {[ ["overview", BarChart3, "Overview"], ["expenses", Receipt, "Expenses"], ["budgets", PiggyBank, "Budgets"], ["reports", Download, "Reports"] ].map(([key, Icon, label]) => <button className={`nav-item ${view === key ? "active" : ""}`} onClick={() => setView(key)} key={key}><Icon size={18} />{label}</button>)}
      <div className="sidebar-bottom">
        <button className="theme-toggle" onClick={() => setDarkMode((current) => !current)}>{darkMode ? <Sun size={16} /> : <Moon size={16} />} {darkMode ? "Light" : "Dark"}</button>
        <div className="user-chip"><div className="avatar">{(user.name || "U")[0]}</div><span>{user.name || "SpendWise User"}</span></div>
        <button className="logout-button" onClick={logout}><LogOut size={17} /> Sign out</button>
      </div>
    </aside>

    <main className="content">
      <header className="topbar">
        <div>
          <p className="eyebrow">{new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" }).toUpperCase()}</p>
          <h1>{view === "overview" ? `Good to see you, ${(user.name || "there").split(" ")[0]}.` : view[0].toUpperCase() + view.slice(1)}</h1>
        </div>
        <button className="add-button" onClick={() => { setEditingId(null); setForm(emptyForm); setModal(true); }}><Plus size={18} /> Add expense</button>
      </header>

      {error && <p className="error-message page-error">{error}</p>}

      {view === "overview" && <>
        <section className="stats-grid">
          <article className="stat-card feature"><span>Total tracked</span><strong>{formatCurrency(total)}</strong><small>Across {expenses.length} transactions</small></article>
          <article className="stat-card"><span>This month</span><strong>{formatCurrency(thisMonth)}</strong><small>Current month spending</small></article>
          <article className="stat-card"><span>Top category</span><strong>{topCategory?.[0] || "-"}</strong><small>{topCategory ? formatCurrency(topCategory[1]) : "No data yet"}</small></article>
        </section>

        <BudgetAlert budgets={budgets} loading={budgetsLoading} />

        <section className="insights-grid">
          <article className="insight-card">
            <div className="insight-header"><Target size={18} /><span>Monthly budget</span></div>
            <div className="progress-wrap"><span style={{ width: `${budgetProgress}%` }} /></div>
            <div className="progress-meta"><strong>{formatCurrency(thisMonth)}</strong><small>{formatCurrency(budgetLeft)} left</small></div>
            <div className="budget-controls"><input type="number" min="0" value={budgetLimit} onChange={(event) => setBudgetLimit(Number(event.target.value) || 0)} /><button className="secondary-button" onClick={saveBudget}>Update</button></div>
          </article>

          <article className="insight-card">
            <div className="insight-header"><TrendingUp size={18} /><span>AI insight</span></div>
            <p className="insight-text">{aiInsights[0]}</p>
            <div className="mini-row"><span>Potential savings</span><strong>{formatCurrency(savingPotential)}</strong></div>
          </article>

          <article className="insight-card">
            <div className="insight-header"><PiggyBank size={18} /><span>Goal momentum</span></div>
            <p className="insight-text">{activeGoals.length ? `${activeGoals[0].title} is ${Math.round(activeGoals[0].progress)}% funded.` : "Set a savings goal to start building momentum."}</p>
            <div className="mini-row"><span>Average spend</span><strong>{formatCurrency(averageSpend)}</strong></div>
          </article>
        </section>

        <section className="feature-grid">
          <div className="panel">
            <div className="panel-heading">
              <div><p className="eyebrow">RECURRING</p><h2>Reminders</h2></div>
              <button className="text-button" onClick={() => setShowReminderForm((current) => !current)}>{showReminderForm ? "Close" : "Add"}</button>
            </div>

            {showReminderForm && <form className="mini-form" onSubmit={addRecurringReminder}>
              <div className="form-row">
                <label>Title<input value={recurringForm.title} onChange={(event) => setRecurringForm((current) => ({ ...current, title: event.target.value }))} placeholder="Gym" /></label>
                <label>Amount<input type="number" value={recurringForm.amount} onChange={(event) => setRecurringForm((current) => ({ ...current, amount: event.target.value }))} placeholder="1200" min="0" /></label>
              </div>
              <div className="form-row">
                <label>Category<select value={recurringForm.category} onChange={(event) => setRecurringForm((current) => ({ ...current, category: event.target.value }))}>{availableCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
                <label>Frequency<select value={recurringForm.frequency} onChange={(event) => setRecurringForm((current) => ({ ...current, frequency: event.target.value }))}><option value="weekly">Weekly</option><option value="biweekly">Bi-weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></label>
              </div>
              <label>Next date<input type="date" value={recurringForm.nextDate} onChange={(event) => setRecurringForm((current) => ({ ...current, nextDate: event.target.value }))} /></label>
              <button className="primary-button" type="submit">Save reminder</button>
            </form>}

            <div className="stack-list">
              {recurringItems.length ? recurringItems.map((item) => <div className="stack-item" key={item.id}><div><strong>{item.title}</strong><span>{item.category} · {item.frequency}</span></div><div className="stack-meta"><small>{new Date(item.nextDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small><strong>{formatCurrency(item.amount)}</strong></div><div className="row-actions"><button onClick={() => advanceRecurring(item.id)} aria-label={`Advance ${item.title}`}><Bell size={15} /></button><button onClick={() => removeRecurring(item.id)} aria-label={`Remove ${item.title}`}><Trash2 size={15} /></button></div></div>) : <div className="empty-state compact"><Receipt size={24} /><p>No reminders yet.</p><small>Set recurring bills and subscriptions here.</small></div>}
            </div>
          </div>

          <div className="panel">
            <div className="panel-heading">
              <div><p className="eyebrow">CATEGORIES</p><h2>Budget caps</h2></div>
            </div>
            <div className="category-budget-list">
              {categoryBudgetData.map((entry) => <div className="category-budget-row" key={entry.category}><div className="category-row-head"><span>{entry.category}</span><strong>{formatCurrency(entry.spent)} / {formatCurrency(entry.limit || 0)}</strong></div><div className="category-bar"><i style={{ width: `${entry.limit > 0 ? entry.percent : 0}%` }} /></div>{entry.limit > 0 ? <div className="budget-inline"><input type="number" value={entry.limit} onChange={(event) => updateCategoryBudget(entry.category, event.target.value)} /><small>{entry.remaining >= 0 ? `${formatCurrency(entry.remaining)} left` : `${formatCurrency(Math.abs(entry.remaining))} over`}</small></div> : <small className="budget-inline-note">Set a cap to track this category.</small>}</div>)}
            </div>
          </div>
        </section>

        <section className="feature-grid lower-grid">
          <div className="panel">
            <div className="panel-heading">
              <div><p className="eyebrow">GOALS</p><h2>Savings tracker</h2></div>
              <button className="text-button" onClick={() => setShowGoalForm((current) => !current)}>{showGoalForm ? "Close" : "Add"}</button>
            </div>

            {showGoalForm && <form className="mini-form" onSubmit={addSavingsGoal}>
              <div className="form-row">
                <label>Goal<input value={goalForm.title} onChange={(event) => setGoalForm((current) => ({ ...current, title: event.target.value }))} placeholder="Emergency Fund" /></label>
                <label>Target<input type="number" value={goalForm.target} onChange={(event) => setGoalForm((current) => ({ ...current, target: event.target.value }))} placeholder="25000" min="0" /></label>
              </div>
              <label>Current saved<input type="number" value={goalForm.current} onChange={(event) => setGoalForm((current) => ({ ...current, current: event.target.value }))} placeholder="5000" min="0" /></label>
              <button className="primary-button" type="submit">Create goal</button>
            </form>}

            <div className="goal-list">
              {activeGoals.length ? activeGoals.map((goal) => <div className="goal-item" key={goal.id}><div className="goal-top"><strong>{goal.title}</strong><span>{Math.round(goal.progress)}%</span></div><div className="progress-wrap small-progress"><span style={{ width: `${goal.progress}%` }} /></div><div className="goal-bottom"><small>{formatCurrency(Number(goal.current || 0))} saved</small><small>{formatCurrency(goal.remaining)} left</small></div></div>) : <div className="empty-state compact"><Target size={24} /><p>No savings goals yet.</p><small>Define a target to track progress.</small></div>}
            </div>
          </div>

          <div className="panel">
            <div className="panel-heading">
              <div><p className="eyebrow">GUIDANCE</p><h2>Smart suggestions</h2></div>
            </div>
            <div className="insight-list">
              {aiInsights.map((item, index) => <div className="insight-bullet" key={index}><span className="tip-dot" /> <p>{item}</p></div>)}
            </div>
          </div>
        </section>
      </>}

      {view === "expenses" && <section className="panel expense-panel"><div className="panel-heading"><div><p className="eyebrow">TRANSACTION LOG</p><h2>All expenses</h2></div><div className="search-box"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, category, note" /></div></div><ExpenseList expenses={filteredExpenses} onEdit={editExpense} onDelete={deleteExpense} /></section>}

      {view === "budgets" && <BudgetSettings />}

      {view === "reports" && <>
        <section className="report-hero report-hero-enhanced"><div className="report-hero-copy"><p className="eyebrow">FINANCIAL SUMMARY / 01</p><h2>{new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</h2><p>See the rhythm behind your spending and make your next month more intentional.</p></div><div className="report-hero-side"><div className="report-total"><span>Total tracked</span><strong>{formatCurrency(total)}</strong><small>{expenses.length} transactions analyzed</small></div><button className="report-download-button" onClick={downloadReport}><Download size={18} /> Download PDF <ArrowUpRight size={16} /></button></div></section>
        <section className="report-grid report-grid-enhanced">
          <div className="category-list report-category-panel"><div className="report-panel-heading"><div><p className="eyebrow">CATEGORY BREAKDOWN</p><h2>Where your money goes</h2></div><span className="report-count">{categorySummary.length} lanes</span></div>{categorySummary.length ? categorySummary.map(([category, totalValue], index) => <div className="category-row report-category-row" style={{ "--row-index": index }} key={category}><span>{category}</span><div className="category-bar"><i style={{ width: `${Math.min(100, (totalValue / Math.max(total, 1)) * 100)}%` }} /></div><strong>{formatCurrency(totalValue)}</strong></div>) : <div className="report-empty">Add expenses to reveal your spending pattern.</div>}</div>
          <div className="report-insight report-insight-enhanced"><div className="report-insight-orbit" /><p className="eyebrow">INSIGHT / 02</p><h2>Smart summary</h2><p>{topCategory ? `Your biggest spending lane is ${topCategory[0]}, accounting for ${Math.round((topCategory[1] / Math.max(total, 1)) * 100)}% of this total.` : "No spending data yet — your summary will appear once you add transactions."}</p><div className="report-stat-stack"><div className="mini-stat"><span>Average spent</span><strong>{formatCurrency(expenses.length ? total / expenses.length : 0)}</strong></div><div className="mini-stat"><span>Monthly spending</span><strong>{formatCurrency(thisMonth)}</strong></div></div></div>
        </section>
      </>}

      {modal && <div className="modal-backdrop" onClick={() => { setModal(false); setEditingId(null); setForm(emptyForm); }}><div className="expense-modal" onClick={(event) => event.stopPropagation()}><button className="close-modal" onClick={() => { setModal(false); setEditingId(null); setForm(emptyForm); }}><X size={18} /></button><p className="eyebrow">{editingId ? "UPDATE" : "NEW"}</p><h2>{editingId ? "Edit expense" : "Add expense"}</h2><form onSubmit={addExpense} className="expense-form"><div className="form-row"><label>Title<input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Groceries" /></label><label>Amount<input type="number" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} placeholder="0" min="0" /></label></div><div className="form-row"><label>Category<select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>{availableCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label><label>Date<input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} /></label></div><label>Description<textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Optional note" rows="3" /></label>{error && <p className="error-message">{error}</p>}<button className="primary-button" type="submit">{editingId ? "Save changes" : "Add transaction"}</button></form></div></div>}
    </main>
  </div>;
}

function ExpenseList({ expenses, onEdit, onDelete }) {
  if (!expenses.length) return <div className="empty-state"><Receipt size={28} /><p>No expenses here yet.</p><small>Your transactions will appear here once you add them.</small></div>;

  return <><SpendingVisuals expenses={expenses} /><div className="expense-list">{expenses.map((expense) => <div className="expense-row" key={expense._id}><div className="expense-icon"><Receipt size={17} /></div><div className="expense-info"><strong>{expense.title}</strong><span>{expense.category} · {new Date(expense.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span></div><strong className="expense-amount">{formatCurrency(expense.amount)}</strong><div className="row-actions"><button onClick={() => onEdit?.(expense)} aria-label={`Edit ${expense.title}`}><Pencil size={15} /></button><button onClick={() => onDelete?.(expense._id)} aria-label={`Delete ${expense.title}`}><Trash2 size={15} /></button></div></div>)}</div></>;
}

export default App;
