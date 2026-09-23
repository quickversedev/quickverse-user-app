import axios from 'axios';
import axiosInstance, { apiCall, getAuthHeader, withHeaders } from '../config/api/axios.config';
import { EssentialsCheckoutRequest, EssentialsCheckoutSummary } from './essentialsCartService';

/**
 * Daily Essentials orders: one order for the customer, one SmartBiz order per kirana behind it.
 *
 * Placing returns at once with status PLACING while the server sends each kirana its part;
 * poll `getOrder` until the status settles. A kirana that could not take its part is shown as
 * such and is not charged for — `amountToPay` only counts the parts that were placed.
 */

export type EssentialsOrderStatus =
  | 'AWAITING_PAYMENT'
  | 'PAYMENT_EXPIRED'
  | 'PLACING'
  | 'CONFIRMED'
  | 'PARTIALLY_CONFIRMED'
  | 'FAILED';
export type EssentialsPlacementStatus = 'PENDING' | 'PLACING' | 'PLACED' | 'FAILED';
/** A kirana's answer once its part is placed. */
export type EssentialsVendorDecision =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'TIMED_OUT'
  | 'CANCELLED';
/** The kiranas' answers as a whole. */
export type EssentialsAcceptanceStatus =
  | 'AWAITING_STORES'
  | 'ACCEPTED'
  | 'PARTIALLY_ACCEPTED'
  | 'REJECTED';

export interface EssentialsOrderItem {
  sku: string;
  name: string | null;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface EssentialsOrderPart {
  shopId: string;
  shopName: string | null;
  pickupSequence: number;
  placementStatus: EssentialsPlacementStatus;
  failureReason: string | null;
  smartbizOrderId: string | null;
  /** The kirana order's own state once known, e.g. PENDING, ACCEPTED, DELIVERED, CANCELLED. */
  orderState: string | null;
  vendorDecision: EssentialsVendorDecision | null;
  /** Epoch millis by which the kirana must accept, while it has not. */
  acceptDeadlineAt: number | null;
  itemCount: number;
  itemTotal: number;
  payableAmount: number;
  items: EssentialsOrderItem[];
}

export interface EssentialsOrder {
  orderId: string;
  status: EssentialsOrderStatus;
  acceptanceStatus: EssentialsAcceptanceStatus | 'CANCELLED' | null;
  paymentMethod: string;
  /** COD_PENDING, PENDING_PAYMENT, PAID, EXPIRED or CANCELLED. */
  paymentStatus: string | null;
  /** Present while a prepaid order awaits payment: what Razorpay checkout is opened with. */
  payment: {
    razorpayOrderId: string;
    amountPaise: number;
    currency: string;
    /** The key the server charges with — use this, not a key baked into the app. */
    keyId: string;
  } | null;
  refundedAmount: number;
  refundDue: number;
  /** The customer may still cancel: nothing has been picked up yet. */
  cancellable: boolean;
  /** Epoch millis, as a string. */
  createdAt: string;
  itemCount: number;
  itemTotal: number;
  deliveryFee: number;
  payableAmount: number;
  amountToPay: number;
  couponCode: string | null;
  routeDistanceKm: number;
  shops: EssentialsOrderPart[];
}

/** Whether a kirana's part is still in the order (placed, and not rejected or timed out). */
export const partStillIn = (part: EssentialsOrderPart) =>
  part.placementStatus === 'PLACED' &&
  part.vendorDecision !== 'REJECTED' &&
  part.vendorDecision !== 'TIMED_OUT' &&
  part.vendorDecision !== 'CANCELLED';

/**
 * What the order is to the customer now, as one status:
 * PLACING → AWAITING_STORES → ACCEPTED / PARTIALLY_ACCEPTED → DELIVERED, or CANCELLED /
 * FAILED when nothing is coming. Kirana order states (delivered, cancelled) win once every
 * kirana still in the order has reached one.
 */
export const displayStatusOf = (order: EssentialsOrder): string => {
  if (order.acceptanceStatus === 'CANCELLED') return 'CANCELLED';
  if (
    order.status === 'AWAITING_PAYMENT' ||
    order.status === 'PAYMENT_EXPIRED' ||
    order.status === 'PLACING' ||
    order.status === 'FAILED'
  ) {
    return order.status;
  }
  if (order.acceptanceStatus === 'REJECTED') return 'CANCELLED';
  const states = order.shops.filter(partStillIn).map(s => (s.orderState ?? '').toUpperCase());
  if (states.length > 0 && states.every(s => s === 'CANCELLED' || s === 'REJECTED')) {
    return 'CANCELLED';
  }
  if (states.length > 0 && states.every(s => s === 'DELIVERED' || s === 'COMPLETED')) {
    return 'DELIVERED';
  }
  return order.acceptanceStatus ?? order.status;
};

export type PlaceOrderResult =
  | { ok: true; order: EssentialsOrder }
  /** The bill changed or something blocks the order; `summary` is the fresh bill to show. */
  | { ok: false; code: string; message: string; summary: EssentialsCheckoutSummary | null };

const BASE = '/v3/essentials/orders';

const sessionHeaders = (jwtToken: string, phone: string) =>
  withHeaders({ Authorization: getAuthHeader(), SessionKey: jwtToken, phone });

class EssentialsOrderService {
  async placeOrder(
    request: EssentialsCheckoutRequest & { summaryHash: string },
    jwtToken: string,
    phone: string
  ): Promise<PlaceOrderResult> {
    try {
      // Called directly rather than through apiCall: a 409 carries the fresh bill in its body,
      // which apiCall's error shape would drop.
      const response = await axiosInstance.post<EssentialsOrder>(
        BASE,
        request,
        sessionHeaders(jwtToken, phone)
      );
      return { ok: true, order: response.data };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        const body = error.response.data as {
          error?: { code?: string; message?: string };
          summary?: EssentialsCheckoutSummary;
        };
        return {
          ok: false,
          code: body?.error?.code ?? '',
          message: body?.error?.message ?? 'Your bill has changed',
          summary: body?.summary ?? null,
        };
      }
      const body = axios.isAxiosError(error)
        ? (error.response?.data as { error?: { code?: string; message?: string } })
        : undefined;
      return {
        ok: false,
        code: body?.error?.code ?? 'UNKNOWN',
        message: body?.error?.message ?? 'Could not place your order. Please try again.',
        summary: null,
      };
    }
  }

  /** `live` asks SmartBiz for kirana order states the server has not been told yet. */
  async getOrder(
    orderId: string,
    jwtToken: string,
    phone: string,
    live = false
  ): Promise<EssentialsOrder> {
    return apiCall(
      axiosInstance.get<EssentialsOrder>(`${BASE}/${orderId}`, {
        params: live ? { live: true } : undefined,
        ...sessionHeaders(jwtToken, phone),
      })
    );
  }

  /** Hands the Razorpay checkout result to the server, which verifies it and places the order. */
  async confirmPayment(
    orderId: string,
    payment: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string },
    jwtToken: string,
    phone: string
  ): Promise<EssentialsOrder> {
    return apiCall(
      axiosInstance.post<EssentialsOrder>(
        `${BASE}/${orderId}/payment`,
        payment,
        sessionHeaders(jwtToken, phone)
      )
    );
  }

  /** Cancels the whole order before anything is picked up; a prepaid order is refunded. */
  async cancelOrder(orderId: string, jwtToken: string, phone: string): Promise<EssentialsOrder> {
    return apiCall(
      axiosInstance.post<EssentialsOrder>(
        `${BASE}/${orderId}/cancel`,
        { reason: 'Cancelled by customer' },
        sessionHeaders(jwtToken, phone)
      )
    );
  }

  async listOrders(jwtToken: string, phone: string, limit = 20): Promise<EssentialsOrder[]> {
    const data = await apiCall(
      axiosInstance.get<EssentialsOrder[]>(BASE, {
        params: { limit },
        ...sessionHeaders(jwtToken, phone),
      })
    );
    return Array.isArray(data) ? data : [];
  }
}

export default new EssentialsOrderService();
