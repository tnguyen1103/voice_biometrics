import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AudioRecorder } from '../components/audio/AudioRecorder';
import { FileUploader } from '../components/ui/FileUploader';
import { PipelineStatus } from '../components/verification/PipelineStatus';
import { useVerification } from '../hooks/useVerification';

type InputMode = 'record' | 'upload';

export default function VerificationPage() {
  const navigate = useNavigate();
  const { phase, statusData, result, error, begin, reset } = useVerification();
  const [customerId, setCustomerId] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('record');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const getAudio = () => (inputMode === 'record' ? audioBlob : selectedFile);

  const handleStart = async () => {
    const audio = getAudio();
    if (!customerId.trim()) { setFormError('Customer ID is required'); return; }
    if (!audio) { setFormError('Please record or upload a call recording'); return; }
    setFormError(null);
    await begin(customerId.trim(), audio);
  };

  const handleReset = () => {
    reset();
    setAudioBlob(null);
    setSelectedFile(null);
    setFormError(null);
  };

  const pipelineStep = statusData?.pipeline_step ?? 0;

  return (
    <PageShell title="Verify Caller" subtitle="Analyze a call recording to detect potential SIM swap fraud">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <CardHeader title="Caller Information" />
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Customer ID *</label>
            <input
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="e.g. CUST_001"
              disabled={phase !== 'idle'}
              style={{ width: '100%', padding: '9px 12px', fontSize: 14, border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-sans)', outline: 'none', background: phase !== 'idle' ? '#f9fafb' : '#fff' }}
            />
          </Card>

          <Card>
            <CardHeader
              title="Call Recording"
              subtitle="Record or upload the support call between agent and customer"
            />
            <div style={{ display: 'flex', gap: 0, marginBottom: 16, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', width: 'fit-content' }}>
              {(['record', 'upload'] as InputMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setInputMode(mode)}
                  disabled={phase !== 'idle'}
                  style={{
                    padding: '7px 18px', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
                    background: inputMode === mode ? 'var(--color-primary)' : '#fff',
                    color: inputMode === mode ? '#fff' : 'var(--color-text)',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {mode === 'record' ? 'Record Call' : 'Upload File'}
                </button>
              ))}
            </div>

            {inputMode === 'record' ? (
              <AudioRecorder onAudioReady={setAudioBlob} onReset={() => setAudioBlob(null)} />
            ) : (
              <FileUploader onFileSelect={setSelectedFile} selectedFile={selectedFile} />
            )}

            {(formError || (error && phase === 'failed')) && (
              <p style={{ marginTop: 12, fontSize: 13, color: 'var(--color-fraud)', padding: '8px 12px', background: 'var(--color-fraud-bg)', borderRadius: 'var(--radius-md)' }}>
                {formError || error}
              </p>
            )}

            {phase === 'idle' && (
              <Button style={{ marginTop: 16, width: '100%', justifyContent: 'center' }} onClick={handleStart}>
                Start Verification
              </Button>
            )}

            {phase === 'failed' && (
              <Button variant="secondary" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }} onClick={handleReset}>
                Try Again
              </Button>
            )}
          </Card>
        </div>

        {/* Right column — pipeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <CardHeader title="How It Works" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: '🎙', text: 'Record or upload the support call (20–60 seconds ideal)' },
                { icon: '🔍', text: 'AssemblyAI separates agent and customer speech' },
                { icon: '🧬', text: 'Customer voice is compared against enrolled voiceprint' },
                { icon: '⚡', text: 'Fraud decision returned in seconds' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <p style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.5 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </Card>

          {(phase === 'uploading' || phase === 'processing' || phase === 'completed') && (
            <Card>
              <CardHeader
                title={phase === 'completed' ? 'Analysis Complete' : 'Processing...'}
                subtitle={phase === 'processing' ? `Status: ${statusData?.status ?? 'initializing'}` : undefined}
              />
              <PipelineStatus currentStep={phase === 'completed' ? 5 : pipelineStep} isFailed={false} />
              {phase === 'completed' && result && (
                <Button
                  style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}
                  onClick={() => navigate(`/result/${result.session_id}`)}
                >
                  View Full Results
                </Button>
              )}
            </Card>
          )}
        </div>
      </div>
    </PageShell>
  );
}
