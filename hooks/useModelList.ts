
import { useState, useEffect, useRef, useCallback } from 'react';
import { createOpenAIClient } from '../services/openaiClient';
import { processModels, type ModelInfo } from '../services/modelCapabilities';

export interface UseModelListResult {
  models: ModelInfo[];
  isLoading: boolean;
  error: string | null;
  isFiltered: boolean;
  refetch: () => void;
}

interface CachedResult {
  key: string;
  models: ModelInfo[];
  isFiltered: boolean;
}

/**
 * Hook that fetches and filters the list of available models from any
 * OpenAI-compatible API provider.
 *
 * - Does nothing if apiKey or apiEndpoint are empty.
 * - Sends `?detailed=true` query param (NanoGPT needs it for capabilities;
 *   other providers simply ignore it).
 * - Caches results per endpoint+key pair to avoid redundant requests.
 * - Debounces 500ms after endpoint/key changes before fetching.
 */
export function useModelList(apiKey: string, apiEndpoint: string): UseModelListResult {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFiltered, setIsFiltered] = useState(false);

  const cacheRef = useRef<CachedResult | null>(null);
  const fetchIdRef = useRef(0);

  const doFetch = useCallback(async (key: string, endpoint: string) => {
    if (!key || !endpoint) {
      setModels([]);
      setError(null);
      setIsFiltered(false);
      return;
    }

    const cacheKey = `${endpoint}|${key}`;

    // Return cached result if available
    if (cacheRef.current && cacheRef.current.key === cacheKey) {
      setModels(cacheRef.current.models);
      setIsFiltered(cacheRef.current.isFiltered);
      setError(null);
      return;
    }

    const currentFetchId = ++fetchIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const client = createOpenAIClient({ apiKey: key, apiEndpoint: endpoint });

      // Request with detailed=true so NanoGPT returns capabilities.
      // Other providers will simply ignore the unknown query param.
      const page = await client.models.list({ query: { detailed: 'true' } });

      // Stale request guard
      if (currentFetchId !== fetchIdRef.current) return;

      // Collect all models from the paginated response
      const rawModels: Record<string, unknown>[] = [];
      for (const model of page.data) {
        rawModels.push(model as unknown as Record<string, unknown>);
      }

      const result = processModels(rawModels as any);

      // Sort models alphabetically by name
      result.models.sort((a, b) => a.name.localeCompare(b.name));

      cacheRef.current = {
        key: cacheKey,
        models: result.models,
        isFiltered: result.isFiltered,
      };

      setModels(result.models);
      setIsFiltered(result.isFiltered);
    } catch (err) {
      if (currentFetchId !== fetchIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to fetch models');
      setModels([]);
      setIsFiltered(false);
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Debounced auto-fetch when key/endpoint change
  useEffect(() => {
    if (!apiKey || !apiEndpoint) {
      setModels([]);
      setError(null);
      setIsLoading(false);
      setIsFiltered(false);
      return;
    }

    const timer = setTimeout(() => {
      doFetch(apiKey, apiEndpoint);
    }, 500);

    return () => clearTimeout(timer);
  }, [apiKey, apiEndpoint, doFetch]);

  const refetch = useCallback(() => {
    // Invalidate cache and re-fetch
    cacheRef.current = null;
    doFetch(apiKey, apiEndpoint);
  }, [apiKey, apiEndpoint, doFetch]);

  return { models, isLoading, error, isFiltered, refetch };
}
