import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Zap, RefreshCw, AlertCircle, Calendar, DollarSign, BarChart3, Sparkles, Target, Award } from 'lucide-react';
import './PredictionView.css';

function PredictionView({ userId, apiBase, expenses }) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trained, setTrained] = useState(false);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (expenses.length >= 10) {
      trainAndPredict();
      fetchInsights();
    }
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await fetch(`${apiBase}/insights/spending?user_id=${userId}&days=30`);
      const data = await response.json();
      if (data.success) {
        setInsights(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    }
  };

  const trainAndPredict = async () => {
    setLoading(true);
    setError(null);
    setProgress(0);
    
    try {
      console.log('Starting training with userId:', userId);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      // Train model
      const trainResponse = await fetch(`${apiBase}/predictions/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      
      const trainData = await trainResponse.json();
      console.log('Train response:', trainData);
      
      if (!trainResponse.ok) {
        clearInterval(progressInterval);
        throw new Error(trainData.message || trainData.error || 'Failed to train model');
      }
      
      setTrained(true);
      setProgress(70);
      
      // Get prediction
      console.log('Fetching prediction...');
      const response = await fetch(`${apiBase}/predictions/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, period: 'monthly' })
      });
      
      const data = await response.json();
      console.log('Prediction response:', data);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to get prediction');
      }
      
      if (data.success) {
        setPrediction(data.data);
        setError(null);
        
        // Fetch insights after prediction
        fetchInsights();
      } else {
        throw new Error(data.message || 'Prediction failed');
      }
    } catch (error) {
      console.error('Prediction error:', error);
      setError(error.message);
      setProgress(0);
    } finally {
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 500);
    }
  };

  if (expenses.length < 10) {
    return (
      <div className="prediction-empty">
        <div className="empty-icon-wrapper">
          <Brain size={64} className="pulse-icon" />
          <Sparkles size={24} className="sparkle-1" />
          <Sparkles size={20} className="sparkle-2" />
        </div>
        <h3>Not Enough Data Yet</h3>
        <p>Add at least 10 expenses to unlock AI-powered predictions</p>
        <div className="progress-tracker">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(expenses.length / 10) * 100}%` }}
            ></div>
          </div>
          <span className="progress-text">{expenses.length}/10 expenses</span>
        </div>
      </div>
    );
  }

  return (
    <div className="prediction-view">
      <div className="prediction-header">
        <div className="header-content">
          <div className="header-icon">
            <Brain size={32} />
          </div>
          <div>
            <h2 className="prediction-title">AI Budget Predictions</h2>
            <p className="prediction-subtitle">Machine learning powered spending forecasts</p>
          </div>
        </div>
        <button className="retrain-btn" onClick={trainAndPredict} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'spinning' : ''} />
          <span>{loading ? 'Training...' : 'Retrain Model'}</span>
        </button>
      </div>

      {error && (
        <div className="prediction-error slide-in">
          <AlertCircle size={24} />
          <div>
            <h4>Prediction Error</h4>
            <p>{error}</p>
            <button onClick={trainAndPredict} className="btn-retry">
              Try Again
            </button>
          </div>
        </div>
      )}

      {loading && !prediction ? (
        <div className="prediction-loading fade-in">
          <div className="loading-container">
            <div className="loading-spinner-ring"></div>
            <Brain size={40} className="loading-brain" />
          </div>
          <p>Training AI model on your spending patterns...</p>
          <small>Analyzing {expenses.length} transactions</small>
          <div className="progress-bar-horizontal">
            <div 
              className="progress-fill-horizontal" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      ) : prediction ? (
        <div className="prediction-results">
          {/* Main Prediction Card */}
          <div className="prediction-card main scale-in">
            <div className="card-glow"></div>
            <div className="prediction-icon">
              <Brain size={40} />
            </div>
            <div className="prediction-content">
              <span className="prediction-label">Predicted Monthly Spending</span>
              <span className="prediction-value">
                <DollarSign size={32} />
                {prediction.predicted_amount.toFixed(2)}
              </span>
              <div className="prediction-meta">
                <div className="confidence-badge">
                  <Zap size={16} />
                  <span>{(prediction.confidence_score * 100).toFixed(0)}% confidence</span>
                </div>
                <div className="prediction-period">
                  <Calendar size={14} />
                  <span>Next 30 days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Insights Grid */}
          {insights && (
            <div className="insights-grid">
              <div className="insight-card slide-in" style={{ animationDelay: '0.1s' }}>
                <div className="insight-icon">
                  <BarChart3 size={24} />
                </div>
                <div className="insight-content">
                  <span className="insight-label">Total Spent (30d)</span>
                  <span className="insight-value">${insights.total_spending.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="insight-card slide-in" style={{ animationDelay: '0.2s' }}>
                <div className="insight-icon">
                  <TrendingUp size={24} />
                </div>
                <div className="insight-content">
                  <span className="insight-label">Daily Average</span>
                  <span className="insight-value">${insights.average_daily.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="insight-card slide-in" style={{ animationDelay: '0.3s' }}>
                <div className="insight-icon">
                  <Target size={24} />
                </div>
                <div className="insight-content">
                  <span className="insight-label">Transactions</span>
                  <span className="insight-value">{insights.num_transactions}</span>
                </div>
              </div>
              
              <div className="insight-card slide-in" style={{ animationDelay: '0.4s' }}>
                <div className="insight-icon">
                  <Award size={24} />
                </div>
                <div className="insight-content">
                  <span className="insight-label">Avg Transaction</span>
                  <span className="insight-value">${insights.average_transaction.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Model Status Banner */}
          <div className="model-status-banner slide-in" style={{ animationDelay: '0.5s' }}>
            <div className="status-indicator">
              <div className={`status-dot ${trained ? 'active' : ''}`}></div>
              <span>Model Status: {trained ? 'Active & Trained' : 'Ready'}</span>
            </div>
            {prediction.confidence_score >= 0.7 ? (
              <div className="accuracy-badge high">
                <Sparkles size={16} />
                <span>High Accuracy</span>
              </div>
            ) : (
              <div className="accuracy-badge medium">
                <span>Medium Accuracy</span>
              </div>
            )}
          </div>

          {/* Category Breakdown */}
          {insights && insights.category_breakdown && (
            <div className="category-breakdown slide-in" style={{ animationDelay: '0.6s' }}>
              <h4>Top Spending Categories</h4>
              <div className="category-list">
                {Object.entries(insights.category_breakdown)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([category, amount], index) => {
                    const percentage = (amount / insights.total_spending) * 100;
                    return (
                      <div key={category} className="category-item">
                        <div className="category-info">
                          <span className="category-name">{category}</span>
                          <span className="category-amount">${amount.toFixed(2)}</span>
                        </div>
                        <div className="category-bar">
                          <div 
                            className="category-fill"
                            style={{ 
                              width: `${percentage}%`,
                              animationDelay: `${0.7 + (index * 0.1)}s`
                            }}
                          ></div>
                        </div>
                        <span className="category-percentage">{percentage.toFixed(1)}%</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="prediction-info slide-in" style={{ animationDelay: '0.8s' }}>
            <div className="info-icon">
              <Sparkles size={20} />
            </div>
            <div>
              <h4>How AI Predictions Work</h4>
              <p>Our advanced machine learning model analyzes your spending patterns, transaction frequency, seasonal trends, and category distributions. Using gradient boosting algorithms, it identifies patterns and predicts future expenses with high accuracy.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="prediction-cta">
          <div className="cta-icon-wrapper">
            <Brain size={64} className="cta-brain" />
            <div className="cta-particles">
              <div className="particle"></div>
              <div className="particle"></div>
              <div className="particle"></div>
            </div>
          </div>
          <h3>Ready to predict your spending</h3>
          <p>Let AI analyze your patterns and forecast future expenses</p>
          <button className="btn-primary" onClick={trainAndPredict} disabled={loading}>
            <Zap size={20} />
            <span>Generate Prediction</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default PredictionView;