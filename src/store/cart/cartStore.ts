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
  image: string | number; // require() returns number, uri is string
  quantity: number;
};

export type Cart = {
  cartId: string;
  smartBizCartId: string; // Maps to cartId from API
  customerId?: string;
  totalCartAmountWithBenefit?: number;
  finalCartAmount?: number;
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
  getCartCount: (cartId: string) => number;
  getTotalCarts: () => number;
  getAllCarts: () => Cart[];
  syncCartWithApi: (cartId: string, apiData: TransformedCartData) => void;
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
          const apiResponse = await cartApiService.deleteFromCart(
            shopId,
            sku,
            false,
            jwtToken,
            phone
          );

          get().syncCartWithApi(cartId, apiResponse);

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

          const updatedCart: Cart = {
            cartId,
            smartBizCartId: apiData.smartBizCartId,
            customerId: apiData.customerId,
            totalCartAmountWithBenefit: apiData.totalCartAmountWithBenefit,
            finalCartAmount: apiData.finalCartAmount,
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
