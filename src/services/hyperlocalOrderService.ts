import axiosInstance, { apiCall, getAuthHeader } from '../config/api/axios.config';

/**
 * Grouped ordering for Daily Essentials.
 *
 * A curated group deliberately spans kiranas, so a basket can hold items from several
 * shops. This endpoint takes them all, charges once, and fans one sub-order out per shop
 * under a single `orderGroupMasterId`.
 *
 * It is additive, not a replacement: food and the normal vendor journey keep using
 * `/v2/order/placeOrder`, one shop per order. Only daily-needs carts come through here.
 */

/** One shop's slice of the basket. */
export interface HyperlocalShopOrder {
  shopId: string;
  /** The SmartBiz cart id, not our local `vendor_<shopId>` key. */
  cartId: string;
  /**
   * What we displayed. Advisory — the server prices every shop itself and charges its
   * own figure. Sent so a stale cart is caught: a difference beyond a paisa comes back
   * as PRICE_MISMATCH rather than silently charging a total the customer never saw.
   */
  shopOrderAmount: number;
  cartItems: Array<{ sku: string; quantity: number }>;
  specialInstructions?: string | null;
  /** Coupons are per shop — a SmartBiz offer attaches to one shop, not to the basket. */
  couponId?: string | null;
  deliveryCouponId?: string | null;
  couponCode?: string | null;
}

export interface HyperlocalPlaceOrderRequest {
  /** The local address UUID, the same one the single-shop flow sends. */
  customerAddressId: string;
  paymentMethod: 'PREPAID' | 'COD';
  notificationMobileNumber: string;
  notificationEmail?: string | null;
  customerName: string;
  orderSource?: string;
  fulfillmentOption?: string;
  /** One delivery location for the basket; the per-shop delivery fee is distance-based. */
  customerCoordinates?: { latitude: number | null; longitude: number | null };
  shopOrders: HyperlocalShopOrder[];
}

export interface HyperlocalSubOrder {
  shopId: string;
  cartId: string;
  /** Null until the sub-order reaches the shop — for PREPAID that is after the webhook. */
  orderId: string | null;
  orderStatus: string | null;
  paymentStatus: string | null;
  orderAmount: number | null;
}

/** CONFIRMED, PARTIALLY_CONFIRMED and FAILED are all returned with HTTP 200. */
export type OrderGroupStatus = 'CREATED' | 'CONFIRMED' | 'PARTIALLY_CONFIRMED' | 'FAILED';

export interface HyperlocalOrderResponse {
  orderGroupMasterId: string;
  groupStatus: OrderGroupStatus;
  grandTotal: number;
  paymentMethod: 'PREPAID' | 'COD';
  paymentStatus: string;
  /** Razorpay order for PREPAID; null for COD. */
  paymentGatewayResponse?: { id: string } | null;
  subOrders: HyperlocalSubOrder[];
}

export interface HyperlocalOrderGroup {
  orderGroupMasterId: string;
  groupStatus: OrderGroupStatus;
  paymentStatus: string;
  paymentMethod: string | null;
  totalAmount: number;
  createdAt: string;
  subOrders: HyperlocalSubOrder[];
}

class HyperlocalOrderService {
  async placeOrder(
    request: HyperlocalPlaceOrderRequest,
    sessionKey: string,
    phone: string
  ): Promise<HyperlocalOrderResponse> {
    return apiCall(
      axiosInstance.post<HyperlocalOrderResponse>('/v2/order/hyperlocal/placeOrder', request, {
        headers: { SessionKey: sessionKey, Authorization: getAuthHeader(), phone },
      })
    );
  }

  /**
   * One group and its sub-orders.
   *
   * Also the landing after an online payment: the placement response cannot carry
   * sub-order ids because the payment webhook has not created them yet, so the client
   * polls this until `orderId` fills in.
   */
  async getOrderGroup(
    orderGroupMasterId: string,
    sessionKey: string
  ): Promise<HyperlocalOrderGroup> {
    return apiCall(
      axiosInstance.get<HyperlocalOrderGroup>(`/v2/order/hyperlocal/groups/${orderGroupMasterId}`, {
        headers: { SessionKey: sessionKey, Authorization: getAuthHeader() },
      })
    );
  }

  /** The customer's groups, newest first. Used to fold order history into one row. */
  async getOrderGroups(sessionKey: string): Promise<HyperlocalOrderGroup[]> {
    const response = await apiCall(
      axiosInstance.get<HyperlocalOrderGroup[]>('/v2/order/hyperlocal/groups', {
        headers: { SessionKey: sessionKey, Authorization: getAuthHeader() },
      })
    );
    return Array.isArray(response) ? response : [];
  }

  /**
   * Waits for the payment webhook to place the sub-orders.
   *
   * Razorpay calls the server, not us, so after the payment sheet closes there is a gap
   * before any shop has an order id. Resolves as soon as every sub-order has one, and
   * gives up after `attempts` — returning the group as it stands rather than throwing,
   * because a slow webhook is not a failed order and the success screen can show what it
   * has.
   */
  async waitForPlacement(
    orderGroupMasterId: string,
    sessionKey: string,
    attempts = 10,
    delayMs = 1500
  ): Promise<HyperlocalOrderGroup | null> {
    let last: HyperlocalOrderGroup | null = null;
    for (let i = 0; i < attempts; i++) {
      try {
        last = await this.getOrderGroup(orderGroupMasterId, sessionKey);
        const settled = last.subOrders.every(s => s.orderId || s.orderStatus === 'FAILED');
        if (settled && last.groupStatus !== 'CREATED') return last;
      } catch (error) {
        // A transient failure mid-poll should not abort the wait; the next tick retries.
        console.warn('[Hyperlocal] Poll failed, retrying:', error);
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    return last;
  }
}

export default new HyperlocalOrderService();
