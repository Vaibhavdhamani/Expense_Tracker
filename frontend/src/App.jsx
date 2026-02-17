import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, TrendingUp, TrendingDown, Calendar, 
  DollarSign, PieChart, BarChart3, Sparkles, Target,
  Filter, Download, Settings, Bell, Search, X, ChevronRight, LogOut
} from 'lucide-react';
import './App.css';
import './DarkMode.css';
import Auth from './auth/Auth';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import Dashboard from './components/Dashboard';
import BudgetView from './components/BudgetView';
import PredictionView from './components/PredictionView';
import DashboardHeader from './components/DashboardHeader';
import BudgetAlerts from './components/BudgetAlerts';
import DarkModeToggle from './components/DarkModeToggle';

function App() {
  const [user, setUser]                   = useState(null);
  const [activeView, setActiveView]       = useState('dashboard');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [categories, setCategories]       = useState([]);
  const [expenses, setExpenses]           = useState([]);
  const [budgets, setBudgets]             = useState([]);
  const [dateRange, setDateRange]         = useState(30);
  const [loading, setLoading]             = useState(false);
  const [notification, setNotification]   = useState(null);

  const API_BASE = 'http://localhost:5000/api';

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => { if (user) fetchCategories(); }, [user]);

  useEffect(() => {
    if (user && categories.length > 0) { fetchExpenses(); fetchBudgets(); }
  }, [dateRange, categories, user]);

  const handleLogin  = (userData) => setUser(userData);
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null); setExpenses([]); setBudgets([]); setCategories([]);
  };

  const fetchCategories = async () => {
    try {
      const res  = await fetch(`${API_BASE}/categories`);
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch { showNotification('Failed to load categories', 'error'); }
  };

  const fetchExpenses = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/expenses?user_id=${user.id}&days=${dateRange}`);
      const data = await res.json();
      if (data.success) setExpenses(data.data);
    } catch { showNotification('Failed to load expenses', 'error'); }
    finally { setLoading(false); }
  };

  const fetchBudgets = async () => {
    if (!user) return;
    try {
      const res  = await fetch(`${API_BASE}/budgets/status?user_id=${user.id}`);
      const data = await res.json();
      if (data.success) setBudgets(data.data.budgets || []);
    } catch { console.error('Failed to load budgets'); }
  };

  const handleExpenseAdded = () => {
    fetchExpenses(); fetchBudgets();
    setShowExpenseForm(false);
    showNotification('Expense added successfully!', 'success');
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAlertDismiss = (alertId) => console.log('Alert dismissed:', alertId);

  const generateNotifications = () => {
    const notifications = [];
    budgets.forEach(budget => {
      if (budget.percentage_used > 90) {
        notifications.push({
          id: `budget-${budget.budget_id}`, type: 'warning', title: 'Budget Alert',
          message: `${budget.category_name}: ${budget.percentage_used.toFixed(0)}% used (${budget.remaining < 0 ? 'Over by' : 'Remaining'} ₹${Math.abs(budget.remaining).toFixed(2)})`,
          time: 'Just now', read: false
        });
      }
    });
    if (expenses.length > 0) {
      const recentExpense = expenses[0];
      notifications.push({
        id: 'recent-expense', type: 'info', title: 'Recent Expense',
        message: `Added: ${recentExpense.description || 'Expense'} - ₹${recentExpense.amount}`,
        time: new Date(recentExpense.date).toLocaleDateString(), read: true
      });
    }
    if (budgets.length > 0 && budgets.filter(b => b.is_exceeded).length === 0) {
      notifications.push({ id: 'budget-success', type: 'success', title: 'Great Job!', message: 'All budgets are on track this month', time: '1 day ago', read: true });
    }
    return notifications;
  };

  if (!user) return <Auth onLogin={handleLogin} />;

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const avgDaily   = totalSpent / dateRange;

  return (
    <div className="app">
      <div className="background-pattern"></div>
      <div className="gradient-orb orb-1"></div>
      <div className="gradient-orb orb-2"></div>
      <div className="gradient-orb orb-3"></div>

      {notification && (
        <div className={`notification ${notification.type}`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)}><X size={16} /></button>
        </div>
      )}

      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo"><Sparkles size={28} /></div>
            <div>
              <h1 className="app-title">ExpenseFlow</h1>
              <p className="app-subtitle">Welcome, {user.username}!</p>
            </div>
          </div>

          <div className="header-stats">
            <div className="stat-card mini">
              <TrendingUp size={18} />
              <div>
                <span className="stat-label">Period Spent</span>
                <span className="stat-value">₹{totalSpent.toFixed(2)}</span>    {/* ← ₹ */}
              </div>
            </div>
            <div className="stat-card mini">
              <Calendar size={18} />
              <div>
                <span className="stat-label">Daily Avg</span>
                <span className="stat-value">₹{avgDaily.toFixed(2)}</span>      {/* ← ₹ */}
              </div>
            </div>
          </div>

          <div className="header-actions">
            <DarkModeToggle />
            <DashboardHeader 
              user={user}
              notifications={generateNotifications()}
              onLogout={handleLogout}
              onClearNotifications={() => showNotification('Notifications cleared', 'success')}
            />
          </div>
        </div>
      </header>

      <nav className="main-nav">
        <div className="nav-content">
          <div className="nav-tabs">
            {[
              { key: 'dashboard',   icon: <PieChart size={20} />,    label: 'Dashboard'   },
              { key: 'expenses',    icon: <DollarSign size={20} />,  label: 'Expenses'    },
              { key: 'budgets',     icon: <Target size={20} />,      label: 'Budgets'     },
              { key: 'predictions', icon: <TrendingUp size={20} />,  label: 'Predictions' },
            ].map(({ key, icon, label }) => (
              <button key={key} className={`nav-tab ${activeView === key ? 'active' : ''}`} onClick={() => setActiveView(key)}>
                {icon}<span>{label}</span>
              </button>
            ))}
          </div>
          <div className="nav-actions">
            <select className="date-filter" value={dateRange} onChange={(e) => setDateRange(Number(e.target.value))}>
              <option value={7}>Last 7 Days</option>
              <option value={15}>Last 15 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={60}>Last 60 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
            <button className="btn-primary" onClick={() => setShowExpenseForm(true)}>
              <PlusCircle size={20} /><span>Add Expense</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {budgets.length > 0 && <BudgetAlerts budgets={budgets} onDismiss={handleAlertDismiss} />}

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your data...</p>
          </div>
        ) : (
          <>
            {activeView === 'dashboard'   && <Dashboard    expenses={expenses} budgets={budgets} categories={categories} dateRange={dateRange} userId={user.id} apiBase={API_BASE} />}
            {activeView === 'expenses'    && <ExpenseList  expenses={expenses} categories={categories} onRefresh={fetchExpenses} apiBase={API_BASE} />}
            {activeView === 'budgets'     && <BudgetView   budgets={budgets} categories={categories} userId={user.id} apiBase={API_BASE} onUpdate={fetchBudgets} />}
            {activeView === 'predictions' && <PredictionView userId={user.id} apiBase={API_BASE} expenses={expenses} />}
          </>
        )}
      </main>

      {showExpenseForm && (
        <ExpenseForm categories={categories} userId={user.id} apiBase={API_BASE}
          onClose={() => setShowExpenseForm(false)} onSuccess={handleExpenseAdded} />
      )}

      <button className="fab" onClick={() => setShowExpenseForm(true)} title="Quick Add Expense">
        <PlusCircle size={24} />
      </button>
    </div>
  );
}

export default App;