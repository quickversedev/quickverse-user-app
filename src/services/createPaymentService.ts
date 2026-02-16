import axiosInstance, { apiCall, getAuthHeader } from '../config/api/axios.config';

export interface PaymentTender {
  amount: number;
  status: string;
  type: string;
  paymentMethod: string;
  additionalTenderCharges: number;
}

export interface CreatePaymentRequest {
  customerId: number;
  mobileNumber: string | null;
  name: string | null;
  orderId: string;
  tenders: PaymentTender[];
}

export interface CreatePaymentResponse {
  paymentId: string;
  customerId: number;
  orderId: string;
  status: string;
  tenders: PaymentTender[];
  createdAt: number;
  updatedAt: number;
}

export interface CreatePaymentError {
  message: string;
  code?: string;
  details?: unknown;
}

class CreatePaymentService {
  async createPayment(
    requestData: CreatePaymentRequest,
    sessionKey: string,
    phone: string
  ): Promise<CreatePaymentResponse> {
    try {
      const data = await apiCall(
        axiosInstance.post<CreatePaymentResponse>('/v3/payment/create', requestData, {
          headers: {
            SessionKey: sessionKey,
            Authorization: getAuthHeader(),
            phone,
          },
        })
      );

      return data;
    } catch (error: unknown) {
      console.error('create payment error', error);
      // Handle different types of errors
      if (error && typeof error === 'object' && 'response' in error) {
        // Server responded with error status
        const errorResponse = error as { response: { data: { message?: string }; status: number } };
        const errorData = errorResponse.response.data;
        throw new Error(
          errorData?.message || `Payment creation failed: ${errorResponse.response.status}`
        );
      } else if (error && typeof error === 'object' && 'request' in error) {
        // Network error
        throw new Error('Network error: Unable to connect to server');
      } else {
        // Other errors
        const errorMessage =
          error instanceof Error ? error.message : 'An unexpected error occurred';
        throw new Error(errorMessage);
      }
    }
  }
}

export default new CreatePaymentService();
