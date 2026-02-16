import axiosInstance, { apiCall, getAuthHeader } from '../config/api/axios.config';
import { AuthSession } from '../services/localStorage/storage.service';
import { Coupon } from '../store/cart/couponStore';
import { CartApiResponse, TransformedCartData, TransformedCartProduct } from './cartApiService';

// Vendor Offers Response
export interface VendorOffersResponse {
  publicOffersPresent: boolean;
  privateOffersPresent: boolean;
}

// Customer Offers Response
export interface CustomerOffersResponse {
  listOfEligibleOffers: CustomerOffer[];
  listOfNonEligibleOffers: CustomerOffer[];
}

// Customer Offer Interface
interface CustomerOffer {
  offerId: string;
  offerCode: string | null;
  offerName: string;
  startDate: number;
  endDate: number;
  offerType: 'PERCENTAGE_OFF' | 'FLAT_OFF' | 'ENTITY_PERCENTAGE_OFF' | 'ENTITY_FLAT_OFF';
  discountValue: number;
  minimumOrderAmount: number;
  discountLimit: number;
  countAllowedPerUser: number;
  customerCohortType: number;
  redeemMethod: string;
  offerConstraintSuggestions: string[];
  offerBenefitSuggestions: string[];
  totalAmountRequired: number;
  totalBenefit: number;
  state: 'ACTIVE' | 'INACTIVE';
  remainingProductsCount: number;
  offerClass: 'CART' | 'PRODUCT';
  applicableEntities: ApplicableEntity[];
  minProductCount: number;
}

interface ApplicableEntity {
  entityId: string;
  entityType: string;
  quantityLimit: number | null;
}

// Legacy API Response (for backward compatibility)
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

const transformCustomerOffer = (
  customerOffer: CustomerOffer,
  isEligible: boolean = true
): Coupon => ({
  id: customerOffer.offerId,
  code: customerOffer.offerCode || '',
  description: customerOffer.offerName,
  discount: `${customerOffer.discountValue}${customerOffer.offerType.includes('PERCENTAGE') ? '%' : '₹'
    } OFF`,
  minOrder: customerOffer.minimumOrderAmount,
  expiryDate: `Valid till ${new Date(customerOffer.endDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`,
  offerType: customerOffer.offerType,
  discountLimit: customerOffer.discountLimit,
  totalBenefit: customerOffer.totalBenefit,
  offerClass: customerOffer.offerClass,
  applicableEntities: customerOffer.applicableEntities,
  minProductCount: customerOffer.minProductCount,
  // Eligibility information
  isEligible,
  constraintSuggestions: customerOffer.offerConstraintSuggestions,
  benefitSuggestions: customerOffer.offerBenefitSuggestions,
  totalAmountRequired: customerOffer.totalAmountRequired,
  minimumOrderAmount: customerOffer.minimumOrderAmount,
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
      offerType: 'PERCENTAGE_OFF',
      discountLimit: 100,
      totalBenefit: 50,
      offerClass: 'CART',
      applicableEntities: [],
      minProductCount: 0,
      isEligible: true,
    },
    {
      id: '2',
      code: 'SAVE20',
      description: 'Get 20% off on orders above ₹500',
      discount: '20% OFF',
      minOrder: 500,
      expiryDate: 'Valid till 15 Apr 2024',
      offerType: 'PERCENTAGE_OFF',
      discountLimit: 200,
      totalBenefit: 100,
      offerClass: 'CART',
      applicableEntities: [],
      minProductCount: 0,
      isEligible: true,
    },
    {
      id: '3',
      code: 'SPECIAL30',
      description: 'Get 30% off on selected items',
      discount: '30% OFF',
      minOrder: 300,
      expiryDate: 'Valid till 20 Apr 2024',
      offerType: 'ENTITY_PERCENTAGE_OFF',
      discountLimit: 150,
      totalBenefit: 75,
      offerClass: 'PRODUCT',
      applicableEntities: [
        {
          entityId: 'product-1',
          entityType: 'PRODUCT',
          quantityLimit: 2,
        },
        {
          entityId: 'product-2',
          entityType: 'PRODUCT',
          quantityLimit: 1,
        },
      ],
      minProductCount: 2,
      isEligible: true,
    },
    {
      id: '4',
      code: 'FLAT100',
      description: 'Get ₹100 off on orders above ₹1000',
      discount: '₹100 OFF',
      minOrder: 1000,
      expiryDate: 'Valid till 25 Apr 2024',
      offerType: 'FLAT_OFF',
      discountLimit: 100,
      totalBenefit: 100,
      offerClass: 'CART',
      applicableEntities: [],
      minProductCount: 0,
      isEligible: true,
    },
  ];

  private readonly useMockData = false; // Toggle this to switch between mock and API

  async getVendorOffers(vendorId: string, authData?: AuthSession): Promise<Coupon[]> {
    if (this.useMockData) {
      return this.mockCoupons;
    }

    try {
      // Add Basic prefix if not present
      const authHeader = getAuthHeader();

      const data: VendorOffersResponse = await apiCall(
        axiosInstance.get(`/v3/${vendorId}/Offers`, {
          headers: {
            Authorization: authHeader,
          },
        })
      );

      // Check if any offers are present
      if (data.publicOffersPresent || data.privateOffersPresent) {
        // If offers are present, fetch customer offers
        return await this.getCustomerOffers(vendorId, authData);
      }

      return []; // No offers available
    } catch (error) {
      console.error('Error fetching vendor offers:', error);
      return [];
    }
  }

  async getCustomerOffers(shopId: string = '', authData?: AuthSession): Promise<Coupon[]> {
    if (this.useMockData) {
      return this.mockCoupons;
    }

    try {
      // Add Basic prefix if not present
      const authHeader = getAuthHeader();

      const data: CustomerOffersResponse = await apiCall(
        axiosInstance.get('/v3/Offers/Customer', {
          params: {
            shopId: shopId || 'null',
            sortBy: 'MAX_DISCOUNT',
            state: 'ACTIVE',
            limit: '500',
            isBuyNow: 'false',
          },
          headers: {
            Authorization: authHeader,
            SessionKey: authData?.jwt || '',
            phone: authData?.phone || '',
          },
        })
      );
      // //console.log('customer offer response', data);

      // Transform both eligible and non-eligible offers to Coupon format
      const eligibleCoupons = data.listOfEligibleOffers.map(offer =>
        transformCustomerOffer(offer, true)
      );
      const nonEligibleCoupons = data.listOfNonEligibleOffers.map(offer =>
        transformCustomerOffer(offer, false)
      );

      // Combine both arrays - eligible offers first, then non-eligible
      const allCoupons = [...eligibleCoupons, ...nonEligibleCoupons];

      return allCoupons;
    } catch (error) {
      console.error('Error fetching customer offers:', error);
      return this.mockCoupons; // Fallback to mock data on error
    }
  }

  /**
   * Apply offer/coupon to cart and return transformed cart data
   */
  async applyOffer(
    shopId: string,
    offerIdOrCode: string,
    isBuyNow: boolean,
    authData?: AuthSession
  ): Promise<TransformedCartData> {
    try {
      // Add Basic prefix if not present
      const authHeader = getAuthHeader();

      const data = await apiCall(
        axiosInstance.post<CartApiResponse>('/v3/Offers/Apply', null, {
          params: { shopId, offerId: offerIdOrCode, isBuyNow },
          headers: {
            Authorization: authHeader,
            SessionKey: authData?.jwt || '',
            phone: authData?.phone || '',
          },
        })
      );

      return this.transformCartResponse(data);
    } catch (error) {
      console.error('Apply offer error:', error);
      throw error;
    }
  }

  // Transform API response to store-friendly format (copied from cartApiService)
  private transformCartResponse(apiResponse: CartApiResponse): TransformedCartData {
    const products: Record<string, TransformedCartProduct> = {};

    if (apiResponse.skuDetailsGrouped && Array.isArray(apiResponse.skuDetailsGrouped)) {
      apiResponse.skuDetailsGrouped.forEach(skuDetail => {
        products[skuDetail.sku] = {
          sku: skuDetail.sku,
          itemCount: skuDetail.itemCount,
          appliedOffers: skuDetail.appliedOffers,
          productDetails: skuDetail.productDetails,
          shopPrice: skuDetail.shopPrice,
          productMRP: skuDetail.productMRP,
          finalPrice: skuDetail.finalPrice,
        };
      });
    }

    // Extract applied coupon from smartBizOffer if it exists
    const appliedCoupon = apiResponse.smartBizOffer
      ? {
        code: apiResponse.smartBizOffer.offerCode || apiResponse.smartBizOffer.offerId,
        discount:
          apiResponse.smartBizOffer.discountValue > 0
            ? `${apiResponse.smartBizOffer.discountValue}%`
            : `₹${apiResponse.smartBizOffer.totalBenefit || 0}`,
        minOrder: 0, // This might need to come from a different field
        offerId: apiResponse.smartBizOffer.offerId,
        totalBenefit: apiResponse.smartBizOffer.totalBenefit || 0,
      }
      : null;

    return {
      smartBizCartId: apiResponse.cartIdStr || '',
      customerId: apiResponse.customerIdStr || '',
      totalCartAmountWithBenefit: apiResponse.totalCartAmountWithBenefit || 0,
      finalCartAmount: apiResponse.finalCartAmount || 0,
      totalCartAmount: apiResponse.totalCartAmount || 0,
      totalDiscountOnItems: apiResponse.totalDiscountOnItems || 0,
      deliveryFee: apiResponse.deliveryFee || 0,
      totalCartAmountWithDeliveryFee: apiResponse.totalCartAmountWithDeliveryFee || 0,
      totalCartAmountWithDeliveryFeeAndBenefit:
        apiResponse.totalCartAmountWithDeliveryFeeAndBenefit || 0,
      smartBizOffer: apiResponse.smartBizOffer
        ? {
          offerId: apiResponse.smartBizOffer.offerId,
          offerCode: apiResponse.smartBizOffer.offerCode ?? null,
          offerName: apiResponse.smartBizOffer.offerName,
          offerType: apiResponse.smartBizOffer.offerType,
          discountValue: apiResponse.smartBizOffer.discountValue,
          totalBenefit: apiResponse.smartBizOffer.totalBenefit ?? 0,
        }
        : null,
      appliedCoupon,
      products,
    };
  }
}

export default new CouponService();
