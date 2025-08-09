import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import authService from '../../services/api/authService';
import {
  AuthSession,
  getAuthSession,
  getNewUser,
  getSkipLoginFlow,
  setAuthSession,
  setNewUser,
  setSkipLoginFlow,
  StorageService,
} from '../../services/localStorage/storage.service';
import { Address } from '../../types/address';

type AuthContextData = {
  authData?: AuthSession;
  loading: boolean;
  skipUserLogin?: boolean;
  isNewUser: boolean | undefined;
  selectedAddress: Address | null;
  setSkipLogin: (skipLogin: boolean) => void;
  setSelectedAddress: (address: Address | null) => void;
  sendOtp(phoneNumber: string): Promise<string>;
  verifyOtp(phoneNumber: string, otp: string, verificationId: string): Promise<void>;
  signOut(): void;
  signUp(fullName: string, campusId: string, email: string, dob: string): Promise<void>;
  setAuthData(data: AuthSession): void;
  resetAuthState(): void;
};

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

type AuthProviderProps = {
  children: ReactNode;
};

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authData, setAuthData] = useState<AuthSession | undefined>();
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState<boolean | undefined>();
  const [skipUserLogin, setSkipUserLogin] = useState<boolean | undefined>(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedSession = getAuthSession();
        if (storedSession) {
          setAuthData(storedSession);
        }
        const skipLoginFlow = getSkipLoginFlow();
        setSkipUserLogin(skipLoginFlow);
        const storedIsNewUser = getNewUser();
        setIsNewUser(storedIsNewUser);
        // Load selected address from storage
        const storedAddress = StorageService.getItem('selectedAddress');
        if (storedAddress) {
          try {
            const parsedAddress = JSON.parse(storedAddress);
            setSelectedAddress(parsedAddress);
          } catch (error) {
            console.error('Failed to parse stored address', error);
          }
        }
      } catch (error) {
        console.error('Failed to load auth data from storage', error);
      } finally {
        setLoading(false);
      }
    };

    loadStorageData();
  }, []);

  const setSkipLogin = (skipLogin: boolean): void => {
    setSkipLoginFlow(skipLogin);
    setSkipUserLogin(skipLogin);
  };

  const setAuth = (data: AuthSession): void => {
    setAuthData(data);
    setAuthSession(data);
  };

  const setNewUserstate = (newUser: boolean): void => {
    setIsNewUser(newUser);
    setNewUser(newUser);
  };

  const handleSetSelectedAddress = (address: Address | null): void => {
    setSelectedAddress(address);
    if (address) {
      StorageService.setItem('selectedAddress', JSON.stringify(address));
    } else {
      StorageService.removeItem('selectedAddress');
    }
  };

  const resetAuthState = (): void => {
    setAuthData(undefined);
    setSkipUserLogin(undefined);
    setSelectedAddress(null);
    StorageService.clearAll();
  };

  const sendOtp = async (phoneNumber: string): Promise<string> => {
    return await authService.sendOtp(phoneNumber);
  };

  const verifyOtp = async (
    phoneNumber: string,
    otp: string,
    verificationId: string
  ): Promise<void> => {
    const response = await authService.verifyOtp(phoneNumber, otp, verificationId);
    const { token, phoneNumber: phone, name, newUser } = response?.session;

    if (token && phone) {
      setAuth({ jwt: token, phone, username: name || '' });
    }
    if (newUser) setNewUserstate(newUser);
  };

  const signUp = async (
    fullName: string,
    gender: string,
    email: string,
    dob: string
  ): Promise<void> => {
    try {
      if (authData) {
        await authService.signUp(fullName, dob, gender, email, authData.jwt, authData.phone);
      }
      setNewUserstate(false);
    } catch (error) {
      throw error;
    }
  };

  const signOut = (): void => {
    // authService.signOut().catch(console.error);
    resetAuthState();
  };

  return (
    <AuthContext.Provider
      value={{
        authData,
        loading,
        skipUserLogin,
        isNewUser,
        selectedAddress,
        setSkipLogin,
        setSelectedAddress: handleSetSelectedAddress,
        sendOtp,
        verifyOtp,
        signOut,
        signUp,
        setAuthData: setAuth,
        resetAuthState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

function useAuth(): AuthContextData {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthProvider, useAuth };
