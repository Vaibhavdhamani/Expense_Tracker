// ============================================================
// FILE: ExpenseList.jsx   (only $ → ₹)
// ============================================================
import React from 'react';
import { Trash2, Edit, Calendar } from 'lucide-react';
import './ExpenseList.css';

function ExpenseList({ expenses, categories, onRefresh, apiBase }) {
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await fetch(`${apiBase}/expenses/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (error) {
      console.error('Failed to delete');
    }
  };

  return (
    <div className="expense-list">
      <div className="list-header">
        <h2 className="list-title">Recent Expenses</h2>
        <span className="list-count">{expenses.length} transactions</span>
      </div>
      <div className="expenses-container">
        {expenses.map((exp, index) => (
          <div key={exp.id} className="expense-item" style={{ animationDelay: `${index * 0.05}s` }}>
            <div className="expense-icon" style={{ background: exp.category?.color || '#6366f1' }}>
              {exp.category?.icon || '💰'}
            </div>
            <div className="expense-details">
              <div className="expense-primary">
                <span className="expense-description">{exp.description || 'No description'}</span>
                <span className="expense-amount">₹{exp.amount.toFixed(2)}</span>   {/* ← ₹ */}
              </div>
              <div className="expense-secondary">
                <span className="expense-category">{exp.category?.name || 'Unknown'}</span>
                <span className="expense-date">
                  <Calendar size={12} />
                  {new Date(exp.date).toLocaleDateString()}
                </span>
              </div>
            </div>
            <button className="expense-delete" onClick={() => handleDelete(exp.id)}>
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {expenses.length === 0 && (
          <div className="empty-state">
            <p>No expenses found for this period</p>
            <span>Start tracking by adding your first expense!</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExpenseList;