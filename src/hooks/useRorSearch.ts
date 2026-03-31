import { useState, useEffect, useRef, useCallback } from 'react';
import type { RorSearchResult } from '@/types';
import { searchRor } from '@/lib/ror-client';

interface UseRorSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
}

interface UseRorSearchReturn {
  results: RorSearchResult[];
  isLoading: boolean;
  error: string | null;
  search: (query: string) => void;
  clear: () => void;
}

/**
 * Debounced ROR search hook
 * - Debounces API calls (default 300ms)
 * - Requires minimum query length (default 2 chars)
 * - Tracks loading state
 * - Handles errors gracefully
 */
export function useRorSearch(options: UseRorSearchOptions = {}): UseRorSearchReturn {
  const { debounceMs = 300, minQueryLength = 2 } = options;

  const [results, setResults] = useState<RorSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
    setIsLoading(false);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const search = useCallback(
    (query: string) => {
      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Clear results if query is too short
      if (query.trim().length < minQueryLength) {
        setResults([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      debounceTimerRef.current = setTimeout(async () => {
        // Cancel any pending request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        try {
          const searchResults = await searchRor(query);
          setResults(searchResults);
          setError(null);
        } catch (err) {
          // Only set error if not aborted
          if (err instanceof Error && err.name !== 'AbortError') {
            setError('Search failed. Please try again.');
            setResults([]);
          }
        } finally {
          setIsLoading(false);
        }
      }, debounceMs);
    },
    [debounceMs, minQueryLength]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { results, isLoading, error, search, clear };
}
