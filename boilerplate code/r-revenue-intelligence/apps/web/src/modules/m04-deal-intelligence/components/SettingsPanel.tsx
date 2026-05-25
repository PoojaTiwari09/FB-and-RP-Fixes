import React, { useEffect, useState } from 'react';
import { settingsAPI, NotificationSettings, GlobalSettings, ViewSettings } from '../api/settings.api';

/**
 * Settings Panel Component
 * Allows users to manage their preferences
 */
export const SettingsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'global' | 'notifications' | 'view'>('global');
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    defaultBoardView: 'list',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    currencySymbol: '$',
    theme: 'light',
  });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailEnabled: true,
    inAppEnabled: true,
    notifyOnWarnings: true,
    notifyOnTaskAssignments: true,
    notifyOnComments: true,
    notifyOnRiskEscalations: true,
    dailyDigestEnabled: false,
    weeklySummaryEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [global, notifications] = await Promise.all([
        settingsAPI.getGlobalSettings(),
        settingsAPI.getNotificationSettings(),
      ]);
      setGlobalSettings(global.settings);
      setNotificationSettings(notifications.settings);
    } catch (err) {
      showMessage('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveGlobal = async () => {
    try {
      setSaving(true);
      await settingsAPI.saveGlobalSettings(globalSettings);
      showMessage('success', 'Global settings saved successfully');
    } catch (err) {
      showMessage('error', 'Failed to save global settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSaving(true);
      await settingsAPI.saveNotificationSettings(notificationSettings);
      showMessage('success', 'Notification settings saved successfully');
    } catch (err) {
      showMessage('error', 'Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetAll = async () => {
    if (!confirm('Are you sure you want to reset all settings to defaults?')) {
      return;
    }

    try {
      setSaving(true);
      await settingsAPI.resetAllSettings();
      await loadSettings();
      showMessage('success', 'All settings reset to defaults');
    } catch (err) {
      showMessage('error', 'Failed to reset settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="settings-loading">Loading settings...</div>;
  }

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h2>Settings</h2>
        <button onClick={handleResetAll} className="reset-button" disabled={saving}>
          Reset All Settings
        </button>
      </div>

      {message && (
        <div className={`settings-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-tabs">
        <button
          className={`tab ${activeTab === 'global' ? 'active' : ''}`}
          onClick={() => setActiveTab('global')}
        >
          Global
        </button>
        <button
          className={`tab ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          Notifications
        </button>
        <button
          className={`tab ${activeTab === 'view' ? 'active' : ''}`}
          onClick={() => setActiveTab('view')}
        >
          View Preferences
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'global' && (
          <div className="settings-section">
            <h3>Global Settings</h3>
            
            <div className="setting-group">
              <label>Default Board View</label>
              <select
                value={globalSettings.defaultBoardView}
                onChange={(e) => setGlobalSettings({ ...globalSettings, defaultBoardView: e.target.value })}
              >
                <option value="list">List</option>
                <option value="grid">Grid</option>
                <option value="kanban">Kanban</option>
              </select>
            </div>

            <div className="setting-group">
              <label>Timezone</label>
              <select
                value={globalSettings.timezone}
                onChange={(e) => setGlobalSettings({ ...globalSettings, timezone: e.target.value })}
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
              </select>
            </div>

            <div className="setting-group">
              <label>Date Format</label>
              <select
                value={globalSettings.dateFormat}
                onChange={(e) => setGlobalSettings({ ...globalSettings, dateFormat: e.target.value })}
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>

            <div className="setting-group">
              <label>Currency Symbol</label>
              <select
                value={globalSettings.currencySymbol}
                onChange={(e) => setGlobalSettings({ ...globalSettings, currencySymbol: e.target.value })}
              >
                <option value="$">$ (USD)</option>
                <option value="€">€ (EUR)</option>
                <option value="£">£ (GBP)</option>
                <option value="¥">¥ (JPY)</option>
              </select>
            </div>

            <div className="setting-group">
              <label>Theme</label>
              <select
                value={globalSettings.theme}
                onChange={(e) => setGlobalSettings({ ...globalSettings, theme: e.target.value })}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>

            <button onClick={handleSaveGlobal} className="save-button" disabled={saving}>
              {saving ? 'Saving...' : 'Save Global Settings'}
            </button>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="settings-section">
            <h3>Notification Settings</h3>

            <div className="setting-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={notificationSettings.emailEnabled}
                  onChange={(e) => setNotificationSettings({ 
                    ...notificationSettings, 
                    emailEnabled: e.target.checked 
                  })}
                />
                <span>Enable Email Notifications</span>
              </label>
            </div>

            <div className="setting-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={notificationSettings.inAppEnabled}
                  onChange={(e) => setNotificationSettings({ 
                    ...notificationSettings, 
                    inAppEnabled: e.target.checked 
                  })}
                />
                <span>Enable In-App Notifications</span>
              </label>
            </div>

            <h4>Notification Types</h4>

            <div className="setting-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={notificationSettings.notifyOnWarnings}
                  onChange={(e) => setNotificationSettings({ 
                    ...notificationSettings, 
                    notifyOnWarnings: e.target.checked 
                  })}
                />
                <span>Deal Warnings</span>
              </label>
            </div>

            <div className="setting-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={notificationSettings.notifyOnTaskAssignments}
                  onChange={(e) => setNotificationSettings({ 
                    ...notificationSettings, 
                    notifyOnTaskAssignments: e.target.checked 
                  })}
                />
                <span>Task Assignments</span>
              </label>
            </div>

            <div className="setting-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={notificationSettings.notifyOnComments}
                  onChange={(e) => setNotificationSettings({ 
                    ...notificationSettings, 
                    notifyOnComments: e.target.checked 
                  })}
                />
                <span>Comments</span>
              </label>
            </div>

            <div className="setting-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={notificationSettings.notifyOnRiskEscalations}
                  onChange={(e) => setNotificationSettings({ 
                    ...notificationSettings, 
                    notifyOnRiskEscalations: e.target.checked 
                  })}
                />
                <span>Risk Escalations</span>
              </label>
            </div>

            <h4>Digest Options</h4>

            <div className="setting-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={notificationSettings.dailyDigestEnabled}
                  onChange={(e) => setNotificationSettings({ 
                    ...notificationSettings, 
                    dailyDigestEnabled: e.target.checked 
                  })}
                />
                <span>Daily Digest Email</span>
              </label>
            </div>

            <div className="setting-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={notificationSettings.weeklySummaryEnabled}
                  onChange={(e) => setNotificationSettings({ 
                    ...notificationSettings, 
                    weeklySummaryEnabled: e.target.checked 
                  })}
                />
                <span>Weekly Summary Email</span>
              </label>
            </div>

            <button onClick={handleSaveNotifications} className="save-button" disabled={saving}>
              {saving ? 'Saving...' : 'Save Notification Settings'}
            </button>
          </div>
        )}

        {activeTab === 'view' && (
          <div className="settings-section">
            <h3>View Preferences</h3>
            <p className="info-text">
              View preferences are saved per board. Configure columns, sorting, and grouping 
              options directly on each board, and your preferences will be saved automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;
