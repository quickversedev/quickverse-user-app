import axios from '../config/api/axios.config';

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
    console.log('requestData', requestData);
    try {
      const response = await axios.post<CreateOrderResponse>('/v2/order/createOrder', requestData, {
        headers: {
          SessionKey: sessionKey,
          Authorization: 'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx',
          phone: phone,
        },
      });

      return response.data;
    } catch (error: any) {
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const errorData = error.response.data;
        throw new Error(errorData?.message || `Order creation failed: ${error.response.status}`);
      } else if (error.request) {
        // Network error
        throw new Error('Network error: Unable to connect to server');
      } else {
        // Other errors
        throw new Error(error.message || 'An unexpected error occurred');
      }
    }
  }
}

export default new OrderService();
