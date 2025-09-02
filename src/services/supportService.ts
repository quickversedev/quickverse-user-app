import axiosInstance, { apiCall } from '../config/api/axios.config';

export interface SupportEmailPayload {
  orderId: string;
  subject: string;
  body: string;
}

class SupportService {
  async sendSupportEmail(jwt: string, phone: string, payload: SupportEmailPayload): Promise<void> {
    //console.log('payload', payload);
    await apiCall(
      axiosInstance.post<void>('/v1/email', payload, {
        headers: {
          SessionKey: jwt,
          phone,
        },
      })
    );
  }
}

export default new SupportService();
