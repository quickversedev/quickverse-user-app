import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { DefaultTheme } from '../../assets/theme/defaultTheme';
import {
  clearSessionExpiredCallback,
  setSessionExpiredCallback,
} from '../../config/api/axios.config';
import { PermissionAndLocation } from '../../hooks/Permissions/useLocation';
import authService from '../../services/api/authService';
import {
  AuthSession,
  getAuthSession,
  getNewUser,
  getSkipLoginFlow,
  removeAuthSession,
  removeNewUser,
  removeRecentSearches,
  removeRegionId,
  removeUserAddresses,
  setAuthSession,
  setNewUser,
  setSkipLoginFlow,
  StorageService,
} from '../../services/localStorage/storage.service';
import useAddressStore from '../../store/address/addressStore';
import useCartStore from '../../store/cart/cartStore';
import useCouponStore from '../../store/cart/couponStore';
import useOrderStore from '../../store/cart/orderStore';
import useConfigStore from '../../store/configStore';
import usePagesStore from '../../store/pages/pagesStore';
import useFeaturedProductsStore from '../../store/products/featuredProductsStore';
import { useProductsStore } from '../../store/products/productsStore';
import useThemeStore from '../../store/themeStore';
import useVendorStore from '../../store/vendorStore';
import { Address } from '../../types/address';

type AuthContextData = {
  authData?: AuthSession;
  loading: boolean;
  skipUserLogin?: boolean;
  isNewUser: boolean | undefined;
  selectedAddress: Address | null;
  permissionDataInAuth: PermissionAndLocation | null;
  setSkipLogin: (skipLogin: boolean) => void;
  setSelectedAddress: (address: Address | null) => void;
  setPermissionDataInAuth: (data: PermissionAndLocation | null) => void;
  sendOtp(phoneNumber: string): Promise<string>;
  verifyOtp(phoneNumber: string, otp: string, verificationId: string): Promise<void>;
  signOut(): void;
  signUp(fullName: string): Promise<void>;
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
  const [permissionDataInAuth, setPermissionDataInAuth] = useState<PermissionAndLocation | null>(
    null
  );

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
        // Restore selected address from storage (same device only; new device has no stored address)
        const storedAddress = StorageService.getItem('selectedAddress');
        if (storedAddress) {
          try {
            const parsedAddress = JSON.parse(storedAddress);
            if (parsedAddress && typeof parsedAddress === 'object' && parsedAddress.addressID) {
              setSelectedAddress(parsedAddress);
            }
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

  // Set up session expired callback for axios interceptor
  useEffect(() => {
    setSessionExpiredCallback(() => {
      //console.log('session expired');
      resetAuthState();
    });

    // Cleanup callback on unmount
    return () => {
      clearSessionExpiredCallback();
    };
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
    // Reset auth context state
    setAuthData(undefined);
    setSkipUserLogin(undefined);
    setSelectedAddress(null);

    // Clear all localStorage items
    removeUserAddresses();
    removeAuthSession();
    removeRecentSearches();
    removeRegionId();
    removeNewUser();
    StorageService.removeItem('cart-storage');
    StorageService.clearAll(); // Clear any remaining items

    // Reset all Zustand stores
    try {
      // Reset cart store
      useCartStore.setState({
        carts: {},
        activeCartId: null,
        error: null,
        loading: false,
      });

      // Reset coupon store
      useCouponStore.setState({
        appliedCoupons: {},
        availableCoupons: {},
        vendorOffersLoading: false,
        vendorOffersError: null,
        customerOffersLoading: false,
        customerOffersError: null,
        applyCouponLoading: false,
        applyCouponError: null,
      });

      // Reset config store
      useConfigStore.setState({
        config: null,
        loading: false,
        error: null,
      });

      // Reset pages store
      usePagesStore.setState({
        pages: [],
        loading: false,
        error: null,
      });

      // Reset theme store
      useThemeStore.setState({
        theme: DefaultTheme,
        loading: false,
        error: null,
      });

      // Reset address store
      useAddressStore.setState({
        addresses: [],
        loading: false,
        addingLoading: false,
        fetchError: null,
        addError: null,
      });

      // Reset featured products store
      useFeaturedProductsStore.setState({
        cache: {},
        batchLoading: false,
        batchError: null,
        cacheExpiryMs: 5 * 60 * 1000,
      });

      // Reset order store
      useOrderStore.setState({
        orders: [],
        selectedOrder: null,
        loading: false,
        error: null,
        filters: {},
        pagination: {
          cursor: null,
          pageSize: 10,
          hasMore: true,
        },
      });

      // Reset products store
      useProductsStore.setState({
        products: [],
        loading: false,
        fullyLoaded: false,
        error: null,
        offset: 0,
        limit: 10,
        total: 0,
        shopId: '',
        hasMore: true,
        categories: [],
        categoriesLoading: false,
        categoriesError: null,
      });

      // Reset vendor store
      useVendorStore.setState({
        vendors: [],
        selectedVendor: null,
        loading: false,
        error: null,
        filters: {},
        userLocation: null,
      });
    } catch (error) {
      console.error('Error resetting stores:', error);
    }
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
    const { token, phoneNumber: phone, name, newUser, defaultAddressId } = response?.session;

    if (token && phone) {
      setAuth({ jwt: token, phone, username: name || 'Howdy', defaultAddressId });
    }
    if (newUser) setNewUserstate(newUser);
  };

  const signUp = async (fullName: string): Promise<void> => {
    try {
      if (authData) {
        await authService.signUp(fullName, authData.jwt, authData.phone);
        setAuth({ ...authData, username: fullName });
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
        permissionDataInAuth,
        setSkipLogin,
        setSelectedAddress: handleSetSelectedAddress,
        setPermissionDataInAuth,
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
