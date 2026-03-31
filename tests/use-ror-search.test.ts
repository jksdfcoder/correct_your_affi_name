import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRorSearch } from '@/hooks/useRorSearch';
import * as rorClient from '@/lib/ror-client';

// Mock the ror-client module
vi.mock('@/lib/ror-client', () => ({
  searchRor: vi.fn(),
}));

const mockSearchRor = vi.mocked(rorClient.searchRor);

describe('useRorSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockSearchRor.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useRorSearch());

    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('does not search for queries shorter than minQueryLength', () => {
    const { result } = renderHook(() => useRorSearch({ minQueryLength: 3 }));

    act(() => {
      result.current.search('ab');
    });

    expect(mockSearchRor).not.toHaveBeenCalled();
    expect(result.current.results).toEqual([]);
  });

  it('debounces search calls', async () => {
    mockSearchRor.mockResolvedValue([]);

    const { result } = renderHook(() => useRorSearch({ debounceMs: 300 }));

    act(() => {
      result.current.search('test');
    });

    // Should be loading but not called yet
    expect(result.current.isLoading).toBe(true);
    expect(mockSearchRor).not.toHaveBeenCalled();

    // Fast forward past debounce
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(mockSearchRor).toHaveBeenCalledWith('test');
  });

  it('cancels previous debounce on new search', async () => {
    mockSearchRor.mockResolvedValue([]);

    const { result } = renderHook(() => useRorSearch({ debounceMs: 300 }));

    act(() => {
      result.current.search('first');
    });

    // Before debounce completes, search again
    act(() => {
      vi.advanceTimersByTime(200);
      result.current.search('second');
    });

    // Complete the debounce
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // Should only have called with 'second'
    expect(mockSearchRor).toHaveBeenCalledTimes(1);
    expect(mockSearchRor).toHaveBeenCalledWith('second');
  });

  it('sets results on successful search', async () => {
    const mockResults = [
      { id: 'https://ror.org/123', name: 'Test Uni', aliases: [], country: { country_name: 'US', country_code: 'US' }, addresses: [], types: [] },
    ];
    mockSearchRor.mockResolvedValue(mockResults);

    const { result } = renderHook(() => useRorSearch({ debounceMs: 100 }));

    act(() => {
      result.current.search('test');
    });

    // Advance timers and flush promises
    await act(async () => {
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();
    });

    expect(result.current.results).toEqual(mockResults);
    expect(result.current.isLoading).toBe(false);
  });

  it('clears results and state with clear()', async () => {
    const mockResults = [
      { id: 'https://ror.org/123', name: 'Test Uni', aliases: [], country: { country_name: 'US', country_code: 'US' }, addresses: [], types: [] },
    ];
    mockSearchRor.mockResolvedValue(mockResults);

    const { result } = renderHook(() => useRorSearch({ debounceMs: 100 }));

    // Perform search
    act(() => {
      result.current.search('test');
    });

    await act(async () => {
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();
    });

    expect(result.current.results).toHaveLength(1);

    // Clear
    act(() => {
      result.current.clear();
    });

    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('clears results when query becomes too short', () => {
    const { result } = renderHook(() => useRorSearch({ minQueryLength: 2 }));

    act(() => {
      result.current.search('a'); // Too short
    });

    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('uses default options', () => {
    const { result } = renderHook(() => useRorSearch());

    // Default minQueryLength is 2
    act(() => {
      result.current.search('a');
    });

    expect(result.current.isLoading).toBe(false); // Too short, no loading
  });
});
