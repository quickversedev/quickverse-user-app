import axios from '../config/api/axios.config';

export type SmartBizAddressMap = Record<string, string>;

class SmartBizAddressService {
  async fetchSmartBizAddressIds(
    shopId: string,
    sessionKey: string,
    phone: string
  ): Promise<SmartBizAddressMap> {
    try {
      const response = await axios.get<SmartBizAddressMap>(`/v2/addressId`, {
        params: { shopId },
        headers: {
          SessionKey: sessionKey,
          'Request-Origin': 'CUSTOMER',
          phone,
        },
      });
      return response.data || {};
    } catch (error: any) {
      // Swallow errors and return empty map to avoid blocking cart
      return {} as SmartBizAddressMap;
    }
  }
}

export default new SmartBizAddressService();
