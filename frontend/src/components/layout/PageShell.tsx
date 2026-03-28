import type { ReactNode } from 'react';

interface PageShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function PageShell({ title, subtitle, children }: PageShellProps) {
  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, width: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.3px' }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 14, color: 'var(--color-text-subtle)', marginTop: 4 }}>{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}
