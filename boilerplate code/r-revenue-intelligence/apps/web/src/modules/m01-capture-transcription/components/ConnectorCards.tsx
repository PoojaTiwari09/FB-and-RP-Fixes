'use client';
import React, { useCallback, useEffect, useState } from 'react';
import {
  listIntegrations,
  connectProvider,
  disconnectProvider,
  IntegrationStatus,
} from '../api/integrations.api';
import styles from './ConnectorCards.module.css';

export default function ConnectorCards() {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await listIntegrations();
      setIntegrations(data);
    } catch (e) {
      console.error('Failed to load integrations:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleConnect = async (provider: string) => {
    setActing(provider);
    try {
      const res = await connectProvider(provider);
      if (res.authorizationUrl) {
        // Real OAuth — open in new window
        window.open(res.authorizationUrl, '_blank', 'width=600,height=700');
      } else {
        // Demo mode — already connected
        await load();
      }
    } catch (e: any) {
      alert(e.message || 'Connection failed');
    } finally {
      setActing(null);
    }
  };

  const handleDisconnect = async (provider: string) => {
    if (!confirm('Disconnect this integration?')) return;
    setActing(provider);
    try {
      await disconnectProvider(provider);
      await load();
    } catch (e: any) {
      alert(e.message || 'Disconnect failed');
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading connectors…</div>;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3 className={styles.title}>🔗 Connected Services</h3>
        <span className={styles.count}>
          {integrations.filter(i => i.status === 'connected').length}/{integrations.length} active
        </span>
      </div>

      <div className={styles.grid}>
        {integrations.map((integ) => {
          const isConnected = integ.status === 'connected';
          const isBusy = acting === integ.provider;

          return (
            <div
              key={integ.provider}
              className={`${styles.card} ${isConnected ? styles.connected : ''}`}
              style={{ '--accent': integ.color } as React.CSSProperties}
            >
              <div className={styles.cardTop}>
                <span className={styles.icon}>{integ.icon}</span>
                <div className={styles.info}>
                  <span className={styles.name}>{integ.name}</span>
                  {isConnected && integ.accountEmail && (
                    <span className={styles.email}>{integ.accountEmail}</span>
                  )}
                </div>
                <span className={`${styles.badge} ${isConnected ? styles.badgeOn : styles.badgeOff}`}>
                  {isConnected ? '● Connected' : '○ Not connected'}
                </span>
              </div>

              <div className={styles.cardActions}>
                {['teams', 'zoom', 'google_calendar', 'gmail', 'salesforce'].includes(integ.provider) ? (
                  <button
                    className={styles.connectBtn}
                    style={{ background: integ.color }}
                    onClick={() => {
                      let url = '';
                      if (integ.provider === 'teams') url = 'https://teams.microsoft.com/l/meeting/new?subject=Sales%20Meeting';
                      else if (integ.provider === 'zoom') url = 'https://zoom.us/meeting/schedule';
                      else if (integ.provider === 'google_calendar') url = 'https://calendar.google.com/calendar/';
                      else if (integ.provider === 'gmail') url = 'https://mail.google.com/mail/?view=cm&fs=1&su=Sales%20Follow-up';
                      else if (integ.provider === 'salesforce') url = 'https://login.salesforce.com/';
                      
                      window.open(url, '_blank');
                    }}
                  >
                    {integ.provider === 'gmail'
                      ? 'Compose Email'
                      : integ.provider === 'google_calendar'
                      ? 'Add Event'
                      : integ.provider === 'salesforce'
                      ? 'Open Salesforce'
                      : 'Schedule Meeting'}
                  </button>
                ) : isConnected ? (
                  <>
                    <span className={styles.connectedSince}>
                      Since {integ.connectedAt ? new Date(integ.connectedAt).toLocaleDateString() : '—'}
                    </span>
                    <button
                      className={styles.disconnectBtn}
                      onClick={() => handleDisconnect(integ.provider)}
                      disabled={isBusy}
                    >
                      {isBusy ? 'Disconnecting…' : 'Disconnect'}
                    </button>
                  </>
                ) : (
                  <button
                    className={styles.connectBtn}
                    style={{ background: integ.color }}
                    onClick={() => handleConnect(integ.provider)}
                    disabled={isBusy}
                  >
                    {isBusy ? 'Connecting…' : `Connect ${integ.name}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
