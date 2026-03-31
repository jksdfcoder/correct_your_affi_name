import type { RorSearchResult, Institution } from '@/types';

const ROR_API_BASE = 'https://api.ror.org/v2/organizations';

/**
 * Search ROR API for organizations matching the query
 * Returns top 10 results, handles errors gracefully (returns empty array on failure)
 */
export async function searchRor(query: string): Promise<RorSearchResult[]> {
  if (!query.trim()) return [];

  try {
    const url = `${ROR_API_BASE}?query=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`ROR API returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    // ROR API v2 returns { items: [...], number_of_results: N }
    const items = data.items || [];
    
    return items.slice(0, 10).map((item: Record<string, unknown>): RorSearchResult => ({
      id: item.id as string,
      name: (item.names as Array<{ value: string; types: string[] }>)?.find(n => n.types.includes('ror_display'))?.value 
            || (item.names as Array<{ value: string }>)?.[0]?.value 
            || '',
      aliases: ((item.names as Array<{ value: string; types: string[] }>) || [])
        .filter(n => n.types.includes('alias'))
        .map(n => n.value),
      country: {
        country_name: (item.locations as Array<{ geonames_details: { country_name: string; country_code: string } }>)?.[0]?.geonames_details?.country_name || '',
        country_code: (item.locations as Array<{ geonames_details: { country_code: string } }>)?.[0]?.geonames_details?.country_code || '',
      },
      addresses: ((item.locations as Array<{ geonames_details: { name: string; country_code: string } }>) || []).map(loc => ({
        city: loc.geonames_details?.name || '',
        state: null,
        country_geonames_id: 0,
      })),
      types: (item.types as string[]) || [],
    }));
  } catch (error) {
    console.warn('ROR API search failed:', error);
    return [];
  }
}

/**
 * Convert ROR search result to our unified Institution type
 */
export function rorToInstitution(result: RorSearchResult): Institution {
  return {
    id: `ror:${result.id}`,
    source: 'ror',
    components: {
      university: result.name,
      city: result.addresses[0]?.city || '',
      country: result.country.country_name,
    },
  };
}
