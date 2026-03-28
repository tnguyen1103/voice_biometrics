export const colors = {
  primary: '#003A8F',
  primaryHover: '#002d70',
  secondary: '#0070F3',
  secondaryHover: '#005cd1',
  accent: '#00A6A6',
  bg: '#F5F7FA',
  surface: '#FFFFFF',
  text: '#1F2937',
  textSubtle: '#6B7280',
  border: '#E5E7EB',
  match: '#059669',
  matchBg: '#ECFDF5',
  uncertain: '#D97706',
  uncertainBg: '#FFFBEB',
  fraud: '#DC2626',
  fraudBg: '#FEF2F2',
} as const;

export const DECISION_COLORS = {
  match: { text: colors.match, bg: colors.matchBg, border: '#A7F3D0' },
  uncertain: { text: colors.uncertain, bg: colors.uncertainBg, border: '#FDE68A' },
  fraud_suspected: { text: colors.fraud, bg: colors.fraudBg, border: '#FECACA' },
} as const;
