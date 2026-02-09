import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, FileText, Tag } from 'lucide-react';
import './ExpenseForm.css';

function ExpenseForm({ categories, userId, apiBase, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    description: '',
    notes: '',
    date: new Date().toISOString().slice(0, 16)
  });
  const [standardDescriptions, setStandardDescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch standard descriptions when category changes
  useEffect(() => {
    if (formData.category_id) {
      fetchStandardDescriptions(formData.category_id);
    } else {
      setStandardDescriptions([]);
    }
  }, [formData.category_id]);

  const fetchStandardDescriptions = async (categoryId) => {
    try {
      const response = await fetch(`${apiBase}/categories/${categoryId}/descriptions`);
      const data = await response.json();
      if (data.success) {
        setStandardDescriptions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch descriptions');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.category_id) {
      newErrors.category_id = 'Please select a category';
    }
    
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }
    
    if (!formData.description) {
      newErrors.description = 'Please select or enter a description';
    }
    
    if (!formData.date) {
      newErrors.date = 'Please select a date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${apiBase}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          user_id: userId,
          amount: parseFloat(formData.amount),
          date: new Date(formData.date).toISOString()
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        onSuccess();
      } else {
        setErrors({ submit: data.error || 'Failed to add expense' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const selectedCategory = categories.find(cat => cat.id === parseInt(formData.category_id));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content expense-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-section">
            <div className="modal-icon">
              <DollarSign size={24} />
            </div>
            <div>
              <h2 className="modal-title">Add New Expense</h2>
              <p className="modal-subtitle">Quick expense entry with smart suggestions</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="expense-form">
          {/* Category Selection */}
          <div className="form-group">
            <label className="form-label">
              <Tag size={16} />
              <span>Category</span>
            </label>
            <div className="category-grid">
              {categories.map(category => (
                <button
                  key={category.id}
                  type="button"
                  className={`category-option ${formData.category_id === category.id.toString() ? 'active' : ''}`}
                  onClick={() => handleChange({ target: { name: 'category_id', value: category.id.toString() } })}
                  style={{ '--category-color': category.color }}
                >
                  <span className="category-icon">{category.icon}</span>
                  <span className="category-name">{category.name}</span>
                </button>
              ))}
            </div>
            {errors.category_id && <span className="error-message">{errors.category_id}</span>}
          </div>

          {/* Description Dropdown - Shows when category is selected */}
          {formData.category_id && (
            <div className="form-group animate-in">
              <label className="form-label">
                <FileText size={16} />
                <span>Description</span>
              </label>
              <select
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">Select description...</option>
                {standardDescriptions.map(desc => (
                  <option key={desc.id} value={desc.description}>
                    {desc.description}
                  </option>
                ))}
                <option value="__other__">Other (Enter manually)</option>
              </select>
              {errors.description && <span className="error-message">{errors.description}</span>}
            </div>
          )}

          {/* Custom Description Input - Shows when "Other" is selected */}
          {formData.description === '__other__' && (
            <div className="form-group animate-in">
              <label className="form-label">
                <FileText size={16} />
                <span>Custom Description</span>
              </label>
              <input
                type="text"
                name="description"
                placeholder="Enter custom description..."
                value=""
                onChange={handleChange}
                className="form-input"
                autoFocus
              />
            </div>
          )}

          <div className="form-row">
            {/* Amount */}
            <div className="form-group">
              <label className="form-label">
                <DollarSign size={16} />
                <span>Amount</span>
              </label>
              <div className="input-with-icon">
                <span className="input-icon">$</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="form-input with-icon"
                />
              </div>
              {errors.amount && <span className="error-message">{errors.amount}</span>}
            </div>

            {/* Date */}
            <div className="form-group">
              <label className="form-label">
                <Calendar size={16} />
                <span>Date & Time</span>
              </label>
              <input
                type="datetime-local"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="form-input"
              />
              {errors.date && <span className="error-message">{errors.date}</span>}
            </div>
          </div>

          {/* Notes (Optional) */}
          <div className="form-group">
            <label className="form-label">
              <FileText size={16} />
              <span>Notes (Optional)</span>
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any additional details..."
              rows="3"
              className="form-textarea"
            />
          </div>

          {/* Preview */}
          {formData.category_id && formData.amount && (
            <div className="expense-preview animate-in">
              <div className="preview-label">Preview</div>
              <div className="preview-content">
                {selectedCategory && (
                  <span className="preview-category" style={{ '--category-color': selectedCategory.color }}>
                    {selectedCategory.icon} {selectedCategory.name}
                  </span>
                )}
                <span className="preview-amount">${parseFloat(formData.amount || 0).toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errors.submit && (
            <div className="error-banner">
              {errors.submit}
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="btn-spinner"></div>
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <DollarSign size={18} />
                  <span>Add Expense</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExpenseForm;
