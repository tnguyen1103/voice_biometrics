type StepState = 'pending' | 'active' | 'complete' | 'error';

interface Step {
  label: string;
  description: string;
}

const STEPS: Step[] = [
  { label: 'Audio Uploaded', description: 'Call recording received' },
  { label: 'Sending to AssemblyAI', description: 'Submitting for transcription' },
  { label: 'Speaker Diarization', description: 'Separating speakers in the call' },
  { label: 'Customer Identified', description: 'Detecting caller voice' },
  { label: 'Voice Comparison', description: 'Matching against enrolled voiceprint' },
  { label: 'Decision Generated', description: 'Fraud risk assessment complete' },
];

function getStepState(index: number, currentStep: number, isFailed: boolean): StepState {
  if (isFailed && index === currentStep) return 'error';
  if (index < currentStep) return 'complete';
  if (index === currentStep) return 'active';
  return 'pending';
}

interface PipelineStatusProps {
  currentStep: number;
  isFailed?: boolean;
}

export function PipelineStatus({ currentStep, isFailed = false }: PipelineStatusProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {STEPS.map((step, i) => {
        const state = getStepState(i, currentStep, isFailed);
        return (
          <div key={i} style={{ display: 'flex', gap: 14, position: 'relative' }}>
            {/* connector line */}
            {i < STEPS.length - 1 && (
              <div
                style={{
                  position: 'absolute',
                  left: 15,
                  top: 32,
                  width: 2,
                  height: 28,
                  background: state === 'complete' ? 'var(--color-match)' : 'var(--color-border)',
                  transition: 'background 0.3s',
                }}
              />
            )}
            {/* icon */}
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  state === 'complete' ? 'var(--color-match)' :
                  state === 'active' ? 'var(--color-secondary)' :
                  state === 'error' ? 'var(--color-fraud)' :
                  'var(--color-border)',
                color: state === 'pending' ? 'var(--color-text-subtle)' : '#fff',
                transition: 'background 0.3s',
                zIndex: 1,
              }}
            >
              {state === 'complete' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              ) : state === 'active' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>
                  </path>
                </svg>
              ) : state === 'error' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              ) : (
                <span style={{ fontSize: 12, fontWeight: 600 }}>{i + 1}</span>
              )}
            </div>
            {/* text */}
            <div style={{ paddingBottom: 20, paddingTop: 4 }}>
              <p style={{
                fontSize: 14,
                fontWeight: state === 'active' ? 600 : 500,
                color:
                  state === 'active' ? 'var(--color-secondary)' :
                  state === 'complete' ? 'var(--color-text)' :
                  state === 'error' ? 'var(--color-fraud)' :
                  'var(--color-text-subtle)',
              }}>
                {step.label}
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-text-subtle)', marginTop: 1 }}>
                {step.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
