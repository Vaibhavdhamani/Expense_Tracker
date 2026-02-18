import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, AlertCircle, 
  Zap, Calendar, ArrowUp, ArrowDown, RefreshCw, Eye, EyeOff,
  BarChart3, PieChart, Activity, Target
} from 'lucide-react';
import './Dashboard.css';

function Dashboard({ expenses, budgets, categories, dateRange, userId, apiBase }) {
  const [summary, setSummary] = useState(null);
  const [insights, setInsights] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState('pie');
  const [showValues, setShowValues] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(dateRange);

  useEffect(() => {
    fetchAllData();
  }, [expenses, selectedPeriod]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchSummary(),
      fetchInsights(),
      fetchRecommendations()
    ]);
    setLoading(false);
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch(`${apiBase}/expenses/summary?user_id=${userId}&days=${selectedPeriod}`);
      const data = await response.json();
      if (data.success) {
        setSummary(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error);
      // Set empty summary if fetch fails
      setSummary({
        total_spending: 0,
        average_daily: 0,
        category_breakdown: [],
        daily_breakdown: []
      });
    }
  };

  const fetchInsights = async () => {
    try {
      const response = await fetch(`${apiBase}/insights/spending?user_id=${userId}&days=${selectedPeriod}`);
      const data = await response.json();
      if (data.success) {
        setInsights(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error);
      // Set empty insights if fetch fails
      setInsights({
        total_spending: 0,
        average_daily: 0,
        num_transactions: 0,
        average_transaction: 0,
        max_transaction: 0,
        category_breakdown: {},
        daily_trend: {}
      });
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await fetch(`${apiBase}/insights/recommendations?user_id=${userId}`);
      const data = await response.json();
      if (data.success) {
        setRecommendations(data.data.recommendations || []);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      setRecommendations([]);
    }
  };

  const handleRefresh = () => {
    fetchAllData();
  };

  // Show loading state
  if (loading || !summary || !insights) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner-large"></div>
        <p>Loading dashboard insights...</p>
      </div>
    );
  }

  // Calculate totals with null checks
  const totalBudgeted = budgets?.reduce((sum, b) => sum + (b.budgeted || 0), 0) || 0;
  const totalSpent = budgets?.reduce((sum, b) => sum + (b.spent || 0), 0) || 0;
  const budgetRemaining = totalBudgeted - totalSpent;
  const budgetPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted * 100) : 0;

  // Calculate trends with null checks
  const calculateTrend = () => {
    if (summary?.daily_breakdown && summary.daily_breakdown.length > 7) {
      const recent = summary.daily_breakdown.slice(-3).reduce((sum, d) => sum + (d.total || 0), 0) / 3;
      const previous = summary.daily_breakdown.slice(-7, -3).reduce((sum, d) => sum + (d.total || 0), 0) / 4;
      const change = previous > 0 ? ((recent - previous) / previous * 100) : 0;
      return { change, isPositive: change < 0 };
    }
    return { change: 0, isPositive: true };
  };

  const trend = calculateTrend();

  // Prepare chart data with null checks
  const categoryData = summary?.category_breakdown || [];
  const totalCategorySpent = categoryData.reduce((sum, cat) => sum + (cat.total || 0), 0);

  // Safe values with defaults
  const safeInsights = {
    total_spending: insights?.total_spending || 0,
    average_daily: insights?.average_daily || 0,
    num_transactions: insights?.num_transactions || 0,
    average_transaction: insights?.average_transaction || 0,
    max_transaction: insights?.max_transaction || 0,
    category_breakdown: insights?.category_breakdown || {},
    daily_trend: insights?.daily_trend || {}
  };

  const safeSummary = {
    total_spending: summary?.total_spending || 0,
    average_daily: summary?.average_daily || 0,
    category_breakdown: summary?.category_breakdown || [],
    daily_breakdown: summary?.daily_breakdown || []
  };

  return (
    <div className="dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">Financial Overview</h2>
          <p className="dashboard-subtitle">Track your spending and manage your budget</p>
        </div>
        <div className="dashboard-controls">
          <select 
            className="period-selector"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
          <button className="btn-refresh" onClick={handleRefresh} title="Refresh data">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="overview-grid">
        <div className="overview-card primary">
          <div className="card-header">
            <div className="card-icon">
              <DollarSign size={24} />
            </div>
            {trend.change !== 0 && (
              <div className={`trend-badge ${trend.isPositive ? 'positive' : 'negative'}`}>
                {trend.isPositive ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                {Math.abs(trend.change).toFixed(1)}%
              </div>
            )}
          </div>
          <div className="card-content">
            <span className="card-label">Total Spent</span>
            <span className="card-value">₹{safeSummary.total_spending.toFixed(2)}</span>
            <span className="card-meta">{selectedPeriod} days period</span>
          </div>
          {safeSummary.daily_breakdown.length > 0 && (
            <div className="card-progress">
              <div className="mini-sparkline">
                {safeSummary.daily_breakdown.slice(-7).map((day, i) => {
                  const maxValue = Math.max(...safeSummary.daily_breakdown.slice(-7).map(d => d.total || 0)) || 1;
                  return (
                    <div 
                      key={i} 
                      className="sparkline-bar"
                      style={{ 
                        height: `${((day.total || 0) / maxValue) * 100}%` 
                      }}
                    ></div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="overview-card success">
          <div className="card-header">
            <div className="card-icon">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="card-content">
            <span className="card-label">Daily Average</span>
            <span className="card-value">₹{safeSummary.average_daily.toFixed(2)}</span>
            <span className="card-meta">Average per day</span>
          </div>
          <div className="card-stat-mini">
            <div className="stat-item">
              <span className="stat-label">Max</span>
              <span className="stat-value">₹{safeInsights.max_transaction.toFixed(0)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Avg</span>
              <span className="stat-value">₹{safeInsights.average_transaction.toFixed(0)}</span>
            </div>
          </div>
        </div>

        <div className="overview-card warning">
          <div className="card-header">
            <div className="card-icon">
              <ShoppingBag size={24} />
            </div>
          </div>
          <div className="card-content">
            <span className="card-label">Transactions</span>
            <span className="card-value">{safeInsights.num_transactions}</span>
            <span className="card-meta">Total expenses logged</span>
          </div>
          <div className="card-frequency">
            <Activity size={16} />
            <span>{selectedPeriod > 0 ? (safeInsights.num_transactions / selectedPeriod).toFixed(1) : 0} per day</span>
          </div>
        </div>

        <div className={`overview-card accent ${budgetPercentage > 100 ? 'over-budget' : ''}`}>
          <div className="card-header">
            <div className="card-icon">
              <Target size={24} />
            </div>
            {budgetPercentage > 100 && (
              <div className="alert-badge">
                <AlertCircle size={16} />
              </div>
            )}
          </div>
          <div className="card-content">
            <span className="card-label">Budget Status</span>
            <span className="card-value">{budgetPercentage.toFixed(0)}%</span>
            <span className={`card-meta ${budgetRemaining < 0 ? 'negative' : ''}`}>
              ₹{Math.abs(budgetRemaining).toFixed(2)}{budgetRemaining >= 0 ? 'remaining' : 'over budget'}
            </span>
          </div>
          {totalBudgeted > 0 && (
            <div className="budget-progress-mini">
              <div 
                className="budget-fill"
                style={{ 
                  width: `${Math.min(budgetPercentage, 100)}%`,
                  background: budgetPercentage > 100 ? '#ef4444' : '#10b981'
                }}
              ></div>
            </div>
          )}
        </div>
      </div>

      {/* Show empty state if no data */}
      {safeInsights.num_transactions === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <PieChart size={64} />
          </div>
          <h3>No Data Yet</h3>
          <p>Start adding expenses to see insights and analytics</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            <RefreshCw size={20} />
            <span>Refresh</span>
          </button>
        </div>
      ) : (
        <>
          {/* Charts Section - Only show if there's data */}
          <div className="charts-grid">
            {/* Category Breakdown Chart */}
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">Spending by Category</h3>
                  <span className="chart-subtitle">Distribution overview</span>
                </div>
                <div className="chart-controls">
                  <button 
                    className={`btn-chart-toggle ${activeChart === 'pie' ? 'active' : ''}`}
                    onClick={() => setActiveChart('pie')}
                    title="Pie chart"
                  >
                    <PieChart size={18} />
                  </button>
                  <button 
                    className={`btn-chart-toggle ${activeChart === 'bar' ? 'active' : ''}`}
                    onClick={() => setActiveChart('bar')}
                    title="Bar chart"
                  >
                    <BarChart3 size={18} />
                  </button>
                  <button 
                    className="btn-chart-toggle"
                    onClick={() => setShowValues(!showValues)}
                    title={showValues ? 'Hide values' : 'Show values'}
                  >
                    {showValues ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>

              {activeChart === 'pie' ? (
                <div className="pie-chart-container">
                  {categoryData.length > 0 ? (
                    <>
                      <svg className="pie-chart" viewBox="0 0 200 200">
                        {categoryData.map((cat, index) => {
                          const percentage = (cat.total / totalCategorySpent) * 100;
                          const startAngle = categoryData.slice(0, index).reduce((sum, c) => 
                            sum + (c.total / totalCategorySpent) * 360, 0);
                          const endAngle = startAngle + (percentage / 100) * 360;
                          
                          const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
                          const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
                          const x2 = 100 + 80 * Math.cos((endAngle - 90) * Math.PI / 180);
                          const y2 = 100 + 80 * Math.sin((endAngle - 90) * Math.PI / 180);
                          
                          const largeArc = percentage > 50 ? 1 : 0;
                          
                          return (
                            <g key={cat.category}>
                              <path
                                d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                fill={cat.color || '#6366f1'}
                                opacity="0.85"
                                className="pie-slice"
                                style={{ animationDelay: `${index * 0.1}s` }}
                              />
                            </g>
                          );
                        })}
                        <circle cx="100" cy="100" r="50" fill="white" />
                        <text x="100" y="95" textAnchor="middle" fill="#1e293b" fontSize="24" fontWeight="700">
                          ₹{totalCategorySpent.toFixed(0)}
                        </text>
                        <text x="100" y="112" textAnchor="middle" fill="#64748b" fontSize="12">
                          Total Spent
                        </text>
                      </svg>
                      
                      <div className="pie-legend">
                        {categoryData.slice(0, 6).map((cat, index) => {
                          const percentage = (cat.total / totalCategorySpent) * 100;
                          return (
                            <div 
                              key={cat.category} 
                              className="legend-item"
                              style={{ animationDelay: `${index * 0.1}s` }}
                            >
                              <span className="legend-color" style={{ background: cat.color }}></span>
                              <span className="legend-label">{cat.icon} {cat.category}</span>
                              <div className="legend-values">
                                {showValues && <span className="legend-value">₹{cat.total.toFixed(0)}</span>}
                                <span className="legend-percent">{percentage.toFixed(1)}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="no-data">
                      <PieChart size={48} />
                      <p>No category data available</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="category-bars-container">
                  {categoryData.length > 0 ? (
                    categoryData.slice(0, 6).map((cat, index) => {
                      const percentage = (cat.total / totalCategorySpent) * 100;
                      return (
                        <div 
                          key={cat.category} 
                          className="category-bar-item"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className="category-bar-label">
                            <span className="category-icon" style={{ background: cat.color }}>
                              {cat.icon}
                            </span>
                            <span className="category-name">{cat.category}</span>
                          </div>
                          <div className="category-bar-progress">
                            <div 
                              className="category-bar-fill"
                              style={{ 
                                width: `${percentage}%`,
                                background: cat.color
                              }}
                            ></div>
                          </div>
                          {showValues && (
                            <div className="category-bar-values">
                              <span className="category-amount">₹{cat.total.toFixed(0)}</span>
                              <span className="category-percent">{percentage.toFixed(1)}%</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-data">
                      <BarChart3 size={48} />
                      <p>No category data available</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Daily Spending Trend */}
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">Daily Spending Trend</h3>
                  <span className="chart-subtitle">Last {Math.min(selectedPeriod, 14)} days</span>
                </div>
                <div className="trend-indicator">
                  {trend.change !== 0 && (
                    trend.isPositive ? (
                      <div className="trend-badge positive">
                        <ArrowDown size={14} />
                        <span>Improving</span>
                      </div>
                    ) : (
                      <div className="trend-badge negative">
                        <ArrowUp size={14} />
                        <span>Increasing</span>
                      </div>
                    )
                  )}
                </div>
              </div>
              <div className="bar-chart-container">
                {safeSummary.daily_breakdown && safeSummary.daily_breakdown.length > 0 ? (
                  <div className="bar-chart">
                    {safeSummary.daily_breakdown.slice(-14).map((day, index) => {
                      const maxValue = Math.max(...safeSummary.daily_breakdown.slice(-14).map(d => d.total || 0)) || 1;
                      const height = ((day.total || 0) / maxValue) * 100;
                      const date = new Date(day.date);
                      const isToday = date.toDateString() === new Date().toDateString();
                      
                      return (
                        <div 
                          key={index} 
                          className="bar-wrapper"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <div 
                            className={`bar ${isToday ? 'today' : ''}`}
                            style={{ height: `${height}%` }}
                             data-value={`₹${(day.total || 0).toFixed(2)}`}
                            data-date={date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          >
                            <div className="bar-fill"></div>
                          </div>
                          <span className="bar-label">
                            {date.getDate()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="no-data">
                    <Activity size={48} />
                    <p>No daily data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          {recommendations.length > 0 && (
            <div className="recommendations-section">
              <div className="section-header">
                <div>
                  <h3 className="section-title">
                    <Zap size={24} />
                    AI-Powered Insights
                  </h3>
                  <span className="section-subtitle">Personalized recommendations based on your spending patterns</span>
                </div>
              </div>
              
              <div className="recommendations-grid">
                {recommendations.map((rec, index) => (
                  <div 
                    key={index} 
                    className={`recommendation-card ${rec.type || 'tip'} ${rec.priority}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="recommendation-icon">
                      {rec.priority === 'high' && <AlertCircle size={22} />}
                      {rec.priority === 'medium' && <TrendingDown size={22} />}
                      {rec.priority === 'low' && <Zap size={22} />}
                    </div>
                    <div className="recommendation-content">
                      <h4 className="recommendation-title">{rec.title}</h4>
                      <p className="recommendation-message">{rec.message}</p>
                    </div>
                    <div className={`priority-badge ${rec.priority}`}>
                      {rec.priority}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          {categoryData.length > 0 && (
            <div className="quick-stats">
              <h3 className="section-title">Quick Stats</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-icon">📈</span>
                  <span className="stat-label">Top Category</span>
                  <span className="stat-value">
                    {categoryData[0].icon} {categoryData[0].category}
                  </span>
                  <span className="stat-meta">₹{categoryData[0].total.toFixed(2)}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">💰</span>
                  <span className="stat-label">Avg per Transaction</span>
                  <span className="stat-value">₹{safeInsights.average_transaction.toFixed(2)}</span>
                  <span className="stat-meta">{safeInsights.num_transactions} transactions</span>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">🎯</span>
                  <span className="stat-label">Budget Health</span>
                  <span className={`stat-value ${budgetPercentage > 90 ? 'warning' : 'success'}`}>
                    {budgetPercentage <= 75 ? 'Good' : budgetPercentage <= 90 ? 'Fair' : 'Critical'}
                  </span>
                  <span className="stat-meta">{budgetPercentage.toFixed(0)}% used</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;