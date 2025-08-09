import { API_BASE_URL } from '../config/api/axios.config';
import { Coupon } from '../store/cart/couponStore';

export interface GetOffersResponse {
  success: boolean;
  data: {
    offers: ApiCoupon[];
  };
  message?: string;
}

interface ApiCoupon {
  id: string;
  code: string;
  description: string;
  discount: {
    type: 'PERCENTAGE' | 'FLAT';
    value: number;
  };
  minOrder: number;
  expiryDate: string;
  shopId?: string;
  state?: string;
  isActive: boolean;
}

const transformApiCoupon = (apiCoupon: ApiCoupon): Coupon => ({
  id: apiCoupon.id,
  code: apiCoupon.code,
  description: apiCoupon.description,
  discount: `${apiCoupon.discount.value}${
    apiCoupon.discount.type === 'PERCENTAGE' ? '%' : '₹'
  } OFF`,
  minOrder: apiCoupon.minOrder,
  expiryDate: `Valid till ${new Date(apiCoupon.expiryDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`,
});

class CouponService {
  private readonly mockCoupons: Coupon[] = [
    {
      id: '1',
      code: 'WELCOME50',
      description: 'Get 50% off on your first order',
      discount: '50% OFF',
      minOrder: 200,
      expiryDate: 'Valid till 30 Apr 2024',
    },
    {
      id: '2',
      code: 'SAVE20',
      description: 'Get 20% off on orders above ₹500',
      discount: '20% OFF',
      minOrder: 500,
      expiryDate: 'Valid till 15 Apr 2024',
    },
    {
      id: '3',
      code: 'SPECIAL30',
      description: 'Get 30% off on selected items',
      discount: '30% OFF',
      minOrder: 300,
      expiryDate: 'Valid till 20 Apr 2024',
    },
  ];

  private readonly useMockData = false; // Toggle this to switch between mock and API

  async getVendorOffers(vendorId: string): Promise<Coupon[]> {
    if (this.useMockData) {
      return this.mockCoupons;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/quickVerse/v3/${vendorId}/Offers`, {
        method: 'GET',
        headers: {
          Authorization: 'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GetOffersResponse = await response.json();
      return data.data.offers.map(transformApiCoupon);
    } catch (error) {
      console.error('Error fetching vendor offers:', error);
      return this.mockCoupons; // Fallback to mock data on error
    }
  }

  async getCustomerOffers(shopId: string = ''): Promise<Coupon[]> {
    if (this.useMockData) {
      return this.mockCoupons;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/quickVerse/v3/Offers/Customer`, {
        method: 'GET',
        headers: {
          Authorization: 'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx',
          SessionKey: await this.getSessionKey(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopId,
          sortBy: '',
          state: '',
          limit: 500,
          isBuyNow: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GetOffersResponse = await response.json();
      return data.data.offers.map(transformApiCoupon);
    } catch (error) {
      console.error('Error fetching customer offers:', error);
      return this.mockCoupons; // Fallback to mock data on error
    }
  }

  private async getSessionKey(): Promise<string> {
    // TODO: Implement session key retrieval from your auth system
    return 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...';
  }
}

export default new CouponService();
