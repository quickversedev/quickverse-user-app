import { create } from 'zustand';
import { mockOrders } from '../../assets/mock/orders';
import axiosInstance from '../../config/api/axios.config';
import { Order, OrderFilters, OrderResponse, OrderStore } from '../../types/order';

const ORDER_API_URL = '/v2/getSMZBIZOrders';

const USE_ORDER_MOCKS = false; // Set to false for real API

const useOrderStore = create<OrderStore>((set, get) => ({
  // Initial state
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

  // Actions
  fetchOrders: async (
    jwt: string,
    phone: string,
    cursor?: string | null,
    pageSize: number = 10
  ) => {
    set({ loading: true, error: null });

    if (USE_ORDER_MOCKS) {
      // Simulate API delay
      setTimeout(() => {
        set({
          orders: mockOrders,
          pagination: {
            cursor: null,
            pageSize: 10,
            hasMore: false,
          },
          loading: false,
        });
      }, 1000);
      return;
    }

    try {
      // Use the provided cursor or get the current cursor from state
      const currentCursor = cursor !== undefined ? cursor : get().pagination.cursor;

      const requestData = {
        cursor: currentCursor,
      };

      const response = await axiosInstance.post<OrderResponse>(
        `${ORDER_API_URL}?pageSize=${pageSize}`,
        requestData,
        {
          headers: {
            SessionKey: jwt,
            phone: phone,
          },
        }
      );

      const { orders, pagination } = response.data;

      // Update pagination with the new cursor from response
      const updatedPagination = {
        ...pagination,
        cursor: pagination.cursor, // Save the cursor from response
        hasMore: pagination.cursor !== null, // Check if there are more pages
      };

      // If this is the first page (cursor is null), replace orders
      // Otherwise, append to existing orders
      set(state => ({
        orders: currentCursor === null ? orders : [...state.orders, ...orders],
        pagination: updatedPagination,
        loading: false,
      }));
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Failed to fetch orders';
      set({ error: errorMessage, loading: false });
    }
  },

  fetchOrderById: async (orderId: string, jwt: string, _phone: string) => {
    set({ loading: true, error: null });

    try {
      // First check if order exists in current state
      const existingOrder = get().orders.find(order => order.orderId === orderId);
      if (existingOrder) {
        set({ selectedOrder: existingOrder, loading: false });
        return;
      }

      if (USE_ORDER_MOCKS) {
        // Find order in mock data
        setTimeout(() => {
          const mockOrder = mockOrders.find(order => order.orderId === orderId);
          if (mockOrder) {
            set({ selectedOrder: mockOrder, loading: false });
          } else {
            set({ error: 'Order not found', loading: false });
          }
        }, 500);
        return;
      }

      // If not found in state, fetch from API
      // Note: You might need to adjust this endpoint based on your API
      const response = await axiosInstance.get(`${ORDER_API_URL}/${orderId}`, {
        headers: {
          SessionKey: jwt,
          'Request-Origin': 'QUICKVERSE',
        },
      });

      set({ selectedOrder: response.data, loading: false });
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Failed to fetch order details';
      set({ error: errorMessage, loading: false });
    }
  },

  setOrders: (orders: Order[]) => set({ orders }),
  setSelectedOrder: (order: Order | null) => set({ selectedOrder: order }),
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),

  setFilters: (filters: Partial<OrderFilters>) =>
    set(state => ({ filters: { ...state.filters, ...filters } })),

  clearFilters: () => set({ filters: {} }),

  clearOrders: () => set({ orders: [], pagination: { cursor: null, pageSize: 10, hasMore: true } }),

  // Computed values
  getOrdersByStatus: (status: Order['status']) => {
    const { orders } = get();
    return orders.filter(order => order.status === status);
  },

  getFilteredOrders: () => {
    const { orders, filters } = get();
    let filtered = orders;

    if (filters.status) {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    if (filters.shopId) {
      filtered = filtered.filter(order => order.shopId === filters.shopId);
    }

    if (filters.dateRange) {
      const { startDate, endDate } = filters.dateRange;
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.orderDate);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return orderDate >= start && orderDate <= end;
      });
    }

    return filtered;
  },

  getOrderById: (orderId: string) => {
    const { orders } = get();
    return orders.find(order => order.orderId === orderId);
  },

  getRecentOrders: (limit: number = 5) => {
    const { orders } = get();
    return orders
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
      .slice(0, limit);
  },
}));

export default useOrderStore;
