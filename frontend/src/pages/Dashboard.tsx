import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { getStats, listVerifications } from '../api/verificationApi';
import type { StatsResponse, VerificationListItem } from '../types';

function StatCard({ label, value, sublabel, color }: { label: string; value: string | number; sublabel?: string; color?: string }) {
  return (
    <Card style={{ flex: 1 }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</p>
      <p style={{ fontSize: 32, fontWeight: 700, color: color || 'var(--color-primary)', marginTop: 6 }}>{value}</p>
      {sublabel && <p style={{ fontSize: 12, color: 'var(--color-text-subtle)', marginTop: 3 }}>{sublabel}</p>}
    </Card>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Dashboard() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [sessions, setSessions] = useState<VerificationListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStats(), listVerifications()])
      .then(([s, v]) => { setStats(s); setSessions(v); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell title="Dashboard" subtitle="Real-time SIM swap fraud prevention overview">
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Enrollments" value={loading ? '—' : (stats?.total_enrollments ?? 0)} sublabel="Registered customers" />
        <StatCard label="Verifications Today" value={loading ? '—' : (stats?.verifications_today ?? 0)} sublabel="Calls analyzed" />
        <StatCard
          label="Fraud Detected"
          value={loading ? '—' : (stats?.fraud_detected ?? 0)}
          sublabel="Freeze-account decisions"
          color="var(--color-fraud)"
        />
        <StatCard
          label="Avg. Confidence"
          value={loading ? '—' : `${Math.round((stats?.avg_score ?? 0) * 100)}%`}
          sublabel="Across all verifications"
          color="var(--color-match)"
        />
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600 }}>Recent Verifications</h2>
          <Link to="/verify" style={{ fontSize: 13, color: 'var(--color-secondary)', fontWeight: 500 }}>
            + New Verification
          </Link>
        </div>
        {sessions.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-subtle)' }}>
            <p style={{ fontSize: 14 }}>No verifications yet.</p>
            <p style={{ fontSize: 13, marginTop: 6 }}>
              Start by <Link to="/enroll" style={{ color: 'var(--color-secondary)' }}>enrolling a customer</Link>, then run a verification.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg)' }}>
                {['Customer ID', 'Timestamp', 'Decision', 'Score', 'Status', ''].map((h) => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--color-border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.session_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px 20px', fontSize: 14, fontWeight: 500 }}>{s.customer_id}</td>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: 'var(--color-text-subtle)' }}>{formatDate(s.created_at)}</td>
                  <td style={{ padding: '12px 20px' }}>
                    {s.decision ? <Badge variant={s.decision as 'match' | 'uncertain' | 'fraud_suspected'} /> : <Badge variant="neutral" label={s.status} />}
                  </td>
                  <td style={{ padding: '12px 20px', fontSize: 14, fontWeight: 600, color: s.score != null ? (s.score >= 0.82 ? 'var(--color-match)' : s.score >= 0.65 ? 'var(--color-uncertain)' : 'var(--color-fraud)') : 'var(--color-text-subtle)' }}>
                    {s.score != null ? `${Math.round(s.score * 100)}%` : '—'}
                  </td>
                  <td style={{ padding: '12px 20px' }}><Badge variant="neutral" label={s.status} /></td>
                  <td style={{ padding: '12px 20px' }}>
                    {s.status === 'completed' && (
                      <Link to={`/result/${s.session_id}`} style={{ fontSize: 13, color: 'var(--color-secondary)', fontWeight: 500 }}>View</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </PageShell>
  );
}
