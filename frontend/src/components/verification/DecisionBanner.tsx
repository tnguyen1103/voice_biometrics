import type { VerificationResult } from '../../types';
import { DECISION_COLORS } from '../../styles/theme';

const DECISION_CONFIG = {
  match: {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
    title: 'Identity Verified',
    actionLabel: 'Allow SIM Swap to Proceed',
  },
  uncertain: {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    title: 'Identity Uncertain',
    actionLabel: 'Step-Up Verification Required',
  },
  fraud_suspected: {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
    title: 'Fraud Suspected',
    actionLabel: 'Freeze Account & Route to Manual Review',
  },
} as const;

interface DecisionBannerProps {
  result: VerificationResult;
}

export function DecisionBanner({ result }: DecisionBannerProps) {
  const cfg = DECISION_CONFIG[result.decision];
  const colors = DECISION_COLORS[result.decision];

  return (
    <div
      style={{
        background: colors.bg,
        border: `1.5px solid ${colors.border}`,
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
      }}
    >
      <div style={{ color: colors.text, flexShrink: 0, marginTop: 2 }}>{cfg.icon}</div>
      <div>
        <p style={{ fontSize: 17, fontWeight: 700, color: colors.text }}>{cfg.title}</p>
        <p style={{ fontSize: 14, color: colors.text, opacity: 0.85, marginTop: 3 }}>
          <strong>Recommended Action:</strong> {cfg.actionLabel}
        </p>
        <p style={{ fontSize: 13, color: colors.text, opacity: 0.7, marginTop: 8, maxWidth: 600 }}>
          {result.notes}
        </p>
      </div>
      <div style={{ marginLeft: 'auto', flexShrink: 0, textAlign: 'right' }}>
        <p style={{ fontSize: 11, color: colors.text, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600 }}>Risk Level</p>
        <p style={{ fontSize: 20, fontWeight: 700, color: colors.text }}>{result.risk_level.toUpperCase()}</p>
      </div>
    </div>
  );
}
