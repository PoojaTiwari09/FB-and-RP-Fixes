import React from 'react';

/**
 * Compliance & Access Controls — BRD §6.7 (RG-27 through RG-30)
 * SOC 2 Type II, HIPAA, PCI DSS, GDPR/DFF, STAR Level 1
 * Encryption, RBAC, data retention policies.
 */

export function ComplianceTab({ compliance }: { compliance: any }) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 16 }}>Compliance & Access Controls</div>
        <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
          RG-27 through RG-30 · Security standards, encryption, RBAC, and data retention
        </div>
      </div>

      {/* Standards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
        {compliance.standards.map((std: any) => (
          <div key={std.name} style={{
            background: 'rgba(8,14,30,0.55)', border: '1px solid rgba(16,185,129,0.15)',
            borderRadius: 12, padding: '20px', textAlign: 'center' as const,
          }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>{std.icon}</div>
            <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 14, marginBottom: 6 }}>{std.name}</div>
            <span style={{
              background: 'rgba(16,185,129,0.12)', color: '#10b981',
              padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700,
              border: '1px solid rgba(16,185,129,0.25)', textTransform: 'uppercase' as const, letterSpacing: .5,
            }}>✓ {std.status}</span>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>Last audit: {std.lastAudit}</div>
          </div>
        ))}
      </div>

      {/* Encryption + RBAC + Retention */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        {/* Encryption */}
        <div style={{ background: 'rgba(8,14,30,0.55)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px' }}>
          <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🔐</span> Encryption (RG-30)
          </div>
          {[
            { label: 'In Transit', value: compliance.encryption.inTransit },
            { label: 'At Rest', value: compliance.encryption.atRest },
            { label: 'Credential Store', value: compliance.encryption.credentialStore },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ color: '#94a3b8', fontSize: 12 }}>{row.label}</span>
              <span style={{ color: '#10b981', fontSize: 12, fontWeight: 600 }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* RBAC */}
        <div style={{ background: 'rgba(8,14,30,0.55)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px' }}>
          <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>👤</span> Role-Based Access (RG-29)
          </div>
          {[
            { label: 'Total Roles', value: compliance.rbac.totalRoles },
            { label: 'Active Users', value: compliance.rbac.activeUsers },
            { label: 'Policies Configured', value: compliance.rbac.policiesConfigured },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ color: '#94a3b8', fontSize: 12 }}>{row.label}</span>
              <span style={{ color: '#38bdf8', fontSize: 12, fontWeight: 600 }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Retention */}
        <div style={{ background: 'rgba(8,14,30,0.55)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px' }}>
          <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>📦</span> Data Retention (RG-28)
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ color: '#94a3b8', fontSize: 12 }}>Retention Period</span>
            <span style={{ color: '#f59e0b', fontSize: 12, fontWeight: 600 }}>{compliance.retentionPolicy}</span>
          </div>
          <div style={{ marginTop: 14, fontSize: 11, color: '#64748b', lineHeight: 1.6 }}>
            Admins can configure data access policies, user permissions, and data retention rules to align with organisational compliance requirements.
          </div>
        </div>
      </div>
    </div>
  );
}
