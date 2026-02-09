import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, CheckCircle, Info, X, TrendingUp, TrendingDown,
  DollarSign, Calendar, Target, Zap, AlertCircle, Bell, BellOff
} from 'lucide-react';
import './BudgetAlerts.css';

function BudgetAlerts({ budgets, onDismiss, expenses = [] }) {
  const [alerts, setAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(true);
  const [filter, setFilter] = useState('all'); // all, critical, warning, info, success

  useEffect(() => {
    // Load dismissed alerts from localStorage
    const saved = localStorage.getItem('dismissedAlerts');
    if (saved) {
      setDismissedAlerts(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    generateAlerts();
  }, [budgets, expenses, dismissedAlerts]);

  const generateAlerts = () => {
    const newAlerts = [];
    const now = new Date();

    budgets.forEach(budget => {
      const percentage = budget.percentage_used || 0;
      const alertId = `budget-${budget.budget_id}-${budget.period}`;

      // Skip if already dismissed
      if (dismissedAlerts.includes(alertId)) return;

      const spent = budget.spent || 0;
      const budgeted = budget.budgeted || 0;
      const remaining = budget.remaining || 0;

      // Calculate days remaining in period
      const daysRemaining = calculateDaysRemaining(budget.period, budget.start_date);
      const dailyBudget = budgeted / getDaysInPeriod(budget.period);
      const dailySpending = spent / (getDaysInPeriod(budget.period) - daysRemaining);

      // Critical Alert - Over budget
      if (budget.is_exceeded) {
        newAlerts.push({
          id: alertId,
          type: 'critical',
          priority: 'high',
          icon: <AlertCircle size={24} />,
          title: `${budget.category_name} Budget Exceeded!`,
          message: `You've overspent by $${Math.abs(remaining).toFixed(2)}`,
          details: {
            spent: spent,
            budgeted: budgeted,
            percentage: percentage,
            overage: Math.abs(remaining),
            period: budget.period,
            daysRemaining: daysRemaining
          },
          action: 'Reduce spending immediately',
          budget: budget
        });
      }
      // Warning Alert - 90-100%
      else if (percentage >= 90) {
        const projectedOverage = (dailySpending * daysRemaining) - remaining;
        newAlerts.push({
          id: alertId,
          type: 'warning',
          priority: 'high',
          icon: <AlertTriangle size={24} />,
          title: `${budget.category_name} Budget Alert`,
          message: `Only $${remaining.toFixed(2)} remaining (${(100 - percentage).toFixed(0)}% left)`,
          details: {
            spent: spent,
            budgeted: budgeted,
            percentage: percentage,
            remaining: remaining,
            period: budget.period,
            daysRemaining: daysRemaining,
            dailyLimit: remaining / (daysRemaining || 1)
          },
          action: projectedOverage > 0 
            ? `Reduce spending by $${projectedOverage.toFixed(2)} to stay on track`
            : `Limit spending to $${(remaining / (daysRemaining || 1)).toFixed(2)}/day`,
          budget: budget
        });
      }
      // Info Alert - 75-89%
      else if (percentage >= 75) {
        newAlerts.push({
          id: alertId,
          type: 'info',
          priority: 'medium',
          icon: <Info size={24} />,
          title: `${budget.category_name} Budget Notice`,
          message: `${percentage.toFixed(0)}% used with ${daysRemaining} days left`,
          details: {
            spent: spent,
            budgeted: budgeted,
            percentage: percentage,
            remaining: remaining,
            period: budget.period,
            daysRemaining: daysRemaining,
            dailyAverage: dailySpending
          },
          action: `Stay under $${(remaining / (daysRemaining || 1)).toFixed(2)}/day`,
          budget: budget
        });
      }
      // Success Alert - Under 50%
      else if (percentage < 50 && spent > 0) {
        newAlerts.push({
          id: alertId,
          type: 'success',
          priority: 'low',
          icon: <CheckCircle size={24} />,
          title: `${budget.category_name} On Track!`,
          message: `Great job! You're doing well with ${percentage.toFixed(0)}% used`,
          details: {
            spent: spent,
            budgeted: budgeted,
            percentage: percentage,
            remaining: remaining,
            period: budget.period,
            daysRemaining: daysRemaining,
            savings: budgeted - (dailySpending * getDaysInPeriod(budget.period))
          },
          action: 'Keep up the good work!',
          budget: budget
        });
      }
    });

    // Sort by priority
    newAlerts.sort((a, b) => {
      const priority = { high: 0, medium: 1, low: 2 };
      return priority[a.priority] - priority[b.priority];
    });

    setAlerts(newAlerts);
  };

  const calculateDaysRemaining = (period, startDate) => {
    const periodDays = {
      'daily': 1,
      'weekly': 7,
      'monthly': 30,
      'yearly': 365
    };
    
    if (!startDate) return periodDays[period] || 30;
    
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + periodDays[period]);
    
    const now = new Date();
    const remaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    
    return Math.max(0, remaining);
  };

  const getDaysInPeriod = (period) => {
    const days = {
      'daily': 1,
      'weekly': 7,
      'monthly': 30,
      'yearly': 365
    };
    return days[period] || 30;
  };

  const handleDismiss = (alertId) => {
    const newDismissed = [...dismissedAlerts, alertId];
    setDismissedAlerts(newDismissed);
    localStorage.setItem('dismissedAlerts', JSON.stringify(newDismissed));
    setAlerts(alerts.filter(a => a.id !== alertId));
    
    if (onDismiss) {
      onDismiss(alertId);
    }
  };

  const handleDismissAll = () => {
    const allIds = alerts.map(a => a.id);
    const newDismissed = [...dismissedAlerts, ...allIds];
    setDismissedAlerts(newDismissed);
    localStorage.setItem('dismissedAlerts', JSON.stringify(newDismissed));
    setAlerts([]);
  };

  const handleClearDismissed = () => {
    setDismissedAlerts([]);
    localStorage.removeItem('dismissedAlerts');
    generateAlerts();
  };

  const toggleAlerts = () => {
    setShowAlerts(!showAlerts);
  };

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(a => a.type === filter);

  const alertCounts = {
    all: alerts.length,
    critical: alerts.filter(a => a.type === 'critical').length,
    warning: alerts.filter(a => a.type === 'warning').length,
    info: alerts.filter(a => a.type === 'info').length,
    success: alerts.filter(a => a.type === 'success').length
  };

  if (alerts.length === 0 && dismissedAlerts.length === 0) return null;

  return (
    <div className="budget-alerts-container">
      {/* Header */}
      <div className="alerts-header">
        <div className="alerts-header-left">
          <div className="alerts-title-wrapper">
            <Bell size={24} className="alerts-title-icon" />
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
            <button 
              className="btn-header-action"
              onClick={handleClearDismissed}
              title="Show dismissed alerts"
            >
              <BellOff size={18} />
              <span>Show Dismissed</span>
            </button>
          )}
          {alerts.length > 1 && (
            <button 
              className="btn-header-action dismiss"
              onClick={handleDismissAll}
            >
              <X size={18} />
              <span>Dismiss All</span>
            </button>
          )}
          <button 
            className={`btn-header-action toggle ${!showAlerts ? 'collapsed' : ''}`}
            onClick={toggleAlerts}
          >
            {showAlerts ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {/* Filters */}
      {showAlerts && alerts.length > 0 && (
        <div className="alerts-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <span>All</span>
            <span className="filter-count">{alertCounts.all}</span>
          </button>
          {alertCounts.critical > 0 && (
            <button 
              className={`filter-btn critical ${filter === 'critical' ? 'active' : ''}`}
              onClick={() => setFilter('critical')}
            >
              <span>Critical</span>
              <span className="filter-count">{alertCounts.critical}</span>
            </button>
          )}
          {alertCounts.warning > 0 && (
            <button 
              className={`filter-btn warning ${filter === 'warning' ? 'active' : ''}`}
              onClick={() => setFilter('warning')}
            >
              <span>Warning</span>
              <span className="filter-count">{alertCounts.warning}</span>
            </button>
          )}
          {alertCounts.info > 0 && (
            <button 
              className={`filter-btn info ${filter === 'info' ? 'active' : ''}`}
              onClick={() => setFilter('info')}
            >
              <span>Info</span>
              <span className="filter-count">{alertCounts.info}</span>
            </button>
          )}
          {alertCounts.success > 0 && (
            <button 
              className={`filter-btn success ${filter === 'success' ? 'active' : ''}`}
              onClick={() => setFilter('success')}
            >
              <span>Success</span>
              <span className="filter-count">{alertCounts.success}</span>
            </button>
          )}
        </div>
      )}

      {/* Alerts List */}
      {showAlerts && (
        <div className="alerts-list">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert, index) => (
              <div 
                key={alert.id}
                className={`budget-alert ${alert.type} priority-${alert.priority}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Alert Icon */}
                <div className="alert-icon-wrapper">
                  {alert.icon}
                </div>

                {/* Alert Content */}
                <div className="alert-content">
                  {/* Title & Message */}
                  <div className="alert-header-section">
                    <h4 className="alert-title">{alert.title}</h4>
                    <span className={`priority-badge ${alert.priority}`}>
                      {alert.priority}
                    </span>
                  </div>
                  <p className="alert-message">{alert.message}</p>

                  {/* Details Grid */}
                  <div className="alert-details-grid">
                    <div className="detail-item">
                      <DollarSign size={14} />
                      <div>
                        <span className="detail-label">Spent</span>
                        <span className="detail-value">${alert.details.spent?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <Target size={14} />
                      <div>
                        <span className="detail-label">Budget</span>
                        <span className="detail-value">${alert.details.budgeted?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <Calendar size={14} />
                      <div>
                        <span className="detail-label">Days Left</span>
                        <span className="detail-value">{alert.details.daysRemaining || 0}</span>
                      </div>
                    </div>
                    {alert.details.dailyLimit && (
                      <div className="detail-item">
                        <TrendingDown size={14} />
                        <div>
                          <span className="detail-label">Daily Limit</span>
                          <span className="detail-value">${alert.details.dailyLimit.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="alert-progress-wrapper">
                    <div className="alert-progress-bar">
                      <div 
                        className="alert-progress-fill"
                        style={{ 
                          width: `${Math.min(alert.details.percentage, 100)}%`
                        }}
                      >
                        <span className="progress-percentage">
                          {alert.details.percentage?.toFixed(0) || 0}%
                        </span>
                      </div>
                    </div>
                    <div className="alert-progress-labels">
                      <span className="progress-label left">
                        ${alert.details.spent?.toFixed(0) || 0}
                      </span>
                      <span className="progress-label right">
                        ${alert.details.budgeted?.toFixed(0) || 0}
                      </span>
                    </div>
                  </div>

                  {/* Action Suggestion */}
                  {alert.action && (
                    <div className="alert-action">
                      <Zap size={14} />
                      <span>{alert.action}</span>
                    </div>
                  )}
                </div>

                {/* Dismiss Button */}
                <button 
                  className="btn-dismiss-alert"
                  onClick={() => handleDismiss(alert.id)}
                  aria-label="Dismiss alert"
                  title="Dismiss this alert"
                >
                  <X size={18} />
                </button>
              </div>
            ))
          ) : (
            <div className="no-alerts">
              <div className="no-alerts-icon">
                {filter === 'all' ? <Bell size={48} /> : <Info size={48} />}
              </div>
              <p>No {filter !== 'all' ? filter : ''} alerts to display</p>
              {filter !== 'all' && (
                <button 
                  className="btn-show-all"
                  onClick={() => setFilter('all')}
                >
                  Show All Alerts
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Summary Stats */}
      {showAlerts && alerts.length > 0 && (
        <div className="alerts-summary">
          <div className="summary-stat critical">
            <AlertCircle size={16} />
            <span>{alertCounts.critical} Critical</span>
          </div>
          <div className="summary-stat warning">
            <AlertTriangle size={16} />
            <span>{alertCounts.warning} Warnings</span>
          </div>
          <div className="summary-stat success">
            <CheckCircle size={16} />
            <span>{alertCounts.success} On Track</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default BudgetAlerts;