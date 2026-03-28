interface ScoreGaugeProps {
  score: number; // 0 to 1
  size?: number;
}

function scoreToColor(score: number): string {
  // Red → Amber → Green interpolation
  if (score < 0.65) return '#DC2626';
  if (score < 0.82) return '#D97706';
  return '#059669';
}

export function ScoreGauge({ score, size = 160 }: ScoreGaugeProps) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  // Show 270° arc (start from bottom-left, go clockwise to bottom-right)
  const arcLength = circumference * 0.75;
  const filled = arcLength * Math.min(1, Math.max(0, score));
  const color = scoreToColor(score);
  const pct = Math.round(score * 100);

  // Rotate so 0 starts at bottom-left (-135deg)
  const rotation = -135;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={14}
          strokeDasharray={`${arcLength} ${circumference - arcLength}`}
          strokeDashoffset={circumference * 0.125}
          strokeLinecap="round"
          transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
        />
        {/* Filled arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={14}
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeDashoffset={circumference * 0.125}
          strokeLinecap="round"
          transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        {/* Score text */}
        <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" fontSize={28} fontWeight={700} fill={color} fontFamily="Inter, sans-serif">
          {pct}%
        </text>
        <text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle" fontSize={11} fill="var(--color-text-subtle)" fontFamily="Inter, sans-serif">
          Confidence
        </text>
      </svg>
    </div>
  );
}
