import axiosInstance, { apiCall, getAuthHeader } from '../../config/api/axios.config';

export interface SubmitFeedbackRequest {
  customerName?: string;
  mobileNumber?: string;
  category?: string;
  message: string;
}

const feedbackService = {
  async submitFeedback(data: SubmitFeedbackRequest, file?: any) {
    const authHeader = getAuthHeader();

    const formData = new FormData();
    formData.append('request', JSON.stringify(data));

    if (file) {
      formData.append('file', {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.fileName || `feedback_${Date.now()}.jpg`,
      } as any);
    }

    const response = await apiCall(
      axiosInstance.post('/v3/feedback', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: authHeader,
        },
      })
    );

    return response?.response?.data;
  },

  async getFeedbacksByMobileNumber(mobileNumber: string) {
    const authHeader = getAuthHeader();

    const response = await apiCall(
      axiosInstance.get(`/v3/feedback/user/${mobileNumber}`, {
        headers: {
          Authorization: authHeader,
        },
      })
    );

    return response?.response?.data ?? [];
  },
};

export default feedbackService;
