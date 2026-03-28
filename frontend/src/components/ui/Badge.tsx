import { DECISION_COLORS } from '../../styles/theme';

type BadgeVariant = 'match' | 'uncertain' | 'fraud_suspected' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

const VARIANT_STYLES: Record<BadgeVariant, React.CSSProperties> = {
  match: { background: DECISION_COLORS.match.bg, color: DECISION_COLORS.match.text, border: `1px solid ${DECISION_COLORS.match.border}` },
  uncertain: { background: DECISION_COLORS.uncertain.bg, color: DECISION_COLORS.uncertain.text, border: `1px solid ${DECISION_COLORS.uncertain.border}` },
  fraud_suspected: { background: DECISION_COLORS.fraud_suspected.bg, color: DECISION_COLORS.fraud_suspected.text, border: `1px solid ${DECISION_COLORS.fraud_suspected.border}` },
  success: { background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' },
  warning: { background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' },
  error: { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' },
  info: { background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' },
  neutral: { background: '#F9FAFB', color: '#6B7280', border: '1px solid #E5E7EB' },
};

const DECISION_LABELS: Partial<Record<BadgeVariant, string>> = {
  match: 'Match',
  uncertain: 'Uncertain',
  fraud_suspected: 'Fraud Suspected',
};

interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
}

export function Badge({ variant, label }: BadgeProps) {
  const text = label ?? DECISION_LABELS[variant] ?? variant;
  return (
    <span
      style={{
        ...VARIANT_STYLES[variant],
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.2px',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  );
}
