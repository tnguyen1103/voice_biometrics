import type { ReactNode, CSSProperties } from 'react';

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function Card({ children, style }: CardProps) {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
        padding: 24,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 13, color: 'var(--color-text-subtle)', marginTop: 3 }}>{subtitle}</p>}
    </div>
  );
}
