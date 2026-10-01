import axiosInstance, { apiCall, getAuthHeader } from '../../config/api/axios.config';
import useConfigStore from '../../store/configStore';

interface GetAvailableCouponsParams {
  regionId: string;
  serviceType: string;
  shopId?: string;
}

const couponService = {
  /**
   * Coupons are per region and the server rejects a request without one ("Region ID must be
   * specified"), so the region is always sent: the caller's, else the config's, refetched once
   * if the cached config has none. With no region at all there is nothing to ask for.
   */
  async getAvailableCoupons(
    regionId: string | null | undefined,
    shopId?: string,
    serviceType: string = 'FOOD'
  ) {
    const region = regionId || (await useConfigStore.getState().ensureRegionId());
    if (!region) return [];

    const authHeader = getAuthHeader();

    const params: GetAvailableCouponsParams = {
      regionId: region,
      serviceType,
    };

    if (shopId) {
      params.shopId = shopId;
    }

    const data = await apiCall(
      axiosInstance.get('/v3/coupons/available', {
        params,
        headers: {
          Authorization: authHeader,
        },
      })
    );

    return data?.response?.data ?? [];
  },
};

export default couponService;
