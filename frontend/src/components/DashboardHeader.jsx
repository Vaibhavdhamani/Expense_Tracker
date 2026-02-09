import React, { useState } from 'react';
import { Bell, Settings, LogOut, X, Check, Trash2, Clock } from 'lucide-react';
import './DashboardHeader.css';

function DashboardHeader({ user, notifications = [], onLogout, onClearNotifications, onSettingsClick }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Sample notifications if none provided
  const defaultNotifications = [
    {
      id: 1,
      type: 'warning',
      title: 'Budget Alert',
      message: 'You\'ve spent 90% of your Food budget',
      time: '2 hours ago',
      read: false
    },
    {
      id: 2,
      type: 'success',
      title: 'Goal Achieved',
      message: 'You stayed under budget this week!',
      time: '1 day ago',
      read: false
    },
    {
      id: 3,
      type: 'info',
      title: 'New Feature',
      message: 'Try our new AI budget predictions',
      time: '2 days ago',
      read: true
    }
  ];

  const displayNotifications = notifications.length > 0 ? notifications : defaultNotifications;
  const unreadCount = displayNotifications.filter(n => !n.read).length;

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    if (onLogout) {
      onLogout();
    } else {
      // Default logout behavior
      localStorage.removeItem('user');
      window.location.href = '/login'; // Adjust to your login route
    }
  };

  const handleNotificationClick = (notificationId) => {
    // Mark as read
    console.log('Notification clicked:', notificationId);
  };

  const handleClearAll = () => {
    if (onClearNotifications) {
      onClearNotifications();
    }
    setShowNotifications(false);
  };

  const handleSettingsClick = () => {
    if (onSettingsClick) {
      onSettingsClick();
    } else {
      setShowSettings(true);
    }
  };

  return (
    <>
      <div className="dashboard-header-actions">
        {/* Notifications Button */}
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

        {/* Settings Button */}
        <button 
          className="header-action-btn"
          onClick={handleSettingsClick}
          title="Settings"
        >
          <Settings size={20} />
        </button>

        {/* Logout Button */}
        <button 
          className="header-action-btn"
          onClick={() => setShowLogoutConfirm(true)}
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <>
          <div className="overlay" onClick={() => setShowNotifications(false)}></div>
          <div className="notifications-dropdown">
            <div className="dropdown-header">
              <h3>Notifications</h3>
              <button 
                className="btn-clear-all"
                onClick={handleClearAll}
              >
                Clear All
              </button>
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
                      {notification.type === 'info' && 'ℹ️'}
                      {notification.type === 'danger' && '🚨'}
                    </div>
                    <div className="notification-content">
                      <h4>{notification.title}</h4>
                      <p>{notification.message}</p>
                      <span className="notification-time">
                        <Clock size={12} />
                        {notification.time}
                      </span>
                    </div>
                    {!notification.read && (
                      <div className="unread-indicator"></div>
                    )}
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

      {/* Settings Modal */}
      {showSettings && (
        <>
          <div className="modal-overlay" onClick={() => setShowSettings(false)}></div>
          <div className="settings-modal">
            <div className="modal-header">
              <h3>Settings</h3>
              <button 
                className="btn-close"
                onClick={() => setShowSettings(false)}
              >
                <X size={24} />
              </button>
            </div>
            <div className="settings-content">
              <div className="settings-section">
                <h4>Account Settings</h4>
                <div className="setting-item">
                  <label>
                    <input type="checkbox" defaultChecked />
                    <span>Email notifications</span>
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input type="checkbox" defaultChecked />
                    <span>Budget alerts</span>
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input type="checkbox" />
                    <span>Weekly reports</span>
                  </label>
                </div>
              </div>

              <div className="settings-section">
                <h4>Display Settings</h4>
                <div className="setting-item">
                  <label>
                    <span>Currency</span>
                    <select defaultValue="USD">
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
                    <select defaultValue="MM/DD/YYYY">
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="settings-section">
                <h4>Privacy & Security</h4>
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
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowSettings(false)}
              >
                Cancel
              </button>
              <button className="btn-primary">
                Save Changes
              </button>
            </div>
          </div>
        </>
      )}

      {/* Logout Confirmation Modal */}
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
              <button 
                className="btn-secondary"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-danger"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default DashboardHeader;