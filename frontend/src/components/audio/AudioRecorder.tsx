import { useEffect } from 'react';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { Button } from '../ui/Button';

interface AudioRecorderProps {
  onAudioReady: (blob: Blob) => void;
  onReset?: () => void;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export function AudioRecorder({ onAudioReady, onReset }: AudioRecorderProps) {
  const { state, audioBlob, audioUrl, elapsedSeconds, startRecording, stopRecording, reset, error } = useAudioRecorder();

  useEffect(() => {
    if (audioBlob) onAudioReady(audioBlob);
  }, [audioBlob, onAudioReady]);

  const handleReset = () => {
    reset();
    onReset?.();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {state === 'idle' && (
        <Button variant="primary" onClick={startRecording}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round"/>
            <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Start Recording
        </Button>
      )}

      {state === 'recording' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'var(--color-fraud)',
                animation: 'pulse 1s infinite',
              }}
            />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-fraud)' }}>
              Recording — {formatTime(elapsedSeconds)}
            </span>
          </div>
          <Button variant="danger" onClick={stopRecording}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="1"/>
            </svg>
            Stop Recording
          </Button>
        </div>
      )}

      {state === 'stopped' && audioUrl && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-match)" strokeWidth="2" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span style={{ fontSize: 13, color: 'var(--color-match)', fontWeight: 500 }}>
              Recording complete ({formatTime(elapsedSeconds)})
            </span>
          </div>
          <audio controls src={audioUrl} style={{ width: '100%', height: 36 }} />
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Re-record
          </Button>
        </div>
      )}

      {error && (
        <p style={{ fontSize: 13, color: 'var(--color-fraud)', padding: '8px 12px', background: 'var(--color-fraud-bg)', borderRadius: 'var(--radius-md)' }}>
          {error}
        </p>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}
