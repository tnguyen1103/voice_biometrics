import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  {
    to: '/',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
    label: 'Dashboard',
  },
  {
    to: '/enroll',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="12" y1="3" x2="12" y2="21" />
      </svg>
    ),
    label: 'Enroll Customer',
  },
  {
    to: '/verify',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    label: 'Verify Caller',
  },
];

export function Sidebar() {
  return (
    <aside
      style={{
        width: 220,
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 0',
        flexShrink: 0,
      }}
    >
      <div style={{ padding: '0 12px', marginBottom: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '0 8px' }}>
          Navigation
        </p>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 12px' }}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
              background: isActive ? '#EEF4FF' : 'transparent',
              transition: 'all 0.15s',
              textDecoration: 'none',
            })}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', padding: '16px 20px', borderTop: '1px solid var(--color-border)' }}>
        <p style={{ fontSize: 11, color: 'var(--color-text-subtle)' }}>AssemblyAI + Resemblyzer</p>
        <p style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginTop: 2 }}>Voice Biometrics Engine</p>
      </div>
    </aside>
  );
}
