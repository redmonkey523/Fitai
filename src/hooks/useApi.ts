import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import apiService from '../services/api';

export type ApiOptions = {
  method?: string;
  body?: any;
  includeAuth?: boolean;
  isMultipart?: boolean;
  retry?: { max?: number; backoffMs?: number };
};

export type ApiState<T> = {
  data?: T;
  error?: Error & { code?: number };
  loading: boolean;
  request: (path?: string, override?: ApiOptions) => Promise<T | undefined>;
};

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

export default function useApi<T = any>(path: string, options: ApiOptions = {}): ApiState<T> {
  const controllerRef = useRef<AbortController | null>(null);
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const request = useCallback(async (p?: string, override?: ApiOptions) => {
    const endpoint = (p ?? path) || '';
    const opts = { ...options, ...(override || {}) };
    const max = opts.retry?.max ?? 0;
    const backoffMs = opts.retry?.backoffMs ?? 600;
    let attempt = 0;
    setLoading(true);
    setError(undefined);
    controllerRef.current?.abort();
    controllerRef.current = typeof AbortController !== 'undefined' ? new AbortController() : null;
    
    while (true) {
      try {
        // Use canonical ApiService instead of direct fetch
        const json = await apiService.makeRequest(endpoint, {
          method: opts.method || 'GET',
          body: opts.body,
          includeAuth: opts.includeAuth !== false,
          isMultipart: opts.isMultipart,
          silent: true,
        });
        
        setData(json as T);
        setLoading(false);
        return json as T;
      } catch (e: any) {
        if (controllerRef.current?.signal?.aborted) {
          setLoading(false);
          return undefined;
        }
        attempt += 1;
        if (attempt > max) {
          setError(e);
          setLoading(false);
          return undefined;
        }
        await sleep(backoffMs * attempt);
      }
    }
  }, [path, JSON.stringify(options)]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  return useMemo(() => ({ data, error: error as any, loading, request }), [data, error, loading, request]);
}


