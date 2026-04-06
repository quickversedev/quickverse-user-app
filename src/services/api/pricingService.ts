import axiosInstance, { apiCall, getAuthHeader } from '../../config/api/axios.config';
import { PricingConfigItem, ServiceType } from '../../types/pricing';

const PRICING_ENDPOINTS = {
  pricingConfig: '/v3/pricing-configurations',
} as const;

export const fetchPricingConfig = async (
  serviceType: ServiceType
): Promise<PricingConfigItem[]> => {
  return apiCall(
    axiosInstance.get<PricingConfigItem[]>(PRICING_ENDPOINTS.pricingConfig, {
      params: { serviceType },
      headers: { Authorization: getAuthHeader() },
    })
  );
};
