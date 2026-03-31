import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchRor, rorToInstitution } from '@/lib/ror-client';
import type { RorSearchResult } from '@/types';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('ror-client', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchRor', () => {
    it('returns empty array for empty query', async () => {
      const results = await searchRor('');
      expect(results).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns empty array for whitespace-only query', async () => {
      const results = await searchRor('   ');
      expect(results).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('calls ROR API v2 with encoded query', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [], number_of_results: 0 }),
      });

      await searchRor('Hong Kong University');
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.ror.org/v2/organizations?query=Hong%20Kong%20University'
      );
    });

    it('parses ROR API v2 response correctly', async () => {
      const mockRorResponse = {
        items: [
          {
            id: 'https://ror.org/02zhqgq86',
            names: [
              { value: 'The University of Hong Kong', types: ['ror_display'] },
              { value: 'HKU', types: ['alias'] },
              { value: '香港大學', types: ['alias'] },
            ],
            locations: [
              {
                geonames_details: {
                  name: 'Hong Kong',
                  country_name: 'Hong Kong',
                  country_code: 'HK',
                },
              },
            ],
            types: ['education'],
          },
        ],
        number_of_results: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRorResponse),
      });

      const results = await searchRor('Hong Kong');

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        id: 'https://ror.org/02zhqgq86',
        name: 'The University of Hong Kong',
        aliases: ['HKU', '香港大學'],
        country: { country_name: 'Hong Kong', country_code: 'HK' },
        addresses: [{ city: 'Hong Kong', state: null, country_geonames_id: 0 }],
        types: ['education'],
      });
    });

    it('limits results to 10 items', async () => {
      const mockRorResponse = {
        items: Array.from({ length: 20 }, (_, i) => ({
          id: `https://ror.org/org${i}`,
          names: [{ value: `University ${i}`, types: ['ror_display'] }],
          locations: [],
          types: ['education'],
        })),
        number_of_results: 20,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRorResponse),
      });

      const results = await searchRor('university');
      expect(results).toHaveLength(10);
    });

    it('returns empty array on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const results = await searchRor('test');
      expect(results).toEqual([]);
      expect(console.warn).toHaveBeenCalledWith('ROR API returned 500');
    });

    it('returns empty array on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const results = await searchRor('test');
      expect(results).toEqual([]);
      expect(console.warn).toHaveBeenCalledWith('ROR API search failed:', expect.any(Error));
    });

    it('handles missing names array gracefully', async () => {
      const mockRorResponse = {
        items: [{ id: 'https://ror.org/test', locations: [], types: [] }],
        number_of_results: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRorResponse),
      });

      const results = await searchRor('test');
      expect(results[0].name).toBe('');
      expect(results[0].aliases).toEqual([]);
    });

    it('handles missing locations array gracefully', async () => {
      const mockRorResponse = {
        items: [
          {
            id: 'https://ror.org/test',
            names: [{ value: 'Test Uni', types: ['ror_display'] }],
            types: [],
          },
        ],
        number_of_results: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRorResponse),
      });

      const results = await searchRor('test');
      expect(results[0].country).toEqual({ country_name: '', country_code: '' });
      expect(results[0].addresses).toEqual([]);
    });

    it('falls back to first name if no ror_display name', async () => {
      const mockRorResponse = {
        items: [
          {
            id: 'https://ror.org/test',
            names: [{ value: 'Fallback Name', types: ['label'] }],
            locations: [],
            types: [],
          },
        ],
        number_of_results: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRorResponse),
      });

      const results = await searchRor('test');
      expect(results[0].name).toBe('Fallback Name');
    });
  });

  describe('rorToInstitution', () => {
    it('converts RorSearchResult to Institution', () => {
      const rorResult: RorSearchResult = {
        id: 'https://ror.org/02zhqgq86',
        name: 'The University of Hong Kong',
        aliases: ['HKU'],
        country: { country_name: 'Hong Kong', country_code: 'HK' },
        addresses: [{ city: 'Hong Kong', state: null, country_geonames_id: 0 }],
        types: ['education'],
      };

      const institution = rorToInstitution(rorResult);

      expect(institution).toEqual({
        id: 'ror:https://ror.org/02zhqgq86',
        source: 'ror',
        components: {
          university: 'The University of Hong Kong',
          city: 'Hong Kong',
          country: 'Hong Kong',
        },
      });
    });

    it('handles empty addresses array', () => {
      const rorResult: RorSearchResult = {
        id: 'https://ror.org/test',
        name: 'Test University',
        aliases: [],
        country: { country_name: 'USA', country_code: 'US' },
        addresses: [],
        types: [],
      };

      const institution = rorToInstitution(rorResult);

      expect(institution.components.city).toBe('');
      expect(institution.components.country).toBe('USA');
    });

    it('prefixes id with "ror:" prefix', () => {
      const rorResult: RorSearchResult = {
        id: 'https://ror.org/abc123',
        name: 'Test',
        aliases: [],
        country: { country_name: 'UK', country_code: 'GB' },
        addresses: [],
        types: [],
      };

      const institution = rorToInstitution(rorResult);
      expect(institution.id).toBe('ror:https://ror.org/abc123');
      expect(institution.source).toBe('ror');
    });
  });
});
