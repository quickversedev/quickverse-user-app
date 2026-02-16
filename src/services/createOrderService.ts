import axiosInstance, { apiCall, getAuthHeader } from '../config/api/axios.config';

export interface CreateOrderRequest {
  shopId: number;
  cartId: string;
  orderSource: string;
  customerAddressId: string;
  fulfillmentOption: string;
  notificationMobileNumber: string;
  notificationEmail: string | null;
  customerName: string;
  paymentMethod: string;
}

export interface CreateOrderResponse {
  orderId: string;
  customerId: string;
  totalOrderAmount: number;
  orderStatus: string;
  orderDate: string;
  estimatedDeliveryTime: string;
  deliveryAddress: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
  };
  items: Array<{
    sku: string;
    name: string;
    quantity: number;
    price: number;
    totalPrice: number;
  }>;
  paymentDetails: {
    method: string;
    status: string;
    amount: number;
  };
  smartBizOffers: Array<{
    offerId: string;
    offerCode: string;
    totalBenefit: number;
    offerConstraintSuggestions: string[];
    offerBenefitSuggestions: string[];
    state: string;
    offerName: string;
    offerClass: string;
    startDate: string | null;
    endDate: string | null;
    discountLimit: number;
    offerType: string;
    discountValue: number;
    minProductsCount: number;
    remainingProductsCount: number;
    applicableEntities: any[];
    totalAmountRequired: number;
  }>;
  skuDetailsGrouped: any[];
}

export interface CreateOrderError {
  message: string;
  code?: string;
  details?: any;
}

class OrderService {
  async createOrder(
    requestData: CreateOrderRequest,
    sessionKey: string,
    phone: string
  ): Promise<CreateOrderResponse> {
    try {
      const response = await apiCall(
        axiosInstance.post<CreateOrderResponse>('/v2/order/createOrder', requestData, {
          headers: {
            SessionKey: sessionKey,
            Authorization: getAuthHeader(),
            phone: phone,
          },
        })
      );
      return response;
    } catch (error: unknown) {
      console.error('Create Order Error:', {
        message: (error as any)?.message || 'Unknown error',
        code: (error as any)?.code || 'UNKNOWN',
        status: (error as any)?.status || 'UNKNOWN',
        apiEndpoint: (error as any)?.apiEndpoint || 'Unknown',
        // Log the full error object for debugging
        fullError: error,
        requestData,
        sessionKey: sessionKey ? '***' : 'MISSING',
        phone: phone ? '***' : 'MISSING',
      });
      throw error;
    }
  }

  async cancelOrder(
    orderId: string,
    shopId: string,
    cancelReason: string,
    sessionKey: string,
    phone: string
  ): Promise<void> {
    try {
      await apiCall(
        axiosInstance.put(
          `/v2/order/cancelOrder?orderId=${orderId}&shopId=${shopId}`,
          { cancelReason },
          {
            headers: {
              SessionKey: sessionKey,
              Authorization: getAuthHeader(),

              phone,
            },
          }
        )
      );
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = (error as any).response?.data;
        throw new Error(
          errorData?.message || `Failed to cancel order: ${(error as any).response.status}`
        );
      } else if (error && typeof error === 'object' && 'request' in error) {
        throw new Error('Network error: Unable to connect to server');
      } else {
        throw new Error(error instanceof Error ? error.message : 'Failed to cancel order');
      }
    }
  }
}

export default new OrderService();
