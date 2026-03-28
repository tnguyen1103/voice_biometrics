import { useState, useEffect, useRef, useCallback } from 'react';

interface UsePollingOptions<T> {
  fetchFn: () => Promise<T>;
  shouldStop: (data: T) => boolean;
  intervalMs?: number;
  enabled?: boolean;
}

interface UsePollingReturn<T> {
  data: T | null;
  error: string | null;
  isPolling: boolean;
}

export function usePolling<T>({
  fetchFn,
  shouldStop,
  intervalMs = 2000,
  enabled = true,
}: UsePollingOptions<T>): UsePollingReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stoppedRef = useRef(false);

  const poll = useCallback(async () => {
    try {
      const result = await fetchFn();
      setData(result);
      setError(null);
      if (shouldStop(result)) {
        stoppedRef.current = true;
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsPolling(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Polling error';
      setError(msg);
    }
  }, [fetchFn, shouldStop]);

  useEffect(() => {
    if (!enabled) return;
    stoppedRef.current = false;
    setIsPolling(true);
    poll();
    intervalRef.current = setInterval(() => {
      if (!stoppedRef.current) poll();
    }, intervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, intervalMs, poll]);

  return { data, error, isPolling };
}
