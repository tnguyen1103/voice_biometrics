import { useState } from 'react';
import { PageShell } from '../components/layout/PageShell';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AudioRecorder } from '../components/audio/AudioRecorder';
import { FileUploader } from '../components/ui/FileUploader';
import { enrollCustomer, getEnrollmentStatus } from '../api/enrollApi';

type InputMode = 'record' | 'upload';
type EnrollPhase = 'idle' | 'submitting' | 'processing' | 'completed' | 'failed';

const STATUS_TO_STEP: Record<string, number> = {
  uploaded: 0, processing: 1, completed: 2, failed: -1,
};

const ENROLLMENT_STEPS = [
  { label: 'Audio Uploaded', description: 'Voice sample received' },
  { label: 'Processing Voice', description: 'Extracting speaker characteristics' },
  { label: 'Enrollment Complete', description: 'Voiceprint saved successfully' },
];

function SimpleSteps({ step, isFailed }: { step: number; isFailed: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {ENROLLMENT_STEPS.map((s, i) => {
        const state = isFailed && i === step ? 'error' : i < step ? 'complete' : i === step ? 'active' : 'pending';
        return (
          <div key={i} style={{ display: 'flex', gap: 12, position: 'relative' }}>
            {i < ENROLLMENT_STEPS.length - 1 && (
              <div style={{ position: 'absolute', left: 14, top: 30, width: 2, height: 28, background: state === 'complete' ? 'var(--color-match)' : 'var(--color-border)' }} />
            )}
            <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: state === 'complete' ? 'var(--color-match)' : state === 'active' ? 'var(--color-secondary)' : state === 'error' ? 'var(--color-fraud)' : 'var(--color-border)', color: state === 'pending' ? 'var(--color-text-subtle)' : '#fff', zIndex: 1 }}>
              {state === 'complete' ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> :
               state === 'active' ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/></path></svg> :
               <span style={{ fontSize: 11, fontWeight: 600 }}>{i + 1}</span>}
            </div>
            <div style={{ paddingBottom: 18, paddingTop: 3 }}>
              <p style={{ fontSize: 13, fontWeight: state === 'active' ? 600 : 500, color: state === 'active' ? 'var(--color-secondary)' : state === 'complete' ? 'var(--color-text)' : 'var(--color-text-subtle)' }}>{s.label}</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>{s.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function EnrollPage() {
  const [customerId, setCustomerId] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('record');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<EnrollPhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [pipelineStep, setPipelineStep] = useState(0);

  const getAudio = () => {
    if (inputMode === 'record') return audioBlob;
    return selectedFile;
  };

  const handleSubmit = async () => {
    const audio = getAudio();
    if (!customerId.trim()) { setError('Customer ID is required'); return; }
    if (!audio) { setError('Please record or upload an audio file'); return; }
    setError(null);
    setPhase('submitting');

    try {
      await enrollCustomer(customerId.trim(), audio);
      setPhase('processing');
      setPipelineStep(0);

      const poll = async () => {
        const record = await getEnrollmentStatus(customerId.trim());
        setPipelineStep(STATUS_TO_STEP[record.status] ?? 0);
        if (record.status === 'completed') { setPhase('completed'); return; }
        if (record.status === 'failed') { setError(record.error || 'Enrollment failed'); setPhase('failed'); return; }
        setTimeout(poll, 2000);
      };
      setTimeout(poll, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Enrollment error';
      setError(msg);
      setPhase('failed');
    }
  };

  const reset = () => {
    setPhase('idle');
    setAudioBlob(null);
    setSelectedFile(null);
    setError(null);
    setPipelineStep(0);
  };

  return (
    <PageShell title="Enroll Customer" subtitle="Register a new voiceprint for SIM swap verification">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <CardHeader title="Customer Information" />
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Customer ID *</label>
              <input
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder="e.g. CUST_001"
                disabled={phase !== 'idle'}
                style={{ width: '100%', padding: '9px 12px', fontSize: 14, border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-sans)', outline: 'none', background: phase !== 'idle' ? '#f9fafb' : '#fff' }}
              />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Voice Sample"
              subtitle='Ask the customer to say: "I am the account holder and this is my voice verification"'
            />
            {/* Tab toggle */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 16, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', width: 'fit-content' }}>
              {(['record', 'upload'] as InputMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setInputMode(mode)}
                  disabled={phase !== 'idle'}
                  style={{
                    padding: '7px 18px',
                    fontSize: 13,
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer',
                    background: inputMode === mode ? 'var(--color-primary)' : '#fff',
                    color: inputMode === mode ? '#fff' : 'var(--color-text)',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {mode === 'record' ? 'Record' : 'Upload File'}
                </button>
              ))}
            </div>

            {inputMode === 'record' ? (
              <AudioRecorder onAudioReady={setAudioBlob} onReset={() => setAudioBlob(null)} />
            ) : (
              <FileUploader onFileSelect={setSelectedFile} selectedFile={selectedFile} />
            )}

            {error && phase !== 'failed' && (
              <p style={{ marginTop: 12, fontSize: 13, color: 'var(--color-fraud)' }}>{error}</p>
            )}

            {phase === 'idle' && (
              <Button style={{ marginTop: 16, width: '100%', justifyContent: 'center' }} onClick={handleSubmit}>
                Enroll Customer
              </Button>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <CardHeader title="Instructions" />
            <ol style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Enter the customer\'s unique ID',
                'Record or upload a voice sample (min. 5 seconds)',
                'Ask the customer to say the verification phrase',
                'Submit and wait for enrollment to complete',
              ].map((step, i) => (
                <li key={i} style={{ fontSize: 13, color: 'var(--color-text)' }}>{step}</li>
              ))}
            </ol>
            <div style={{ marginTop: 16, padding: 12, background: '#EFF6FF', borderRadius: 'var(--radius-md)', border: '1px solid #BFDBFE' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#1D4ED8', marginBottom: 4 }}>Verification Phrase</p>
              <p style={{ fontSize: 13, color: '#1D4ED8', fontStyle: 'italic' }}>
                "I am the account holder and this is my voice verification"
              </p>
            </div>
          </Card>

          {(phase === 'processing' || phase === 'submitting' || phase === 'completed' || phase === 'failed') && (
            <Card>
              <CardHeader title="Enrollment Status" />
              <SimpleSteps step={phase === 'completed' ? 3 : pipelineStep} isFailed={phase === 'failed'} />
              {phase === 'completed' && (
                <div style={{ marginTop: 12, padding: 12, background: 'var(--color-match-bg)', borderRadius: 'var(--radius-md)', border: '1px solid #A7F3D0' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-match)' }}>Enrollment Complete</p>
                  <p style={{ fontSize: 12, color: 'var(--color-match)', marginTop: 3 }}>
                    Customer <strong>{customerId}</strong> is ready for voice verification.
                  </p>
                  <button onClick={reset} style={{ marginTop: 10, fontSize: 12, color: 'var(--color-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-sans)' }}>
                    Enroll another customer
                  </button>
                </div>
              )}
              {phase === 'failed' && (
                <div style={{ marginTop: 12, padding: 12, background: 'var(--color-fraud-bg)', borderRadius: 'var(--radius-md)', border: '1px solid #FECACA' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-fraud)' }}>Enrollment Failed</p>
                  <p style={{ fontSize: 12, color: 'var(--color-fraud)', marginTop: 3 }}>{error}</p>
                  <button onClick={reset} style={{ marginTop: 10, fontSize: 12, color: 'var(--color-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-sans)' }}>
                    Try again
                  </button>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </PageShell>
  );
}
