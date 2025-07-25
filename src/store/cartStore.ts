import { create } from 'zustand';

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
  products: Record<string, CartProduct>; // key: sku
};

interface CartStore {
  carts: Record<string, Cart>; // key: cartId
  activeCartId: string | null;
  addToCart: (cartId: string, product: Omit<CartProduct, 'quantity'>) => void;
  removeFromCart: (cartId: string, sku: string) => void;
  increment: (cartId: string, sku: string) => void;
  decrement: (cartId: string, sku: string) => void;
  setActiveCart: (cartId: string) => void;
  clearCart: (cartId: string) => void;
  getCartCount: (cartId: string) => number;
  getTotalCarts: () => number;
  getAllCarts: () => Cart[];
}

const MAX_CARTS = 3;

const useCartStore = create<CartStore>((set, get) => ({
  carts: {},
  activeCartId: null,

  addToCart: (cartId, product) => {
    set(state => {
      // If cart doesn't exist and max carts reached, do nothing
      if (!state.carts[cartId] && Object.keys(state.carts).length >= MAX_CARTS) {
        return {};
      }
      const cart = state.carts[cartId] || { cartId, products: {} };
      const existing = cart.products[product.sku];
      const updatedProducts = {
        ...cart.products,
        [product.sku]: existing
          ? { ...existing, quantity: existing.quantity + 1 }
          : { ...product, quantity: 1 },
      };
      return {
        carts: {
          ...state.carts,
          [cartId]: { ...cart, products: updatedProducts },
        },
        activeCartId: cartId,
      };
    });
  },

  removeFromCart: (cartId, sku) => {
    set(state => {
      const cart = state.carts[cartId];
      if (!cart) return {};
      const { [sku]: _, ...rest } = cart.products;
      return {
        carts: {
          ...state.carts,
          [cartId]: { ...cart, products: rest },
        },
      };
    });
  },

  increment: (cartId, sku) => {
    set(state => {
      const cart = state.carts[cartId];
      if (!cart || !cart.products[sku]) return {};
      return {
        carts: {
          ...state.carts,
          [cartId]: {
            ...cart,
            products: {
              ...cart.products,
              [sku]: {
                ...cart.products[sku],
                quantity: cart.products[sku].quantity + 1,
              },
            },
          },
        },
      };
    });
  },

  decrement: (cartId, sku) => {
    set(state => {
      const cart = state.carts[cartId];
      if (!cart || !cart.products[sku]) return {};
      const currentQty = cart.products[sku].quantity;
      if (currentQty <= 1) {
        // Remove product if quantity goes to 0
        const { [sku]: _, ...rest } = cart.products;
        return {
          carts: {
            ...state.carts,
            [cartId]: { ...cart, products: rest },
          },
        };
      }
      return {
        carts: {
          ...state.carts,
          [cartId]: {
            ...cart,
            products: {
              ...cart.products,
              [sku]: {
                ...cart.products[sku],
                quantity: currentQty - 1,
              },
            },
          },
        },
      };
    });
  },

  setActiveCart: cartId => {
    set({ activeCartId: cartId });
  },

  clearCart: cartId => {
    set(state => {
      if (!state.carts[cartId]) return {};
      const { [cartId]: _, ...restCarts } = state.carts;
      return {
        carts: restCarts,
      };
    });
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
}));

export default useCartStore;
