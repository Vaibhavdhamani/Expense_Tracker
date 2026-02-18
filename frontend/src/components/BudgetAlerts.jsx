import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle, CheckCircle, Info, X, TrendingUp, TrendingDown,
  Calendar, Target, Zap, AlertCircle, Bell, BellOff,
  ChevronDown, ChevronUp
} from 'lucide-react';
import './BudgetAlerts.css';

function BudgetAlerts({ budgets = [], onDismiss }) {
  const [alerts, setAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const saved = localStorage.getItem('dismissedAlerts');
    if (saved) setDismissedAlerts(JSON.parse(saved));
  }, []);

  const calculateDaysRemaining = (period) => {
    const map = { daily: 1, weekly: 7, monthly: 30, yearly: 365 };
    return map[period] || 30;
  };

  const generateAlerts = useCallback(() => {
    if (!budgets.length) return setAlerts([]);

    const list = [];

    budgets.forEach(budget => {
      const id = `budget-${budget.budget_id}-${budget.period}`;
      if (dismissedAlerts.includes(id)) return;

      const spent = budget.spent || 0;
      const budgeted = budget.budgeted || 0;
      const remaining = budgeted - spent;
      const percent = budgeted ? (spent / budgeted) * 100 : 0;
      const daysLeft = calculateDaysRemaining(budget.period);

      if (percent >= 100) {
        list.push({
          id,
          type: 'critical',
          title: `${budget.category_name} Budget Exceeded`,
          message: `Overspent by ₹${Math.abs(remaining).toFixed(2)}`,
          details: { spent, budgeted, remaining: Math.abs(remaining), percent, daysLeft }
        });
      } else if (percent >= 90) {
        list.push({
          id,
          type: 'warning',
          title: `${budget.category_name} Warning`,
          message: `Only ₹${remaining.toFixed(2)} left`,
          details: { spent, budgeted, remaining, percent, daysLeft }
        });
      } else if (percent >= 75) {
        list.push({
          id,
          type: 'info',
          title: `${budget.category_name} Notice`,
          message: `${percent.toFixed(0)}% used`,
          details: { spent, budgeted, remaining, percent, daysLeft }
        });
      } else {
        list.push({
          id,
          type: 'success',
          title: `${budget.category_name} On Track`,
          message: `Only ${percent.toFixed(0)}% used`,
          details: { spent, budgeted, remaining, percent, daysLeft }
        });
      }
    });

    setAlerts(list);
  }, [budgets, dismissedAlerts]);

  useEffect(() => { generateAlerts(); }, [generateAlerts]);

  const dismiss = (id) => {
    const updated = [...dismissedAlerts, id];
    setDismissedAlerts(updated);
    localStorage.setItem('dismissedAlerts', JSON.stringify(updated));
    setAlerts(prev => prev.filter(a => a.id !== id));
    onDismiss && onDismiss(id);
  };

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.type === filter);

  if (!alerts.length) return null;

  return (
    <div className="budget-alerts-container">

      {/* HEADER */}
      <div className="alerts-header">
        <div className="alerts-title-wrapper">
          <div className="bell-icon-animated"><Bell size={24} /></div>
          <div>
            <h3 className="alerts-title">Budget Alerts</h3>
            <span className="alerts-subtitle">{alerts.length} active</span>
          </div>
        </div>
        <button className="btn-header-action toggle" onClick={() => setShowAlerts(!showAlerts)}>
          {showAlerts ? <ChevronUp /> : <ChevronDown />}
        </button>
      </div>

      {/* ALERTS */}
      {showAlerts && (
        <div className="alerts-list-enhanced">
          {filtered.map(alert => (
            <div key={alert.id} className={`alert-card-modern ${alert.type}`}>
              <div className="alert-card-header">
                <div className="alert-header-info">
                  <h4 className="alert-card-title">{alert.title}</h4>
                  <p className="alert-card-message">{alert.message}</p>
                </div>
                <button className="btn-dismiss-modern" onClick={() => dismiss(alert.id)}>
                  <X size={16} />
                </button>
              </div>

              <div className="alert-progress-modern">
                <div className="progress-header">
                  <span>{alert.details.percent.toFixed(0)}% Used</span>
                  <span className="progress-amount">
                    ₹{alert.details.spent.toFixed(2)} / ₹{alert.details.budgeted.toFixed(2)}
                  </span>
                </div>
                <div className="progress-bar-modern">
                  <div
                    className={`progress-fill-modern ${alert.type}`}
                    style={{ width: `${Math.min(alert.details.percent, 100)}%` }}
                  />
                </div>
              </div>

              <div className={`alert-action-modern ${alert.type}`}>
                <Zap size={14} />
                <span>Remaining ₹{alert.details.remaining.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BudgetAlerts;
