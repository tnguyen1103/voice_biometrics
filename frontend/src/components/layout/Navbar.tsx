export function Navbar() {
  return (
    <header
      style={{
        background: 'var(--color-primary)',
        color: '#fff',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: 12,
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="6" fill="#0070F3" />
        <path d="M8 20l4-8 4 6 2-4 2 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.3px' }}>VoiceGuard</span>
      <span
        style={{
          marginLeft: 4,
          fontSize: 11,
          fontWeight: 500,
          background: 'rgba(255,255,255,0.15)',
          padding: '2px 8px',
          borderRadius: 20,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}
      >
        SIM Fraud Prevention
      </span>
    </header>
  );
}
