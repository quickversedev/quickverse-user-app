import notifee, { AuthorizationStatus } from '@notifee/react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Linking,
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HelpCard, OrderReviewCard } from '../../../components/common/OrderDetails';
import { Fonts } from '../../../components/common/theme/fonts';
import { ThemeText } from '../../../components/common/theme/ThemeText';
import { useAuth } from '../../../contexts/login/AuthProvider';
import { useNotifications } from '../../../hooks/useNotifications';
import { useOrders } from '../../../hooks/useOrders';
import { useEssentialsOrderDetails } from '../../../hooks/useEssentialsOrderDetails';
import essentialsOrderService, {
  displayStatusOf,
  EssentialsOrder,
  partStillIn,
} from '../../../services/essentialsOrderService';
import orderService from '../../../services/createOrderService';
import createPaymentService, { PaymentTender } from '../../../services/createPaymentService';
import usePricingStore from '../../../store/pricingStore';
import useVendorStore from '../../../store/vendorStore';
import { Colors, useTheme } from '../../../theme/ThemeContext';
import { AppNavigationProp } from '../../../types/navigation';
import { OrderTrackingInfo } from '../../../types/order';

export interface OrderFeedback {
  id?: string;
  feedbackId?: string;
  orderId?: string;
  shopId?: string;
  customerId?: string;
  customerName?: string;
  mobileNumber?: string;
  type: 'REVIEW' | 'COMPLAINT';
  rating?: number;
  complaintCategory?: string | null;
  message: string;
  attachmentUrl?: string | null;
  status?: string;
  adminReply?: string | null;
  createdAt?: number;
  updatedAt?: number | null;
}

export type OrderWithFeedback<T> = T & {
  review?: OrderFeedback | null;
  complaint?: OrderFeedback | null;
};

const { width: screenWidth } = Dimensions.get('window');

type ColorKey = keyof Colors | 'primary' | 'primaryLight' | 'success';
type GetColor = (key: ColorKey) => string;

// Fixed semantic colours (status accents that should not change with theme)
const AMBER = '#F59E0B';
const AMBER_BG = '#FEF3C7';
const AMBER_TEXT = '#B45309';
const GREEN = '#15803D';
const GREEN_BG = '#DCFCE7';
const RED = '#F44336';
const RED_BG = '#FEE2E2';
const BLUE = '#2196F3';

const MAP_HEIGHT = 280;
const AVG_SPEED_KMPH = 25; // used only when the API doesn't send an ETA

/* -------------------------------------------------------------------------- */
/*                              Shared data shapes                            */
/* -------------------------------------------------------------------------- */

type LatLng = { latitude: number; longitude: number };

type DerivedItem = { id: string; name: string; quantity: number; price: number; image?: string };
type ApiSkuGroup = {
  id?: string;
  sku?: string;
  itemCount?: number;
  finalPrice?: number;
  shopPrice?: number;
  productDetails?: {
    sku?: string;
    productName?: string;
    productImageUrl?: string;
    additionalAttributes?: { quantity?: number };
  };
};
type AddressShape = {
  name?: string;
  /** The shared Order shape's first line (name and street, already joined). */
  address?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  postalCode?: string;
  latitude?: number | string;
  longitude?: number | string;
  coordinates?: { latitude?: number | string; longitude?: number | string } | null;
};
type ApiOrderShape = {
  items?: Array<{
    id?: string;
    sku?: string;
    name?: string;
    productName?: string;
    quantity?: number;
    totalPrice?: number;
    price?: number;
    image?: string;
    imageUrl?: string;
  }>;
  skuDetailsGrouped?: ApiSkuGroup[];
  deliveryDetails?: { deliveryFees?: number };
  // Fields that exist on the raw order payload
  state?: string;
  creationTime?: number | string;
  deliveryTime?: number | string | null;
  actualDeliveryTime?: number | string | null;
  cancelReason?: string | null;
  refundStatus?: string | null;
  paymentMethod?: string;
  paymentReceivalStatus?: string;
  deliveryAgentName?: string | null;
  deliveryAgentMobileNumber?: string | number | null;
  deliveryOtp?: string | number | null;
  otp?: string | number | null;
  timestamps?: Record<string, string | number | null> | null;
  tracking?: Record<string, any> | null;
  deliveryAddress?: AddressShape | null;
  customerDeliveryAddress?: AddressShape | null;
  deliveryPartnerDetails?: {
    name?: string;
    mobileNumber?: string | number;
    profilePicture?: string | null;
    orderSuccess?: number;
    vehicleType?: string | null;
    vehicleNumber?: string | null;
    rating?: number | string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
  } | null;
};

/** Normalised bill — built from `order.finance` when present, else from the pricing config. */
type BillValues = {
  subtotal: number;
  couponDiscount: number;
  isFreeDelivery: boolean;
  deliveryCouponCode?: string;
  deliveryFee: number;
  deliveryFeeOriginal?: number;
  platformFee: number;
  platformFeeOriginal?: number;
  packagingCharges: number;
  packagingChargesOriginal?: number;
  codCharges: number;
  gatewayCharges: number;
  tip: number;
  taxes: number;
  platformGst: number;
  deliveryGst: number;
  packagingGst: number;
  codGst: number;
  taxableAmount: number;
  gstPct: string;
  total: number;
};

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const TOTAL_STEPS = 7;

// Anything before 2001 is treated as "no timestamp" (backend sends 1970-01-01 for unset values)
const MIN_VALID_TS = 978307200000;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const money = (n: number): string => `₹${n.toFixed(2)}`;

/** An order is LIVE unless it is DELIVERED, CANCELLED or REJECTED. */
const isOrderLive = (...values: Array<string | null | undefined>): boolean =>
  !values.some(v => {
    const s = String(v ?? '').toLowerCase();
    return s === 'delivered' || s.includes('cancel') || s.includes('reject');
  });

const toCoord = (lat: unknown, lng: unknown): LatLng | null => {
  if (
    lat === null ||
    lat === undefined ||
    lat === '' ||
    lng === null ||
    lng === undefined ||
    lng === ''
  )
    return null;
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude === 0 && longitude === 0) return null;
  return { latitude, longitude };
};

const distanceKm = (a: LatLng, b: LatLng): number => {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const formatDistance = (km: number): string =>
  km < 1 ? `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m` : `${km.toFixed(1)} km`;

/** How many timeline steps are complete, derived from the order status strings. */
const getCompletedSteps = (status?: string, masterStatus?: string): number => {
  const s = `${status ?? ''} ${masterStatus ?? ''}`.toLowerCase();
  if (s.includes('delivered')) return 7;
  if (s.includes('near') || s.includes('arriving')) return 6;
  if (
    s.includes('picked') ||
    s.includes('out_for_delivery') ||
    s.includes('out for delivery') ||
    s.includes('on_the_way') ||
    s.includes('dispatched')
  )
    return 5;
  if (s.includes('reached') || s.includes('at_store') || s.includes('at store')) return 4;
  if (s.includes('assigned') || s.includes('rider')) return 3;
  if (
    s.includes('accepted') ||
    s.includes('preparing') ||
    s.includes('packed') ||
    s.includes('ready') ||
    s.includes('confirmed')
  )
    return 2;
  if (s.includes('payment_pending') || s.includes('payment pending')) return 0;
  return 1; // placed / processing
};

/**
 * Parses ISO strings, epoch millis and epoch seconds.
 * Returns null for empty / invalid / 1970 placeholder values.
 */
const toDate = (ts?: number | string | null): Date | null => {
  if (ts === undefined || ts === null || ts === '') return null;
  let value: number | string = ts;
  const n = Number(ts);
  if (!Number.isNaN(n)) value = n < 1e11 ? n * 1000 : n; // seconds -> millis
  const d = new Date(value);
  if (Number.isNaN(d.getTime()) || d.getTime() < MIN_VALID_TS) return null;
  return d;
};

const formatTime = (ts?: number | string | null): string | undefined => {
  const d = toDate(ts);
  if (!d) return undefined;
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m < 10 ? `0${m}` : m} ${ampm}`;
};

const formatDateTime = (ts?: number | string | null): string | undefined => {
  const d = toDate(ts);
  if (!d) return undefined;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${formatTime(ts)}`;
};

/** Timeline time: "6:23 PM" for today, "27 Sep, 6:23 PM" for any other day. */
const formatStepTime = (ts?: number | string | null): string | undefined => {
  const d = toDate(ts);
  if (!d) return undefined;
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  return sameDay ? formatTime(ts) : `${d.getDate()} ${MONTHS[d.getMonth()]}, ${formatTime(ts)}`;
};

const prettify = (s?: string) =>
  (s || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());

const getStatusPill = (status?: string) => {
  switch (status) {
    case 'delivered':
      return { label: 'Delivered', fg: GREEN, bg: GREEN_BG };
    case 'cancelled':
      return { label: 'Cancelled', fg: RED, bg: RED_BG };
    case 'payment_pending':
      return { label: 'Payment Pending', fg: AMBER_TEXT, bg: AMBER_BG };
    case 'processing':
      return { label: 'Processing', fg: AMBER_TEXT, bg: AMBER_BG };
    default:
      return { label: prettify(status) || 'In Progress', fg: AMBER_TEXT, bg: AMBER_BG };
  }
};

const getHeadline = (status?: string, completed = 1) => {
  if (status === 'delivered') return { title: 'Order delivered', sub: 'Hope you enjoyed it!' };
  if (status === 'cancelled') return { title: 'Order cancelled', sub: 'This order was cancelled' };
  if (status === 'payment_pending')
    return { title: 'Waiting for payment', sub: 'Complete the payment to confirm your order' };
  switch (completed) {
    case 0:
    case 1:
      return { title: 'Order placed', sub: 'Waiting for the shop to accept' };
    case 2:
      return { title: 'Preparing your order', sub: 'The shop is packing your items' };
    case 3:
      return { title: 'Rider assigned', sub: 'Your rider is heading to the shop' };
    case 4:
      return { title: 'Rider at the shop', sub: 'Your order is about to be picked up' };
    case 5:
      return { title: 'On the way', sub: 'Your order is out for delivery' };
    default:
      return { title: 'Rider is near you', sub: 'Get ready to receive your order' };
  }
};

/* -------------------------------------------------------------------------- */
/*                                   Skeleton                                 */
/* -------------------------------------------------------------------------- */

const SkeletonBlock = ({
  w,
  h,
  borderRadius = 8,
  style,
  shimmer,
  baseColor,
  highlightColor,
}: {
  w: number | string;
  h: number;
  borderRadius?: number;
  style?: object;
  shimmer: Animated.Value;
  baseColor: string;
  highlightColor: string;
}) => {
  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-screenWidth, screenWidth],
  });
  return (
    <View
      style={[
        {
          width: w as any,
          height: h,
          borderRadius,
          backgroundColor: baseColor,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: highlightColor,
          transform: [{ translateX }],
          opacity: 0.4,
        }}
      />
    </View>
  );
};

const OrderDetailsSkeleton = ({ getColor }: { getColor: GetColor }) => {
  const shimmer = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 1200, useNativeDriver: true })
    );
    anim.start();
    return () => anim.stop();
  }, [shimmer]);

  const base = getColor('border');
  const highlight = getColor('card');
  const S = (props: { w: number | string; h: number; borderRadius?: number; style?: object }) => (
    <SkeletonBlock {...props} shimmer={shimmer} baseColor={base} highlightColor={highlight} />
  );
  const card = {
    backgroundColor: getColor('card'),
    borderRadius: 16,
    borderWidth: 1,
    borderColor: getColor('border'),
    padding: 16,
    marginBottom: 12,
  } as const;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={card}>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <S w={170} h={20} borderRadius={4} />
          <S w={90} h={26} borderRadius={13} />
        </View>
        <S w={screenWidth - 64} h={56} borderRadius={12} style={{ marginTop: 16 }} />
      </View>

      {/* Timeline */}
      <View style={card}>
        <S w={140} h={14} borderRadius={4} />
        {[0, 1, 2, 3, 4].map(i => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 18 }}>
            <S w={26} h={26} borderRadius={13} />
            <View style={{ marginLeft: 12 }}>
              <S w={130} h={13} borderRadius={4} />
              <S w={170} h={10} borderRadius={3} style={{ marginTop: 6 }} />
            </View>
          </View>
        ))}
      </View>

      {/* Rider */}
      <View style={card}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <S w={48} h={48} borderRadius={24} />
          <View style={{ marginLeft: 12 }}>
            <S w={120} h={14} borderRadius={4} />
            <S w={90} h={11} borderRadius={4} style={{ marginTop: 6 }} />
          </View>
        </View>
        <S w={screenWidth - 64} h={44} borderRadius={12} style={{ marginTop: 14 }} />
      </View>

      {/* Items */}
      <View style={card}>
        <S w={120} h={14} borderRadius={4} />
        {[0, 1].map(i => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
            <S w={44} h={44} borderRadius={8} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <S w={120} h={14} borderRadius={4} />
              <S w={50} h={10} borderRadius={3} style={{ marginTop: 6 }} />
            </View>
            <S w={50} h={14} borderRadius={4} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

/* -------------------------------------------------------------------------- */
/*                                Live order map                              */
/* -------------------------------------------------------------------------- */

/** Keeps custom markers re-rendering briefly after content changes, then freezes them (perf). */
const useTrackViewChanges = (deps: React.DependencyList) => {
  const [track, setTrack] = useState(true);
  useEffect(() => {
    setTrack(true);
    const t = setTimeout(() => setTrack(false), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return track;
};

const PinLabel = ({ text, bg, fg }: { text: string; bg: string; fg: string }) => (
  <View style={[styles.pinLabel, { backgroundColor: bg }]}>
    <ThemeText style={[styles.pinLabelText, { color: fg }]} numberOfLines={1}>
      {text}
    </ThemeText>
  </View>
);

const LiveOrderMap = ({
  vendor,
  rider,
  customer,
  vendorName,
  riderLabel,
  pickedUp,
  onShiftPin,
  getColor,
}: {
  vendor: LatLng | null;
  rider: LatLng | null;
  customer: LatLng | null;
  vendorName: string;
  riderLabel: string;
  pickedUp: boolean;
  onShiftPin: () => void;
  getColor: GetColor;
}) => {
  const mapRef = useRef<MapView>(null);
  const primary = getColor('primary');

  const points = [vendor, rider, customer].filter(Boolean) as LatLng[];
  const pointsRef = useRef<LatLng[]>(points);
  pointsRef.current = points;
  const pointsKey = [vendor, rider, customer]
    .map(p => (p ? `${p.latitude},${p.longitude}` : 'x'))
    .join('|');

  const trackViews = useTrackViewChanges([vendorName, riderLabel, pointsKey]);

  const fit = useCallback(() => {
    const pts = pointsRef.current;
    if (!mapRef.current || pts.length === 0) return;
    if (pts.length === 1) {
      mapRef.current.animateToRegion({ ...pts[0], latitudeDelta: 0.01, longitudeDelta: 0.01 }, 400);
      return;
    }
    mapRef.current.fitToCoordinates(pts, {
      edgePadding: { top: 70, right: 60, bottom: 60, left: 60 },
      animated: true,
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(fit, 300);
    return () => clearTimeout(t);
  }, [pointsKey, fit]);

  // Route: rider -> (store, until picked up) -> customer
  const route: LatLng[] = [];
  if (rider) route.push(rider);
  if (!pickedUp && vendor) route.push(vendor);
  if (customer) route.push(customer);

  const initial = points[0];

  return (
    <View style={[styles.mapWrap, { backgroundColor: getColor('border') }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{ ...initial, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
        onMapReady={fit}
        // Enabled map interactions
        scrollEnabled={true}
        zoomEnabled={true}
        rotateEnabled={true}
        pitchEnabled={true}
        toolbarEnabled={true}
        showsCompass={true}
        showsMyLocationButton={true}
        moveOnMarkerPress={true}
      >
        {route.length >= 2 && (
          <Polyline
            coordinates={route}
            strokeColor={primary}
            strokeWidth={4}
            lineDashPattern={[10, 8]}
            lineCap="round"
          />
        )}

        {vendor && (
          <Marker
            coordinate={vendor}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={trackViews}
            zIndex={1}
          >
            <View style={styles.pinCol} collapsable={false}>
              <PinLabel text={vendorName} bg="#FFFFFF" fg="#111827" />
              <View style={[styles.pinCircle, { borderColor: primary, backgroundColor: '#FFF' }]}>
                <Icon name={'storefront-outline' as any} size={16} color={primary} />
              </View>
            </View>
          </Marker>
        )}

        {rider && (
          <Marker
            coordinate={rider}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={trackViews}
            zIndex={3}
          >
            <View style={styles.pinCol} collapsable={false}>
              <PinLabel text={riderLabel} bg="#111827" fg="#FFFFFF" />
              <View style={[styles.pinCircle, { borderColor: '#FFF', backgroundColor: primary }]}>
                <Icon name={'moped' as any} size={17} color="#FFF" />
              </View>
            </View>
          </Marker>
        )}

        {customer && (
          <Marker
            coordinate={customer}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={trackViews}
            zIndex={2}
          >
            <View style={styles.pinCol} collapsable={false}>
              <PinLabel text="You" bg={primary} fg="#FFFFFF" />
              <View style={[styles.pinCircle, { borderColor: '#FFF', backgroundColor: primary }]}>
                <Icon name={'map-marker' as any} size={16} color="#FFF" />
              </View>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Locate / re-centre */}
      <TouchableOpacity
        style={styles.locateBtn}
        onPress={fit}
        activeOpacity={0.8}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Icon name={'crosshairs-gps' as any} size={20} color={primary} />
      </TouchableOpacity>

      {/* Wrong spot? Shift Pin */}
      {!!customer && (
        <TouchableOpacity style={styles.shiftPinChip} onPress={onShiftPin} activeOpacity={0.85}>
          <Icon name={'map-marker-alert-outline' as any} size={14} color={AMBER_TEXT} />
          <ThemeText style={styles.shiftPinText}>
            Wrong spot?{' '}
            <ThemeText style={[styles.shiftPinText, { color: primary }]}>Shift Pin</ThemeText>
          </ThemeText>
        </TouchableOpacity>
      )}
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*                               UI components                                */
/* -------------------------------------------------------------------------- */

const ScreenHeader = ({
  orderId,
  subtitle,
  isLive,
  onBackPress,
  onSharePress,
  getColor,
}: {
  orderId: string;
  subtitle?: string;
  isLive: boolean;
  onBackPress: () => void;
  onSharePress?: () => void;
  getColor: GetColor;
}) => (
  <View
    style={[
      styles.header,
      { backgroundColor: getColor('card'), borderBottomColor: getColor('border') },
    ]}
  >
    <TouchableOpacity
      onPress={onBackPress}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[styles.headerBack, { backgroundColor: getColor('background') }]}
    >
      <Icon name="arrow-left" size={20} color={getColor('text')} />
    </TouchableOpacity>
    <View style={styles.headerCenter}>
      <View style={styles.headerTitleRow}>
        <ThemeText style={[styles.headerTitle, { color: getColor('text') }]} numberOfLines={1}>
          Order #{orderId}
        </ThemeText>
        {isLive && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <ThemeText style={styles.liveBadgeText}>LIVE</ThemeText>
          </View>
        )}
      </View>
      {!!subtitle && (
        <ThemeText
          style={[styles.headerSubtitle, { color: getColor('subText') }]}
          numberOfLines={1}
        >
          {subtitle}
        </ThemeText>
      )}
    </View>
    {onSharePress ? (
      <TouchableOpacity
        onPress={onSharePress}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={[styles.headerBack, { backgroundColor: getColor('background') }]}
      >
        <Icon name={'share-variant-outline' as any} size={19} color={getColor('text')} />
      </TouchableOpacity>
    ) : (
      <View style={styles.headerBack} />
    )}
  </View>
);

const StatusHero = ({
  title,
  subtitle,
  pill,
  showLiveDot,
  otp,
  addressLine,
  actionButton,
  getColor,
}: {
  title: string;
  subtitle?: string;
  pill: { label: string; fg: string; bg: string };
  showLiveDot?: boolean;
  otp?: string;
  addressLine?: string;
  actionButton?: React.ReactNode;
  getColor: GetColor;
}) => (
  <View
    style={[styles.card, { backgroundColor: getColor('card'), borderColor: getColor('border') }]}
  >
    <View style={styles.heroTop}>
      <View style={[styles.heroTitleRow, { flex: 1, marginRight: 12 }]}>
        {showLiveDot && <View style={[styles.heroDot, { backgroundColor: getColor('primary') }]} />}
        <View style={{ flexShrink: 1 }}>
          <ThemeText style={[styles.heroTitle, { color: getColor('text') }]}>{title}</ThemeText>
          {!!subtitle && (
            <ThemeText style={[styles.heroSub, { color: getColor('subText') }]}>
              {subtitle}
            </ThemeText>
          )}
        </View>
      </View>
      <View style={[styles.pill, { backgroundColor: pill.bg }]}>
        <ThemeText style={[styles.pillText, { color: pill.fg }]}>{pill.label}</ThemeText>
      </View>
    </View>

    {!!otp && (
      <View
        style={[
          styles.otpRow,
          { backgroundColor: getColor('background'), borderColor: getColor('border') },
        ]}
      >
        <View style={{ flex: 1 }}>
          <ThemeText style={[styles.otpLabel, { color: getColor('subText') }]}>
            Delivery OTP
          </ThemeText>
          <ThemeText style={[styles.otpHint, { color: getColor('text') }]}>
            Share with partner on arrival
          </ThemeText>
        </View>
        <View
          style={[
            styles.otpBox,
            { backgroundColor: getColor('card'), borderColor: getColor('border') },
          ]}
        >
          <ThemeText style={[styles.otpValue, { color: getColor('primary') }]}>{otp}</ThemeText>
        </View>
      </View>
    )}

    {!otp && !!addressLine && (
      <View style={[styles.addressRow, { backgroundColor: getColor('background') }]}>
        <Icon name="map-marker-outline" size={18} color={getColor('primary')} />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <ThemeText style={[styles.addressLabel, { color: getColor('subText') }]}>
            Delivering to
          </ThemeText>
          <ThemeText style={[styles.addressText, { color: getColor('text') }]} numberOfLines={2}>
            {addressLine}
          </ThemeText>
        </View>
      </View>
    )}

    {actionButton ? <View style={styles.heroAction}>{actionButton}</View> : null}
  </View>
);

type TimelineStep = {
  key: string;
  title: string;
  description: string;
  icon: string;
  time?: string;
};

const OrderStatusTimeline = ({
  steps,
  completed,
  stepLabel,
  getColor,
}: {
  steps: TimelineStep[];
  completed: number;
  stepLabel: string;
  getColor: GetColor;
}) => (
  <View
    style={[styles.card, { backgroundColor: getColor('card'), borderColor: getColor('border') }]}
  >
    <View style={styles.timelineHeader}>
      <ThemeText style={[styles.cardTitle, { color: getColor('text') }]}>
        Live Order Status
      </ThemeText>
      <View style={[styles.stepChip, { backgroundColor: getColor('background') }]}>
        <ThemeText style={[styles.stepChipText, { color: getColor('subText') }]}>
          {stepLabel}
        </ThemeText>
      </View>
    </View>

    {steps.map((step, index) => {
      const hasTime = !!step.time;
      // A recorded timestamp means the step has happened, even if the status string lags behind.
      const isDone = index < completed || (hasTime && index < TOTAL_STEPS);
      const isCurrent = !isDone && index === completed && completed < TOTAL_STEPS;
      const isLast = index === steps.length - 1;
      const nodeColor = isDone ? getColor('primary') : isCurrent ? AMBER : getColor('border');
      const nextDone = index + 1 < completed || !!steps[index + 1]?.time;
      const lineColor = isDone && nextDone ? getColor('primary') : getColor('border');

      return (
        <View key={step.key} style={styles.timelineRow}>
          <View style={styles.timelineRail}>
            <View
              style={[
                styles.timelineNode,
                isDone && { backgroundColor: nodeColor, borderColor: nodeColor },
                isCurrent && { backgroundColor: AMBER_BG, borderColor: AMBER },
                !isDone &&
                  !isCurrent && { backgroundColor: getColor('card'), borderColor: nodeColor },
              ]}
            >
              <Icon
                name={(isDone ? 'check' : step.icon) as any}
                size={isDone ? 15 : 14}
                color={isDone ? '#FFFFFF' : isCurrent ? AMBER_TEXT : getColor('subText')}
              />
            </View>
            {!isLast && <View style={[styles.timelineLine, { backgroundColor: lineColor }]} />}
          </View>

          <View style={[styles.timelineBody, isLast && { paddingBottom: 0 }]}>
            <View style={styles.timelineTitleRow}>
              <ThemeText
                style={[
                  styles.timelineTitle,
                  { color: isDone || isCurrent ? getColor('text') : getColor('subText') },
                ]}
              >
                {step.title}
              </ThemeText>
              {isCurrent && <View style={styles.currentDot} />}
            </View>
            <ThemeText
              style={[
                styles.timelineDesc,
                { color: isCurrent ? getColor('primary') : getColor('subText') },
              ]}
            >
              {step.time && (isDone || isCurrent)
                ? `${step.description} · ${step.time}`
                : step.description}
            </ThemeText>
          </View>
        </View>
      );
    })}
  </View>
);

const RiderCard = ({
  name,
  rating,
  deliveries,
  vehicleLine,
  fallbackMeta,
  imageUrl,
  canContact,
  onCall,
  onChat,
  getColor,
}: {
  name: string;
  rating?: number;
  deliveries?: number;
  vehicleLine?: string;
  fallbackMeta?: string;
  imageUrl?: string | null;
  canContact: boolean;
  onCall: () => void;
  onChat: () => void;
  getColor: GetColor;
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const hasStats = (rating ?? 0) > 0 || (deliveries ?? 0) > 0;
  return (
    <View
      style={[styles.card, { backgroundColor: getColor('card'), borderColor: getColor('border') }]}
    >
      <View style={styles.riderRow}>
        <View>
          {imageUrl && !imgFailed ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.riderAvatar}
              onError={() => setImgFailed(true)}
            />
          ) : (
            <View
              style={[
                styles.riderAvatar,
                styles.riderAvatarFallback,
                { backgroundColor: getColor('background') },
              ]}
            >
              <ThemeText style={[styles.riderInitial, { color: getColor('primary') }]}>
                {(name || 'R').charAt(0).toUpperCase()}
              </ThemeText>
            </View>
          )}
          <View style={[styles.verifiedBadge, { backgroundColor: getColor('card') }]}>
            <Icon name={'check-decagram' as any} size={16} color={getColor('primary')} />
          </View>
        </View>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <ThemeText style={[styles.riderName, { color: getColor('text') }]} numberOfLines={1}>
            {name}
          </ThemeText>
          {hasStats ? (
            <ThemeText style={[styles.riderMeta, { color: getColor('subText') }]} numberOfLines={1}>
              {(rating ?? 0) > 0 && (
                <ThemeText
                  style={[styles.riderMeta, { color: AMBER_TEXT, fontFamily: Fonts.bold }]}
                >
                  {Number(rating).toFixed(1)} ★
                </ThemeText>
              )}
              {(rating ?? 0) > 0 && (deliveries ?? 0) > 0 ? ' • ' : ''}
              {(deliveries ?? 0) > 0
                ? `${Number(deliveries).toLocaleString('en-IN')} deliveries`
                : ''}
            </ThemeText>
          ) : (
            !!fallbackMeta && (
              <ThemeText
                style={[styles.riderMeta, { color: getColor('subText') }]}
                numberOfLines={1}
              >
                {fallbackMeta}
              </ThemeText>
            )
          )}
          {!!vehicleLine && (
            <ThemeText style={[styles.riderMeta, { color: getColor('subText') }]} numberOfLines={1}>
              {vehicleLine}
            </ThemeText>
          )}
        </View>
      </View>

      {canContact && (
        <View style={styles.riderActions}>
          <TouchableOpacity
            style={[styles.partnerCallButton, { backgroundColor: getColor('primary') }]}
            onPress={onCall}
            activeOpacity={0.85}
          >
            <Icon name="phone" size={18} color="#FFF" />
            <ThemeText style={styles.partnerCallText}>Call Partner</ThemeText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.partnerChatButton,
              { backgroundColor: getColor('background'), borderColor: getColor('border') },
            ]}
            onPress={onChat}
            activeOpacity={0.85}
          >
            <Icon name={'chat-outline' as any} size={18} color={getColor('text')} />
            <ThemeText style={[styles.partnerChatText, { color: getColor('text') }]}>
              Chat
            </ThemeText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

/** One row of the bill breakdown (same look as the old BillSummaryCard rows). */
const BillRow = ({
  label,
  labelNode,
  value,
  original,
  valueColor,
  getColor,
}: {
  label?: string;
  labelNode?: React.ReactNode;
  value: string;
  original?: string;
  valueColor?: string;
  getColor: GetColor;
}) => (
  <View style={styles.billRow}>
    {labelNode ?? (
      <ThemeText variant="body" style={[styles.billLabel, { color: getColor('text') }]}>
        {label}
      </ThemeText>
    )}
    <View style={styles.feeRow}>
      {!!original && (
        <ThemeText style={[styles.crossedText, { color: getColor('text') }]}>{original}</ThemeText>
      )}
      <ThemeText
        variant="body"
        style={[styles.billAmount, { color: valueColor ?? getColor('text') }]}
      >
        {value}
      </ThemeText>
    </View>
  </View>
);

/**
 * What a Daily Essentials order's state means to the customer, in one line or two — shown above
 * the progress steps, which cannot say "some items were unavailable" or "refund on its way".
 * Never names or counts the kiranas.
 */
const essentialsStatusNote = (
  order: EssentialsOrder
): {
  icon: 'progress-clock' | 'alert-circle-outline' | 'cash-refund' | 'close-circle-outline';
  title: string;
  lines: string[];
} | null => {
  const shown = displayStatusOf(order);
  const refund =
    order.paymentStatus === 'PAID' && order.refundDue > 0
      ? order.refundedAmount >= order.refundDue
        ? `₹${order.refundDue.toFixed(0)} refunded to your payment method.`
        : `₹${order.refundDue.toFixed(0)} refund on its way to your payment method.`
      : null;
  const withRefund = (lines: string[]) => (refund ? [...lines, refund] : lines);
  if (order.status === 'PLACING') {
    return {
      icon: 'progress-clock',
      title: 'Placing your order…',
      lines: ['This takes a few seconds.'],
    };
  }
  if (shown === 'AWAITING_STORES') {
    return {
      icon: 'progress-clock',
      title: 'Confirming your order',
      lines: withRefund(["We're confirming your items. You'll only pay for what we can deliver."]),
    };
  }
  if (shown === 'PARTIALLY_ACCEPTED' || order.status === 'PARTIALLY_CONFIRMED') {
    return {
      icon: 'alert-circle-outline',
      title: "Some items weren't available",
      lines: withRefund(['They were removed and your total updated.']),
    };
  }
  if (shown === 'CANCELLED' || order.status === 'FAILED' || shown === 'PAYMENT_EXPIRED') {
    return refund ? { icon: 'cash-refund', title: 'Order cancelled', lines: [refund] } : null;
  }
  return refund ? { icon: 'cash-refund', title: 'Refund', lines: [refund] } : null;
};

/* -------------------------------------------------------------------------- */
/*                                   Screen                                   */
/* -------------------------------------------------------------------------- */

const OrderDetailsScreen = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute();
  const { getColor, theme } = useTheme();
  const { selectedOrder: storeOrder, loadOrderById, refreshOrders, setSelectedOrder } = useOrders();
  const { authData } = useAuth();
  const { orderId, shopId, essentialsOrderId } = route.params as {
    orderId: string;
    shopId?: string;
    essentialsOrderId?: string;
  };
  // A Daily Essentials order is shown on this same screen: loaded as itself, drawn as any order.
  // What only it has — the kiranas' parts, refunds — is read from `essentials` where needed; the
  // kiranas themselves are never shown.
  const essentialsDetail = useEssentialsOrderDetails(essentialsOrderId);
  const essentials = essentialsDetail.essentials;
  const selectedOrder = essentialsOrderId ? essentialsDetail.order : storeOrder;
  const { getVendorById } = useVendorStore();
  const { requestPermissions } = useNotifications();

  // selectedOrder from the API may embed `review` / `complaint` even though the
  // shared Order type doesn't declare them yet — this widened alias lets us read
  // them safely.
  const orderWithFeedback = selectedOrder as unknown as OrderWithFeedback<typeof selectedOrder>;

  // Notification permission state
  const [showPermissionBar, setShowPermissionBar] = useState(false);

  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);

  // Polling interval ref
  const pollingIntervalRef = useRef<any>(null);
  const POLLING_INTERVAL_MS = 15000; // 15 seconds (keeps the rider pin fresh)

  // Live tracking data (rider info + coordinates, shop location, stage timestamps)
  const [trackingInfo, setTrackingInfo] = useState<OrderTrackingInfo | null>(null);

  // Custom dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    confirmColor?: string;
  } | null>(null);

  // Items card expand / collapse
  const [itemsExpanded, setItemsExpanded] = useState(true);

  // Inline bill (Total Bill) expand / collapse + tax breakdown
  const [billExpanded, setBillExpanded] = useState(false);
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(false);
  const billHeight = useRef(new Animated.Value(0)).current;
  const billOpacity = useRef(new Animated.Value(0)).current;
  const billRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(billHeight, {
        toValue: billExpanded ? 1 : 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(billOpacity, {
        toValue: billExpanded ? 1 : 0,
        duration: 250,
        delay: billExpanded ? 100 : 0,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(billRotation, {
        toValue: billExpanded ? 1 : 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [billExpanded, billHeight, billOpacity, billRotation]);

  // Get vendor details if we have a shopId
  const vendorDetails = useMemo(() => {
    if (!selectedOrder?.shopId) return null;
    return getVendorById(selectedOrder.shopId);
  }, [selectedOrder?.shopId, getVendorById]);

  const isGrocery = vendorDetails?.category?.toLowerCase().includes('grocery');
  const serviceType = isGrocery ? ('GROCERY' as const) : ('FOOD' as const);

  // Select the stable array to trigger re-renders only when it changes.
  const pricingConfig = usePricingStore(state => state.configs[serviceType]);
  const pricing = useMemo(() => {
    return usePricingStore.getState().getPricingValues(serviceType);
  }, [pricingConfig, serviceType]);

  // Capture shopId before clearing stale data
  const shopIdRef = useRef(shopId || selectedOrder?.shopId);

  // Clear stale data and fetch fresh on mount
  useEffect(() => {
    if (orderId && !essentialsOrderId) {
      setSelectedOrder(null);
      loadOrderById(orderId, shopIdRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // LIVE = anything except DELIVERED / CANCELLED / REJECTED
  // A Daily Essentials order polls itself (useEssentialsOrderDetails) and has no single rider.
  const liveForPolling =
    !essentialsOrderId && selectedOrder
      ? isOrderLive(
          selectedOrder.status as string | undefined,
          selectedOrder.orderMasterStatus as string | undefined,
          (selectedOrder as unknown as ApiOrderShape).state
        )
      : false;

  // Poll for status & tracking updates while order is live
  useEffect(() => {
    const jwt = authData?.jwt;
    const phone = authData?.phone;

    const fetchTracking = async () => {
      if (orderId && jwt && phone) {
        const info = await orderService.getOrderTracking(orderId, jwt, phone);
        if (info) setTrackingInfo(info);
      }
    };

    if (liveForPolling) {
      fetchTracking();

      pollingIntervalRef.current = setInterval(() => {
        loadOrderById(orderId, shopIdRef.current);
        fetchTracking();
      }, POLLING_INTERVAL_MS);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [liveForPolling, orderId, loadOrderById, authData?.jwt, authData?.phone]);

  // Check notification permission on component mount
  useEffect(() => {
    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        // Android 13+ requires POST_NOTIFICATIONS; older versions don't
        if (Platform.Version < 33) {
          setShowPermissionBar(false);
          return;
        }
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        setShowPermissionBar(!granted);
      } else if (Platform.OS === 'ios') {
        const settings = await notifee.getNotificationSettings();
        const enabled =
          settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
          settings.authorizationStatus === AuthorizationStatus.PROVISIONAL;
        setShowPermissionBar(!enabled);
      }
    } catch (error) {
      setShowPermissionBar(false);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      const result = await requestPermissions();

      if (result) {
        setShowPermissionBar(false);
      } else {
        Alert.alert(
          'Permission Blocked',
          'Notification permissions have been permanently denied. To enable notifications:\n\n1. Go to App Settings > Notifications\n2. Turn on "Show notifications"\n3. Enable "Sound", "Vibration", and "Heads-up"\n\nWould you like to open App Settings now?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
          ]
        );

        setShowPermissionBar(false);
      }
    } catch (error: unknown) {
      if (Platform.OS === 'ios') {
        Alert.alert(
          'Permission Blocked',
          'Notification permissions have been permanently denied. To enable notifications:\n\n1. Go to Settings > Notifications > QuickVerse\n2. Turn on "Allow Notifications"\n3. Enable "Sounds", "Badges", and "Banners"\n\nWould you like to open Settings now?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
          ]
        );
      } else if (Platform.OS === 'android') {
        Alert.alert(
          'Permission Blocked',
          'Notification permissions have been permanently denied. To enable notifications:\n\n1. Go to App Settings > Notifications\n2. Turn on "Show notifications"\n3. Enable "Sound", "Vibration", and "Heads-up"\n\nWould you like to open App Settings now?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
          ]
        );
      }
    }
  };

  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleShare = useCallback(() => {
    Share.share({ message: `Track my QuickVerse order #${orderId}` }).catch(() => {});
  }, [orderId]);

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (essentialsOrderId) {
        await essentialsDetail.reload(true);
      } else {
        await loadOrderById(orderId, selectedOrder?.shopId);
      }
    } finally {
      setRefreshing(false);
    }
  }, [orderId, selectedOrder?.shopId, loadOrderById, essentialsOrderId, essentialsDetail]);

  const handleShiftPin = useCallback(() => {
    // TODO: Navigate to the address / pin-adjust screen
  }, []);

  const handleSafetyGuide = useCallback(() => {
    Alert.alert(
      'Contactless delivery',
      'Ask the partner to leave the order at your door, keep a safe distance while receiving it, and share the OTP only when you have your order.'
    );
  }, []);

  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [retryingPayment, setRetryingPayment] = useState(false);
  const wait = useCallback((ms: number) => new Promise(resolve => setTimeout(resolve, ms)), []);

  const handleRetryPayment = useCallback(() => {
    if (!selectedOrder) return;
    if (!authData?.jwt || !authData?.phone) {
      Alert.alert('Login required', 'Please login to proceed with payment.');
      return;
    }

    const onConfirmRetry = async () => {
      setRetryingPayment(true);
      try {
        const tender: PaymentTender = {
          amount: Number(selectedOrder.totalAmount || 0),
          status: 'CREATED',
          type: 'COMPLETION',
          paymentMethod: 'COD',
          additionalTenderCharges: Number(selectedOrder.additionalPaymentCharges || 0),
        };
        await createPaymentService.createPayment(
          {
            customerId: Number(selectedOrder.customerId),
            mobileNumber: authData.phone,
            name: authData.username,
            orderId: selectedOrder.orderId,
            tenders: [tender],
          },
          authData.jwt,
          authData.phone
        );
        Alert.alert('Ready', 'Payment created.');

        // Refetch the order a few times to overcome eventual consistency on the backend
        await loadOrderById(selectedOrder.orderId, selectedOrder.shopId);
        for (let i = 0; i < 2; i += 1) {
          await wait(600);
          await loadOrderById(selectedOrder.orderId, selectedOrder.shopId);
        }
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Failed to start payment. Please try again.';
        Alert.alert('Error', message);
      } finally {
        setRetryingPayment(false);
      }
    };

    setDialogConfig({
      title: 'Retry Payment',
      message: 'Press Retry to proceed with payment.',
      confirmText: 'Retry',
      cancelText: 'Cancel',
      onConfirm: onConfirmRetry,
      confirmColor: getColor('secondary'),
    });
    setDialogVisible(true);
  }, [selectedOrder, authData?.jwt, authData?.phone, refreshOrders, loadOrderById, getColor]);

  const handleCancelOrder = useCallback(async () => {
    if (!selectedOrder || !authData?.jwt || !authData?.phone) return;

    if (essentialsOrderId && essentials) {
      const jwt = authData.jwt;
      const phone = authData.phone;
      // What is still held: part may already have gone back (an item a store couldn't supply).
      const toRefund = Math.max(0, essentials.payableAmount - essentials.refundedAmount);
      setDialogConfig({
        title: 'Cancel Order',
        message:
          essentials.paymentStatus === 'PAID'
            ? `Are you sure you want to cancel this order? ₹${toRefund.toFixed(0)} will be refunded to your payment method.`
            : 'Are you sure you want to cancel this order?',
        confirmText: 'Yes',
        cancelText: 'No',
        confirmColor: '#F44336',
        onConfirm: async () => {
          setDialogVisible(false);
          setCancellingOrder(true);
          try {
            const cancelled = await essentialsOrderService.cancelOrder(
              essentials.orderId,
              jwt,
              phone
            );
            essentialsDetail.setEssentials(cancelled);
            setCancellingOrder(false);
            setDialogConfig({
              title: 'Success',
              message: 'Order cancelled successfully',
              confirmText: 'OK',
              cancelText: '',
              onConfirm: () => setDialogVisible(false),
              confirmColor: getColor('secondary'),
            });
            setDialogVisible(true);
          } catch (error) {
            setCancellingOrder(false);
            setDialogConfig({
              title: 'Error',
              message:
                (error as { message?: string })?.message ||
                'Failed to cancel order. Please try again.',
              confirmText: 'OK',
              cancelText: '',
              onConfirm: () => setDialogVisible(false),
              confirmColor: getColor('secondary'),
            });
            setDialogVisible(true);
          }
        },
      });
      setDialogVisible(true);
      return;
    }

    const onConfirmCancel = async () => {
      setDialogVisible(false);
      setCancellingOrder(true);
      try {
        await orderService.cancelOrder(
          selectedOrder.orderId,
          selectedOrder.shopId,
          'Need to change address', // Default reason
          authData.jwt,
          authData.phone
        );

        await refreshOrders();
        setCancellingOrder(false);

        setDialogConfig({
          title: 'Success',
          message: 'Order cancelled successfully',
          confirmText: 'OK',
          cancelText: '',
          onConfirm: () => {
            setDialogVisible(false);
            navigation.goBack();
          },
          confirmColor: getColor('secondary'),
        });
        setDialogVisible(true);
      } catch (error) {
        setCancellingOrder(false);
        setDialogConfig({
          title: 'Error',
          message:
            error instanceof Error ? error.message : 'Failed to cancel order. Please try again.',
          confirmText: 'OK',
          cancelText: '',
          onConfirm: () => setDialogVisible(false),
          confirmColor: getColor('secondary'),
        });
        setDialogVisible(true);
      }
    };

    setDialogConfig({
      title: 'Cancel Order',
      message: 'Are you sure you want to cancel this order?',
      confirmText: 'Yes',
      cancelText: 'No',
      onConfirm: onConfirmCancel,
      confirmColor: '#F44336',
    });
    setDialogVisible(true);
  }, [
    selectedOrder,
    authData?.jwt,
    authData?.phone,
    refreshOrders,
    navigation,
    getColor,
    essentialsOrderId,
    essentials,
    essentialsDetail,
  ]);

  /** Items of a kirana part that dropped out: shown, marked, not charged. */
  const unavailableSkus = useMemo(() => {
    const skus = new Set<string>();
    if (!essentials) return skus;
    const orderOff = displayStatusOf(essentials) === 'CANCELLED' || essentials.status === 'FAILED';
    if (orderOff) return skus;
    essentials.shops
      // Placed and then dropped, or never placed; parts still being placed or paid for are not.
      .filter(
        part =>
          part.placementStatus === 'FAILED' ||
          (part.placementStatus === 'PLACED' && !partStillIn(part))
      )
      .forEach(part => part.items.forEach(item => skus.add(item.sku)));
    return skus;
  }, [essentials]);

  const essentialsNote = useMemo(
    () => (essentials ? essentialsStatusNote(essentials) : null),
    [essentials]
  );

  const handleGetHelp = useCallback(() => {
    // TODO: Navigate to help screen
  }, []);

  // Derive items either from typed order.items or API's skuDetailsGrouped
  const derivedItems = React.useMemo<DerivedItem[]>(() => {
    const base: DerivedItem[] = [];
    const apiOrder = selectedOrder as unknown as ApiOrderShape;
    if (Array.isArray(apiOrder?.items) && apiOrder.items.length > 0) {
      return apiOrder.items.map(it => ({
        id: String(it.id ?? it.sku ?? Math.random()),
        name: String(it.name ?? it.productName ?? 'Item'),
        quantity: Number(it.quantity ?? 1),
        price: Number(it.totalPrice ?? it.price ?? 0),
        image: it.image ?? it.imageUrl,
      }));
    }
    const groups = apiOrder?.skuDetailsGrouped;
    if (Array.isArray(groups)) {
      return groups.map((g: ApiSkuGroup) => {
        const pd = g.productDetails || {};
        return {
          id: String(g.id ?? g.sku ?? pd.sku ?? Math.random()),
          name: String(pd.productName ?? 'Item'),
          quantity: Number(g.itemCount ?? pd.additionalAttributes?.quantity ?? 1),
          price: Number(g.finalPrice ?? g.shopPrice ?? 0),
          image: pd.productImageUrl,
        };
      });
    }
    return base;
  }, [selectedOrder]);

  // Payment summary derived from items + dynamic pricing config.
  // Used ONLY as the fallback when the order has no `finance` object.
  // Fee structure must match Cart's PaymentSummary.tsx exactly
  const summary = useMemo(() => {
    if (!selectedOrder)
      return {
        subTotal: 0,
        deliveryFee: 0,
        deliveryFeeOriginal: 0,
        additionalCharges: 0,
        total: 0,
        platformFee: 0,
        platformFeeOriginal: 0,
        packagingCharges: 0,
        packagingChargesOriginal: 0,
        taxes: 0,
        commission: 0,
        taxableAmount: 0,
        isGrocery: false,
      };

    // item.price is already the line total (unit price × quantity)
    const subTotal = derivedItems.reduce((sum, item) => sum + item.price, 0);

    const commission = pricing.commissionRate * Number(subTotal);
    const taxableAmount = pricing.deliveryFee + pricing.platformFee;
    const taxes = Math.round(pricing.gstRate * taxableAmount);

    const total =
      Number(subTotal) +
      pricing.deliveryFee +
      pricing.platformFee +
      pricing.packagingCharges +
      taxes;

    return {
      subTotal,
      deliveryFee: pricing.deliveryFee,
      deliveryFeeOriginal: pricing.deliveryFeeOriginal,
      total,
      platformFee: pricing.platformFee,
      platformFeeOriginal: pricing.platformFeeOriginal,
      packagingCharges: pricing.packagingCharges,
      packagingChargesOriginal: pricing.packagingChargesOriginal,
      taxes,
      commission,
      taxableAmount,
      isGrocery: !!isGrocery,
    };
  }, [selectedOrder, derivedItems, pricing, isGrocery]);

  if (!selectedOrder) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: getColor('background') }]}>
        <View style={[styles.container, { backgroundColor: getColor('background') }]}>
          <ScreenHeader
            orderId={orderId || 'Loading...'}
            isLive={false}
            onBackPress={handleBackPress}
            getColor={getColor}
          />
          <OrderDetailsSkeleton getColor={getColor} />
        </View>
      </SafeAreaView>
    );
  }

  /* ----------------------- Derived values for the UI ----------------------- */

  const rawOrder = selectedOrder as unknown as ApiOrderShape;
  const status = selectedOrder.status as string | undefined;
  const masterStatus = selectedOrder.orderMasterStatus as string | undefined;

  // LIVE = not DELIVERED / CANCELLED / REJECTED
  const isLive = isOrderLive(status, masterStatus, rawOrder.state);
  const isDelivered = [status, masterStatus].some(
    s => String(s ?? '').toLowerCase() === 'delivered'
  );
  const isCancelled = [status, masterStatus, rawOrder.state].some(s => {
    const v = String(s ?? '').toLowerCase();
    return v.includes('cancel') || v.includes('reject');
  });

  // Live tracking value: polled tracking info first, then what's embedded on the order
  const track = (key: string): any =>
    (trackingInfo as unknown as Record<string, any> | null)?.[key] ??
    rawOrder.tracking?.[key] ??
    rawOrder.timestamps?.[key] ??
    null;

  // Timestamp lookup: tries every key across every source and returns the first VALID date
  // (ignores null, '' and the backend's 1970-01-01 placeholder).
  const timeSources: Array<Record<string, any> | null | undefined> = [
    trackingInfo as unknown as Record<string, any> | null,
    rawOrder.tracking,
    rawOrder.timestamps,
    rawOrder as unknown as Record<string, any>,
  ];
  const pickTime = (...keys: string[]): number | string | null => {
    for (const key of keys) {
      for (const src of timeSources) {
        const v = src?.[key];
        if (toDate(v)) return v;
      }
    }
    return null;
  };

  const tPlaced = toDate(selectedOrder.orderDate as any)
    ? (selectedOrder.orderDate as any)
    : pickTime('createdAt', 'creationTime');
  const tAccepted = pickTime('acceptedAt', 'shopAcceptedAt', 'storeAcceptedAt', 'confirmedAt');
  const tAssigned = pickTime('assignedAt', 'riderAssignedAt', 'riderAcceptedAt');
  const tArrivedStore = pickTime('arrivedAtStoreAt', 'reachedStoreAt');
  const tPicked = pickTime('pickedUpAt');
  const tNear = pickTime('reachedLocationAt', 'nearCustomerAt');
  const tDelivered =
    pickTime('deliveredAt') ??
    // deliveryTime can be an estimate on live orders — only trust it once delivered
    (isDelivered ? pickTime('actualDeliveryTime', 'deliveryTime') : null);
  const tCancelled = pickTime('cancelledAt', 'rejectedAt');

  const statusSteps = getCompletedSteps(status, masterStatus);
  const timestampSteps = tDelivered
    ? 7
    : tNear
      ? 6
      : tPicked
        ? 5
        : tArrivedStore
          ? 4
          : tAssigned
            ? 3
            : tAccepted
              ? 2
              : 0;
  const completedSteps = isDelivered ? 7 : Math.max(statusSteps, isLive ? timestampSteps : 0);
  const pickedUp = completedSteps >= 5;
  const stepLabel = `Step ${Math.min(completedSteps + 1, TOTAL_STEPS)} of ${TOTAL_STEPS}`;
  const headline = getHeadline(status, completedSteps);
  const pill = getStatusPill(status);

  const shopName = vendorDetails?.name || 'the shop';
  const headerSubtitle = [vendorDetails?.name, vendorDetails?.category].filter(Boolean).join(' • ');

  const placedAt = formatDateTime(tPlaced);
  const cancelledAtLabel = formatDateTime(tCancelled);

  const addr = rawOrder.deliveryAddress ?? rawOrder.customerDeliveryAddress ?? null;
  const addressLine = addr
    ? [
        ...(addr.addressLine1 ? [addr.name, addr.addressLine1] : [addr.address]),
        addr.city,
        addr.pincode ?? addr.postalCode,
      ]
        .filter(Boolean)
        .join(', ')
    : undefined;

  const partner = rawOrder.deliveryPartnerDetails;
  const riderName = partner?.name || rawOrder.deliveryAgentName || undefined;
  const riderPhone = partner?.mobileNumber ?? rawOrder.deliveryAgentMobileNumber ?? undefined;

  /* ------------------------------ Map coordinates ------------------------------ */

  const vendorAny = vendorDetails as unknown as Record<string, any> | null;
  const customerCoord = toCoord(
    addr?.coordinates?.latitude ?? addr?.latitude,
    addr?.coordinates?.longitude ?? addr?.longitude
  );
  const riderCoord = riderName
    ? toCoord(
        track('riderLatitude') ?? partner?.latitude,
        track('riderLongitude') ?? partner?.longitude
      )
    : null;
  const vendorCoord = toCoord(
    track('shopLatitude') ??
      vendorAny?.coordinates?.latitude ??
      vendorAny?.location?.coordinates?.[1],
    track('shopLongitude') ??
      vendorAny?.coordinates?.longitude ??
      vendorAny?.location?.coordinates?.[0]
  );

  const showMap = isLive && !!(vendorCoord || riderCoord || customerCoord);

  const riderToCustomerKm =
    riderCoord && customerCoord ? distanceKm(riderCoord, customerCoord) : null;
  const riderLabel = riderName
    ? `${riderName.split(' ')[0]}${riderToCustomerKm !== null ? ` (${formatDistance(riderToCustomerKm)})` : ''}`
    : '';

  /* ----------------------------------- Bill ----------------------------------- */

  // Prefer the order's own `finance` block; fall back to the pricing-config summary.
  const fin = (selectedOrder.finance ?? null) as unknown as Record<string, any> | null;
  const toPct = (rate: number) => `${(rate > 0 && rate < 1 ? rate * 100 : rate).toFixed(0)}%`;

  const bill: BillValues = fin
    ? {
        subtotal: num(fin.itemTotalAmount),
        couponDiscount: num(fin.couponDiscount),
        isFreeDelivery: !!fin.isFreeDelivery,
        deliveryCouponCode: fin.deliveryCouponCode || undefined,
        deliveryFee: num(fin.deliveryFee),
        deliveryFeeOriginal: fin.actualDeliveryFee != null ? num(fin.actualDeliveryFee) : undefined,
        platformFee: num(fin.platformFee),
        packagingCharges: num(fin.packagingCharges),
        codCharges: num(fin.codCharges),
        gatewayCharges: num(fin.razorpayCharges),
        tip: num(fin.tip),
        taxes: num(fin.totalGst),
        platformGst: num(fin.platformGst),
        deliveryGst: num(fin.deliveryGst),
        packagingGst: num(fin.packagingGst),
        codGst: num(fin.codGst),
        taxableAmount: num(fin.taxableAmount),
        gstPct: fin.serviceGstRate != null ? toPct(num(fin.serviceGstRate)) : '18%',
        total: num(fin.payableAmount) || summary.total,
      }
    : {
        subtotal: summary.subTotal,
        couponDiscount: 0,
        isFreeDelivery: false,
        deliveryFee: summary.deliveryFee,
        deliveryFeeOriginal: summary.deliveryFeeOriginal,
        platformFee: summary.platformFee,
        platformFeeOriginal: summary.platformFeeOriginal,
        packagingCharges: summary.packagingCharges,
        packagingChargesOriginal: summary.packagingChargesOriginal,
        codCharges: 0,
        gatewayCharges: 0,
        tip: 0,
        taxes: summary.taxes,
        platformGst: 0,
        deliveryGst: 0,
        packagingGst: 0,
        codGst: 0,
        taxableAmount: summary.taxableAmount,
        gstPct: toPct(pricing.gstRate * 100),
        total: summary.total,
      };

  const billRotate = billRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const billMaxHeight = billHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 900] });
  const radiusSm = theme?.borderRadius?.sm ?? 8;

  /* ----------------------------------- ETA ----------------------------------- */

  let etaMin: number | null = null;
  if (isLive && completedSteps >= 3) {
    const apiEta = Number(track('etaMinutes'));
    if (Number.isFinite(apiEta) && apiEta > 0) {
      etaMin = Math.round(apiEta);
    } else if (riderCoord && customerCoord) {
      const km =
        pickedUp || !vendorCoord
          ? distanceKm(riderCoord, customerCoord)
          : distanceKm(riderCoord, vendorCoord) + distanceKm(vendorCoord, customerCoord);
      etaMin = Math.max(1, Math.round((km / AVG_SPEED_KMPH) * 60));
    }
  }
  const showEta = etaMin !== null;
  const expectedTime = etaMin !== null ? formatTime(Date.now() + etaMin * 60000) : undefined;

  const otpRaw = rawOrder.deliveryOtp ?? rawOrder.otp ?? track('deliveryOtp') ?? track('otp');
  const otp = isLive && otpRaw ? String(otpRaw) : undefined;

  const heroTitle = showEta
    ? `Arriving in ${etaMin} ${etaMin === 1 ? 'Min' : 'Mins'}`
    : headline.title;
  const heroSubtitle = showEta
    ? undefined
    : isCancelled
      ? cancelledAtLabel
        ? `Cancelled on ${cancelledAtLabel}`
        : headline.sub
      : isDelivered
        ? `Delivered ${formatDateTime(tDelivered) || ''}`.trim()
        : placedAt
          ? `Placed on ${placedAt}`
          : headline.sub;
  const heroPill = showEta ? { label: 'ON SCHEDULE', fg: AMBER_TEXT, bg: AMBER_BG } : pill;

  /* -------------------------------- Timeline -------------------------------- */

  const nearDesc = isDelivered
    ? 'Rider reached your location'
    : riderToCustomerKm !== null
      ? `${formatDistance(riderToCustomerKm)} away • Approaching your location`
      : 'Approaching your location';

  const prepMin = num(track('preparationTime'));
  const acceptedDesc =
    prepMin > 0 && completedSteps >= 2 && completedSteps < 5
      ? `Confirmed by ${shopName} • Ready in ~${Math.round(prepMin)} min`
      : `Confirmed by ${shopName}`;

  const timelineSteps: TimelineStep[] = [
    {
      key: 'placed',
      title: 'Order Placed',
      description: `Received by ${shopName}`,
      icon: 'check',
      time: formatStepTime(tPlaced),
    },
    {
      key: 'accepted',
      title: 'Store Accepted',
      description: acceptedDesc,
      icon: 'storefront-outline',
      time: formatStepTime(tAccepted),
    },
    {
      key: 'assigned',
      title: 'Rider Assigned & Accepted',
      description: riderName ? `${riderName} accepted your order` : 'Assigning a delivery partner',
      icon: 'account-check-outline',
      time: formatStepTime(tAssigned),
    },
    {
      key: 'reached',
      title: 'Rider Reached Store',
      description: `Partner arrived at ${shopName}`,
      icon: 'map-marker-check-outline',
      time: formatStepTime(tArrivedStore),
    },
    {
      key: 'picked',
      title: 'Rider Picked Up Order',
      description: 'Order verified & on the move',
      icon: 'package-variant-closed',
      time: formatStepTime(tPicked),
    },
    {
      key: 'near',
      title: 'Rider Near You',
      description: nearDesc,
      icon: 'moped',
      time: formatStepTime(tNear),
    },
    {
      key: 'delivered',
      title: 'Delivered',
      description: isDelivered
        ? 'Order delivered to you'
        : expectedTime
          ? `Expected by ${expectedTime}${otp ? ` • Share OTP ${otp}` : ''}`
          : 'Arrives at your doorstep soon',
      icon: 'map-marker-outline',
      time: formatStepTime(tDelivered),
    },
  ];

  /* --------------------------------- Rider card --------------------------------- */

  const ratingNum = Number(partner?.rating);
  const vehicleLine = [
    partner?.vehicleType,
    partner?.vehicleNumber ? `(${partner.vehicleNumber})` : '',
  ]
    .filter(Boolean)
    .join(' ');
  const riderFallbackMeta = isDelivered ? 'Delivered your order' : 'Your delivery partner';

  /* ---------------------------------- Payment ---------------------------------- */

  // A Daily Essentials order arrives in the shared Order shape ('cash', paymentStatus 'pending')
  // rather than the API's ('COD', paymentReceivalStatus 'YET_TO_RECEIVE'); both mean unpaid COD.
  const isCod = ['COD', 'CASH'].includes((rawOrder.paymentMethod || '').toUpperCase());
  const cashStillDue =
    rawOrder.paymentReceivalStatus === 'YET_TO_RECEIVE' ||
    (essentialsOrderId != null && selectedOrder.paymentStatus === 'pending');
  const paymentLine = isCancelled
    ? 'Order cancelled'
    : cashStillDue && isCod
      ? `Pay ₹${bill.total.toFixed(0)} on delivery`
      : `Paid ₹${bill.total.toFixed(0)}${rawOrder.paymentMethod ? ` via ${isCod ? 'Cash' : String(rawOrder.paymentMethod).toUpperCase()}` : ''}`;
  const paymentSubtitle = [paymentLine, vendorDetails?.name].filter(Boolean).join(' • ');

  const itemCount = derivedItems.reduce((sum, it) => sum + it.quantity, 0) || derivedItems.length;

  const renderCancelButton = () => (
    <TouchableOpacity
      style={[styles.actionButton, styles.cancelButton, styles.fullWidthButton]}
      onPress={handleCancelOrder}
      disabled={cancellingOrder}
      activeOpacity={0.85}
    >
      {cancellingOrder ? (
        <ActivityIndicator size="small" color={RED} />
      ) : (
        <ThemeText style={[styles.actionButtonText, styles.cancelButtonText]}>
          Cancel Order
        </ThemeText>
      )}
    </TouchableOpacity>
  );

  const renderActionButtons = () => {
    if (essentialsOrderId) {
      return essentials?.cancellable ? renderCancelButton() : null;
    }
    if (status === 'payment_pending') {
      return (
        <View style={styles.actionButtonContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.retryButton]}
            onPress={handleRetryPayment}
            disabled={retryingPayment}
            activeOpacity={0.85}
          >
            {retryingPayment ? (
              <ActivityIndicator size="small" color={BLUE} />
            ) : (
              <ThemeText style={[styles.actionButtonText, styles.retryButtonText]}>
                Retry Payment
              </ThemeText>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={handleCancelOrder}
            disabled={cancellingOrder}
            activeOpacity={0.85}
          >
            {cancellingOrder ? (
              <ActivityIndicator size="small" color={RED} />
            ) : (
              <ThemeText style={[styles.actionButtonText, styles.cancelButtonText]}>
                Cancel Order
              </ThemeText>
            )}
          </TouchableOpacity>
        </View>
      );
    }
    if (status === 'processing') {
      return renderCancelButton();
    }
    return null;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: getColor('background') }]}>
      <View style={[styles.container, { backgroundColor: getColor('background') }]}>
        <ScreenHeader
          orderId={selectedOrder.orderId}
          subtitle={headerSubtitle}
          isLive={isLive}
          onBackPress={handleBackPress}
          onSharePress={handleShare}
          getColor={getColor}
        />

        {/* Notification Permission Bar */}
        {showPermissionBar && (
          <View style={[styles.notificationBar, { backgroundColor: getColor('main') }]}>
            <View style={styles.notificationContent}>
              <Icon name="bell-outline" size={20} color={getColor('background')} />
              <ThemeText style={[styles.notificationText, { color: getColor('background') }]}>
                Enable notifications to get order updates
              </ThemeText>
            </View>
            <TouchableOpacity
              style={[
                styles.enableButton,
                {
                  backgroundColor: getColor('error'),
                  borderColor: getColor('border'),
                },
              ]}
              onPress={handleEnableNotifications}
              activeOpacity={0.8}
            >
              <ThemeText style={[styles.enableButtonText, { color: getColor('white') }]}>
                Enable
              </ThemeText>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={getColor('secondary')}
              colors={[getColor('secondary')]}
              progressBackgroundColor={getColor('card')}
            />
          }
        >
          {/* Live map — only for LIVE orders (not DELIVERED / CANCELLED / REJECTED) */}
          {showMap && (
            <LiveOrderMap
              vendor={vendorCoord}
              rider={riderCoord}
              customer={customerCoord}
              vendorName={vendorDetails?.name || 'Store'}
              riderLabel={riderLabel}
              pickedUp={pickedUp}
              onShiftPin={handleShiftPin}
              getColor={getColor}
            />
          )}

          <View style={styles.body}>
            {/* Status hero */}
            <StatusHero
              title={heroTitle}
              subtitle={heroSubtitle}
              pill={heroPill}
              showLiveDot={showEta}
              otp={otp}
              addressLine={addressLine}
              actionButton={renderActionButtons()}
              getColor={getColor}
            />

            {essentialsNote ? (
              <View
                style={[
                  styles.statusNote,
                  { backgroundColor: getColor('card'), borderColor: getColor('border') },
                ]}
              >
                <Icon name={essentialsNote.icon} size={20} color={getColor('primary')} />
                <View style={styles.statusNoteText}>
                  <ThemeText style={[styles.statusNoteTitle, { color: getColor('text') }]}>
                    {essentialsNote.title}
                  </ThemeText>
                  {essentialsNote.lines.map(line => (
                    <ThemeText
                      key={line}
                      style={[styles.statusNoteSub, { color: getColor('subText') }]}
                    >
                      {line}
                    </ThemeText>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Savings banner */}
            {bill.couponDiscount > 0 && (
              <View style={styles.savingsBanner}>
                <Icon name="tag-outline" size={18} color="#15803D" />
                <ThemeText style={styles.savingsBannerText}>
                  You saved ₹{bill.couponDiscount.toFixed(0)} on this order!
                </ThemeText>
                <View style={styles.savingsAmountBadge}>
                  <ThemeText style={styles.savingsAmountText}>
                    ₹{bill.couponDiscount.toFixed(0)}
                  </ThemeText>
                </View>
              </View>
            )}

            {/* Live Order Status timeline */}
            {isCancelled ? (
              <View style={[styles.card, styles.cancelledCard]}>
                <Icon name="close-circle-outline" size={22} color={RED} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <ThemeText style={styles.cancelledTitle}>This order was cancelled</ThemeText>
                  {!!rawOrder.cancelReason && (
                    <ThemeText style={styles.cancelledReason}>{rawOrder.cancelReason}</ThemeText>
                  )}
                  {!!placedAt && (
                    <ThemeText style={styles.cancelledReason}>Placed on {placedAt}</ThemeText>
                  )}
                  {!!cancelledAtLabel && (
                    <ThemeText style={styles.cancelledReason}>
                      Cancelled on {cancelledAtLabel}
                    </ThemeText>
                  )}
                  {!!rawOrder.refundStatus && (
                    <ThemeText style={styles.cancelledReason}>
                      Refund: {prettify(String(rawOrder.refundStatus))}
                    </ThemeText>
                  )}
                </View>
              </View>
            ) : (
              <OrderStatusTimeline
                steps={timelineSteps}
                completed={completedSteps}
                stepLabel={stepLabel}
                getColor={getColor}
              />
            )}

            {/* Delivery partner */}
            {!!riderName && !isCancelled && (
              <RiderCard
                name={riderName}
                rating={Number.isFinite(ratingNum) ? ratingNum : undefined}
                deliveries={partner?.orderSuccess}
                vehicleLine={vehicleLine || undefined}
                fallbackMeta={riderFallbackMeta}
                imageUrl={partner?.profilePicture}
                canContact={isLive && !!riderPhone}
                onCall={() => Linking.openURL(`tel:${riderPhone}`)}
                onChat={() => Linking.openURL(`sms:${riderPhone}`)}
                getColor={getColor}
              />
            )}

            {/* Items in order + inline bill */}
            <View
              style={[
                styles.card,
                { backgroundColor: getColor('card'), borderColor: getColor('border') },
              ]}
            >
              <TouchableOpacity
                style={styles.itemsHeader}
                onPress={() => setItemsExpanded(v => !v)}
                activeOpacity={0.7}
              >
                <View style={[styles.itemsHeaderIcon, { backgroundColor: AMBER_BG }]}>
                  <Icon name="shopping-outline" size={20} color={AMBER_TEXT} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <ThemeText style={[styles.cardTitle, { color: getColor('text') }]}>
                    {itemCount} {itemCount === 1 ? 'Item' : 'Items'} in Order
                  </ThemeText>
                  <ThemeText
                    style={[styles.itemsHeaderSub, { color: getColor('subText') }]}
                    numberOfLines={1}
                  >
                    {paymentSubtitle}
                  </ThemeText>
                </View>
                <Icon
                  name={itemsExpanded ? 'chevron-up' : 'chevron-down'}
                  size={22}
                  color={getColor('subText')}
                />
              </TouchableOpacity>

              {itemsExpanded &&
                (derivedItems.length === 0 ? (
                  <ThemeText style={[styles.emptyText, { color: getColor('subText') }]}>
                    No items found
                  </ThemeText>
                ) : (
                  <View style={styles.itemsContainer}>
                    {derivedItems.map((item: DerivedItem) => (
                      <View
                        key={item.id}
                        style={[styles.itemRow, { borderColor: getColor('border') }]}
                      >
                        {item.image ? (
                          <Image source={{ uri: item.image }} style={styles.itemImage} />
                        ) : (
                          <View
                            style={[styles.itemImage, { backgroundColor: getColor('background') }]}
                          />
                        )}
                        <View style={styles.itemInfo}>
                          <ThemeText
                            style={[styles.itemName, { color: getColor('text') }]}
                            numberOfLines={2}
                          >
                            {item.name}
                          </ThemeText>
                          <ThemeText style={[styles.itemMeta, { color: getColor('subText') }]}>
                            {item.quantity} {item.quantity === 1 ? 'unit' : 'units'}
                          </ThemeText>
                          {unavailableSkus.has(item.id) ? (
                            <ThemeText style={[styles.itemMeta, { color: getColor('error') }]}>
                              Unavailable · not charged
                            </ThemeText>
                          ) : null}
                        </View>
                        <ThemeText
                          style={[
                            styles.itemPrice,
                            { color: getColor('text') },
                            unavailableSkus.has(item.id) && styles.struckPrice,
                          ]}
                        >
                          ₹{item.price.toFixed(0)}
                        </ThemeText>
                      </View>
                    ))}
                  </View>
                ))}

              {/* ───────── Total Bill block (inline, replaces BillSummaryCard) ───────── */}
              <View style={[styles.billSectionDivider]} />

              <TouchableOpacity
                style={styles.billSummaryHeader}
                onPress={() => setBillExpanded(v => !v)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBadge, { backgroundColor: `${getColor('primary')}12` }]}>
                  <Icon name="file-document-outline" size={22} color={getColor('primary')} />
                </View>
                <View style={styles.billSummaryContent}>
                  <ThemeText
                    variant="body"
                    style={[styles.billSummaryTitle, { color: getColor('text') }]}
                  >
                    Total Bill
                  </ThemeText>
                  <ThemeText
                    variant="body"
                    style={[styles.billSummaryAmount, { color: getColor('primary') }]}
                  >
                    {money(bill.total)}
                  </ThemeText>
                </View>
                <Animated.View style={{ transform: [{ rotate: billRotate }] }}>
                  <Icon name="chevron-down" size={24} color={getColor('text')} />
                </Animated.View>
              </TouchableOpacity>

              <Animated.View
                style={[
                  styles.billSummaryDetails,
                  { maxHeight: billMaxHeight, opacity: billOpacity, overflow: 'hidden' },
                ]}
              >
                <View style={styles.billDetailsTitle}>
                  <View style={[styles.titleLine, { backgroundColor: getColor('border') }]} />
                  <ThemeText
                    variant="caption"
                    style={[styles.titleText, { color: getColor('text') }]}
                  >
                    Bill Details
                  </ThemeText>
                  <View style={[styles.titleLine, { backgroundColor: getColor('border') }]} />
                </View>

                <View
                  style={[
                    styles.billBreakdown,
                    { backgroundColor: getColor('background'), borderRadius: radiusSm },
                  ]}
                >
                  <BillRow label="Sub Total" value={money(bill.subtotal)} getColor={getColor} />

                  {bill.couponDiscount > 0 && (
                    <BillRow
                      label="Coupon Discount"
                      value={`-${money(bill.couponDiscount)}`}
                      valueColor={getColor('primary')}
                      getColor={getColor}
                    />
                  )}

                  <View style={[styles.dottedLine, { borderColor: getColor('border') }]} />

                  {/* Delivery fee */}
                  <BillRow
                    label={`Delivery Fee${
                      bill.isFreeDelivery && bill.deliveryCouponCode
                        ? ` (${bill.deliveryCouponCode})`
                        : ''
                    }`}
                    value={bill.isFreeDelivery ? 'FREE' : money(bill.deliveryFee)}
                    valueColor={bill.isFreeDelivery ? getColor('primary') : undefined}
                    original={
                      bill.isFreeDelivery
                        ? bill.deliveryFeeOriginal != null
                          ? money(bill.deliveryFeeOriginal)
                          : undefined
                        : bill.deliveryFeeOriginal != null &&
                            bill.deliveryFeeOriginal > bill.deliveryFee
                          ? money(bill.deliveryFeeOriginal)
                          : undefined
                    }
                    getColor={getColor}
                  />

                  {/* Platform fee */}
                  <BillRow
                    label="Platform Fee"
                    value={money(bill.platformFee)}
                    original={
                      bill.platformFeeOriginal != null &&
                      bill.platformFeeOriginal > bill.platformFee
                        ? money(bill.platformFeeOriginal)
                        : undefined
                    }
                    getColor={getColor}
                  />

                  {/* Packaging */}
                  {bill.packagingCharges > 0 && (
                    <BillRow
                      label="Packaging Charges"
                      value={money(bill.packagingCharges)}
                      original={
                        bill.packagingChargesOriginal != null &&
                        bill.packagingChargesOriginal > bill.packagingCharges
                          ? money(bill.packagingChargesOriginal)
                          : undefined
                      }
                      getColor={getColor}
                    />
                  )}

                  {bill.codCharges > 0 && (
                    <BillRow
                      label="Cash On Delivery Charges"
                      value={money(bill.codCharges)}
                      getColor={getColor}
                    />
                  )}

                  {bill.gatewayCharges > 0 && (
                    <BillRow
                      label="Payment Charges"
                      value={money(bill.gatewayCharges)}
                      getColor={getColor}
                    />
                  )}

                  {bill.tip > 0 && (
                    <BillRow label="Delivery Tip" value={money(bill.tip)} getColor={getColor} />
                  )}

                  {/* Taxes + breakdown */}
                  {bill.taxes > 0 && (
                    <View>
                      <Pressable
                        style={styles.billRow}
                        onPress={() => setShowTaxBreakdown(prev => !prev)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <ThemeText
                            variant="body"
                            style={[styles.billLabel, { color: getColor('text') }]}
                          >
                            Taxes (GST & Services)
                          </ThemeText>
                          <Icon
                            name={showTaxBreakdown ? 'chevron-up' : 'information-outline'}
                            size={14}
                            color={getColor('subText')}
                            style={{ marginLeft: 4 }}
                          />
                        </View>
                        <ThemeText
                          variant="body"
                          style={[styles.billAmount, { color: getColor('text') }]}
                        >
                          {money(bill.taxes)}
                        </ThemeText>
                      </Pressable>

                      {showTaxBreakdown && (
                        <View
                          style={[
                            styles.taxBreakdownBox,
                            {
                              backgroundColor: getColor('card'),
                              borderColor: getColor('border'),
                              borderRadius: radiusSm,
                            },
                          ]}
                        >
                          {bill.platformGst > 0 && (
                            <ThemeText
                              variant="caption"
                              color={getColor('subText')}
                              style={styles.taxBreakdownText}
                            >
                              Platform GST: {money(bill.platformGst)}
                            </ThemeText>
                          )}
                          {bill.deliveryGst > 0 && (
                            <ThemeText
                              variant="caption"
                              color={getColor('subText')}
                              style={styles.taxBreakdownText}
                            >
                              Delivery GST: {money(bill.deliveryGst)}
                            </ThemeText>
                          )}
                          {bill.packagingGst > 0 && (
                            <ThemeText
                              variant="caption"
                              color={getColor('subText')}
                              style={styles.taxBreakdownText}
                            >
                              Packaging GST: {money(bill.packagingGst)}
                            </ThemeText>
                          )}
                          {bill.codGst > 0 && (
                            <ThemeText
                              variant="caption"
                              color={getColor('subText')}
                              style={styles.taxBreakdownText}
                            >
                              COD GST: {money(bill.codGst)}
                            </ThemeText>
                          )}
                          <View
                            style={[
                              styles.taxBreakdownDivider,
                              { borderTopColor: getColor('border') },
                            ]}
                          />
                          <ThemeText
                            variant="caption"
                            color={getColor('text')}
                            style={styles.taxTotalLabel}
                          >
                            Taxable Pool Base: {money(bill.taxableAmount)}
                          </ThemeText>
                          <ThemeText
                            variant="caption"
                            color={getColor('primary')}
                            style={styles.taxTotalValue}
                          >
                            GST Total ({bill.gstPct}): {money(bill.taxes)}
                          </ThemeText>
                        </View>
                      )}
                    </View>
                  )}

                  <View style={[styles.dottedLine, { borderColor: getColor('border') }]} />

                  <View style={styles.billRowLast}>
                    <ThemeText
                      variant="body"
                      style={[styles.billLabel, styles.toPayLabel, { color: getColor('text') }]}
                    >
                      Total Pay
                    </ThemeText>
                    <ThemeText
                      variant="body"
                      style={[styles.toPayAmount, { color: getColor('text') }]}
                    >
                      {money(bill.total)}
                    </ThemeText>
                  </View>
                </View>
              </Animated.View>
            </View>

            {/* Order feedback — unchanged. OrderReviewCard reads order.review itself. */}
            {/* Not for a Daily Essentials order: its kiranas are never shown to the customer. */}
            {!essentialsOrderId && selectedOrder.status === 'delivered' && (
              <OrderReviewCard order={orderWithFeedback as any} />
            )}

            {/* Help — unchanged. HelpCard reads order.complaint itself. */}
            {!essentialsOrderId && (
              <HelpCard
                onPress={handleGetHelp}
                order={orderWithFeedback as any}
                onRefresh={onRefresh}
              />
            )}
            {/* Support */}
            <View
              style={[
                styles.card,
                styles.supportCard,
                { backgroundColor: getColor('card'), borderColor: getColor('border') },
              ]}
            >
              <View style={styles.supportInfoRow}>
                <View style={[styles.supportIconWrap, { backgroundColor: getColor('background') }]}>
                  <Icon name="headset" size={22} color={getColor('primary')} />
                </View>
                <View style={{ marginLeft: 12 }}>
                  <ThemeText style={[styles.supportTitle, { color: getColor('text') }]}>
                    QuickVerse Support
                  </ThemeText>
                  <ThemeText style={[styles.supportSubtitle, { color: getColor('subText') }]}>
                    We are available to help
                  </ThemeText>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.callButton, { backgroundColor: getColor('primary') }]}
                onPress={() => Linking.openURL(`tel:8459418525`)}
                activeOpacity={0.85}
              >
                <Icon name="phone" size={16} color="#FFF" />
                <ThemeText style={styles.callButtonText}>Call</ThemeText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Custom Themed Dialog */}
      <Modal
        visible={dialogVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDialogVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: getColor('card') }]}>
            <ThemeText style={[styles.modalTitle, { color: getColor('text') }]}>
              {dialogConfig?.title}
            </ThemeText>
            <ThemeText style={[styles.modalMessage, { color: getColor('subText') }]}>
              {dialogConfig?.message}
            </ThemeText>
            <View style={styles.modalButtonRow}>
              {dialogConfig?.cancelText ? (
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.modalCancelButton,
                    { borderColor: getColor('border') },
                  ]}
                  onPress={() => setDialogVisible(false)}
                  activeOpacity={0.85}
                >
                  <ThemeText style={[styles.modalButtonText, { color: getColor('text') }]}>
                    {dialogConfig?.cancelText}
                  </ThemeText>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalConfirmButton,
                  { backgroundColor: dialogConfig?.confirmColor || getColor('secondary') },
                ]}
                onPress={() => {
                  dialogConfig?.onConfirm();
                }}
                activeOpacity={0.85}
              >
                <ThemeText
                  style={[
                    styles.modalButtonText,
                    {
                      color:
                        dialogConfig?.confirmColor === '#F44336'
                          ? '#FFFFFF'
                          : getColor('background'),
                    },
                  ]}
                >
                  {dialogConfig?.confirmText}
                </ThemeText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 0,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  body: {
    padding: 16,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'flex-start',
    paddingHorizontal: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    flexShrink: 1,
  },
  headerSubtitle: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GREEN_BG,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN,
  },
  liveBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    color: GREEN,
  },

  /* Map */
  mapWrap: {
    height: MAP_HEIGHT,
    width: '100%',
    overflow: 'hidden',
  },
  pinCol: {
    alignItems: 'center',
    minWidth: 90,
  },
  pinLabel: {
    maxWidth: 150,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  pinLabelText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
  },
  pinCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },
  locateBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  shiftPinChip: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  shiftPinText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: '#4B5563',
  },

  /* Generic card */
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  cardTitle: {
    fontFamily: Fonts.bold,
    fontSize: 15,
  },

  /* Hero */
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  heroTitle: {
    fontFamily: Fonts.bold,
    fontSize: 20,
  },
  heroSub: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    marginTop: 4,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  pillText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
  },
  otpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 14,
  },
  otpLabel: {
    fontFamily: Fonts.medium,
    fontSize: 11,
  },
  otpHint: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    marginTop: 2,
  },
  otpBox: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  otpValue: {
    fontFamily: Fonts.bold,
    fontSize: 26,
    letterSpacing: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 14,
  },
  addressLabel: {
    fontFamily: Fonts.medium,
    fontSize: 11,
  },
  addressText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    marginTop: 1,
  },
  heroAction: {
    marginTop: 14,
  },

  /* Action buttons */
  actionButtonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    minHeight: 40,
    minWidth: 100,
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidthButton: {
    flex: 0,
    width: '100%',
  },
  retryButton: {
    borderWidth: 1.5,
    borderColor: BLUE,
  },
  cancelButton: {
    borderWidth: 1.5,
    borderColor: RED,
  },
  actionButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
  retryButtonText: {
    color: BLUE,
  },
  cancelButtonText: {
    color: RED,
  },

  /* Timeline */
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  stepChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  stepChipText: {
    fontFamily: Fonts.medium,
    fontSize: 11,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  timelineRail: {
    alignItems: 'center',
    width: 28,
  },
  timelineNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 2,
    borderRadius: 1,
  },
  timelineBody: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 18,
  },
  timelineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 28,
  },
  timelineTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
  timelineDesc: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    marginTop: -2,
  },
  currentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AMBER,
  },

  /* Cancelled */
  cancelledCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RED_BG,
    borderColor: '#FECACA',
  },
  cancelledTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: RED,
  },
  cancelledReason: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 2,
  },

  /* Rider */
  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riderAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  riderAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderInitial: {
    fontFamily: Fonts.bold,
    fontSize: 18,
  },
  verifiedBadge: {
    position: 'absolute',
    right: -4,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderName: {
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  riderMeta: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    marginTop: 2,
  },
  riderActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  partnerCallButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
  },
  partnerCallText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: '#FFF',
  },
  partnerChatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
  },
  partnerChatText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
  },

  /* Items */
  itemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemsHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemsHeaderSub: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    marginTop: 8,
    fontFamily: Fonts.medium,
    fontSize: 14,
  },
  itemsContainer: {
    marginTop: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    marginBottom: 2,
  },
  itemMeta: {
    fontFamily: Fonts.medium,
    fontSize: 12,
  },
  itemPrice: {
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
  itemsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
  itemsFooterLabel: {
    fontFamily: Fonts.medium,
    fontSize: 12,
  },
  itemsFooterValue: {
    fontFamily: Fonts.bold,
    fontSize: 14,
  },

  /* Inline bill (Total Bill block) */
  billSectionDivider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 6,
  },
  billSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  billSummaryContent: {
    flex: 1,
  },
  billSummaryTitle: {
    fontFamily: Fonts.bold,
  },
  billSummaryAmount: {
    marginTop: 2,
    fontFamily: Fonts.bold,
  },
  billSummaryDetails: {
    marginTop: 12,
  },
  billDetailsTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  titleLine: {
    flex: 1,
    height: 1,
  },
  titleText: {
    marginHorizontal: 12,
    textTransform: 'uppercase',
    fontFamily: Fonts.medium,
    letterSpacing: 0.5,
  },
  billBreakdown: {
    padding: 16,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  billRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  billLabel: {
    fontFamily: Fonts.regular,
  },
  billAmount: {
    fontFamily: Fonts.medium,
  },
  dottedLine: {
    borderStyle: 'dashed',
    borderWidth: 1,
    marginVertical: 10,
  },
  crossedText: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
    marginRight: 6,
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taxBreakdownBox: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    gap: 4,
  },
  taxBreakdownDivider: {
    borderTopWidth: 1,
    marginVertical: 4,
  },
  taxBreakdownText: {
    fontFamily: Fonts.regular,
  },
  taxTotalLabel: {
    fontFamily: Fonts.medium,
  },
  taxTotalValue: {
    fontFamily: Fonts.bold,
  },
  toPayLabel: {
    fontFamily: Fonts.bold,
  },
  toPayAmount: {
    fontSize: 16,
    fontFamily: Fonts.bold,
  },

  /* Support / safety */
  supportCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  supportInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  supportIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportTitle: {
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  supportSubtitle: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    marginTop: 2,
  },

  /* Notification permission bar */
  notificationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  notificationText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  enableButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  enableButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
  },

  /* Dialog */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalContainer: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    marginBottom: 12,
  },
  modalMessage: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  modalCancelButton: {
    borderWidth: 1,
  },
  modalConfirmButton: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  modalButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
  },

  /* Savings banner */
  statusNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  statusNoteText: { flex: 1 },
  statusNoteTitle: { fontFamily: Fonts.bold, fontSize: 14 },
  statusNoteSub: { fontFamily: Fonts.regular, fontSize: 12, marginTop: 2 },
  struckPrice: { textDecorationLine: 'line-through', opacity: 0.6 },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  savingsBannerText: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: '#15803D',
  },
  savingsAmountBadge: {
    backgroundColor: '#22C55E',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  savingsAmountText: {
    color: '#FFF',
    fontFamily: Fonts.bold,
    fontSize: 12,
  },

  /* Call buttons */
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  callButtonText: {
    fontFamily: Fonts.bold,
    color: '#FFF',
    fontSize: 12,
  },
});

export default OrderDetailsScreen;
