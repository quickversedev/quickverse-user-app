import axiosInstance, { apiCall } from '../../config/api/axios.config';

export type AuthData = {
  session: {
    token: string;
    phoneNumber: string;
    newUser: boolean;
    name: string;
    defaultAddressId: string;
  };
};

export type AuthError = {
  status: number;
  message: string;
  isCancelled?: boolean;
};

// Response types for better type safety
interface SendOtpResponse {
  response: {
    verificationId: string;
  };
}

interface VerifyOtpResponse {
  jwt: string;
  phone: string;
  newUser: boolean;
  userName?: string;
  defaultAddressId?: string;
}

interface SignUpResponse {
  success: boolean;
  message?: string;
}

interface SignOutResponse {
  success: boolean;
  message?: string;
}

const sendOtp = async (phoneNumber: string): Promise<string> => {
  // Validate input
  if (!phoneNumber || phoneNumber.trim().length === 0) {
    throw {
      status: 400,
      message: 'Phone number is required',
      isCancelled: false,
    } as AuthError;
  }

  // Basic phone number validation (you can enhance this)
  const phoneRegex = /^[0-9]{10}$/;
  if (!phoneRegex.test(phoneNumber.replace(/\D/g, ''))) {
    throw {
      status: 400,
      message: 'Please enter a valid 10-digit phone number',
      isCancelled: false,
    } as AuthError;
  }

  try {
    const data = await apiCall<SendOtpResponse>(
      axiosInstance.post(
        '/v1/requestOtp',
        {
          phone: phoneNumber,
        },
        {
          headers: {
            Authorization: 'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx',
          },
        }
      )
    );

    // Validate response
    if (!data?.response?.verificationId) {
      throw {
        status: 500,
        message: 'Invalid response from server: verification ID not received',
        isCancelled: false,
      } as AuthError;
    }

    return data.response.verificationId;
  } catch (error) {
    console.log('requestOTP error', error);
    const authError = error as AuthError;

    // Handle specific error cases
    if (authError.status === 429) {
      throw {
        status: 429,
        message: 'Too many OTP requests. Please wait before requesting another OTP.',
        isCancelled: authError.isCancelled,
      } as AuthError;
    }

    if (authError.status === 400) {
      throw {
        status: 400,
        message: authError.message || 'Invalid phone number format',
        isCancelled: authError.isCancelled,
      } as AuthError;
    }

    // Re-throw other errors
    throw authError;
  }
};

const verifyOtp = async (
  phoneNumber: string,
  otp: string,
  verificationId: string
): Promise<AuthData> => {
  // Validate inputs
  if (!phoneNumber || phoneNumber.trim().length === 0) {
    throw {
      status: 400,
      message: 'Phone number is required',
      isCancelled: false,
    } as AuthError;
  }

  if (!otp || otp.trim().length === 0) {
    throw {
      status: 400,
      message: 'OTP is required',
      isCancelled: false,
    } as AuthError;
  }

  if (!verificationId || verificationId.trim().length === 0) {
    throw {
      status: 400,
      message: 'Verification ID is required',
      isCancelled: false,
    } as AuthError;
  }

  // Basic OTP validation
  const otpRegex = /^[0-9]{4}$/;
  if (!otpRegex.test(otp)) {
    throw {
      status: 400,
      message: 'Please enter a valid 6-digit OTP',
      isCancelled: false,
    } as AuthError;
  }

  try {
    const data = await apiCall<VerifyOtpResponse>(
      axiosInstance.post(
        '/v1/login',
        {
          phone: '91' + phoneNumber,
          otp: otp,
          verificationId: verificationId,
        },
        {
          headers: {
            Authorization: 'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx',
          },
        }
      )
    );

    // Validate response
    if (!data?.jwt) {
      throw {
        status: 500,
        message: 'Invalid response from server: authentication token not received',
        isCancelled: false,
      } as AuthError;
    }

    if (!data?.phone) {
      throw {
        status: 500,
        message: 'Invalid response from server: mobile number not received',
        isCancelled: false,
      } as AuthError;
    }

    return {
      session: {
        token: data.jwt,
        phoneNumber: data.phone,
        newUser: data.newUser ?? false,
        name: data?.userName || '',
        defaultAddressId: data?.defaultAddressId || '',
      },
    };
  } catch (error) {
    console.log('error', error);
    const authError = error as AuthError;

    // Handle specific error cases
    if (authError.status === 401) {
      throw {
        status: 401,
        message: 'Invalid OTP. Please check and try again.',
        isCancelled: authError.isCancelled,
      } as AuthError;
    }

    if (authError.status === 400) {
      throw {
        status: 400,
        message: authError.message || 'Invalid OTP format',
        isCancelled: authError.isCancelled,
      } as AuthError;
    }

    if (authError.status === 422) {
      throw {
        status: 422,
        message: 'OTP has expired. Please request a new OTP.',
        isCancelled: authError.isCancelled,
      } as AuthError;
    }

    // Re-throw other errors
    throw authError;
  }
};

const signUp = async (
  fullName: string,
  dob: string,
  gender: string,
  email: string,
  jwt: string,
  phoneNumber: string
): Promise<SignUpResponse> => {
  // Validate inputs
  if (!fullName || fullName.trim().length === 0) {
    throw {
      status: 400,
      message: 'Full name is required',
      isCancelled: false,
    } as AuthError;
  }

  if (!dob || dob.trim().length === 0) {
    throw {
      status: 400,
      message: 'Date of birth is required',
      isCancelled: false,
    } as AuthError;
  }

  if (!gender || gender.trim().length === 0) {
    throw {
      status: 400,
      message: 'Gender is required',
      isCancelled: false,
    } as AuthError;
  }

  // Validate gender value
  const validGenders = ['MALE', 'FEMALE', 'OTHER'];
  if (!validGenders.includes(gender.toUpperCase())) {
    throw {
      status: 400,
      message: 'Gender must be MALE, FEMALE, or OTHER',
      isCancelled: false,
    } as AuthError;
  }

  try {
    const data = await apiCall<SignUpResponse>(
      axiosInstance.post(
        '/v1/register/customer',
        {
          dob: dob,
          gender: gender.toUpperCase(),
          email: email,
          fullName: fullName,
        },
        {
          headers: {
            Authorization: 'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx',
            SessionKey: jwt,
            phone: phoneNumber,
          },
        }
      )
    );

    return data;
  } catch (error) {
    const authError = error as AuthError;

    // Handle specific error cases
    if (authError.status === 409) {
      throw {
        status: 409,
        message: 'User already exists with this information',
        isCancelled: authError.isCancelled,
      } as AuthError;
    }

    if (authError.status === 422) {
      throw {
        status: 422,
        message: authError.message || 'Invalid user data provided',
        isCancelled: authError.isCancelled,
      } as AuthError;
    }

    // Re-throw other errors
    throw authError;
  }
};

const signOut = async (): Promise<SignOutResponse> => {
  try {
    const data = await apiCall<SignOutResponse>(
      axiosInstance.delete('/v1/logout', {
        headers: {
          SessionKey: 'token',
        },
      })
    );

    return data;
  } catch (error) {
    const authError = error as AuthError;

    // Handle specific error cases
    if (authError.status === 401) {
      throw {
        status: 401,
        message: 'Session expired. Please login again.',
        isCancelled: authError.isCancelled,
      } as AuthError;
    }

    // Re-throw other errors
    throw authError;
  }
};

const authService = {
  sendOtp,
  verifyOtp,
  signUp,
  signOut,
};

export default authService;

const _JWTTokenMock =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ikx1Y2FzIEdhcmNleiIsImlhdCI6MTUxNjIzOTAyMn0.oK5FZPULfF-nfZmiumDGiufxf10Fe2KiGe9G5Njoa64';
