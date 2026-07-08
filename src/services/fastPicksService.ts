import axiosInstance, { apiCall, getAuthHeader } from '../config/api/axios.config';
import { FastPick } from '../types/fastPick';

class FastPicksService {
  async fetchFastPicks(): Promise<FastPick[]> {
    const response = await apiCall(
      axiosInstance.get<FastPick[]>('/v3/fast-picks', {
        headers: { Authorization: getAuthHeader() },
      })
    );
    const picks = Array.isArray(response) ? response : [];
    return picks.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }
}

export default new FastPicksService();
