import axiosInstance, { apiCall, getAuthHeader, withHeaders } from '../config/api/axios.config';

/**
 * The Daily Essentials cart: one cart across kiranas, held by QuickVerse.
 *
 * Unlike every other cart in the app this does not live at SmartBiz. Items added from the
 * Daily Essentials section go here and check out as one order; items added from a
 * kirana's own store page still go to that shop's SmartBiz cart (`vendor_<shopId>`).
 *
 * Every write sets a line to an absolute quantity. Repeating a request is harmless, so a
 * retry after a timeout cannot double-add.
 */

export type EssentialsUnavailableReason =
  | 'OUT_OF_STOCK'
  | 'DEACTIVATED'
  | 'SHOP_CLOSED'
  | 'NOT_IN_ESSENTIALS'
  | 'NOT_FOUND';

export interface EssentialsCartLine {
  sku: string;
  shopId: string;
  shopName: string | null;
  name: string | null;
  imageUrl: string | null;
  quantity: number;
  maxQuantity: number;
  unitPrice: number;
  mrp: number | null;
  lineTotal: number;
  priceAtAdd: number | null;
  priceChanged: boolean;
  available: boolean;
  unavailableReason: EssentialsUnavailableReason | null;
}

export interface EssentialsCartShop {
  shopId: string;
  shopName: string | null;
  itemCount: number;
  itemTotal: number;
}

export interface EssentialsCartView {
  /** False when the server has the feature switched off; the app then uses per-shop carts. */
  enabled: boolean;
  cartId: string | null;
  version: number;
  maxStores: number;
  /** Units across available lines. */
  itemCount: number;
  /** Sum of available lines only. Fees and coupons belong to checkout, not to the cart. */
  itemTotal: number;
  mrpTotal: number;
  updatedAt: string | null;
  items: EssentialsCartLine[];
  shops: EssentialsCartShop[];
}

export type EssentialsIssueType =
  | EssentialsUnavailableReason
  | 'PRICE_CHANGED'
  | 'QUANTITY_LIMIT'
  | 'OUT_OF_RADIUS'
  | 'STORE_LIMIT'
  | 'EMPTY_CART';

export interface EssentialsIssue {
  type: EssentialsIssueType;
  sku: string | null;
  shopId: string | null;
  message: string;
}

/** One kirana's allocated share of the one bill. Parts always sum to the order total. */
export interface EssentialsShopPart {
  shopId: string;
  shopName: string | null;
  pickupSequence: number;
  distanceToCustomerKm: number | null;
  itemCount: number;
  itemTotal: number;
  couponDiscount: number;
  deliveryFee: number;
  platformFee: number;
  packagingCharges: number;
  codCharges: number;
  totalGst: number;
  payableAmount: number;
}

export type EssentialsPaymentMethod = 'COD' | 'PREPAID';

/**
 * The server's bill for the Essentials cart. Everything past the items is charged once for
 * the whole order: delivery on the full kirana → kirana → customer route, one platform fee,
 * one coupon. The app renders these figures; it never computes a charge itself.
 */
export interface EssentialsCheckoutSummary {
  cartId: string | null;
  cartVersion: number;
  customerAddressId: string;
  paymentMethod: EssentialsPaymentMethod;
  itemCount: number;
  itemTotal: number;
  mrpTotal: number;
  itemLevelDiscount: number;
  couponId: string | null;
  couponCode: string | null;
  couponApplied: boolean;
  couponDiscount: number;
  couponError: string | null;
  couponErrorMessage: string | null;
  freeDelivery: boolean;
  freeDeliveryDiscount: number;
  routeDistanceKm: number;
  actualDeliveryFee: number;
  deliveryFee: number;
  platformFee: number;
  packagingCharges: number;
  codCharges: number;
  gstRate: number;
  deliveryGst: number;
  platformGst: number;
  packagingGst: number;
  codGst: number;
  /** The fees GST is charged on: delivery, platform, packaging and COD. */
  taxableAmount: number;
  totalGst: number;
  payableAmount: number;
  totalSavings: number;
  shops: EssentialsShopPart[];
  items: EssentialsCartLine[];
  issues: EssentialsIssue[];
  canPlaceOrder: boolean;
  summaryHash: string | null;
}

export interface EssentialsCheckoutRequest {
  customerAddressId: string;
  paymentMethod: EssentialsPaymentMethod;
  couponId?: string | null;
}

const BASE = '/v3/essentials/cart';

const sessionHeaders = (jwtToken: string, phone: string) =>
  withHeaders({ Authorization: getAuthHeader(), SessionKey: jwtToken, phone });

class EssentialsCartService {
  /** Works signed out too: then it only reports whether the feature is enabled. */
  async getCart(jwtToken?: string, phone?: string): Promise<EssentialsCartView> {
    const config = jwtToken
      ? sessionHeaders(jwtToken, phone || '')
      : withHeaders({ Authorization: getAuthHeader() });
    return apiCall(axiosInstance.get<EssentialsCartView>(BASE, config));
  }

  async setQuantity(
    sku: string,
    quantity: number,
    jwtToken: string,
    phone: string
  ): Promise<EssentialsCartView> {
    return apiCall(
      axiosInstance.put<EssentialsCartView>(
        `${BASE}/items`,
        { sku, quantity },
        sessionHeaders(jwtToken, phone)
      )
    );
  }

  async clear(jwtToken: string, phone: string): Promise<EssentialsCartView> {
    return apiCall(axiosInstance.delete<EssentialsCartView>(BASE, sessionHeaders(jwtToken, phone)));
  }

  /** The bill for delivering the cart to one saved address. */
  async getSummary(
    request: EssentialsCheckoutRequest,
    jwtToken: string,
    phone: string
  ): Promise<EssentialsCheckoutSummary> {
    return apiCall(
      axiosInstance.post<EssentialsCheckoutSummary>(
        `${BASE}/summary`,
        request,
        sessionHeaders(jwtToken, phone)
      )
    );
  }

  /**
   * "Update cart & continue": drops unavailable items and stores that do not deliver to the
   * address, lowers quantities over the limit, and accepts current prices.
   */
  async resolveIssues(
    customerAddressId: string,
    jwtToken: string,
    phone: string
  ): Promise<EssentialsCartView> {
    return apiCall(
      axiosInstance.post<EssentialsCartView>(
        `${BASE}/resolve-issues`,
        { customerAddressId },
        sessionHeaders(jwtToken, phone)
      )
    );
  }
}

export default new EssentialsCartService();
