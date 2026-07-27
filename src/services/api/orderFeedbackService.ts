import axiosInstance, { apiCall, getAuthHeader } from '../../config/api/axios.config';

export type OrderFeedbackType = 'REVIEW' | 'COMPLAINT';
export type OrderFeedbackStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

export interface SubmitOrderFeedbackRequest {
  orderId: string;
  shopId?: string;
  customerName?: string;
  mobileNumber?: string;
  type: OrderFeedbackType;
  rating?: number;
  complaintCategory?: string;
  message: string;
}

export interface OrderFeedbackItem {
  id?: string;
  feedbackId?: string;
  orderId?: string;
  shopId?: string;
  customerName?: string;
  mobileNumber?: string;
  type: OrderFeedbackType;
  rating?: number;
  complaintCategory?: string;
  message: string;
  attachmentUrl?: string;
  status?: OrderFeedbackStatus;
  adminReply?: string | null;
  createdAt?: string | number;
  updatedAt?: string | number;
}

const orderFeedbackService = {
  async submitOrderFeedback(
    data: SubmitOrderFeedbackRequest,
    file?: any
  ): Promise<OrderFeedbackItem> {
    const authHeader = getAuthHeader();

    const formData = new FormData();
    formData.append('request', JSON.stringify(data));

    if (file) {
      formData.append('file', {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.fileName || `order_feedback_${Date.now()}.jpg`,
      } as any);
    }

    const response = await apiCall(
      axiosInstance.post('/v3/order-feedback', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: authHeader,
        },
      })
    );

    return response?.response?.data;
  },

  async getOrderFeedbacksByOrderId(orderId: string): Promise<OrderFeedbackItem[]> {
    const response = await apiCall(
      axiosInstance.get(`/v3/order-feedback/order/${orderId}`, {
        headers: {
          Authorization: getAuthHeader(),
        },
      })
    );
    return response?.response?.data ?? [];
  },

  async getOrderFeedbacksByMobileNumber(mobileNumber: string): Promise<OrderFeedbackItem[]> {
    const authHeader = getAuthHeader();

    const response = await apiCall(
      axiosInstance.get(`/v3/order-feedback/user/${mobileNumber}`, {
        headers: {
          Authorization: authHeader,
        },
      })
    );

    return response?.response?.data ?? [];
  },
};

export default orderFeedbackService;
