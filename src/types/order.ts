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
  status:
    | 'payment_pending'
    | 'processing'
    | 'confirmed'
    | 'shipped'
    | 'ready'
    | 'delivered'
    | 'cancelled';
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

export type OrderCursor = {
  creationTime: string;
  orderId: string;
  customerId: string;
};

export interface OrderPagination {
  cursor: OrderCursor | null;
  pageSize: number;
  hasMore: boolean;
}

export interface OrderResponse {
  ordersMetadata: any[];
  cursor: OrderCursor | null;
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
  fetchOrders: (
    jwt: string,
    phone: string,
    cursor: OrderCursor | null,
    pageSize?: number
  ) => Promise<void>;
  fetchOrderById: (orderId: string, jwt: string, phone: string) => Promise<void>;
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
