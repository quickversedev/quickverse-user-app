import axiosInstance from '../config/api/axios.config';

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
  customerId: number;
  orderNote: string | null;
  shopId: number;
  totalOrderAmount: number;
  totalDiscount: number;
  refundStatus: string;
  totalInvoiceAmount: number;
  creationTime: number;
  additionalPaymentCharges: number;
  totalOrderAmountIncludingPaymentCharges: number;
  totalInvoiceAmountIncludingPaymentCharges: number;
  paymentMethod: string | null;
  cancelReason: string | null;
  state: string;
  customerName: string | null;
  customerMobileNumber: string | null;
  customerDeliveryAddress: any;
  customerNotificationDetails: any;
  deliveryFees: number;
  totalItemCount: number;
  amountExcludingDeliveryFee: number;
  fulfillmentOption: string;
  selfDeliveryMode: string | null;
  deliveryAgentName: string | null;
  deliveryAgentMobileNumber: string | null;
  deliveryPartnerName: string | null;
  trackingId: string | null;
  shippingDetails: any | null;
  deliveryTime: number;
  trackingUrl: string | null;
  orderProcessingPlatform: string | null;
  smartBizTotalDiscountValue: number;
  platform: string | null;
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
      const response = await axiosInstance.post<CreateOrderResponse>(
        '/v2/order/createOrder',
        requestData,
        {
          headers: {
            SessionKey: sessionKey,
            Authorization: 'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx',
            phone: phone,
          },
        }
      );
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorData = (error as any).response?.data;
        throw new Error(
          errorData?.message || `Order creation failed: ${(error as any).response.status}`
        );
      } else if (error && typeof error === 'object' && 'request' in error) {
        throw new Error('Network error: Unable to connect to server');
      } else {
        throw new Error(error instanceof Error ? error.message : 'An unexpected error occurred');
      }
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
      await axiosInstance.put(
        `/v2/order/cancelOrder?orderId=${orderId}&shopId=${shopId}`,
        { cancelReason },
        {
          headers: {
            SessionKey: sessionKey,
            Authorization: 'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx',
            'Request-Origin': 'CUSTOMER',
            phone,
            'Content-Type': 'application/json',
          },
        }
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
