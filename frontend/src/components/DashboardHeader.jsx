import React, { useState, useEffect } from 'react';
import { 
  Bell, Settings, LogOut, X, Check, Clock, AlertCircle, Save, 
  Download, Trash2, Lock, Eye, EyeOff, FileText, Shield
} from 'lucide-react';
import './DashboardHeader.css';

const API_BASE = 'http://localhost:5000/api';

function DashboardHeader({ user, notifications = [], onLogout, onClearNotifications, apiBase = API_BASE }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  // Settings state
  const [settingsForm, setSettingsForm] = useState({
    emailNotifications: true,
    budgetAlerts: true,
    weeklyReports: false,
    currency: 'INR',
    dateFormat: 'DD/MM/YYYY',
  });
  const [saveStatus, setSaveStatus] = useState('idle');
  const [saveMessage, setSaveMessage] = useState('');

  // Change Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState('idle');
  const [passwordMessage, setPasswordMessage] = useState('');

  // Delete Account state
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteStatus, setDeleteStatus] = useState('idle');

  // Export status
  const [exportStatus, setExportStatus] = useState('idle');

  // Load settings
  useEffect(() => {
    if (!user?.id) return;
    loadUserSettings();
  }, [user?.id]);

  const loadUserSettings = async () => {
    try {
      const res = await fetch(`${apiBase}/users/${user.id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.settings) {
          setSettingsForm(prev => ({ ...prev, ...json.data.settings }));
          localStorage.setItem(`settings_${user.id}`, JSON.stringify(json.data.settings));
          return;
        }
      }
    } catch (err) {
      console.warn('Backend settings unavailable, using localStorage');
    }

    try {
      const cached = localStorage.getItem(`settings_${user.id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        setSettingsForm(prev => ({ ...prev, ...parsed }));
      }
    } catch (err) {
      console.error('Failed to load cached settings');
    }
  };

  // Notifications
  const defaultNotifications = [
    { id: 1, type: 'warning', title: 'Budget Alert', message: "You've spent 90% of your Food budget", time: '2 hours ago', read: false },
    { id: 2, type: 'success', title: 'Goal Achieved', message: 'You stayed under budget this week!', time: '1 day ago', read: false },
    { id: 3, type: 'info', title: 'New Feature', message: 'Try our new AI budget predictions', time: '2 days ago', read: true },
  ];

  const displayNotifications = notifications.length > 0 ? notifications : defaultNotifications;
  const unreadCount = displayNotifications.filter(n => !n.read).length;

  // Handlers
  const handleLogout = () => {
    setShowLogoutConfirm(false);
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  };

  const handleClearAll = () => {
    if (onClearNotifications) onClearNotifications();
    setShowNotifications(false);
  };

  const handleSettingsClick = () => {
    setSaveStatus('idle');
    setSaveMessage('');
    setShowSettings(true);
  };

  // Save Settings
  const handleSaveSettings = async () => {
    setSaveStatus('saving');
    setSaveMessage('');

    if (user?.id) {
      localStorage.setItem(`settings_${user.id}`, JSON.stringify(settingsForm));
    }

    try {
      if (!user?.id) throw new Error('No user ID');

      const res = await fetch(`${apiBase}/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          email: user.email,
          settings: settingsForm,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save settings');
      }

      setSaveStatus('success');
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => {
        setShowSettings(false);
        setSaveStatus('idle');
      }, 1200);
    } catch (err) {
      setSaveStatus('error');
      setSaveMessage(`Saved locally. ${err.message}`);
    }
  };

  // Export Data
  const handleExportData = async () => {
    setExportStatus('exporting');
    setSaveMessage('');

    try {
      const res = await fetch(`${apiBase}/expenses?user_id=${user.id}&days=365`);
      if (!res.ok) throw new Error('Failed to fetch data');

      const data = await res.json();
      
      const expenses = data.data || [];
      let csv = 'Date,Category,Description,Amount,Notes\n';
      expenses.forEach(exp => {
        const date = new Date(exp.date).toLocaleDateString();
        csv += `"${date}","${exp.category?.name || 'Unknown'}","${exp.description}","₹${exp.amount}","${exp.notes || ''}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expense-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setExportStatus('success');
      setSaveMessage('Data exported successfully!');
      setTimeout(() => setExportStatus('idle'), 2000);
    } catch (err) {
      setExportStatus('error');
      setSaveMessage(`Export failed: ${err.message}`);
      setTimeout(() => setExportStatus('idle'), 3000);
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus('error');
      setPasswordMessage('Passwords do not match!');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordStatus('error');
      setPasswordMessage('Password must be at least 6 characters!');
      return;
    }

    setPasswordStatus('saving');
    setPasswordMessage('');

    try {
      const res = await fetch(`${apiBase}/users/${user.id}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setPasswordStatus('success');
      setPasswordMessage('Password changed successfully!');
      setTimeout(() => {
        setShowChangePassword(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordStatus('idle');
      }, 1500);
    } catch (err) {
      setPasswordStatus('error');
      setPasswordMessage(err.message);
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteStatus('error');
      setSaveMessage('Please type DELETE to confirm');
      return;
    }

    setDeleteStatus('deleting');
    setSaveMessage('');

    try {
      const res = await fetch(`${apiBase}/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete account');
      }

      setDeleteStatus('success');
      setSaveMessage('Account deleted. Logging out...');
      setTimeout(() => {
        localStorage.clear();
        window.location.href = '/';
      }, 2000);
    } catch (err) {
      setDeleteStatus('error');
      setSaveMessage(`Delete failed: ${err.message}`);
    }
  };

  return (
    <>
      <div className="dashboard-header-actions">
        <button className="header-action-btn" onClick={() => setShowNotifications(!showNotifications)} title="Notifications">
          <Bell size={20} />
          {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
        </button>

        <button className="header-action-btn" onClick={handleSettingsClick} title="Settings">
          <Settings size={20} />
        </button>

        <button className="header-action-btn" onClick={() => setShowLogoutConfirm(true)} title="Logout">
          <LogOut size={20} />
        </button>
      </div>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <>
          <div className="overlay" onClick={() => setShowNotifications(false)} />
          <div className="notifications-dropdown">
            <div className="dropdown-header">
              <h3>Notifications</h3>
              <button className="btn-clear-all" onClick={handleClearAll}>Clear All</button>
            </div>
            <div className="notifications-list">
              {displayNotifications.length > 0 ? (
                displayNotifications.map(notification => (
                  <div key={notification.id} className={`notification-item ${notification.read ? 'read' : 'unread'} ${notification.type}`}>
                    <div className="notification-icon">
                      {notification.type === 'warning' && '⚠️'}
                      {notification.type === 'success' && '✅'}
                      {notification.type === 'info' && 'ℹ️'}
                      {notification.type === 'danger' && '🚨'}
                    </div>
                    <div className="notification-content">
                      <h4>{notification.title}</h4>
                      <p>{notification.message}</p>
                      <span className="notification-time"><Clock size={12} />{notification.time}</span>
                    </div>
                    {!notification.read && <div className="unread-indicator" />}
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
          <div className="modal-overlay" onClick={() => setShowSettings(false)} />
          <div className="settings-modal">
            <div className="modal-header">
              <h3>Settings</h3>
              <button className="btn-close" onClick={() => setShowSettings(false)}><X size={24} /></button>
            </div>

            <div className="settings-content">
              {/* Account Settings */}
              <div className="settings-section">
                <h4>Account Settings</h4>
                <div className="setting-item">
                  <label>
                    <input type="checkbox" checked={settingsForm.emailNotifications} onChange={e => setSettingsForm(p => ({ ...p, emailNotifications: e.target.checked }))} />
                    <span>Email notifications</span>
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input type="checkbox" checked={settingsForm.budgetAlerts} onChange={e => setSettingsForm(p => ({ ...p, budgetAlerts: e.target.checked }))} />
                    <span>Budget alerts</span>
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input type="checkbox" checked={settingsForm.weeklyReports} onChange={e => setSettingsForm(p => ({ ...p, weeklyReports: e.target.checked }))} />
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
                    <select value={settingsForm.currency} onChange={e => setSettingsForm(p => ({ ...p, currency: e.target.value }))}>
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="JPY">JPY (¥)</option>
                    </select>
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <span>Date Format</span>
                    <select value={settingsForm.dateFormat} onChange={e => setSettingsForm(p => ({ ...p, dateFormat: e.target.value }))}>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </label>
                </div>
              </div>

              {/* Privacy & Security */}
              <div className="settings-section">
                <h4>Privacy &amp; Security</h4>
                <div className="setting-item">
                  <button className="btn-secondary-full" onClick={() => { setShowSettings(false); setShowChangePassword(true); }}>
                    <Lock size={16} /> Change Password
                  </button>
                </div>
                <div className="setting-item">
                  <button className="btn-secondary-full" onClick={handleExportData} disabled={exportStatus === 'exporting'}>
                    {exportStatus === 'exporting' ? (
                      <><span className="btn-spinner" /> Exporting...</>
                    ) : (
                      <><Download size={16} /> Export Data</>
                    )}
                  </button>
                </div>
                <div className="setting-item">
                  <button className="btn-danger-full" onClick={() => { setShowSettings(false); setShowDeleteAccount(true); }}>
                    <Trash2 size={16} /> Delete Account
                  </button>
                </div>
              </div>

              {/* Feedback */}
              {saveStatus === 'success' && (
                <div className="save-feedback save-success"><Check size={16} /> {saveMessage}</div>
              )}
              {saveStatus === 'error' && (
                <div className="save-feedback save-error"><AlertCircle size={16} /> {saveMessage}</div>
              )}
              {exportStatus === 'success' && (
                <div className="save-feedback save-success"><FileText size={16} /> {saveMessage}</div>
              )}
              {exportStatus === 'error' && (
                <div className="save-feedback save-error"><AlertCircle size={16} /> {saveMessage}</div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowSettings(false)} disabled={saveStatus === 'saving'}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveSettings} disabled={saveStatus === 'saving'}>
                {saveStatus === 'saving' ? <><span className="btn-spinner" />Saving...</> : <><Save size={16} />Save Changes</>}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <>
          <div className="modal-overlay" onClick={() => setShowChangePassword(false)} />
          <div className="settings-modal password-modal">
            <div className="modal-header">
              <div className="modal-header-icon">
                <Lock size={24} />
              </div>
              <div>
                <h3>Change Password</h3>
                <p className="modal-subtitle">Update your account password</p>
              </div>
              <button className="btn-close" onClick={() => setShowChangePassword(false)}><X size={24} /></button>
            </div>

            <form onSubmit={handleChangePassword} className="settings-content">
              <div className="password-field">
                <label>Current Password</label>
                <div className="input-with-icon">
                  <Lock size={18} />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                    required
                  />
                  <button type="button" className="toggle-password" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="password-field">
                <label>New Password</label>
                <div className="input-with-icon">
                  <Lock size={18} />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                    required
                    minLength={6}
                  />
                  <button type="button" className="toggle-password" onClick={() => setShowNewPassword(!showNewPassword)}>
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="password-field">
                <label>Confirm New Password</label>
                <div className="input-with-icon">
                  <Lock size={18} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                    required
                  />
                  <button type="button" className="toggle-password" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {passwordStatus === 'success' && (
                <div className="save-feedback save-success"><Check size={16} /> {passwordMessage}</div>
              )}
              {passwordStatus === 'error' && (
                <div className="save-feedback save-error"><AlertCircle size={16} /> {passwordMessage}</div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowChangePassword(false)} disabled={passwordStatus === 'saving'}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={passwordStatus === 'saving'}>
                  {passwordStatus === 'saving' ? <><span className="btn-spinner" />Changing...</> : <><Lock size={16} />Change Password</>}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Delete Account Modal */}
      {showDeleteAccount && (
        <>
          <div className="modal-overlay" onClick={() => setShowDeleteAccount(false)} />
          <div className="settings-modal delete-modal">
            <div className="modal-header danger">
              <div className="modal-header-icon danger">
                <Shield size={24} />
              </div>
              <div>
                <h3>Delete Account</h3>
                <p className="modal-subtitle">This action cannot be undone</p>
              </div>
              <button className="btn-close" onClick={() => setShowDeleteAccount(false)}><X size={24} /></button>
            </div>

            <div className="settings-content">
              <div className="delete-warning">
                <AlertCircle size={48} />
                <h4>Warning: Permanent Action</h4>
                <p>Deleting your account will:</p>
                <ul>
                  <li>Remove all your expense data</li>
                  <li>Delete all budget information</li>
                  <li>Erase all transaction history</li>
                  <li>Cancel any active subscriptions</li>
                </ul>
              </div>

              <div className="delete-confirm-input">
                <label>Type <strong>DELETE</strong> to confirm</label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="danger-input"
                />
              </div>

              {deleteStatus === 'success' && (
                <div className="save-feedback save-success"><Check size={16} /> {saveMessage}</div>
              )}
              {deleteStatus === 'error' && (
                <div className="save-feedback save-error"><AlertCircle size={16} /> {saveMessage}</div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDeleteAccount(false)} disabled={deleteStatus === 'deleting'}>Cancel</button>
              <button className="btn-danger" onClick={handleDeleteAccount} disabled={deleteStatus === 'deleting' || deleteConfirmText !== 'DELETE'}>
                {deleteStatus === 'deleting' ? <><span className="btn-spinner" />Deleting...</> : <><Trash2 size={16} />Delete Account</>}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <>
          <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)} />
          <div className="logout-confirm-modal">
            <div className="logout-icon"><LogOut size={48} /></div>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out?</p>
            <div className="logout-actions">
              <button className="btn-secondary" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button className="btn-danger" onClick={handleLogout}><LogOut size={18} />Logout</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default DashboardHeader;