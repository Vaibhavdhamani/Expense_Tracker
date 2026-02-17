import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, CheckCircle, Info, X, TrendingUp, TrendingDown,
  DollarSign, Calendar, Target, Zap, AlertCircle, Bell, BellOff,
  ChevronDown, ChevronUp
} from 'lucide-react';
import './BudgetAlerts.css';

function BudgetAlerts({ budgets = [], onDismiss, expenses = [] }) {
  const [alerts, setAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const saved = localStorage.getItem('dismissedAlerts');
    if (saved) {
      try {
        setDismissedAlerts(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading dismissed alerts:', e);
      }
    }
  }, []);

  const calculateDaysRemaining = useCallback((period, startDate) => {
    const periodDays = { 'daily': 1, 'weekly': 7, 'monthly': 30, 'yearly': 365 };
    if (!startDate) return periodDays[period] || 30;
    try {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + periodDays[period]);
      const now = new Date();
      const remaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      return Math.max(0, remaining);
    } catch (e) {
      return periodDays[period] || 30;
    }
  }, []);

  const getDaysInPeriod = useCallback((period) => {
    const days = { 'daily': 1, 'weekly': 7, 'monthly': 30, 'yearly': 365 };
    return days[period] || 30;
  }, []);

  const generateAlerts = useCallback(() => {
    if (!budgets || budgets.length === 0) { setAlerts([]); return; }

    const newAlerts = [];

    budgets.forEach(budget => {
      const percentage = budget.percentage_used || 0;
      const alertId = `budget-${budget.budget_id}-${budget.period}`;
      if (dismissedAlerts.includes(alertId)) return;

      const spent = budget.spent || 0;
      const budgeted = budget.budgeted || 0;
      const remaining = budget.remaining || 0;
      const daysRemaining = calculateDaysRemaining(budget.period, budget.start_date);
      const totalDays = getDaysInPeriod(budget.period);
      const daysElapsed = totalDays - daysRemaining;
      const dailySpending = daysElapsed > 0 ? spent / daysElapsed : 0;

      if (budget.is_exceeded) {
        newAlerts.push({
          id: alertId, type: 'critical', priority: 'high',
          icon: <AlertCircle size={24} />,
          title: `${budget.category_name} Budget Exceeded!`,
          message: `You've overspent by ₹${Math.abs(remaining).toFixed(2)}`,
          details: { spent, budgeted, percentage, remaining: Math.abs(remaining), period: budget.period, daysRemaining, categoryIcon: budget.category_icon || '💰', categoryColor: budget.category_color || '#8b5cf6' },
          action: 'Reduce spending immediately', budget
        });
      } else if (percentage >= 90) {
        newAlerts.push({
          id: alertId, type: 'warning', priority: 'high',
          icon: <AlertTriangle size={24} />,
          title: `${budget.category_name} Budget Alert`,
          message: `Only ₹${remaining.toFixed(2)} left (${(100 - percentage).toFixed(0)}% remaining)`,
          details: { spent, budgeted, percentage, remaining, period: budget.period, daysRemaining, dailyLimit: daysRemaining > 0 ? remaining / daysRemaining : 0, categoryIcon: budget.category_icon || '⚠️', categoryColor: budget.category_color || '#f59e0b' },
          action: `Limit spending to ₹${(remaining / (daysRemaining || 1)).toFixed(2)}/day`, budget
        });
      } else if (percentage >= 75) {
        newAlerts.push({
          id: alertId, type: 'info', priority: 'medium',
          icon: <Info size={24} />,
          title: `${budget.category_name} Budget Notice`,
          message: `${percentage.toFixed(0)}% used with ${daysRemaining} days left`,
          details: { spent, budgeted, percentage, remaining, period: budget.period, daysRemaining, dailyAverage: dailySpending, categoryIcon: budget.category_icon || 'ℹ️', categoryColor: budget.category_color || '#3b82f6' },
          action: `Stay under ₹${(remaining / (daysRemaining || 1)).toFixed(2)}/day`, budget
        });
      } else if (percentage < 50 && spent > 0) {
        newAlerts.push({
          id: alertId, type: 'success', priority: 'low',
          icon: <CheckCircle size={24} />,
          title: `${budget.category_name} On Track!`,
          message: `Great job! Only ${percentage.toFixed(0)}% used`,
          details: { spent, budgeted, percentage, remaining, period: budget.period, daysRemaining, categoryIcon: budget.category_icon || '✅', categoryColor: budget.category_color || '#10b981' },
          action: 'Keep up the good work!', budget
        });
      }
    });

    newAlerts.sort((a, b) => {
      const priority = { high: 0, medium: 1, low: 2 };
      return priority[a.priority] - priority[b.priority];
    });

    setAlerts(newAlerts);
  }, [budgets, dismissedAlerts, calculateDaysRemaining, getDaysInPeriod]);

  useEffect(() => { generateAlerts(); }, [generateAlerts]);

  const handleDismiss = useCallback((alertId) => {
    const newDismissed = [...dismissedAlerts, alertId];
    setDismissedAlerts(newDismissed);
    localStorage.setItem('dismissedAlerts', JSON.stringify(newDismissed));
    setAlerts(prevAlerts => prevAlerts.filter(a => a.id !== alertId));
    if (onDismiss) onDismiss(alertId);
  }, [dismissedAlerts, onDismiss]);

  const handleDismissAll = useCallback(() => {
    const allIds = alerts.map(a => a.id);
    const newDismissed = [...dismissedAlerts, ...allIds];
    setDismissedAlerts(newDismissed);
    localStorage.setItem('dismissedAlerts', JSON.stringify(newDismissed));
    setAlerts([]);
  }, [alerts, dismissedAlerts]);

  const handleClearDismissed = useCallback(() => {
    setDismissedAlerts([]);
    localStorage.removeItem('dismissedAlerts');
  }, []);

  const toggleAlerts = useCallback(() => { setShowAlerts(prev => !prev); }, []);

  const filteredAlerts = filter === 'all' ? alerts : alerts.filter(a => a.type === filter);
  const alertCounts = {
    all: alerts.length,
    critical: alerts.filter(a => a.type === 'critical').length,
    warning:  alerts.filter(a => a.type === 'warning').length,
    info:     alerts.filter(a => a.type === 'info').length,
    success:  alerts.filter(a => a.type === 'success').length
  };

  const totalSpent    = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
  const totalBudgeted = budgets.reduce((sum, b) => sum + (b.budgeted || 0), 0);

  if (alerts.length === 0 && dismissedAlerts.length === 0) return null;

  return (
    <div className="budget-alerts-container">
      <div className="alerts-header">
        <div className="alerts-header-left">
          <div className="alerts-title-wrapper">
            <div className="bell-icon-animated"><Bell size={24} /></div>
            <div>
              <h3 className="alerts-title">Budget Alerts</h3>
              <span className="alerts-subtitle">
                {alerts.length} active alert{alerts.length !== 1 ? 's' : ''}
                {dismissedAlerts.length > 0 && ` • ${dismissedAlerts.length} dismissed`}
              </span>
            </div>
          </div>
        </div>
        <div className="alerts-header-right">
          {dismissedAlerts.length > 0 && (
            <button className="btn-header-action" onClick={handleClearDismissed}>
              <BellOff size={18} /><span>Show Dismissed</span>
            </button>
          )}
          {alerts.length > 1 && (
            <button className="btn-header-action dismiss" onClick={handleDismissAll}>
              <X size={18} /><span>Dismiss All</span>
            </button>
          )}
          <button className={`btn-header-action toggle ${!showAlerts ? 'collapsed' : ''}`} onClick={toggleAlerts}>
            {showAlerts ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {showAlerts && alerts.length > 0 && (
        <div className="alerts-filters">
          <button className={`filter-pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            <span>All</span><span className="filter-badge">{alertCounts.all}</span>
          </button>
          {alertCounts.critical > 0 && (
            <button className={`filter-pill critical ${filter === 'critical' ? 'active' : ''}`} onClick={() => setFilter('critical')}>
              <AlertCircle size={14} /><span>Critical</span><span className="filter-badge">{alertCounts.critical}</span>
            </button>
          )}
          {alertCounts.warning > 0 && (
            <button className={`filter-pill warning ${filter === 'warning' ? 'active' : ''}`} onClick={() => setFilter('warning')}>
              <AlertTriangle size={14} /><span>Warning</span><span className="filter-badge">{alertCounts.warning}</span>
            </button>
          )}
          {alertCounts.info > 0 && (
            <button className={`filter-pill info ${filter === 'info' ? 'active' : ''}`} onClick={() => setFilter('info')}>
              <Info size={14} /><span>Info</span><span className="filter-badge">{alertCounts.info}</span>
            </button>
          )}
          {alertCounts.success > 0 && (
            <button className={`filter-pill success ${filter === 'success' ? 'active' : ''}`} onClick={() => setFilter('success')}>
              <CheckCircle size={14} /><span>Success</span><span className="filter-badge">{alertCounts.success}</span>
            </button>
          )}
        </div>
      )}

      {showAlerts && alerts.length > 0 && totalBudgeted > 0 && (
        <div className="alerts-overview">
          <div className="overview-stat">
            <div className="stat-icon spent"><DollarSign size={16} /></div>
            <div className="stat-content">
              <span className="stat-label">Spent</span>
              <span className="stat-value">₹{totalSpent.toFixed(2)}</span>
            </div>
          </div>
          <div className="overview-stat">
            <div className="stat-icon budget"><Target size={16} /></div>
            <div className="stat-content">
              <span className="stat-label">Budget</span>
              <span className="stat-value">₹{totalBudgeted.toFixed(2)}</span>
            </div>
          </div>
          <div className="overview-stat">
            <div className="stat-icon days"><Calendar size={16} /></div>
            <div className="stat-content">
              <span className="stat-label">Days Left</span>
              <span className="stat-value">{alerts[0]?.details?.daysRemaining || 0}</span>
            </div>
          </div>
        </div>
      )}

      {showAlerts && (
        <div className="alerts-list-enhanced">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert, index) => (
              <div key={alert.id} className={`alert-card-modern ${alert.type}`} style={{ animationDelay: `${index * 0.05}s` }}>
                <div className="alert-card-header">
                  <div className="alert-category-badge" style={{ background: alert.details.categoryColor }}>
                    <span className="category-emoji">{alert.details.categoryIcon}</span>
                  </div>
                  <div className="alert-header-info">
                    <h4 className="alert-card-title">{alert.title}</h4>
                    <p className="alert-card-message">{alert.message}</p>
                  </div>
                  <button className="btn-dismiss-modern" onClick={() => handleDismiss(alert.id)} aria-label="Dismiss">
                    <X size={18} />
                  </button>
                </div>

                <div className="alert-progress-modern">
                  <div className="progress-header">
                    <span className="progress-label">{alert.details.percentage?.toFixed(0) || 0}% Used</span>
                    <span className="progress-amount">₹{alert.details.spent?.toFixed(2)} / ₹{alert.details.budgeted?.toFixed(2)}</span>
                  </div>
                  <div className="progress-bar-modern">
                    <div className={`progress-fill-modern ${alert.type}`} style={{ width: `${Math.min(alert.details.percentage || 0, 100)}%` }}></div>
                  </div>
                </div>

                <div className="alert-stats-grid">
                  <div className="stat-mini">
                    <DollarSign size={12} className="stat-mini-icon" />
                    <div>
                      <span className="stat-mini-label">Remaining</span>
                      <span className="stat-mini-value">₹{alert.details.remaining?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                  <div className="stat-mini">
                    <Calendar size={12} className="stat-mini-icon" />
                    <div>
                      <span className="stat-mini-label">Days Left</span>
                      <span className="stat-mini-value">{alert.details.daysRemaining || 0}</span>
                    </div>
                  </div>
                  {alert.details.dailyLimit > 0 && (
                    <div className="stat-mini">
                      <TrendingDown size={12} className="stat-mini-icon" />
                      <div>
                        <span className="stat-mini-label">Daily Limit</span>
                        <span className="stat-mini-value">₹{alert.details.dailyLimit.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {alert.action && (
                  <div className={`alert-action-modern ${alert.type}`}>
                    <Zap size={14} />
                    <span>{alert.action}</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-alerts-modern">
              <div className="no-alerts-icon-wrapper">
                {filter === 'all' ? <Bell size={48} /> : <Info size={48} />}
              </div>
              <p className="no-alerts-text">No {filter !== 'all' ? filter : ''} alerts</p>
              {filter !== 'all' && (
                <button className="btn-show-all-modern" onClick={() => setFilter('all')}>Show All Alerts</button>
              )}
            </div>
          )}
        </div>
      )}

      {showAlerts && alerts.length > 0 && (
        <div className="alerts-bottom-summary">
          <div className={`summary-badge critical ${alertCounts.critical === 0 ? 'zero' : ''}`}>
            <AlertCircle size={14} /><span>{alertCounts.critical} Critical</span>
          </div>
          <div className={`summary-badge warning ${alertCounts.warning === 0 ? 'zero' : ''}`}>
            <AlertTriangle size={14} /><span>{alertCounts.warning} Warnings</span>
          </div>
          <div className={`summary-badge success ${alertCounts.success === 0 ? 'zero' : ''}`}>
            <CheckCircle size={14} /><span>{alertCounts.success} On Track</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default BudgetAlerts;