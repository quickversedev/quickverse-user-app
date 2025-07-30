export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  totalPrice: number;
  description?: string;
  image?: string;
}

export interface OrderAddress {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Order {
  orderId: string;
  shopId: string;
  shopName: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  orderDate: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  deliveryAddress: OrderAddress;
  paymentMethod: 'cash' | 'card' | 'upi';
  paymentStatus: 'pending' | 'paid' | 'failed';
  specialInstructions?: string;
  customerName: string;
  customerPhone: string;
}

export interface OrderFilters {
  status?: Order['status'];
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  shopId?: string;
}

export interface OrderPagination {
  cursor: string | null;
  pageSize: number;
  hasMore: boolean;
}

export interface OrderResponse {
  orders: Order[];
  pagination: OrderPagination;
}

export interface OrderStore {
  // State
  orders: Order[];
  selectedOrder: Order | null;
  loading: boolean;
  error: string | null;
  filters: OrderFilters;
  pagination: OrderPagination;

  // Actions
  fetchOrders: (cursor?: string | null, pageSize?: number) => Promise<void>;
  fetchOrderById: (orderId: string) => Promise<void>;
  setOrders: (orders: Order[]) => void;
  setSelectedOrder: (order: Order | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<OrderFilters>) => void;
  clearFilters: () => void;
  clearOrders: () => void;

  // Computed values
  getOrdersByStatus: (status: Order['status']) => Order[];
  getFilteredOrders: () => Order[];
  getOrderById: (orderId: string) => Order | undefined;
  getRecentOrders: (limit?: number) => Order[];
}
