import axiosInstance, { apiCall, getAuthHeader, withHeaders } from '../config/api/axios.config';

export interface PaymentConfiguration {
  paymentMethodStatus: string;
  codCharges: number;
  minimumAllowedCartAmount: number;
  maximumAllowedCartAmount: number;
}

export interface PaymentMethod {
  paymentMethodType: string;
  paymentConfiguration: PaymentConfiguration;
}

export interface PaymentMethodsResponse {
  data: PaymentMethod[];
}

/**
 * Fetch eligible payment methods for a cart
 */
export const fetchEligiblePaymentMethods = async (
  cartId: string,
  shopId: string,
  sessionKey: string,
  phone: string
): Promise<PaymentMethod[]> => {
  const currentTimeStamp = Date.now();
  const url = `/v3/payment/eligiblePaymentMethods?currentTimeStamp=${currentTimeStamp}&cartId=${cartId}&shopId=${shopId}`;

  const headers = {
    SessionKey: sessionKey,
    Authorization: getAuthHeader(),
    phone: phone,
  };

  try {
    const response = await apiCall(axiosInstance.get(url, withHeaders(headers)));

    return response as PaymentMethod[];
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    throw error; // Re-throw the error to be handled by the calling component
  }
};

/**
 * Check if COD is available based on payment methods
 */
export const isCODAvailable = (paymentMethods: PaymentMethod[]): boolean => {
  return paymentMethods.some(
    method =>
      method.paymentMethodType === 'POSTPAID' &&
      method.paymentConfiguration.paymentMethodStatus === 'ON_BOARDED'
  );
};

/**
 * Get available payment options for display
 */
export const getAvailablePaymentOptions = (paymentMethods: PaymentMethod[]) => {
  const options = [];

  // Check if COD is available
  if (isCODAvailable(paymentMethods)) {
    options.push({
      key: 'COD',
      title: 'Cash on Delivery',
      subtitle: 'Pay with cash when your order arrives',
      available: true,
    });
  }

  // For now, disable other payment methods as requested
  options.push({
    key: 'phonepe',
    title: 'PhonePe',
    subtitle: 'UPI Payment',
    available: false,
  });

  options.push({
    key: 'gpay',
    title: 'Google Pay',
    subtitle: 'UPI Payment',
    available: false,
  });

  return options;
};

/**
 * Get COD charges from payment methods
 */
export const getCODCharges = (paymentMethods: PaymentMethod[]): number => {
  const codMethod = paymentMethods.find(
    method =>
      method.paymentMethodType === 'POSTPAID' &&
      method.paymentConfiguration.paymentMethodStatus === 'ON_BOARDED'
  );

  return codMethod?.paymentConfiguration.codCharges || 0;
};
