import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, TrendingUp, TrendingDown, Calendar, 
  DollarSign, PieChart, BarChart3, Sparkles, Target,
  Filter, Download, Settings, Bell, Search, X, ChevronRight, LogOut
} from 'lucide-react';
import './App.css';
import './DarkMode.css';  // ✅ NEW: Import dark mode styles
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
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [dateRange, setDateRange] = useState(30);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const API_BASE = 'http://localhost:5000/api';

  // Check for saved user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Fetch categories when user is set
  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  // Fetch expenses when date range or categories change
  useEffect(() => {
    if (user && categories.length > 0) {
      fetchExpenses();
      fetchBudgets();
    }
  }, [dateRange, categories, user]);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setExpenses([]);
    setBudgets([]);
    setCategories([]);
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      showNotification('Failed to load categories', 'error');
    }
  };

  const fetchExpenses = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/expenses?user_id=${user.id}&days=${dateRange}`);
      const data = await response.json();
      if (data.success) {
        setExpenses(data.data);
      }
    } catch (error) {
      showNotification('Failed to load expenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchBudgets = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${API_BASE}/budgets/status?user_id=${user.id}`);
      const data = await response.json();
      if (data.success) {
        setBudgets(data.data.budgets || []);
      }
    } catch (error) {
      console.error('Failed to load budgets');
    }
  };

  const handleExpenseAdded = () => {
    fetchExpenses();
    fetchBudgets();
    setShowExpenseForm(false);
    showNotification('Expense added successfully!', 'success');
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ✅ NEW: Handle alert dismissal
  const handleAlertDismiss = (alertId) => {
    console.log('Alert dismissed:', alertId);
  };

  // ✅ NEW: Generate sample notifications from expenses and budgets
  const generateNotifications = () => {
    const notifications = [];
    
    // Budget alerts
    budgets.forEach(budget => {
      if (budget.percentage_used > 90) {
        notifications.push({
          id: `budget-${budget.budget_id}`,
          type: 'warning',
          title: 'Budget Alert',
          message: `${budget.category_name}: ${budget.percentage_used.toFixed(0)}% used (${budget.remaining < 0 ? 'Over by' : 'Remaining'} $${Math.abs(budget.remaining).toFixed(2)})`,
          time: 'Just now',
          read: false
        });
      }
    });

    // Recent expense alert
    if (expenses.length > 0) {
      const recentExpense = expenses[0];
      if (recentExpense) {
        notifications.push({
          id: 'recent-expense',
          type: 'info',
          title: 'Recent Expense',
          message: `Added: ${recentExpense.description || 'Expense'} - $${recentExpense.amount}`,
          time: new Date(recentExpense.date).toLocaleDateString(),
          read: true
        });
      }
    }

    // Success message if under budget
    const overBudgetCount = budgets.filter(b => b.is_exceeded).length;
    if (budgets.length > 0 && overBudgetCount === 0) {
      notifications.push({
        id: 'budget-success',
        type: 'success',
        title: 'Great Job!',
        message: 'All budgets are on track this month',
        time: '1 day ago',
        read: true
      });
    }

    return notifications;
  };

  // Show auth screen if not logged in
  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const avgDaily = totalSpent / dateRange;

  return (
    <div className="app">
      {/* Animated Background */}
      <div className="background-pattern"></div>
      <div className="gradient-orb orb-1"></div>
      <div className="gradient-orb orb-2"></div>
      <div className="gradient-orb orb-3"></div>

      {/* Notification Toast */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo">
              <Sparkles size={28} />
            </div>
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
                <span className="stat-value">${totalSpent.toFixed(2)}</span>
              </div>
            </div>
            <div className="stat-card mini">
              <Calendar size={18} />
              <div>
                <span className="stat-label">Daily Avg</span>
                <span className="stat-value">${avgDaily.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="header-actions">
            {/* ✅ NEW: Dark Mode Toggle */}
            <DarkModeToggle />
            
            {/* Existing Dashboard Header */}
            <DashboardHeader 
              user={user}
              notifications={generateNotifications()}
              onLogout={handleLogout}
              onClearNotifications={() => {
                showNotification('Notifications cleared', 'success');
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Navigation */}
      <nav className="main-nav">
        <div className="nav-content">
          <div className="nav-tabs">
            <button 
              className={`nav-tab ${activeView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveView('dashboard')}
            >
              <PieChart size={20} />
              <span>Dashboard</span>
            </button>
            <button 
              className={`nav-tab ${activeView === 'expenses' ? 'active' : ''}`}
              onClick={() => setActiveView('expenses')}
            >
              <DollarSign size={20} />
              <span>Expenses</span>
            </button>
            <button 
              className={`nav-tab ${activeView === 'budgets' ? 'active' : ''}`}
              onClick={() => setActiveView('budgets')}
            >
              <Target size={20} />
              <span>Budgets</span>
            </button>
            <button 
              className={`nav-tab ${activeView === 'predictions' ? 'active' : ''}`}
              onClick={() => setActiveView('predictions')}
            >
              <TrendingUp size={20} />
              <span>Predictions</span>
            </button>
          </div>

          <div className="nav-actions">
            <select 
              className="date-filter"
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value))}
            >
              <option value={7}>Last 7 Days</option>
              <option value={15}>Last 15 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={60}>Last 60 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>

            <button 
              className="btn-primary"
              onClick={() => setShowExpenseForm(true)}
            >
              <PlusCircle size={20} />
              <span>Add Expense</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {/* ✅ NEW: Budget Alerts - Show on all pages */}
        {budgets.length > 0 && (
          <BudgetAlerts 
            budgets={budgets}
            onDismiss={handleAlertDismiss}
          />
        )}

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your data...</p>
          </div>
        ) : (
          <>
            {activeView === 'dashboard' && (
              <Dashboard 
                expenses={expenses}
                budgets={budgets}
                categories={categories}
                dateRange={dateRange}
                userId={user.id}
                apiBase={API_BASE}
              />
            )}

            {activeView === 'expenses' && (
              <ExpenseList 
                expenses={expenses}
                categories={categories}
                onRefresh={fetchExpenses}
                apiBase={API_BASE}
              />
            )}

            {activeView === 'budgets' && (
              <BudgetView 
                budgets={budgets}
                categories={categories}
                userId={user.id}
                apiBase={API_BASE}
                onUpdate={fetchBudgets}
              />
            )}

            {activeView === 'predictions' && (
              <PredictionView 
                userId={user.id}
                apiBase={API_BASE}
                expenses={expenses}
              />
            )}
          </>
        )}
      </main>

      {/* Expense Form Modal */}
      {showExpenseForm && (
        <ExpenseForm 
          categories={categories}
          userId={user.id}
          apiBase={API_BASE}
          onClose={() => setShowExpenseForm(false)}
          onSuccess={handleExpenseAdded}
        />
      )}

      {/* Quick Action Button (FAB) */}
      <button 
        className="fab"
        onClick={() => setShowExpenseForm(true)}
        title="Quick Add Expense"
      >
        <PlusCircle size={24} />
      </button>
    </div>
  );
}

export default App;