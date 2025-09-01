import axiosInstance, { apiCall } from '../config/api/axios.config';

interface DeleteUserResponse {
  success: boolean;
  message?: string;
}

class DeleteUserService {
  async deleteUser(sessionKey: string): Promise<DeleteUserResponse> {
    try {
      await apiCall(
        axiosInstance.delete('/v1/customer', {
          headers: {
            SessionKey: sessionKey,
          },
        })
      );

      return {
        success: true,
        message: 'User deleted successfully',
      };
    } catch (error) {
      console.error('Delete user error:', error);
      throw error; // Let the axios config handle the error formatting
    }
  }
}

const deleteUserService = new DeleteUserService();
export default deleteUserService;
