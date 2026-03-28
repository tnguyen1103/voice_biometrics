import { useState, useCallback } from 'react';
import { startVerification, getVerificationStatus, getVerificationResult } from '../api/verificationApi';
import type { VerificationSession, VerificationStatusResponse } from '../types';

type VerificationPhase = 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';

interface UseVerificationReturn {
  phase: VerificationPhase;
  sessionId: string | null;
  statusData: VerificationStatusResponse | null;
  result: VerificationSession | null;
  error: string | null;
  begin: (customerId: string, audio: Blob | File) => Promise<void>;
  reset: () => void;
}

export function useVerification(): UseVerificationReturn {
  const [phase, setPhase] = useState<VerificationPhase>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<VerificationStatusResponse | null>(null);
  const [result, setResult] = useState<VerificationSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  const begin = useCallback(async (customerId: string, audio: Blob | File) => {
    setPhase('uploading');
    setError(null);
    setResult(null);
    setStatusData(null);

    try {
      const { session_id } = await startVerification(customerId, audio);
      setSessionId(session_id);
      setPhase('processing');

      // Poll until completed or failed
      const poll = async () => {
        const status = await getVerificationStatus(session_id);
        setStatusData(status);

        if (status.status === 'completed' || status.status === 'failed') {
          if (status.status === 'completed') {
            const full = await getVerificationResult(session_id);
            setResult(full as VerificationSession);
            setPhase('completed');
          } else {
            setError(status.error || 'Verification failed');
            setPhase('failed');
          }
          return;
        }
        setTimeout(poll, 2000);
      };

      setTimeout(poll, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      setPhase('failed');
    }
  }, []);

  const reset = useCallback(() => {
    setPhase('idle');
    setSessionId(null);
    setStatusData(null);
    setResult(null);
    setError(null);
  }, []);

  return { phase, sessionId, statusData, result, error, begin, reset };
}
