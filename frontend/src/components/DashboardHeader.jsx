import React, { useState, useEffect } from 'react';
import { Bell, Settings, LogOut, X, Check, Trash2, Clock, AlertCircle } from 'lucide-react';
import './DashboardHeader.css';

// ─── API base URL – change once here if port changes ───────────────────────
const API_BASE = 'http://localhost:5000/api';

function DashboardHeader({ user, notifications = [], onLogout, onClearNotifications, onSettingsClick }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings,      setShowSettings]      = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // ── Settings form state (mirrors what backend returns/accepts) ──────────
  const [settingsForm, setSettingsForm] = useState({
    emailNotifications: true,
    budgetAlerts:       true,
    weeklyReports:      false,
    currency:           'USD',
    dateFormat:         'MM/DD/YYYY',
  });
  const [saveStatus,  setSaveStatus]  = useState('idle'); // idle | saving | success | error
  const [saveMessage, setSaveMessage] = useState('');

  // ── Load settings: backend first, fallback to localStorage ─────────────
  useEffect(() => {
    if (!user?.id) return;

    const loadSettings = async () => {
      try {
        // Try backend: GET /api/users/:id  (your existing route returns user data)
        const res = await fetch(`${API_BASE}/users/${user.id}`);
        if (res.ok) {
          const json = await res.json();
          // If your User model has a settings JSON field use json.data.settings
          // otherwise fall through to localStorage
          if (json.data?.settings) {
            setSettingsForm(prev => ({ ...prev, ...json.data.settings }));
            return;
          }
        }
      } catch (_) { /* backend unreachable – that's fine */ }

      // Fallback: localStorage
      try {
        const cached = localStorage.getItem(`settings_${user.id}`);
        if (cached) setSettingsForm(prev => ({ ...prev, ...JSON.parse(cached) }));
      } catch (_) {}
    };

    loadSettings();
  }, [user?.id]);

  // ── Notification defaults ────────────────────────────────────────────────
  const defaultNotifications = [
    { id: 1, type: 'warning', title: 'Budget Alert',  message: "You've spent 90% of your Food budget", time: '2 hours ago', read: false },
    { id: 2, type: 'success', title: 'Goal Achieved', message: 'You stayed under budget this week!',   time: '1 day ago',   read: false },
    { id: 3, type: 'info',    title: 'New Feature',   message: 'Try our new AI budget predictions',    time: '2 days ago',  read: true  },
  ];

  const displayNotifications = notifications.length > 0 ? notifications : defaultNotifications;
  const unreadCount = displayNotifications.filter(n => !n.read).length;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleLogout = () => {
    setShowLogoutConfirm(false);
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  };

  const handleNotificationClick = (notificationId) => {
    console.log('Notification clicked:', notificationId);
  };

  const handleClearAll = () => {
    if (onClearNotifications) onClearNotifications();
    setShowNotifications(false);
  };

  const handleSettingsClick = () => {
    if (onSettingsClick) { onSettingsClick(); return; }
    setSaveStatus('idle');
    setSaveMessage('');
    setShowSettings(true);
  };

  // Save: PUT /api/users/:id  (same route your existing users_bp exposes)
  const handleSaveSettings = async () => {
    setSaveStatus('saving');
    setSaveMessage('');

    // Always save to localStorage as backup
    if (user?.id) {
      localStorage.setItem(`settings_${user.id}`, JSON.stringify(settingsForm));
    }

    try {
      if (!user?.id) throw new Error('No user id – saved locally only.');

      const res = await fetch(`${API_BASE}/users/${user.id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,   // your PUT /users/:id expects these
          email:    user.email,
          settings: settingsForm,    // extra field; stored if model supports it
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Server error');
      }

      setSaveStatus('success');
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setShowSettings(false), 1000);

    } catch (err) {
      setSaveStatus('error');
      setSaveMessage(`Saved locally. (${err.message})`);
    }
  };

  // ── JSX ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ─── Header action buttons (unchanged layout) ─── */}
      <div className="dashboard-header-actions">
        <button
          className="header-action-btn"
          onClick={() => setShowNotifications(!showNotifications)}
          title="Notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
          )}
        </button>

        <button className="header-action-btn" onClick={handleSettingsClick} title="Settings">
          <Settings size={20} />
        </button>

        <button className="header-action-btn" onClick={() => setShowLogoutConfirm(true)} title="Logout">
          <LogOut size={20} />
        </button>
      </div>

      {/* ─── Notifications Dropdown (unchanged) ─── */}
      {showNotifications && (
        <>
          <div className="overlay" onClick={() => setShowNotifications(false)}></div>
          <div className="notifications-dropdown">
            <div className="dropdown-header">
              <h3>Notifications</h3>
              <button className="btn-clear-all" onClick={handleClearAll}>Clear All</button>
            </div>
            <div className="notifications-list">
              {displayNotifications.length > 0 ? (
                displayNotifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`notification-item ${notification.read ? 'read' : 'unread'} ${notification.type}`}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div className="notification-icon">
                      {notification.type === 'warning' && '⚠️'}
                      {notification.type === 'success' && '✅'}
                      {notification.type === 'info'    && 'ℹ️'}
                      {notification.type === 'danger'  && '🚨'}
                    </div>
                    <div className="notification-content">
                      <h4>{notification.title}</h4>
                      <p>{notification.message}</p>
                      <span className="notification-time">
                        <Clock size={12} />
                        {notification.time}
                      </span>
                    </div>
                    {!notification.read && <div className="unread-indicator"></div>}
                  </div>
                ))
              ) : (
                <div className="no-notifications">
                  <Bell size={48} />
                  <p>No notifications</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ─── Settings Modal ─── */}
      {showSettings && (
        <>
          <div className="modal-overlay" onClick={() => setShowSettings(false)}></div>
          <div className="settings-modal">

            <div className="modal-header">
              <h3>Settings</h3>
              <button className="btn-close" onClick={() => setShowSettings(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="settings-content">

              {/* Account Settings */}
              <div className="settings-section">
                <h4>Account Settings</h4>

                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={settingsForm.emailNotifications}
                      onChange={e => setSettingsForm(p => ({ ...p, emailNotifications: e.target.checked }))}
                    />
                    <span>Email notifications</span>
                  </label>
                </div>

                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={settingsForm.budgetAlerts}
                      onChange={e => setSettingsForm(p => ({ ...p, budgetAlerts: e.target.checked }))}
                    />
                    <span>Budget alerts</span>
                  </label>
                </div>

                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={settingsForm.weeklyReports}
                      onChange={e => setSettingsForm(p => ({ ...p, weeklyReports: e.target.checked }))}
                    />
                    <span>Weekly reports</span>
                  </label>
                </div>
              </div>

              {/* Display Settings */}
              <div className="settings-section">
                <h4>Display Settings</h4>

                <div className="setting-item">
                  <label>
                    <span>Currency</span>
                    <select
                      value={settingsForm.currency}
                      onChange={e => setSettingsForm(p => ({ ...p, currency: e.target.value }))}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="INR">INR (₹)</option>
                    </select>
                  </label>
                </div>

                <div className="setting-item">
                  <label>
                    <span>Date Format</span>
                    <select
                      value={settingsForm.dateFormat}
                      onChange={e => setSettingsForm(p => ({ ...p, dateFormat: e.target.value }))}
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </label>
                </div>
              </div>

              {/* Privacy & Security */}
              <div className="settings-section">
                <h4>Privacy &amp; Security</h4>
                <div className="setting-item">
                  <button className="btn-secondary-full">Change Password</button>
                </div>
                <div className="setting-item">
                  <button className="btn-secondary-full">Export Data</button>
                </div>
                <div className="setting-item">
                  <button className="btn-danger-full">Delete Account</button>
                </div>
              </div>

              {/* ── Save feedback banner ── */}
              {saveStatus === 'success' && (
                <div className="save-feedback save-success">
                  <Check size={16} /> {saveMessage}
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="save-feedback save-error">
                  <AlertCircle size={16} /> {saveMessage}
                </div>
              )}

            </div>{/* end settings-content */}

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowSettings(false)}
                disabled={saveStatus === 'saving'}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveSettings}
                disabled={saveStatus === 'saving'}
              >
                {saveStatus === 'saving' ? (
                  <><span className="btn-spinner"></span> Saving…</>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>

          </div>
        </>
      )}

      {/* ─── Logout Confirmation Modal (unchanged) ─── */}
      {showLogoutConfirm && (
        <>
          <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}></div>
          <div className="logout-confirm-modal">
            <div className="logout-icon">
              <LogOut size={48} />
            </div>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out?</p>
            <div className="logout-actions">
              <button className="btn-secondary" onClick={() => setShowLogoutConfirm(false)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={handleLogout}>
                <LogOut size={18} /> Logout
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default DashboardHeader;