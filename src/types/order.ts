export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  totalPrice: number;
  description?: string;
  image?: string;

  uuid?: string | null;
  sku?: string | null;
  barcodeId?: string | null;
  scannedBarcodeId?: string | null;
  stringBarcodeId?: string | null;

  weightOrQuantity?: number;
  uom?: string | null;
  weightFlag?: string | null;
  unitFlag?: string | null;

  shopPrice?: number;
  mrp?: number;
  finalPrice?: number;

  discount?: number;

  offer?: string | null;
  appliedOffer?: string | null;
  offerRuleId?: string | null;

  appliedOffers?: any[];
  applicableOffers?: any[] | null;
  nonApplicableOffers?: any[] | null;

  mrpStrikeOutFlag?: boolean;
  isScanned?: boolean;
  parkingTicket?: boolean;
  forceOverride?: boolean;

  showQuantityUpdate?: boolean;
  showMultiplePricePopup?: boolean;
  showEditWeightPopup?: boolean;
  editPriceType?: string | null;

  isOOS?: boolean;
  isBestSeller?: boolean;

  returnEligibility?: ReturnEligibility | null;

  productPriceDetails?: ProductPriceDetail[];
  latestProductPrice?: ProductPriceDetail | null;
}

export interface ProductPriceDetail {
  sku?: string;
  shopId?: number;
  shopPrice: number;
  productMRP: number;
  isLatestPrice?: string;
}

export interface ReturnEligibility {
  status?: string;
  returnEligibleTillTimestamp?: string | null;
  returnable?: boolean;
}

export interface OrderAddress {
  address: string;
  addressLine2?: string;
  addressLine3?: string;
  city: string;
  state: string;
  postalCode: string;

  name?: string;
  addressLine1?: string;

  coordinates?: {
    latitude: number;
    longitude: number;
  };

  latitude?: number | null;
  longitude?: number | null;

  addressQualityScore?: number;
  gstNumber?: string | null;
}

export interface OrderFinance {
  id: string;
  itemTotalAmount: number;

  couponId: string | null;
  couponCode: string | null;
  couponDiscount: number;

  deliveryCouponId: string | null;
  deliveryCouponCode: string | null;
  isFreeDelivery: boolean;

  amountAfterCoupon: number;

  packagingCharges: number;
  actualDeliveryFee: number;
  deliveryFee: number;
  platformFee: number;
  razorpayCharges: number;

  serviceGstRate: number;
  commissionGst: number;
  deliveryGst: number;
  packagingGst: number;
  platformGst: number;
  codGst: number;
  totalGst: number;

  taxableAmount: number;
  payableAmount: number;

  commissionRate: number;
  commission: number;
  codCharges: number;

  createdAt: string;
  updatedAt: string | null;
}

export interface OrderTimestamps {
  createdAt?: string | null;
  assignedAt?: string | null;
  arrivedAtStoreAt?: string | null;
  pickedUpAt?: string | null;
  reachedLocationAt?: string | null;
  deliveredAt?: string | null;
  deliveryTime?: string | null;
  cancelledAt?: string | null;
  rejectedAt?: string | null;
  updatedAt?: string | null;
}

export interface CustomerNotificationDetails {
  addressId?: string | null;
  mobileNumber?: string | null;
  emailId?: string | null;
  customerName?: string | null;
}

export interface DeliveryPartnerDetails {
  id?: string | null;
  name?: string | null;
  mobileNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  gender?: string | null;
  address?: string | null;

  profilePicture?: string | null;
  drivingLicence?: string | null;
  rcDocument?: string | null;
  aadharCard?: string | null;

  createdAt?: string | null;
  createdBy?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;

  isActive?: boolean | null;
  isOnline?: boolean | null;
  isTest?: boolean | null;

  totalOrders?: number | null;
  orderSuccess?: number | null;
  orderFailed?: number | null;

  todayOrders?: number | null;
  weeklyOrders?: number | null;
  monthlyOrders?: number | null;
  cashAmount?: number | null;

  latitude?: number | null;
  longitude?: number | null;
  lastLocationUpdatedAt?: string | null;

  vehicleType?: string | null;
  regionId?: string | null;
}

export interface OrderReview {
  id?: string;
  feedbackId?: string;
  orderId?: string;
  shopId?: string;
  regionId?: string | null;

  customerId?: string;
  customerName?: string;
  mobileNumber?: string;

  type?: string;
  rating?: number;

  complaintCategory?: string | null;
  message?: string;
  attachmentUrl?: string | null;

  status?: string;
  adminReply?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface OrderComplaint {
  id?: string;
  feedbackId?: string;
  orderId?: string;
  shopId?: string;
  regionId?: string | null;

  customerId?: string;
  customerName?: string;
  mobileNumber?: string;

  type?: string;
  rating?: number;

  complaintCategory?: string | null;
  message?: string;
  attachmentUrl?: string | null;

  status?: string;
  adminReply?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface Order {
  orderId: string;
  customerId: string;
  shopId: string;
  shopName: string;

  items: OrderItem[];

  totalAmount: number;

  additionalPaymentCharges?: number;
  deliveryFees?: number;
  totalInvoiceAmount?: number;

  totalOrderAmount?: number;
  totalDiscount?: number;
  totalInvoiceAmountIncludingPaymentCharges?: number;
  totalOrderAmountIncludingPaymentCharges?: number;
  amountExcludingDeliveryFee?: number;
  shippingFees?: number | null;
  smartBizTotalDiscountValue?: number;
  totalItemCount?: number;
  /** What the order was charged (our finance record), when the server has it. */
  chargedAmount?: number;
  /** Set when this is one kirana's part of a Daily Essentials order: that order's id. */
  essentialsOrderId?: string;
  status:
    | 'payment_pending'
    | 'processing'
    | 'confirmed'
    | 'shipped'
    | 'shipping'
    | 'ready'
    | 'delivered'
    | 'cancelled'
    | 'rejected'
    | string;

  state?: string | null;
  orderMasterStatus?: string;
  refundStatus?: string | null;
  cancelReason?: string | null;
  customerAction?: string | null;

  orderDate: string;
  creationTime?: string | null;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  deliveryTime?: string | null;

  timestamps?: OrderTimestamps;

  deliveryAddress: OrderAddress;

  paymentMethod: 'cash' | 'card' | 'upi' | 'cod' | string;

  paymentStatus: 'pending' | 'paid' | 'failed' | 'yet_to_receive' | string;

  paymentReceivalStatus?: string | null;

  paymentGatewayUniqueTransactionId?: string | null;
  paymentGatewayConfirmationId?: string | null;

  specialInstructions?: string;

  customerName: string;
  customerPhone: string;

  customerNotificationDetails?: CustomerNotificationDetails | null;

  fulfillmentOption?: string | null;
  selfDeliveryMode?: string | null;
  deliveryStrategy?: string | null;

  deliveryAgentName?: string | null;
  deliveryAgentMobileNumber?: string | null;

  deliveryPartnerName?: string | null;
  deliveryPartnerDetails?: DeliveryPartnerDetails | null;

  trackingId?: string | null;
  trackingUrl?: string | null;
  shippingDetails?: any | null;

  platform?: string | null;
  orderProcessingPlatform?: string | null;

  smartBizOffers?: any[];
  platformOrderDetails?: any | null;

  finance: OrderFinance | null;

  complaint: OrderComplaint | any;
  review: OrderReview | any;

  tracking?: OrderTrackingInfo | null;
}

export interface OrderTrackingInfo {
  orderMasterStatus: string | null;

  riderId?: string | null;
  riderName: string | null;
  riderPhone: string | null;
  riderProfilePicture: string | null;

  riderLatitude: string | number | null;
  riderLongitude: string | number | null;

  riderOnline?: boolean | null;

  shopName: string | null;
  shopLatitude: string | number | null;
  shopLongitude: string | number | null;

  preparationTime: string | null;

  assignedAt: string | null;
  arrivedAtStoreAt: string | null;
  pickedUpAt: string | null;
  reachedLocationAt: string | null;
  deliveredAt: string | null;
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
  orders: Order[];
  selectedOrder: Order | null;
  loading: boolean;
  error: string | null;
  filters: OrderFilters;
  pagination: OrderPagination;

  fetchOrders: (
    jwt: string,
    phone: string,
    cursor: OrderCursor | null,
    pageSize?: number
  ) => Promise<void>;

  fetchOrderById: (orderId: string, jwt: string, phone: string, shopId?: string) => Promise<void>;

  refreshInProgressStatuses: (jwt: string, phone: string) => Promise<void>;

  setOrders: (orders: Order[]) => void;

  setSelectedOrder: (order: Order | null) => void;

  setLoading: (loading: boolean) => void;

  setError: (error: string | null) => void;

  setFilters: (filters: Partial<OrderFilters>) => void;

  clearFilters: () => void;

  clearOrders: () => void;

  getOrdersByStatus: (status: Order['status']) => Order[];

  getFilteredOrders: () => Order[];

  getOrderById: (orderId: string) => Order | undefined;

  getRecentOrders: (limit?: number) => Order[];
}
