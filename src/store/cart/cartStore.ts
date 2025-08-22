import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import cartApiService, { TransformedCartData } from '../../services/cartApiService';
import { storage } from '../../services/localStorage/storage.service';

// Custom storage adapter for MMKV
const mmkvStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ? Promise.resolve(value) : Promise.resolve(null);
  },
  setItem: (name: string, value: string) => {
    storage.set(name, value);
    return Promise.resolve();
  },
  removeItem: (name: string) => {
    storage.delete(name);
    return Promise.resolve();
  },
};

export type CartProduct = {
  sku: string;
  shopId: string;
  name: string;
  price: number;
  mrp: number;
  image: string; // require() returns number, uri is string
  quantity: number;
  veg: boolean;
};

export type Cart = {
  cartId: string;
  smartBizCartId: string; // Maps to cartId from API
  customerId?: string;
  totalCartAmountWithBenefit?: number;
  finalCartAmount?: number;
  totalCartAmount?: number;
  totalDiscountOnItems?: number;
  deliveryFee?: number;
  totalCartAmountWithDeliveryFee?: number;
  totalCartAmountWithDeliveryFeeAndBenefit?: number;
  smartBizOffer?: {
    offerId: string;
    offerCode?: string | null;
    offerName: string;
    offerType: string;
    discountValue: number;
    totalBenefit?: number;
  } | null;
  appliedCoupon?: {
    code: string;
    discount: string;
    minOrder: number;
    offerId?: string;
    totalBenefit?: number;
  } | null;
  products: Record<string, CartProduct>; // key: sku
};

interface CartStore {
  carts: Record<string, Cart>; // key: cartId
  activeCartId: string | null;
  loading: boolean;
  error: string | null;
  addToCart: (
    cartId: string,
    product: Omit<CartProduct, 'quantity'>,
    jwtToken: string,
    phone: string
  ) => Promise<void>;
  removeFromCart: (cartId: string, sku: string, jwtToken: string, phone: string) => Promise<void>;
  increment: (cartId: string, sku: string, jwtToken: string, phone: string) => Promise<void>;
  decrement: (cartId: string, sku: string, jwtToken: string, phone: string) => Promise<void>;
  setActiveCart: (cartId: string) => void;
  clearCart: (cartId: string, jwtToken: string, phone: string) => Promise<void>;
  getCart: (cartId: string, jwtToken: string, phone: string) => Promise<void>;
  refreshCart: (cartId: string, jwtToken: string, phone: string) => Promise<void>;
  refreshAllCarts: (jwtToken: string, phone: string) => Promise<void>;
  refreshActiveCart: (jwtToken: string, phone: string) => Promise<void>;
  getCartCount: (cartId: string) => number;
  getTotalCarts: () => number;
  getAllCarts: () => Cart[];
  syncCartWithApi: (cartId: string, apiData: TransformedCartData) => void;
  setAppliedCoupon: (cartId: string, coupon: Cart['appliedCoupon']) => void;
  getAppliedCoupon: (cartId: string) => Cart['appliedCoupon'];
  removeAppliedCoupon: (cartId: string) => void;
}

const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      carts: {},
      activeCartId: null,
      loading: false,
      error: null,

      addToCart: async (cartId, product, jwtToken, phone) => {
        set({ loading: true, error: null });
        try {
          if (!jwtToken) {
            throw new Error('No authentication token available');
          }

          // Extract shopId from cartId (assuming format: vendor_shopId)
          const shopId = cartId.replace('vendor_', '');

          // Call API to add product
          const apiResponse = await cartApiService.addToCart(shopId, product.sku, jwtToken, phone);

          // Sync local cart with API response
          get().syncCartWithApi(cartId, apiResponse);

          set({ loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to add to cart',
            loading: false,
          });
        }
      },

      removeFromCart: async (cartId, sku, jwtToken, phone) => {
        set({ loading: true, error: null });
        try {
          if (!jwtToken) {
            throw new Error('No authentication token available');
          }

          const shopId = cartId.replace('vendor_', '');
          const apiResponse = await cartApiService.deleteFromCart(
            shopId,
            sku,
            true,
            jwtToken,
            phone
          );

          get().syncCartWithApi(cartId, apiResponse);

          set({ loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to remove from cart',
            loading: false,
          });
        }
      },

      increment: async (cartId, sku, jwtToken, phone) => {
        set({ loading: true, error: null });
        try {
          if (!jwtToken) {
            throw new Error('No authentication token available');
          }

          const shopId = cartId.replace('vendor_', '');

          const apiResponse = await cartApiService.addToCart(shopId, sku, jwtToken, phone);

          // Sync cart with API response (includes updated smartBizOffer)
          get().syncCartWithApi(cartId, apiResponse);

          set({ loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to increment quantity',
            loading: false,
          });
        }
      },

      decrement: async (cartId, sku, jwtToken, phone) => {
        set({ loading: true, error: null });
        try {
          if (!jwtToken) {
            throw new Error('No authentication token available');
          }

          const shopId = cartId.replace('vendor_', '');

          await cartApiService.deleteFromCart(shopId, sku, false, jwtToken, phone);

          // Call getCart API to get the latest cart state
          const getCartResponse = await cartApiService.getCart(shopId, jwtToken, phone);

          // Sync cart with getCart API response
          get().syncCartWithApi(cartId, getCartResponse);

          set({ loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to decrement quantity',
            loading: false,
          });
        }
      },

      setActiveCart: cartId => {
        set({ activeCartId: cartId });
      },

      getCart: async (cartId, jwtToken, phone) => {
        set({ loading: true, error: null });
        try {
          if (!jwtToken) {
            throw new Error('No authentication token available');
          }

          // Get the smartBizCartId from the cart
          const cart = get().carts[cartId];
          let smartBizCartId = cart?.smartBizCartId;

          // If smartBizCartId is not available, try to extract shopId as fallback
          if (!smartBizCartId) {
            const shopId = cartId.replace('vendor_', '');
            smartBizCartId = shopId;
          }

          const apiResponse = await cartApiService.getCart(smartBizCartId, jwtToken, phone);

          // Sync local cart with API response
          get().syncCartWithApi(cartId, apiResponse);

          set({ loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to get cart',
            loading: false,
          });
        }
      },

      refreshCart: async (cartId, jwtToken, phone) => {
        try {
          if (!jwtToken) {
            throw new Error('No authentication token available');
          }

          // Extract shopId from cartId (assuming format: vendor_shopId)
          const shopId = cartId.replace('vendor_', '');

          const apiResponse = await cartApiService.getCart(shopId, jwtToken, phone);

          // Sync local cart with API response
          get().syncCartWithApi(cartId, apiResponse);
        } catch (error) {
          // Don't set error state for refresh operations
          console.error('Failed to refresh cart:', error);
        }
      },

      refreshAllCarts: async (jwtToken, phone) => {
        try {
          if (!jwtToken) {
            throw new Error('No authentication token available');
          }

          const state = get();
          const cartIds = Object.keys(state.carts);

          // Refresh all existing carts
          const refreshPromises = cartIds.map(cartId => {
            const cart = state.carts[cartId];
            let smartBizCartId = cart?.smartBizCartId;

            // If smartBizCartId is not available, try to extract shopId as fallback
            if (!smartBizCartId) {
              const shopId = cartId.replace('vendor_', '');
              smartBizCartId = shopId;
            }

            return cartApiService
              .getCart(smartBizCartId, jwtToken, phone)
              .then(apiResponse => {
                get().syncCartWithApi(cartId, apiResponse);
              })
              .catch(error => {
                console.error(`Failed to refresh cart ${cartId}:`, error);
              });
          });

          await Promise.allSettled(refreshPromises);
        } catch (error) {
          console.error('Failed to refresh all carts:', error);
        }
      },

      refreshActiveCart: async (jwtToken, phone) => {
        try {
          if (!jwtToken) {
            throw new Error('No authentication token available');
          }

          const state = get();
          const activeCartId = state.activeCartId;

          if (activeCartId) {
            const cart = state.carts[activeCartId];
            let smartBizCartId = cart?.smartBizCartId;

            // If smartBizCartId is not available, try to extract shopId as fallback
            if (!smartBizCartId) {
              const shopId = activeCartId.replace('vendor_', '');
              smartBizCartId = shopId;
            }

            const apiResponse = await cartApiService.getCart(smartBizCartId, jwtToken, phone);
            get().syncCartWithApi(activeCartId, apiResponse);
          }
        } catch (error) {
          console.error('Failed to refresh active cart:', error);
        }
      },

      clearCart: async (cartId, jwtToken, phone) => {
        set({ loading: true, error: null });
        try {
          if (!jwtToken) {
            throw new Error('No authentication token available');
          }

          const shopId = cartId.replace('vendor_', '');
          await cartApiService.clearCart(shopId, jwtToken, phone);

          // Remove cart from local state
          set(state => {
            const { [cartId]: _, ...restCarts } = state.carts;
            return { carts: restCarts, loading: false };
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to clear cart',
            loading: false,
          });
        }
      },

      getCartCount: cartId => {
        const cart = get().carts[cartId];
        if (!cart) return 0;
        return Object.values(cart.products).reduce((sum, p) => sum + p.quantity, 0);
      },

      getTotalCarts: () => {
        return Object.keys(get().carts).length;
      },

      getAllCarts: () => {
        return Object.values(get().carts);
      },

      syncCartWithApi: (cartId, apiData) => {
        set(state => {
          // Transform API products to local format
          const transformedProducts: Record<string, CartProduct> = {};

          Object.entries(apiData.products).forEach(([sku, apiProduct]) => {
            transformedProducts[sku] = {
              sku: apiProduct.sku,
              shopId: cartId.replace('vendor_', ''),
              name: apiProduct.productDetails.productName,
              price: apiProduct.finalPrice,
              mrp: apiProduct.productMRP,
              image: apiProduct.productDetails.productImageUrl,
              quantity: apiProduct.itemCount,
              veg: true, // Default to vegetarian, can be updated when API provides this data
            };
          });

          // Check if all products have quantity 0
          const totalQuantity = Object.values(transformedProducts).reduce(
            (sum, product) => sum + product.quantity,
            0
          );

          // If all items have quantity 0, remove the cart entirely
          if (totalQuantity === 0) {
            const { [cartId]: _, ...restCarts } = state.carts;
            return {
              carts: restCarts,
              activeCartId: state.activeCartId === cartId ? null : state.activeCartId,
            };
          }

          // Determine if coupon is applied based on smartBizOffer
          const isCouponApplied =
            apiData.smartBizOffer !== null && apiData.smartBizOffer !== undefined;

          // Sync appliedCoupon with smartBizOffer
          // If smartBizOffer is null, remove appliedCoupon
          // If smartBizOffer exists, use the appliedCoupon from API or create from smartBizOffer
          const appliedCoupon = isCouponApplied
            ? apiData.appliedCoupon ||
              (apiData.smartBizOffer
                ? {
                    code: apiData.smartBizOffer.offerCode || apiData.smartBizOffer.offerId,
                    discount:
                      apiData.smartBizOffer.discountValue > 0
                        ? `${apiData.smartBizOffer.discountValue}%`
                        : `₹${apiData.smartBizOffer.totalBenefit || 0}`,
                    minOrder: 0,
                    offerId: apiData.smartBizOffer.offerId,
                    totalBenefit: apiData.smartBizOffer.totalBenefit || 0,
                  }
                : null)
            : null;

          const updatedCart: Cart = {
            cartId,
            smartBizCartId: apiData.smartBizCartId,
            customerId: apiData.customerId,
            totalCartAmountWithBenefit: apiData.totalCartAmountWithBenefit,
            finalCartAmount: apiData.finalCartAmount,
            totalCartAmount: apiData.totalCartAmount || apiData.totalCartAmountWithBenefit,
            totalDiscountOnItems: apiData.totalDiscountOnItems || 0,
            deliveryFee: apiData.deliveryFee,
            totalCartAmountWithDeliveryFee: apiData.totalCartAmountWithDeliveryFee,
            totalCartAmountWithDeliveryFeeAndBenefit:
              apiData.totalCartAmountWithDeliveryFeeAndBenefit,
            smartBizOffer: apiData.smartBizOffer || null,
            appliedCoupon: appliedCoupon,
            products: transformedProducts,
          };

          return {
            carts: {
              ...state.carts,
              [cartId]: updatedCart,
            },
            activeCartId: cartId,
          };
        });
      },

      setAppliedCoupon: (cartId, coupon) => {
        set(state => {
          const cart = state.carts[cartId];
          if (!cart) return state;

          return {
            carts: {
              ...state.carts,
              [cartId]: {
                ...cart,
                appliedCoupon: coupon,
              },
            },
          };
        });
      },

      getAppliedCoupon: cartId => {
        const cart = get().carts[cartId];

        // Sync with smartBizOffer: if smartBizOffer is null, no coupon is applied
        if (!cart?.smartBizOffer) {
          return null;
        }

        // If smartBizOffer exists, return appliedCoupon or create from smartBizOffer
        if (cart.appliedCoupon) {
          return cart.appliedCoupon;
        } else {
          // Create appliedCoupon from smartBizOffer
          return {
            code: cart.smartBizOffer.offerCode || cart.smartBizOffer.offerId,
            discount:
              cart.smartBizOffer.discountValue > 0
                ? `${cart.smartBizOffer.discountValue}%`
                : `₹${cart.smartBizOffer.totalBenefit || 0}`,
            minOrder: 0,
            offerId: cart.smartBizOffer.offerId,
            totalBenefit: cart.smartBizOffer.totalBenefit || 0,
          };
        }
      },

      removeAppliedCoupon: cartId => {
        set(state => {
          const cart = state.carts[cartId];
          if (!cart) return state;

          return {
            carts: {
              ...state.carts,
              [cartId]: {
                ...cart,
                appliedCoupon: null,
              },
            },
          };
        });
      },
    }),
    {
      name: 'cart-storage', // unique name for the storage key
      storage: createJSONStorage(() => mmkvStorage),
      // Only persist these fields, exclude loading and error states
      partialize: state => ({
        carts: state.carts,
        activeCartId: state.activeCartId,
      }),
    }
  )
);

export default useCartStore;
