import { create } from 'zustand';
import { mockOrders } from '../../assets/mock/orders';
import axiosInstance from '../../config/api/axios.config';
import { Order, OrderCursor, OrderFilters, OrderResponse, OrderStore } from '../../types/order';

const ORDER_API_URL = '/v2/order/getSMZBIZOrders';

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
    cursor: OrderCursor | null,
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
      const { ordersMetadata, cursor: nextCursor } = response.data;

      type SkuGroup = {
        id?: string;
        sku?: string;
        itemCount?: number;
        finalPrice?: number;
        shopPrice?: number;
        productDetails?: {
          sku?: string;
          productName?: string;
          productDescription?: string;
          productImageUrl?: string;
        };
      };
      type OrderMeta = {
        orderId?: string | number;
        totalOrderAmount?: number;
        state?: string;
        creationTime?: string | number;
        customerDeliveryAddress?: {
          addressLine1?: string;
          city?: string;
          state?: string;
          pincode?: string;
        };
        paymentMethod?: string;
        notificationDetail?: { customerName?: string; mobileNumber?: string | number };
        skuDetailsGrouped?: SkuGroup[];
      };

      const normalizeStatus = (state?: string): Order['status'] => {
        const s = String(state || '').toLowerCase();
        if (s === 'rejected') return 'cancelled';
        if (s === 'delivered') return 'delivered';
        if (s === 'confirmed') return 'confirmed';
        if (s === 'preparing') return 'preparing';
        if (s === 'ready') return 'ready';
        return 'pending';
      };

      const mappedOrders: Order[] = (ordersMetadata || []).map((m: OrderMeta) => {
        const firstGroup = m.skuDetailsGrouped && m.skuDetailsGrouped[0];
        const items = (m.skuDetailsGrouped || []).map((g: SkuGroup) => ({
          id: String(g.id || g.sku || g.productDetails?.sku || ''),
          name: String(g.productDetails?.productName || 'Item'),
          quantity: Number(g.itemCount ?? 1),
          price: Number(g.finalPrice ?? g.shopPrice ?? 0),
          totalPrice: Number((g.finalPrice ?? g.shopPrice ?? 0) * (g.itemCount ?? 1)),
          description: g.productDetails?.productDescription,
          image: g.productDetails?.productImageUrl,
        }));

        return {
          orderId: String(m.orderId ?? ''),
          shopId: String((firstGroup as any)?.shopId ?? ''),
          shopName: '',
          items,
          totalAmount: Number(m.totalOrderAmount ?? 0),
          status: normalizeStatus(m.state),
          orderDate:
            typeof m.creationTime === 'string' && /\D/.test(m.creationTime)
              ? new Date(m.creationTime).toISOString()
              : new Date(Number(m.creationTime ?? Date.now())).toISOString(),
          deliveryAddress: {
            address: m.customerDeliveryAddress?.addressLine1 ?? '',
            city: m.customerDeliveryAddress?.city ?? '',
            state: m.customerDeliveryAddress?.state ?? '',
            postalCode: m.customerDeliveryAddress?.pincode ?? '',
          },
          paymentMethod: (m.paymentMethod?.toLowerCase() as Order['paymentMethod']) || 'cash',
          paymentStatus: 'paid',
          customerName: m.notificationDetail?.customerName ?? '',
          customerPhone: String(m.notificationDetail?.mobileNumber ?? ''),
        } as Order;
      });

      const updatedPagination = {
        cursor: (nextCursor as OrderCursor | null) ?? null,
        pageSize,
        hasMore: nextCursor !== null,
      };

      set(state => ({
        orders: currentCursor === null ? mappedOrders : [...state.orders, ...mappedOrders],
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
