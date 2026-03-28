import { useState } from 'react';
import type { SpeakerSegment } from '../../types';

interface SpeakerTimelineProps {
  segments: SpeakerSegment[];
  selectedSpeaker: string;
  totalDurationMs?: number;
}

export function SpeakerTimeline({ segments, selectedSpeaker, totalDurationMs }: SpeakerTimelineProps) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  if (!segments.length) return null;

  const maxMs = totalDurationMs ?? Math.max(...segments.map((s) => s.end_ms));
  const speakers = [...new Set(segments.map((s) => s.speaker))].sort();

  const customerSpeaker = selectedSpeaker.replace('Speaker ', '');
  const agentSpeaker = speakers.find((s) => s !== customerSpeaker) ?? speakers[0];

  const rows = [
    { label: 'Agent', speaker: agentSpeaker, color: '#94A3B8' },
    { label: 'Customer', speaker: customerSpeaker, color: 'var(--color-secondary)' },
  ];

  return (
    <div style={{ position: 'relative' }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-subtle)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Speaker Timeline
      </p>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ width: 64, fontSize: 12, fontWeight: 600, color: 'var(--color-text-subtle)', textAlign: 'right', flexShrink: 0 }}>
            {row.label}
          </div>
          <div
            style={{
              flex: 1,
              height: 28,
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 4,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {segments
              .filter((s) => s.speaker === row.speaker)
              .map((seg, i) => {
                const left = (seg.start_ms / maxMs) * 100;
                const width = ((seg.end_ms - seg.start_ms) / maxMs) * 100;
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: `${left}%`,
                      width: `${width}%`,
                      top: 3,
                      bottom: 3,
                      background: row.color,
                      borderRadius: 2,
                      cursor: 'default',
                      minWidth: 2,
                    }}
                    onMouseEnter={(e) => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      setTooltip({ text: seg.text, x: rect.left, y: rect.top - 8 });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
          </div>
        </div>
      ))}
      {/* Time labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 76, fontSize: 11, color: 'var(--color-text-subtle)' }}>
        <span>0s</span>
        <span>{Math.round(maxMs / 2000)}s</span>
        <span>{Math.round(maxMs / 1000)}s</span>
      </div>

      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            background: '#1F2937',
            color: '#fff',
            fontSize: 12,
            padding: '6px 10px',
            borderRadius: 6,
            maxWidth: 280,
            pointerEvents: 'none',
            zIndex: 999,
            transform: 'translateY(-100%)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
