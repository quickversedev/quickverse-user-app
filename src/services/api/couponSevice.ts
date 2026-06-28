import axiosInstance, { apiCall, getAuthHeader } from '../../config/api/axios.config';

interface GetAvailableCouponsParams {
  regionId: string;
  serviceType: string;
  shopId?: string;
}

const couponService = {
  async getAvailableCoupons(regionId: string, shopId?: string, serviceType: string = 'FOOD') {
    const authHeader = getAuthHeader();

    const params: GetAvailableCouponsParams = {
      regionId,
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
