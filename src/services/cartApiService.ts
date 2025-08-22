import axiosInstance, { apiCall, withHeaders } from '../config/api/axios.config';

// API Response Types
export interface CartApiResponse {
  cartId: number;
  cartIdStr: string;
  customerId: number;
  customerIdStr: string;
  totalCartAmount: number;
  cartStatus: string;
  creationTime: number;
  lastUpdateTime: number;
  errorMessage: string | null;
  deliveryFee: number;
  freeDeliveryAboveAmount: number;
  totalCartAmountWithDeliveryFee: number;
  totalCartAmountWithBenefit: number;
  totalCartAmountWithDeliveryFeeAndBenefit: number;
  smartBizOffer: SmartBizOffer | null;
  totalDiscountOnItems: number;
  deliveryStrategy: DeliveryStrategy | null;
  finalCartAmount: number;
  skuDetailsGrouped: SkuDetail[];
}

export interface SmartBizOffer {
  offerId: string;
  offerCode?: string | null;
  offerName: string;
  offerType: string;
  discountValue: number;
  totalBenefit?: number;
  // Add more fields as needed
}

export interface DeliveryStrategy {
  strategyId: string;
  strategyName: string;
  // Add more fields as needed
}

export interface SkuDetail {
  barcodeId: string;
  shopId: number;
  scannedBarcodeId: string;
  stringBarcodeId: string;
  weightOrQuantity: number;
  sku: string;
  customId: string | null;
  itemCount: number;
  productDetails: ProductDetails;
  buyingOptions: BuyingOptions;
  productPriceDetailList: ProductPriceDetail[];
  shopPrice: number;
  productMRP: number;
  finalPrice: number;
  offer: string;
  appliedOffer: string;
  offerRuleId: string;
  isScanned: boolean;
  parkingTicket: boolean;
  forceOverride: boolean;
  showQuantityUpdate: boolean;
  showMultiplePricePopup: boolean;
  showEditWeightPopup: boolean;
  editPriceType: string | null;
  uuid: string;
  appliedOffers: AppliedOffer[];
  applicableOffers: ApplicableOffer[];
  nonApplicableOffers: NonApplicableOffer[];
  mrpStrikeOutFlag: boolean;
}

export interface ApplicableOffer {
  offerId: string;
  offerName: string;
  offerType: string;
  // Add more fields as needed
}

export interface NonApplicableOffer {
  offerId: string;
  offerName: string;
  reason: string;
  // Add more fields as needed
}

export interface ProductDetails {
  productName: string;
  productImageUrl: string;
  weightFlag: string;
  unitFlag: string;
  deactivate: boolean;
  uom: string;
  additionalAttributes: {
    quantity: number;
    isOOS: boolean;
    isBestSeller: boolean;
  };
}

export interface BuyingOptions {
  singlePurchase: {
    availability: {
      inStock: boolean;
      limitedStock: boolean;
      isBuyable: boolean;
    };
  };
}

export interface ProductPriceDetail {
  sku: string;
  shopId: number;
  shopPrice: number;
  productMRP: number;
  isLatestPrice: string;
}

export interface AppliedOffer {
  offerId: string;
  offerCode: string | null;
  totalBenefit: number;
  offerConstraintSuggestions: string[];
  offerBenefitSuggestions: string[];
  state: string;
  offerName: string;
  offerClass: string;
  startDate: number;
  endDate: number;
  discountLimit: number;
  offerType: string;
  discountValue: number;
  minProductsCount: number;
  remainingProductsCount: number;
  applicableEntities: ApplicableEntity[];
  totalAmountRequired: number;
}

export interface ApplicableEntity {
  entityId: string;
  entityType: string;
  // Add more fields as needed
}

// Transformed Cart Data for Store
export interface TransformedCartData {
  smartBizCartId: string; // Maps to cartId from API
  customerId: string;
  totalCartAmountWithBenefit: number;
  finalCartAmount: number;
  totalCartAmount?: number;
  totalDiscountOnItems?: number;
  deliveryFee?: number;
  totalCartAmountWithDeliveryFee?: number;
  totalCartAmountWithDeliveryFeeAndBenefit?: number;
  smartBizOffer?: SmartBizOffer | null;
  appliedCoupon?: {
    code: string;
    discount: string;
    minOrder: number;
    offerId?: string;
    totalBenefit?: number;
  } | null;
  products: Record<string, TransformedCartProduct>;
}

export interface TransformedCartProduct {
  sku: string;
  itemCount: number;
  appliedOffers: AppliedOffer[];
  productDetails: ProductDetails;
  shopPrice: number;
  productMRP: number;
  finalPrice: number;
}

class CartApiService {
  private baseUrl = 'http://192.168.1.37:8080/quickVerse/v2';

  /**
   * Add product to cart - Method 1: Using apiCall wrapper (Recommended)
   */
  async addToCart(
    shopId: string,
    productSku: string,
    jwtToken: string,
    phone: string
  ): Promise<TransformedCartData> {
    try {
      // Method 1: Using apiCall wrapper (recommended for error handling)
      const response = await apiCall(
        axiosInstance.post<CartApiResponse>(
          '/v2/addCart',
          {
            shopId,
            sku: productSku,
          },
          {
            headers: {
              SessionKey: jwtToken,
              phone,
            },
          }
        )
      );
      return this.transformCartResponse(response);
    } catch (error) {
      console.error('Add to cart error:', error);
      throw error;
    }
  }

  /**
   * Delete product from cart - Method 2: Direct axiosInstance usage
   */
  async deleteFromCart(
    shopId: string,
    productSku: string,
    removeCompletely: boolean = true,
    jwtToken: string,
    phone: string
  ): Promise<TransformedCartData> {
    try {
      // Method 2: Direct axiosInstance usage
      const response = await axiosInstance.delete<CartApiResponse>('/v2/deleteCart', {
        params: {
          shopId,
          productSku,
          removeCompletely,
        },
        headers: {
          SessionKey: jwtToken,
          phone,
        },
      });

      return this.transformCartResponse(response.data);
    } catch (error) {
      console.error('Delete from cart error:', error);
      throw error;
    }
  }

  /**
   * Get cart details - Method 4: Using withHeaders helper
   */
  async getCart(shopId: string, jwtToken: string, phone: string): Promise<TransformedCartData> {
    try {
      console.log('get cart shopId', shopId);
      console.log('get cart jwtToken', jwtToken);
      console.log('get cart phone', phone);
      // Method 4: Using withHeaders helper
      const response = await axiosInstance.get<CartApiResponse>('/v2/getCart', {
        params: { shopId },
        ...withHeaders({ SessionKey: jwtToken, phone }),
      });
      console.log('get cart response', response);
      return this.transformCartResponse(response.data);
    } catch (error) {
      console.error('Get cart error:', error);
      throw error;
    }
  }

  /**
   * Clear entire cart - Method 3: Using withHeaders helper
   */
  async clearCart(shopId: string, jwtToken: string, phone: string): Promise<TransformedCartData> {
    try {
      // Method 3: Using withHeaders helper
      const response = await axiosInstance.delete<CartApiResponse>('/v2/clearCart', {
        params: { shopId },
        ...withHeaders({ SessionKey: jwtToken, phone }),
      });

      return this.transformCartResponse(response.data);
    } catch (error) {
      console.error('Clear cart error:', error);
      throw error;
    }
  }

  // applyOffer moved to couponService

  /**
   * Transform API response to store-friendly format
   */
  private transformCartResponse(apiResponse: CartApiResponse): TransformedCartData {
    const products: Record<string, TransformedCartProduct> = {};

    // Transform skuDetailsGrouped to products with null check
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
    console.log('apiResponse', apiResponse);
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
      smartBizCartId: apiResponse.cartIdStr || '', // Map cartId to smartBizCartId
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

export default new CartApiService();
