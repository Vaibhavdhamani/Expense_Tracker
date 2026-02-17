import React, { useState } from 'react';
import { Target, TrendingUp, AlertTriangle, Plus, X, Edit2, Trash2, Calendar, DollarSign } from 'lucide-react';
import './BudgetView.css';

function BudgetView({ budgets, categories, userId, apiBase, onUpdate }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    period: 'monthly',
    start_date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const resetForm = () => {
    setFormData({ category_id: '', amount: '', period: 'monthly', start_date: new Date().toISOString().split('T')[0] });
    setError(null);
  };

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const response = await fetch(`${apiBase}/budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, category_id: parseInt(formData.category_id), amount: parseFloat(formData.amount), period: formData.period, start_date: formData.start_date, is_active: true })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create budget');
      setShowCreateModal(false); resetForm(); onUpdate();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const response = await fetch(`${apiBase}/budgets/${editingBudget.budget_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(formData.amount), period: formData.period, start_date: formData.start_date })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update budget');
      setEditingBudget(null); resetForm(); onUpdate();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleDeleteBudget = async (budgetId) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;
    try {
      const response = await fetch(`${apiBase}/budgets/${budgetId}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete budget');
      onUpdate();
    } catch (err) { alert(`Error: ${err.message}`); }
  };

  const openEditModal = (budget) => {
    setEditingBudget(budget);
    setFormData({ category_id: budget.category_id, amount: budget.budgeted.toString(), period: budget.period, start_date: budget.start_date.split('T')[0] });
    setShowCreateModal(true);
  };

  const closeModal = () => { setShowCreateModal(false); setEditingBudget(null); resetForm(); };

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.budgeted, 0);
  const totalSpent    = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudgeted - totalSpent;

  return (
    <div className="budget-view">
      <div className="budget-header">
        <div>
          <h2 className="budget-title">Budget Overview</h2>
          <span className="budget-subtitle">{budgets.length} active budgets</span>
        </div>
        <button className="btn-create-budget" onClick={() => setShowCreateModal(true)}>
          <Plus size={20} /><span>Create Budget</span>
        </button>
      </div>

      {budgets.length > 0 && (
        <div className="budget-summary-cards">
          <div className="summary-card">
            <div className="summary-icon" style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
              <DollarSign size={24} color="#6366f1" />
            </div>
            <div className="summary-content">
              <span className="summary-label">Total Budget</span>
              <span className="summary-value">₹{totalBudgeted.toFixed(2)}</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
              <TrendingUp size={24} color="#8b5cf6" />
            </div>
            <div className="summary-content">
              <span className="summary-label">Total Spent</span>
              <span className="summary-value">₹{totalSpent.toFixed(2)}</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon" style={{ background: totalRemaining < 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)' }}>
              <Target size={24} color={totalRemaining < 0 ? '#ef4444' : '#10b981'} />
            </div>
            <div className="summary-content">
              <span className="summary-label">Remaining</span>
              <span className={`summary-value ${totalRemaining < 0 ? 'negative' : ''}`}>
                ₹{Math.abs(totalRemaining).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="budgets-grid">
        {budgets.map((budget, index) => {
          const isOverBudget = budget.is_exceeded;
          const percentage  = budget.percentage_used;
          return (
            <div key={budget.budget_id} className={`budget-card ${isOverBudget ? 'exceeded' : ''}`} style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="budget-card-header">
                <div className="budget-category-info">
                  <span className="budget-category-icon" style={{ background: budget.category_color }}>{budget.category_icon}</span>
                  <div>
                    <h3 className="budget-category-name">{budget.category_name}</h3>
                    <span className="budget-period"><Calendar size={12} />{budget.period}</span>
                  </div>
                </div>
                <div className="budget-actions">
                  {isOverBudget && <div className="budget-alert"><AlertTriangle size={18} /></div>}
                  <button className="btn-icon" onClick={() => openEditModal(budget)} title="Edit budget"><Edit2 size={16} /></button>
                  <button className="btn-icon danger" onClick={() => handleDeleteBudget(budget.budget_id)} title="Delete budget"><Trash2 size={16} /></button>
                </div>
              </div>

              <div className="budget-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min(percentage, 100)}%`, background: isOverBudget ? 'linear-gradient(90deg, #ef4444, #dc2626)' : 'linear-gradient(90deg, #8b5cf6, #6366f1)' }}></div>
                </div>
                <span className="progress-percentage">{percentage.toFixed(0)}%</span>
              </div>

              <div className="budget-amounts">
                <div className="budget-stat">
                  <span className="stat-label">Spent</span>
                  <span className="stat-value">₹{budget.spent.toFixed(2)}</span>
                </div>
                <div className="budget-stat">
                  <span className="stat-label">Budget</span>
                  <span className="stat-value">₹{budget.budgeted.toFixed(2)}</span>
                </div>
                <div className="budget-stat">
                  <span className="stat-label">Remaining</span>
                  <span className={`stat-value ${budget.remaining < 0 ? 'negative' : 'positive'}`}>
                    ₹{Math.abs(budget.remaining).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {budgets.length === 0 && (
          <div className="empty-budget-state">
            <div className="empty-icon-wrapper"><Target size={64} /></div>
            <h3>No budgets set up yet</h3>
            <p>Create budgets to track your spending limits and stay on top of your finances</p>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={20} /><span>Create Your First Budget</span>
            </button>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingBudget ? 'Edit Budget' : 'Create New Budget'}</h3>
              <button className="btn-close" onClick={closeModal}><X size={24} /></button>
            </div>
            <form onSubmit={editingBudget ? handleUpdateBudget : handleCreateBudget}>
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select id="category" value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} required disabled={editingBudget !== null}>
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="amount">Budget Amount *</label>
                <div className="input-with-icon">
                  <span>₹</span>
                  <input type="number" id="amount" placeholder="0.00" step="0.01" min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="period">Period *</label>
                <select id="period" value={formData.period} onChange={(e) => setFormData({ ...formData, period: e.target.value })} required>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="start_date">Start Date *</label>
                <div className="input-with-icon">
                  <Calendar size={18} />
                  <input type="date" id="start_date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required />
                </div>
              </div>
              {error && <div className="form-error"><AlertTriangle size={16} /><span>{error}</span></div>}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal} disabled={loading}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : editingBudget ? 'Update Budget' : 'Create Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BudgetView;