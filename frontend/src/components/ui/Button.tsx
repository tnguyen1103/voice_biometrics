import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

const STYLES: Record<string, React.CSSProperties> = {
  primary: { background: 'var(--color-primary)', color: '#fff', border: 'none' },
  secondary: { background: '#fff', color: 'var(--color-primary)', border: '1.5px solid var(--color-primary)' },
  danger: { background: 'var(--color-fraud)', color: '#fff', border: 'none' },
  ghost: { background: 'transparent', color: 'var(--color-text)', border: '1.5px solid var(--color-border)' },
};

const SIZES: Record<string, React.CSSProperties> = {
  sm: { padding: '6px 14px', fontSize: 13 },
  md: { padding: '9px 20px', fontSize: 14 },
  lg: { padding: '12px 28px', fontSize: 15 },
};

export function Button({ variant = 'primary', size = 'md', loading, children, disabled, style, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={{
        ...STYLES[variant],
        ...SIZES[size],
        borderRadius: 'var(--radius-md)',
        fontFamily: 'var(--font-sans)',
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        transition: 'opacity 0.15s, background 0.15s',
        ...style,
      }}
    >
      {loading && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
          </path>
        </svg>
      )}
      {children}
    </button>
  );
}
