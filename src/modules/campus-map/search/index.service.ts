import { campusMapRepository } from '../campus-map.repository.js';
import type { CampusFeatureCategory, LngLat } from '../campus-map.types.js';
import { toSearchResult } from './ranking.service.js';

export const campusSearchService = {
  async search(schoolId: string, options: { q: string; category?: CampusFeatureCategory; near?: LngLat; limit: number }) {
    const rows = await campusMapRepository.searchFeatures(schoolId, options);
    return rows.map(toSearchResult);
  },
};
