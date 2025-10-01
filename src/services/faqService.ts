import { AUTHORIZATION_KEY } from '@env';
import axiosInstance, { apiCall } from '../config/api/axios.config';

export interface FAQ {
  question: string;
  answer: string;
  title: string;
}

export interface FAQResponse extends Array<FAQ> {}

class FAQService {
  async getFAQs(): Promise<FAQResponse> {
    try {
      const response = await apiCall(
        axiosInstance.get<FAQResponse>('/v1/FAQs', {
          headers: {
            Authorization: AUTHORIZATION_KEY,
            'Request-Origin': 'CUSTOMER',
          },
        })
      );
      return response;
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      throw error;
    }
  }
}

export default new FAQService();
