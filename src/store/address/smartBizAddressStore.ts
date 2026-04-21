import axiosInstance, { apiCall } from '../../config/api/axios.config';

export interface SmartBizAddress {
  id: string;
  address: {
    name: string;
    addressLine1: string;
    addressLine2: string | null;
    addressLine3: string | null;
    city: string;
    state: string;
    pincode: string;
    latitude: string;
    longitude: string;
    tag: string | null;
    amazonAddressId: string | null;
    addressQualityScore: number | null;
  };
  isDefaultAddress: boolean;
}

export interface SmartBizAddressResponse {
  defaultAddressId: string;
  addresses: SmartBizAddress[];
}

interface VendorAddressCache {
  addresses: SmartBizAddress[];
  defaultAddressId: string | null;
  lastFetched: number;
}

class SmartBizAddressService {
  private vendorCache: Map<string, VendorAddressCache> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async fetchAddresses(
    vendorId: string,
    sessionKey: string,
    phone: string
  ): Promise<SmartBizAddress[]> {
    const now = Date.now();
    const cachedData = this.vendorCache.get(vendorId);

    // Check if we have recent data for this specific vendor
    if (
      cachedData &&
      now - cachedData.lastFetched < this.CACHE_DURATION &&
      cachedData.addresses.length > 0
    ) {
      console.warn(
        `[DeliveryAddress] cache hit shopId=${vendorId} addressCount=${cachedData.addresses.length} (skipping network)`
      );
      return cachedData.addresses;
    }

    try {
      const endpoint = `/v2/listAddresses?shopId=${vendorId}`;
      const fullUrl = `${axiosInstance.defaults.baseURL ?? ''}${endpoint}`;
      console.warn(
        `[DeliveryAddress] GET addresses → ${fullUrl} (QuickVerse backend, per-shop, shopId=${vendorId})`
      );

      const data: SmartBizAddressResponse = await apiCall(
        axiosInstance.get(endpoint, {
          headers: {
            SessionKey: sessionKey,
            phone: phone,
          },
        })
      );

      console.warn(
        `[DeliveryAddress] response shopId=${vendorId} addressCount=${data.addresses.length} defaultAddressId=${data.defaultAddressId || 'none'}`
      );

      // Cache the data for this specific vendor
      this.vendorCache.set(vendorId, {
        addresses: data.addresses,
        defaultAddressId: data.defaultAddressId,
        lastFetched: now,
      });

      return data.addresses;
    } catch (error) {
      console.warn(
        `[DeliveryAddress] fetch failed shopId=${vendorId}:`,
        error instanceof Error ? error.message : error
      );
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch addresses';
      throw new Error(errorMessage);
    }
  }

  setAddresses(vendorId: string, addresses: SmartBizAddress[], defaultAddressId: string): void {
    this.vendorCache.set(vendorId, {
      addresses,
      defaultAddressId,
      lastFetched: Date.now(),
    });
  }

  getAddresses(vendorId: string): SmartBizAddress[] {
    const cachedData = this.vendorCache.get(vendorId);
    return cachedData?.addresses || [];
  }

  getDefaultAddress(vendorId: string): SmartBizAddress | null {
    const cachedData = this.vendorCache.get(vendorId);
    if (!cachedData?.defaultAddressId) return null;
    return cachedData.addresses.find(addr => addr.id === cachedData.defaultAddressId) || null;
  }

  getAddressById(vendorId: string, id: string): SmartBizAddress | null {
    const cachedData = this.vendorCache.get(vendorId);
    if (!cachedData) return null;
    return cachedData.addresses.find(addr => addr.id === id) || null;
  }

  getAddressesByTag(vendorId: string, tag: string): SmartBizAddress[] {
    const cachedData = this.vendorCache.get(vendorId);
    if (!cachedData) return [];
    return cachedData.addresses.filter(addr => addr.address.tag === tag);
  }

  clearCache(vendorId?: string): void {
    if (vendorId) {
      // Clear cache for specific vendor
      this.vendorCache.delete(vendorId);
    } else {
      // Clear all cache
      this.vendorCache.clear();
    }
  }

  isDataStale(vendorId: string): boolean {
    const cachedData = this.vendorCache.get(vendorId);
    if (!cachedData) return true;
    return Date.now() - cachedData.lastFetched > this.CACHE_DURATION;
  }

  getCachedVendors(): string[] {
    return Array.from(this.vendorCache.keys());
  }

  getCacheInfo(vendorId: string): { hasData: boolean; isStale: boolean; addressCount: number } {
    const cachedData = this.vendorCache.get(vendorId);
    if (!cachedData) {
      return { hasData: false, isStale: true, addressCount: 0 };
    }

    return {
      hasData: true,
      isStale: this.isDataStale(vendorId),
      addressCount: cachedData.addresses.length,
    };
  }
}

// Export a singleton instance
export const smartBizAddressService = new SmartBizAddressService();
