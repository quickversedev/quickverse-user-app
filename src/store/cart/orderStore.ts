import { create } from 'zustand';
import { mockOrders } from '../../assets/mock/orders';
import axiosInstance, { apiCall, getAuthHeader } from '../../config/api/axios.config';
import {
  DeliveryPartnerDetails,
  Order,
  OrderCursor,
  OrderFilters,
  OrderResponse,
  OrderStore,
} from '../../types/order';

const ORDER_API_URL = '/v2/order/getSMZBIZOrders';

const USE_ORDER_MOCKS = false; // Set to false for real API

// Normalize backend order state (or orderMasterStatus) to app's Order['status']
const normalizeStatus = (state?: string): Order['status'] => {
  const s = String(state || '').toLowerCase();
  switch (s) {
    case 'open':
      return 'payment_pending';
    case 'pending':
      return 'processing';
    case 'accepted':
      return 'confirmed';
    case 'shipped':
    case 'partner_assigned':
    case 'reached_location':
    case 'out_for_delivery':
    case 'order_picked_up':
      return 'shipping';
    case 'packed':
      return 'ready';
    case 'completed':
    case 'delivered':
      return 'delivered';
    case 'cancelled':
    case 'rejected':
      return 'cancelled';
    default:
      return 'processing';
  }
};

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
    // Prevent duplicate API calls if already loading
    if (get().loading) {
      return;
    }

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

      const data = await apiCall(
        axiosInstance.post<OrderResponse>(`${ORDER_API_URL}?pageSize=${pageSize}`, requestData, {
          headers: {
            SessionKey: jwt,
            Authorization: getAuthHeader(),

            phone: phone,
          },
        })
      );

      const { ordersMetadata, cursor: nextCursor } = data;

      type SkuGroup = {
        id?: string;
        shopId?: string;
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
        customerId?: string | number;
        totalOrderAmount?: number;
        additionalPaymentCharges?: number;
        addressLine2?: string;
        addressLine3?: string;
        customerMobileNumber?: string | number;
        deliveryDetails?: {
          deliveryFees?: number;
        };
        totalInvoiceAmount?: number;
        totalOrderAmountIncludingPaymentCharges?: number;
        state?: string;
        creationTime?: string | number;
        customerDeliveryAddress?: {
          name?: string;
          addressLine1?: string;
          addressLine2?: string;
          addressLine3?: string;
          city?: string;
          state?: string;
          pincode?: string;
        };
        paymentMethod?: string;
        notificationDetail?: { customerName?: string; mobileNumber?: string | number };
        skuDetailsGrouped?: SkuGroup[];
        orderMasterStatus?: string;
      };

      const mappedOrders: Order[] = (ordersMetadata || []).map((m: OrderMeta) => {
        const firstGroup: { shopId?: string } | undefined =
          m.skuDetailsGrouped && m.skuDetailsGrouped[0];
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
          customerId: String(m.customerId ?? ''),
          shopId: String(firstGroup?.shopId ?? ''),
          shopName: '',
          items,
          totalAmount: Number(m.totalOrderAmount ?? 0),
          additionalPaymentCharges: Number(m.additionalPaymentCharges ?? 0),
          deliveryFees: Number(m.deliveryDetails?.deliveryFees ?? 0),
          totalInvoiceAmount: Number(m.totalInvoiceAmount ?? 0),
          status: (() => {
            const s = String(m.state || '').toLowerCase();
            if (s === 'cancelled' || s === 'rejected') return normalizeStatus(m.state);
            return normalizeStatus(m.orderMasterStatus || m.state);
          })(),
          orderMasterStatus: m.orderMasterStatus || undefined,
          orderDate:
            typeof m.creationTime === 'string' && /\D/.test(m.creationTime)
              ? new Date(m.creationTime).toISOString()
              : new Date(Number(m.creationTime ?? Date.now())).toISOString(),
          deliveryAddress: {
            address: m.customerDeliveryAddress?.addressLine1 ?? '',
            addressLine2: m.customerDeliveryAddress?.addressLine2 ?? '',
            addressLine3: m.customerDeliveryAddress?.addressLine3 ?? '',
            city: m.customerDeliveryAddress?.city ?? '',
            state: m.customerDeliveryAddress?.state ?? '',
            postalCode: m.customerDeliveryAddress?.pincode ?? '',
          },
          paymentMethod: (m.paymentMethod?.toLowerCase() as Order['paymentMethod']) || 'cash',
          paymentStatus: 'paid',
          customerName: m.customerDeliveryAddress?.name ?? '',
          customerPhone: String(m.notificationDetail?.mobileNumber ?? ''),
        } as Order;
      });

      const updatedPagination = {
        cursor: (nextCursor as OrderCursor | null) ?? null,
        pageSize,
        hasMore: nextCursor !== null,
      };

      set(state => {
        let finalOrders;
        if (currentCursor === null) {
          // Preserve orderMasterStatus corrections from detail API fetches,
          // since the list API doesn't return orderMasterStatus
          const existingMap = new Map(state.orders.map(o => [o.orderId, o]));
          finalOrders = mappedOrders.map(o => {
            const existing = existingMap.get(o.orderId);
            if (existing?.orderMasterStatus && !o.orderMasterStatus) {
              return {
                ...o,
                status: existing.status,
                orderMasterStatus: existing.orderMasterStatus,
              };
            }
            return o;
          });
        } else {
          finalOrders = [...state.orders, ...mappedOrders];
        }

        return {
          orders: finalOrders,
          pagination: updatedPagination,
          loading: false,
        };
      });
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Failed to fetch orders';
      set({ error: errorMessage, loading: false });
    }
  },

  fetchOrderById: async (orderId: string, jwt: string, phone: string, shopId?: string) => {
    set({ loading: true, error: null });

    try {
      if (USE_ORDER_MOCKS) {
        setTimeout(() => {
          const mockOrder = mockOrders.find(order => order.orderId === orderId);

          if (mockOrder) {
            set({
              selectedOrder: mockOrder,
              loading: false,
            });
          } else {
            set({
              error: 'Order not found',
              loading: false,
            });
          }
        }, 500);

        return;
      }

      const apiOrder = await apiCall(
        axiosInstance.get(
          `/v2/order/fetchOrder?groupify=true&viewMode=CONSTELLATION_VIEW&shopId=${
            shopId || ''
          }&orderId=${orderId}`,
          {
            headers: {
              SessionKey: jwt,
              Authorization: getAuthHeader(),
              phone,
            },
          }
        )
      );

      const toDate = (value: any): string | null => {
        if (value === null || value === undefined || value === '') {
          return null;
        }

        try {
          if (typeof value === 'string' && /\D/.test(value)) {
            return new Date(value).toISOString();
          }

          return new Date(Number(value)).toISOString();
        } catch {
          return null;
        }
      };

      const rider =
        apiOrder.deliveryPartnerDetails ||
        apiOrder.deliveryPartner ||
        apiOrder.riderDetail ||
        apiOrder.rider ||
        null;

      const riderDetails: DeliveryPartnerDetails | null =
        rider || apiOrder.deliveryPartnerName
          ? {
              id: rider?.id || null,
              name:
                rider?.name || apiOrder.deliveryPartnerName || apiOrder.deliveryAgentName || null,
              mobileNumber: String(rider?.mobileNumber || apiOrder.deliveryAgentMobileNumber || ''),
              phone: rider?.phone || null,
              email: rider?.email || null,
              gender: rider?.gender || null,
              address: rider?.address || null,
              profilePicture: rider?.profilePicture || null,
              drivingLicence: rider?.drivingLicence || null,
              rcDocument: rider?.rcDocument || null,
              aadharCard: rider?.aadharCard || null,
              createdAt: toDate(rider?.createdAt),
              createdBy: rider?.createdBy || null,
              updatedAt: toDate(rider?.updatedAt),
              updatedBy: rider?.updatedBy || null,
              isActive: rider?.isActive ?? null,
              isOnline: rider?.isOnline ?? null,
              isTest: rider?.isTest ?? null,
              totalOrders: rider?.totalOrders ?? null,
              orderSuccess: rider?.orderSuccess ?? null,
              orderFailed: rider?.orderFailed ?? null,
              todayOrders: rider?.todayOrders ?? null,
              weeklyOrders: rider?.weeklyOrders ?? null,
              monthlyOrders: rider?.monthlyOrders ?? null,
              cashAmount: rider?.cashAmount ?? null,
              latitude:
                rider?.latitude !== null && rider?.latitude !== undefined
                  ? Number(rider.latitude)
                  : null,
              longitude:
                rider?.longitude !== null && rider?.longitude !== undefined
                  ? Number(rider.longitude)
                  : null,
              lastLocationUpdatedAt: toDate(rider?.lastLocationUpdatedAt),
              vehicleType: rider?.vehicleType || null,
              regionId: rider?.regionId || null,
            }
          : null;

      const mappedOrder: Order = {
        orderId: String(apiOrder.orderId || orderId),
        customerId: String(apiOrder.customerId || ''),
        shopId: String(apiOrder.shopId || ''),
        shopName: String(apiOrder.shopName || apiOrder.shopDetails?.shopName || ''),
        platform: apiOrder.platform || null,
        orderProcessingPlatform: apiOrder.orderProcessingPlatform || null,
        items: (apiOrder.skuDetailsGrouped || []).map((item: any) => {
          const finalPrice = Number(item.finalPrice ?? item.shopPrice ?? 0);
          const quantity = Number(item.itemCount ?? item.weightOrQuantity ?? 1);
          const productPriceDetails = item.productPriceDetailList || [];
          const latestPrice =
            productPriceDetails.find((price: any) => price.isLatestPrice === 'Y') || null;

          return {
            id: String(item.id || item.uuid || item.sku || item.barcodeId || ''),
            name: String(item.productDetails?.productName || 'Item'),
            quantity,
            price: finalPrice,
            totalPrice: finalPrice * quantity,
            description: item.productDetails?.productDescription,
            image: item.productDetails?.productImageUrl,
            uuid: item.uuid || null,
            sku: item.sku || null,
            barcodeId: item.barcodeId || null,
            scannedBarcodeId: item.scannedBarcodeId || null,
            stringBarcodeId: item.stringBarcodeId || null,
            weightOrQuantity: Number(item.weightOrQuantity ?? quantity),
            uom: item.productDetails?.uom || null,
            weightFlag: item.productDetails?.weightFlag || null,
            unitFlag: item.productDetails?.unitFlag || null,
            shopPrice: Number(item.shopPrice ?? 0),
            mrp: Number(item.productMRP ?? 0),
            finalPrice,
            discount: Number(item.discount ?? 0),
            offer: item.offer || null,
            appliedOffer: item.appliedOffer || null,
            offerRuleId: item.offerRuleId || null,
            appliedOffers: item.appliedOffers || [],
            applicableOffers: item.applicableOffers || null,
            nonApplicableOffers: item.nonApplicableOffers || null,
            mrpStrikeOutFlag: item.mrpStrikeOutFlag ?? false,
            isScanned: item.isScanned ?? false,
            parkingTicket: item.parkingTicket ?? false,
            forceOverride: item.forceOverride ?? false,
            showQuantityUpdate: item.showQuantityUpdate ?? false,
            showMultiplePricePopup: item.showMultiplePricePopup ?? false,
            showEditWeightPopup: item.showEditWeightPopup ?? false,
            editPriceType: item.editPriceType || null,
            isOOS: item.productDetails?.additionalAttributes?.isOOS ?? false,
            isBestSeller: item.productDetails?.additionalAttributes?.isBestSeller ?? false,
            returnEligibility: item.returnEligibilityDocument || null,
            productPriceDetails,
            latestProductPrice: latestPrice
              ? {
                  sku: latestPrice.sku,
                  shopId: latestPrice.shopId,
                  shopPrice: Number(latestPrice.shopPrice ?? 0),
                  productMRP: Number(latestPrice.productMRP ?? 0),
                  isLatestPrice: latestPrice.isLatestPrice,
                }
              : null,
          };
        }),
        totalItemCount: Number(apiOrder.totalItemCount ?? 0),
        totalAmount: Number(apiOrder.totalOrderAmount ?? 0),
        totalOrderAmount: Number(apiOrder.totalOrderAmount ?? 0),
        totalDiscount: Number(apiOrder.totalDiscount ?? 0),
        totalInvoiceAmount: Number(apiOrder.totalInvoiceAmount ?? apiOrder.totalOrderAmount ?? 0),
        totalInvoiceAmountIncludingPaymentCharges: Number(
          apiOrder.totalInvoiceAmountIncludingPaymentCharges ?? 0
        ),
        totalOrderAmountIncludingPaymentCharges: Number(
          apiOrder.totalOrderAmountIncludingPaymentCharges ?? 0
        ),
        amountExcludingDeliveryFee: Number(apiOrder.amountExcludingDeliveryFee ?? 0),
        additionalPaymentCharges: Number(apiOrder.additionalPaymentCharges ?? 0),
        deliveryFees: Number(apiOrder.deliveryFees ?? 0),
        shippingFees: apiOrder.shippingFees != null ? Number(apiOrder.shippingFees) : null,
        smartBizTotalDiscountValue: Number(apiOrder.smartBizTotalDiscountValue ?? 0),
        status: (() => {
          const state = String(apiOrder.state || '').toLowerCase();
          if (state === 'cancelled' || state === 'rejected') {
            return normalizeStatus(apiOrder.state);
          }
          return normalizeStatus(apiOrder.orderMasterStatus || apiOrder.state);
        })(),
        state: apiOrder.state || null,
        orderMasterStatus: apiOrder.orderMasterStatus || undefined,
        refundStatus: apiOrder.refundStatus || null,
        cancelReason: apiOrder.cancelReason || null,
        customerAction: apiOrder.customerAction || null,
        orderDate: toDate(apiOrder.creationTime) || new Date().toISOString(),
        creationTime: toDate(apiOrder.creationTime),
        deliveryTime: toDate(apiOrder.deliveryTime),
        actualDeliveryTime: toDate(apiOrder.deliveryTime) || undefined,
        timestamps: {
          createdAt: toDate(apiOrder.creationTime),
          assignedAt: toDate(apiOrder.assignedAt),
          arrivedAtStoreAt: toDate(apiOrder.arrivedAtStoreAt),
          pickedUpAt: toDate(apiOrder.pickedUpAt),
          reachedLocationAt: toDate(apiOrder.reachedLocationAt),
          deliveredAt: toDate(apiOrder.deliveredAt),
          deliveryTime: toDate(apiOrder.deliveryTime),
          cancelledAt: toDate(apiOrder.cancelledAt),
          rejectedAt: toDate(apiOrder.rejectedAt),
          updatedAt: toDate(apiOrder.updatedAt),
        },
        deliveryAddress: {
          name: apiOrder.customerDeliveryAddress?.name || '',
          address: apiOrder.customerDeliveryAddress?.addressLine1 || '',
          addressLine1: apiOrder.customerDeliveryAddress?.addressLine1 || '',
          addressLine2: apiOrder.customerDeliveryAddress?.addressLine2 || '',
          addressLine3: apiOrder.customerDeliveryAddress?.addressLine3 || '',
          city: apiOrder.customerDeliveryAddress?.city || '',
          state: apiOrder.customerDeliveryAddress?.state || '',
          postalCode: apiOrder.customerDeliveryAddress?.pincode || '',
          coordinates:
            apiOrder.customerDeliveryAddress?.latitude != null &&
            apiOrder.customerDeliveryAddress?.longitude != null
              ? {
                  latitude: Number(apiOrder.customerDeliveryAddress.latitude),
                  longitude: Number(apiOrder.customerDeliveryAddress.longitude),
                }
              : undefined,
          latitude:
            apiOrder.customerDeliveryAddress?.latitude != null
              ? Number(apiOrder.customerDeliveryAddress.latitude)
              : null,
          longitude:
            apiOrder.customerDeliveryAddress?.longitude != null
              ? Number(apiOrder.customerDeliveryAddress.longitude)
              : null,
          addressQualityScore: Number(apiOrder.customerDeliveryAddress?.addressQualityScore ?? 0),
          gstNumber: apiOrder.customerDeliveryAddress?.gstNumber || null,
        },
        paymentMethod: (apiOrder.paymentMethod?.toLowerCase() || 'cash') as Order['paymentMethod'],
        paymentStatus: apiOrder.paymentReceivalStatus || 'pending',
        paymentReceivalStatus: apiOrder.paymentReceivalStatus || null,
        paymentGatewayUniqueTransactionId: apiOrder.paymentGatewayUniqueTransactionId || null,
        paymentGatewayConfirmationId: apiOrder.paymentGatewayConfirmationId || null,
        customerName:
          apiOrder.customerDeliveryAddress?.name ||
          apiOrder.customerName ||
          apiOrder.customerNotificationDetails?.customerName ||
          '',
        customerPhone: String(
          apiOrder.customerMobileNumber || apiOrder.customerNotificationDetails?.mobileNumber || ''
        ),
        customerNotificationDetails: apiOrder.customerNotificationDetails || null,
        fulfillmentOption: apiOrder.fulfillmentOption || null,
        selfDeliveryMode: apiOrder.selfDeliveryMode || null,
        deliveryStrategy: apiOrder.deliveryStrategy || null,
        deliveryAgentName: apiOrder.deliveryAgentName || null,
        deliveryAgentMobileNumber:
          apiOrder.deliveryAgentMobileNumber != null
            ? String(apiOrder.deliveryAgentMobileNumber)
            : null,
        deliveryPartnerName: apiOrder.deliveryPartnerName || null,
        deliveryPartnerDetails: riderDetails,
        trackingId: apiOrder.trackingId || null,
        trackingUrl: apiOrder.trackingUrl || null,
        shippingDetails: apiOrder.shippingDetails || null,
        tracking:
          apiOrder.tracking ||
          (riderDetails
            ? {
                orderMasterStatus: apiOrder.orderMasterStatus || null,
                riderId: riderDetails.id || null,
                riderName: riderDetails.name || null,
                riderPhone: riderDetails.mobileNumber || riderDetails.phone || null,
                riderProfilePicture: riderDetails.profilePicture || null,
                riderLatitude: riderDetails.latitude ?? null,
                riderLongitude: riderDetails.longitude ?? null,
                riderOnline: riderDetails.isOnline ?? null,
                shopName: apiOrder.shopName || null,
                shopLatitude: apiOrder.shopLatitude ?? null,
                shopLongitude: apiOrder.shopLongitude ?? null,
                preparationTime: apiOrder.preparationTime
                  ? `${apiOrder.preparationTime} mins`
                  : null,
                assignedAt: toDate(apiOrder.assignedAt),
                arrivedAtStoreAt: toDate(apiOrder.arrivedAtStoreAt),
                pickedUpAt: toDate(apiOrder.pickedUpAt),
                reachedLocationAt: toDate(apiOrder.reachedLocationAt),
                deliveredAt: toDate(apiOrder.deliveredAt),
              }
            : null),
        finance: apiOrder.finance || null,
        review: apiOrder.review || null,
        complaint: apiOrder.complaint || null,
        smartBizOffers: apiOrder.smartBizOffers || [],
        platformOrderDetails: apiOrder.platformOrderDetails || null,
      };

      set(state => ({
        selectedOrder: mappedOrder,
        loading: false,
        orders: state.orders.map(order =>
          order.orderId === mappedOrder.orderId
            ? {
                ...order,
                ...mappedOrder,
              }
            : order
        ),
      }));
    } catch (err: unknown) {
      const errorMessage =
        (
          err as {
            response?: {
              data?: {
                message?: string;
              };
            };
          }
        )?.response?.data?.message ||
        (err as Error)?.message ||
        'Failed to fetch order details';

      set({
        error: errorMessage,
        loading: false,
      });
    }
  },

  refreshInProgressStatuses: async (jwt: string, phone: string) => {
    const inProgress = get().orders.filter(
      o => o.status !== 'delivered' && o.status !== 'cancelled'
    );
    if (inProgress.length === 0) return;

    const updates = await Promise.all(
      inProgress.map(async order => {
        try {
          const apiOrder = await apiCall(
            axiosInstance.get(
              `/v2/order/fetchOrder?groupify=true&viewMode=CONSTELLATION_VIEW&shopId=${
                order.shopId || ''
              }&orderId=${order.orderId}`,
              {
                headers: {
                  SessionKey: jwt,
                  Authorization: getAuthHeader(),
                  phone,
                },
              }
            )
          );
          const s = String(apiOrder.state || '').toLowerCase();
          const status =
            s === 'cancelled' || s === 'rejected'
              ? normalizeStatus(apiOrder.state)
              : normalizeStatus(apiOrder.orderMasterStatus || apiOrder.state);
          return { orderId: order.orderId, status, orderMasterStatus: apiOrder.orderMasterStatus };
        } catch {
          return null;
        }
      })
    );

    set(state => ({
      orders: state.orders.map(o => {
        const update = updates.find(u => u && u.orderId === o.orderId);
        if (update) {
          return { ...o, status: update.status, orderMasterStatus: update.orderMasterStatus };
        }
        return o;
      }),
    }));
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
