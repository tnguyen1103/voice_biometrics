import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DecisionBanner } from '../components/verification/DecisionBanner';
import { ScoreGauge } from '../components/verification/ScoreGauge';
import { SpeakerTimeline } from '../components/verification/SpeakerTimeline';
import { getVerificationResult } from '../api/verificationApi';
import type { VerificationSession } from '../types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const ACTION_LABELS = {
  allow_sim_swap: 'Allow SIM Swap',
  step_up_verification: 'Request Step-Up Verification',
  freeze_account: 'Freeze Account',
};

const ACTION_VARIANTS = {
  allow_sim_swap: 'primary',
  step_up_verification: 'secondary',
  freeze_account: 'danger',
} as const;

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<VerificationSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getVerificationResult(id)
      .then(setSession)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <PageShell title="Verification Result">
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: 'var(--color-text-subtle)' }}>Loading result...</p>
        </Card>
      </PageShell>
    );
  }

  if (error || !session) {
    return (
      <PageShell title="Verification Result">
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: 'var(--color-fraud)' }}>{error || 'Session not found'}</p>
          <Link to="/verify"><Button variant="secondary" style={{ marginTop: 16 }}>Back to Verification</Button></Link>
        </Card>
      </PageShell>
    );
  }

  const r = session.result;

  return (
    <PageShell
      title="Verification Result"
      subtitle={`Session ${session.session_id.slice(0, 8)}... · ${formatDate(session.created_at)}`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {r && <DecisionBanner result={r} />}

        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16 }}>
          {/* Score Gauge */}
          {r && (
            <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <ScoreGauge score={r.score} size={160} />
              <p style={{ fontSize: 11, color: 'var(--color-text-subtle)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Voice Match Score
              </p>
            </Card>
          )}

          {/* Decision Details */}
          {r && (
            <Card>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Decision Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Decision', value: r.decision.replace('_', ' ').toUpperCase() },
                  { label: 'Risk Level', value: r.risk_level.toUpperCase() },
                  { label: 'Customer Speech', value: `${r.customer_speech_seconds}s` },
                  { label: 'Detected Speaker', value: r.selected_speaker },
                  { label: 'Customer', value: session.customer_id },
                  { label: 'Verified At', value: formatDate(session.updated_at) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: '10px 14px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
                    <p style={{ fontSize: 14, fontWeight: 600, marginTop: 3 }}>{value}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Speaker Timeline */}
        {r && r.transcript_segments.length > 0 && (
          <Card>
            <SpeakerTimeline
              segments={r.transcript_segments}
              selectedSpeaker={r.selected_speaker}
            />
          </Card>
        )}

        {/* Transcript Table */}
        {r && r.transcript_segments.length > 0 && (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600 }}>Customer Transcript Segments</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg)' }}>
                  {['Speaker', 'Text', 'Duration', 'Time'].map((h) => (
                    <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--color-border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {r.transcript_segments.map((seg, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{seg.speaker}</td>
                    <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--color-text)' }}>{seg.text}</td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--color-text-subtle)', whiteSpace: 'nowrap' }}>{seg.audio_duration_s.toFixed(1)}s</td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--color-text-subtle)', whiteSpace: 'nowrap' }}>{(seg.start_ms / 1000).toFixed(1)}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* Action buttons */}
        {r && (
          <Card>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Operator Actions</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-subtle)', marginBottom: 16 }}>
              Based on the voice analysis, the recommended action is: <strong>{ACTION_LABELS[r.recommended_action]}</strong>
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Button variant={ACTION_VARIANTS[r.recommended_action]}>
                {ACTION_LABELS[r.recommended_action]}
              </Button>
              <Button variant="ghost" onClick={() => window.history.back()}>Back</Button>
              <Link to="/verify"><Button variant="ghost">New Verification</Button></Link>
            </div>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
