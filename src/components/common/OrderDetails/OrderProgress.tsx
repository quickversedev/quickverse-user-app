import Icon from '@react-native-vector-icons/material-design-icons';
import React, { useEffect, useState } from 'react';
import { Image, Linking, Modal, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import { useTheme } from '../../../theme/ThemeContext';
import type { Order, OrderTrackingInfo } from '../../../types/order';
import { Fonts } from '../theme/fonts';
import { ThemeText } from '../theme/ThemeText';

type OrderProgressProps = {
  status: Order['status'];
  orderCreationTime?: string | number;
  category?: string;
  preparationTime?: string;
  orderMasterStatus?: string;
  orderDate?: string;
  tracking?: OrderTrackingInfo | null;
};

const STEPS = [
  { key: 'placed', label: 'Order\nPlaced', icon: 'clipboard-check-outline' },
  { key: 'at_store', label: 'At\nStore', icon: 'store' },
  { key: 'picked_up', label: 'Picked\nUp', icon: 'package-variant' },
  { key: 'reached', label: 'Reached', icon: 'truck-delivery-outline' },
  { key: 'delivered', label: 'Delivered', icon: 'check-decagram' },
];

const CIRCLE_SIZE = 36;
const ICON_SIZE = 18;
const LINE_HEIGHT = 3;
const COMPLETED_COLOR = '#4CAF50';
const COMPLETED_BG = '#E8F5E9';
const CANCELLED_COLOR = '#F44336';
const PRIMARY_ORANGE = '#F97316';

const DELAY_MESSAGES = [
  { text: 'Finalizing your order...', icon: 'package-variant' as const },
  { text: 'Almost there!', icon: 'truck-fast' as const },
  { text: 'Just a moment...', icon: 'timer-sand' as const },
  { text: 'Preparing with care...', icon: 'chef-hat' as const },
  { text: 'On its way soon!', icon: 'map-marker-path' as const },
];

const getActiveStepIndex = (status: Order['status'], orderMasterStatus?: string): number => {
  if (status === 'cancelled') return -1;
  if (status === 'delivered') return STEPS.length;

  const oms = (orderMasterStatus || '').toLowerCase();
  if (oms === 'out_for_delivery' || oms === 'order_picked_up') return 2;
  if (oms === 'reached_location') return 3;
  if (oms === 'arrived_at_store') return 1;
  if (oms === 'partner_assigned' || oms === 'partner_accepted') return 1;
  if (status === 'shipping' || status === 'shipped') return 1;

  return 0;
};

const getRiderStatusLabel = (orderMasterStatus?: string): string => {
  const oms = (orderMasterStatus || '').toUpperCase();
  if (oms === 'PARTNER_ASSIGNED' || oms === 'PARTNER_ACCEPTED') return 'Heading to store';
  if (oms === 'ARRIVED_AT_STORE') return 'At store';
  if (oms === 'ORDER_PICKED_UP' || oms === 'OUT_FOR_DELIVERY') return 'On the way';
  if (oms === 'REACHED_LOCATION') return 'Nearby';
  if (oms === 'DELIVERED') return 'Delivered';
  return 'Finding rider';
};

const formatEpochTime = (epochMs?: string | null): string | null => {
  if (!epochMs) return null;
  try {
    const ms = parseInt(epochMs, 10);
    if (isNaN(ms)) return null;
    return new Date(ms).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return null;
  }
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  const full = Math.floor(rating);
  const remainder = rating % 1;
  const hasHalf = remainder >= 0.2;
  return (
    <View style={starStyles.row}>
      {[1, 2, 3, 4, 5].map(i => {
        let iconName = 'star-outline';
        if (i <= full) {
          iconName = 'star';
        } else if (i === full + 1 && hasHalf) {
          iconName = 'star-half-full';
        }
        return (
          <Icon
            key={i}
            name={iconName}
            size={12}
            color={PRIMARY_ORANGE}
            style={{ marginRight: 1 }}
          />
        );
      })}
      <ThemeText style={starStyles.label}>{rating.toFixed(1)}</ThemeText>
    </View>
  );
};

const starStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  label: { fontSize: 11, color: PRIMARY_ORANGE, marginLeft: 3, fontFamily: Fonts.medium },
});

const RiderMiniMap: React.FC<{
  riderLat: number;
  riderLon: number;
  shopLat?: number | null;
  shopLon?: number | null;
  onPress?: () => void;
}> = ({ riderLat, riderLon, shopLat, shopLon, onPress }) => {
  const sLat = shopLat || riderLat + 0.004;
  const sLon = shopLon || riderLon - 0.006;

  const midLat = (riderLat + sLat) / 2;
  const midLon = (riderLon + sLon) / 2;
  const latDelta = Math.max(0.007, Math.abs(riderLat - sLat) * 2.2);
  const lonDelta = Math.max(0.007, Math.abs(riderLon - sLon) * 2.2);

  const routeCoordinates = [
    { latitude: sLat, longitude: sLon },
    { latitude: (sLat + riderLat) / 2 + 0.0003, longitude: (sLon + riderLon) / 2 - 0.0003 },
    { latitude: riderLat, longitude: riderLon },
  ];

  return (
    <TouchableOpacity
      style={styles.miniMapWrap}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.miniMap}
        initialRegion={{
          latitude: midLat,
          longitude: midLon,
          latitudeDelta: latDelta,
          longitudeDelta: lonDelta,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        mapPadding={{ top: 4, right: 4, bottom: 4, left: 4 }}
        liteMode
      >
        <Polyline
          coordinates={routeCoordinates}
          strokeColor="#16A34A"
          strokeWidth={3}
        />
        <Marker coordinate={{ latitude: sLat, longitude: sLon }} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={mapStyles.storeBadge}>
            <Icon name="store" size={10} color="#FFFFFF" />
          </View>
        </Marker>
        <Marker coordinate={{ latitude: riderLat, longitude: riderLon }} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={mapStyles.riderBadge}>
            <Icon name="motorbike" size={10} color="#FFFFFF" />
          </View>
        </Marker>
      </MapView>
      <View style={mapStyles.expandOverlay}>
        <Icon name="fullscreen" size={14} color="#1E293B" />
      </View>
    </TouchableOpacity>
  );
};

const OrderProgress: React.FC<OrderProgressProps> = ({
  status,
  orderCreationTime,
  category,
  preparationTime,
  orderMasterStatus,
  orderDate,
  tracking,
}) => {
  const { getColor } = useTheme();
  const activeIndex = getActiveStepIndex(status, orderMasterStatus);
  const isCancelled = status === 'cancelled';
  const isDelivered = status === 'delivered';
  const isTerminal = isCancelled || isDelivered;

  const effectivePrepTime = tracking?.preparationTime || preparationTime;
  let deliveryTimeMinutes = 20;
  if (effectivePrepTime) {
    const parsed = parseInt(effectivePrepTime.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0) deliveryTimeMinutes = parsed;
  } else {
    deliveryTimeMinutes = category?.toLowerCase().includes('food') ? 35 : 20;
  }

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [delayMessageIndex, setDelayMessageIndex] = useState(0);
  const isDelayed = elapsedSeconds >= deliveryTimeMinutes * 60;
  const remainingSeconds = Math.max(0, deliveryTimeMinutes * 60 - elapsedSeconds);
  const progressPercent = Math.min(100, (elapsedSeconds / (deliveryTimeMinutes * 60)) * 100);

  useEffect(() => {
    if (!orderCreationTime || isTerminal) return;
    const creationMs =
      typeof orderCreationTime === 'string'
        ? new Date(orderCreationTime).getTime()
        : orderCreationTime;
    setElapsedSeconds(Math.max(0, Math.floor((Date.now() - creationMs) / 1000)));
    const interval = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - creationMs) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [orderCreationTime, isTerminal]);

  useEffect(() => {
    if (!isDelayed) return;
    const interval = setInterval(() => {
      setDelayMessageIndex(prev => (prev + 1) % DELAY_MESSAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isDelayed]);

  const formattedOrderTime = orderDate
    ? new Date(orderDate).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : undefined;

  // Stage timestamps from tracking data
  const stageTimestamps = [
    formattedOrderTime,
    formatEpochTime(tracking?.arrivedAtStoreAt),
    formatEpochTime(tracking?.pickedUpAt),
    formatEpochTime(tracking?.reachedLocationAt),
    formatEpochTime(tracking?.deliveredAt),
  ];

  // Extract rider & shop coordinates with fallbacks for alternative backend DTO key names
  const riderLatRaw = tracking?.riderLatitude || (tracking as any)?.latitude || (tracking as any)?.riderLat;
  const riderLonRaw = tracking?.riderLongitude || (tracking as any)?.longitude || (tracking as any)?.riderLng || (tracking as any)?.riderLon;
  const shopLatRaw = tracking?.shopLatitude || (tracking as any)?.vendorLatitude || (tracking as any)?.shopLat;
  const shopLonRaw = tracking?.shopLongitude || (tracking as any)?.vendorLongitude || (tracking as any)?.shopLng || (tracking as any)?.shopLon;

  const riderLat = riderLatRaw ? parseFloat(riderLatRaw) : null;
  const riderLon = riderLonRaw ? parseFloat(riderLonRaw) : null;
  const shopLat = shopLatRaw ? parseFloat(shopLatRaw) : null;
  const shopLon = shopLonRaw ? parseFloat(shopLonRaw) : null;
  const hasRiderLocation = riderLat !== null && riderLon !== null && !isNaN(riderLat) && !isNaN(riderLon);

  // Extract rider details with fallbacks
  const effectiveRiderName =
    tracking?.riderName ||
    (tracking as any)?.deliveryPartnerName ||
    (tracking as any)?.partnerName ||
    (tracking as any)?.driverName ||
    (tracking as any)?.name ||
    '';

  const effectiveRiderPhone =
    tracking?.riderPhone ||
    (tracking as any)?.deliveryPartnerPhone ||
    (tracking as any)?.partnerPhone ||
    (tracking as any)?.driverPhone ||
    (tracking as any)?.phone ||
    null;

  const effectiveRiderPhoto =
    tracking?.riderProfilePicture ||
    (tracking as any)?.deliveryPartnerPhoto ||
    (tracking as any)?.partnerPhoto ||
    (tracking as any)?.profilePicture ||
    (tracking as any)?.avatar ||
    null;

  const effectiveRiderRating = parseFloat(
    String(
      (tracking as any)?.riderRating ||
        (tracking as any)?.rating ||
        (tracking as any)?.partnerRating ||
        4.9
    )
  ) || 4.9;

  const formattedRiderPhone = effectiveRiderPhone
    ? effectiveRiderPhone.startsWith('+')
      ? effectiveRiderPhone
      : `+${effectiveRiderPhone}`
    : '';

  const activeOrderMasterStatus = tracking?.orderMasterStatus || orderMasterStatus;
  const riderStatusLabel = getRiderStatusLabel(activeOrderMasterStatus);
  const hasRider =
    activeIndex >= 1 ||
    Boolean(effectiveRiderName) ||
    Boolean(effectiveRiderPhone) ||
    Boolean(
      activeOrderMasterStatus &&
        [
          'PARTNER_ASSIGNED',
          'PARTNER_ACCEPTED',
          'ARRIVED_AT_STORE',
          'ORDER_PICKED_UP',
          'OUT_FOR_DELIVERY',
          'REACHED_LOCATION',
        ].includes(activeOrderMasterStatus.toUpperCase())
    );

  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: getColor('card'), borderColor: getColor('border') },
      ]}
    >
      {/* Your Rider Card */}
      {hasRider && !isDelivered && !isCancelled && (
        <View style={styles.riderCard}>
          {/* Top row: label + status badge */}
          <View style={styles.riderTopRow}>
            <ThemeText style={[styles.riderCardLabel, { color: getColor('text') }]}>
              Your Rider
            </ThemeText>
            <View style={[styles.statusBadge, { backgroundColor: COMPLETED_COLOR }]}>
              <ThemeText style={styles.statusBadgeText}>{riderStatusLabel}</ThemeText>
            </View>
          </View>

          {/* Middle row: avatar + info + mini map */}
          <View style={styles.riderMiddleRow}>
            {/* Avatar */}
            <View style={styles.avatarWrap}>
              {effectiveRiderPhoto ? (
                <Image
                  source={{ uri: effectiveRiderPhoto }}
                  style={styles.avatarImg}
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: `${PRIMARY_ORANGE}18` }]}>
                  <Icon name="account" size={32} color={PRIMARY_ORANGE} />
                </View>
              )}
              {/* Online dot */}
              <View style={styles.onlineDot} />
            </View>

            {/* Rider info */}
            <View style={styles.riderInfo}>
              <ThemeText style={[styles.riderName, { color: getColor('text') }]}>
                {effectiveRiderName || 'Delivery Partner'}
              </ThemeText>
              <StarRating rating={effectiveRiderRating} />
              {Boolean(effectiveRiderPhone) && (
                <TouchableOpacity
                  style={styles.phoneRow}
                  onPress={() => Linking.openURL(`tel:${effectiveRiderPhone}`)}
                  activeOpacity={0.7}
                >
                  <Icon name="phone" size={13} color={getColor('subText')} />
                  <ThemeText style={[styles.riderPhone, { color: getColor('subText') }]}>
                    {formattedRiderPhone}
                  </ThemeText>
                </TouchableOpacity>
              )}
            </View>

            {/* Mini map */}
            <RiderMiniMap
              riderLat={riderLat || 19.8762}
              riderLon={riderLon || 75.8862}
              shopLat={shopLat}
              shopLon={shopLon}
              onPress={() => setIsMapModalOpen(true)}
            />
          </View>

          {/* Call button */}
          {Boolean(effectiveRiderPhone) && (
            <TouchableOpacity
              style={[styles.callButton, { backgroundColor: PRIMARY_ORANGE }]}
              onPress={() => Linking.openURL(`tel:${effectiveRiderPhone}`)}
              activeOpacity={0.8}
            >
              <Icon name="phone" size={16} color="#FFFFFF" />
              <ThemeText style={styles.callText}>Call Rider</ThemeText>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Swiggy-Style Live Tracking Map Modal */}
      <Modal
        visible={isMapModalOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsMapModalOpen(false)}
      >
        <View style={modalStyles.container}>
          {/* Full Screen Interactive Google Map */}
          <MapView
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFillObject}
            initialRegion={{
              latitude: (riderLat || 19.8762) + 0.001,
              longitude: riderLon || 75.8862,
              latitudeDelta: 0.015,
              longitudeDelta: 0.015,
            }}
            showsUserLocation={false}
            showsMyLocationButton={false}
          >
            <Polyline
              coordinates={[
                { latitude: shopLat || (riderLat || 19.8762) + 0.004, longitude: shopLon || (riderLon || 75.8862) - 0.006 },
                { latitude: (riderLat || 19.8762), longitude: (riderLon || 75.8862) },
              ]}
              strokeColor="#16A34A"
              strokeWidth={5}
            />
            <Marker
              coordinate={{ latitude: shopLat || (riderLat || 19.8762) + 0.004, longitude: shopLon || (riderLon || 75.8862) - 0.006 }}
              title="Store"
            >
              <View style={mapStyles.storePinLarge}>
                <Icon name="store" size={16} color="#FFFFFF" />
              </View>
            </Marker>
            <Marker
              coordinate={{ latitude: riderLat || 19.8762, longitude: riderLon || 75.8862 }}
              title="Delivery Partner"
            >
              <View style={mapStyles.riderPinLarge}>
                <Icon name="motorbike" size={18} color="#FFFFFF" />
              </View>
            </Marker>
          </MapView>

          {/* Floating Top Header Bar */}
          <View style={modalStyles.topHeader}>
            <TouchableOpacity
              style={modalStyles.closeButton}
              onPress={() => setIsMapModalOpen(false)}
              activeOpacity={0.8}
            >
              <Icon name="close" size={20} color="#1E293B" />
            </TouchableOpacity>
            <ThemeText style={modalStyles.headerTitle}>Live Order Tracking</ThemeText>
          </View>

          {/* Floating Bottom Card */}
          <View style={modalStyles.bottomSheet}>
            <View style={modalStyles.handle} />
            <View style={styles.riderTopRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name="motorbike" size={20} color={PRIMARY_ORANGE} />
                <ThemeText style={[styles.riderCardLabel, { color: getColor('text') }]}>
                  Delivery Partner
                </ThemeText>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: COMPLETED_COLOR }]}>
                <ThemeText style={styles.statusBadgeText}>{riderStatusLabel}</ThemeText>
              </View>
            </View>

            <View style={[styles.riderMiddleRow, { marginBottom: 16, marginTop: 12 }]}>
              <View style={styles.avatarWrap}>
                {effectiveRiderPhoto ? (
                  <Image source={{ uri: effectiveRiderPhoto }} style={styles.avatarImg} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: `${PRIMARY_ORANGE}18` }]}>
                    <Icon name="account" size={36} color={PRIMARY_ORANGE} />
                  </View>
                )}
                <View style={styles.onlineDot} />
              </View>

              <View style={styles.riderInfo}>
                <ThemeText style={[styles.riderName, { color: getColor('text') }]}>
                  {effectiveRiderName || 'Delivery Partner'}
                </ThemeText>
                <StarRating rating={effectiveRiderRating} />
                {Boolean(effectiveRiderPhone) && (
                  <ThemeText style={[styles.riderPhone, { color: getColor('subText'), marginTop: 4 }]}>
                    {formattedRiderPhone}
                  </ThemeText>
                )}
              </View>
            </View>

            {Boolean(effectiveRiderPhone) && (
              <TouchableOpacity
                style={[styles.callButton, { backgroundColor: PRIMARY_ORANGE }]}
                onPress={() => Linking.openURL(`tel:${effectiveRiderPhone}`)}
                activeOpacity={0.85}
              >
                <Icon name="phone" size={16} color="#FFFFFF" />
                <ThemeText style={styles.callText}>Call Rider</ThemeText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Horizontal Stepper */}
      <View style={styles.stepper}>
        {STEPS.map((step, index) => {
          const isCompleted = !isCancelled && index < activeIndex;
          const isActive = !isCancelled && index === activeIndex;
          const isFuture = isCancelled || index > activeIndex;

          const leftLineGreen = index > 0 && !isCancelled && index <= activeIndex;
          const rightLineGreen = index < STEPS.length - 1 && !isCancelled && index < activeIndex;

          let circleBg: string;
          let circleBorder: string;
          let iconColor: string;

          if (isCompleted) {
            circleBg = COMPLETED_COLOR;
            circleBorder = COMPLETED_COLOR;
            iconColor = '#FFFFFF';
          } else if (isActive) {
            circleBg = COMPLETED_BG;
            circleBorder = COMPLETED_COLOR;
            iconColor = COMPLETED_COLOR;
          } else {
            circleBg = `${getColor('border')}40`;
            circleBorder = getColor('border');
            iconColor = getColor('subText');
          }

          const labelColor = isFuture ? getColor('subText') : getColor('text');
          const labelFontFamily = isCompleted || isActive ? Fonts.medium : Fonts.regular;
          const stepTime = stageTimestamps[index];

          return (
            <View key={step.key} style={styles.stepColumn}>
              <View style={styles.circleRow}>
                {index > 0 ? (
                  <View
                    style={[
                      styles.halfLine,
                      { backgroundColor: leftLineGreen ? COMPLETED_COLOR : getColor('border') },
                    ]}
                  />
                ) : (
                  <View style={styles.halfLineSpacer} />
                )}

                <View
                  style={[
                    styles.circle,
                    {
                      backgroundColor: circleBg,
                      borderColor: circleBorder,
                      borderWidth: isActive ? 2.5 : 2,
                    },
                  ]}
                >
                  <Icon name={step.icon as any} size={ICON_SIZE} color={iconColor} />
                </View>

                {index < STEPS.length - 1 ? (
                  <View
                    style={[
                      styles.halfLine,
                      { backgroundColor: rightLineGreen ? COMPLETED_COLOR : getColor('border') },
                    ]}
                  />
                ) : (
                  <View style={styles.halfLineSpacer} />
                )}
              </View>

              <ThemeText
                style={[styles.stepLabel, { color: labelColor, fontFamily: labelFontFamily }]}
                numberOfLines={2}
              >
                {step.label}
              </ThemeText>

              {Boolean(stepTime) && (isCompleted || isActive) && (
                <ThemeText style={[styles.stepTime, { color: getColor('subText') }]}>
                  {stepTime}
                </ThemeText>
              )}
            </View>
          );
        })}
      </View>

      {/* Prep time pill */}
      {Boolean(effectivePrepTime) && !isTerminal && (
        <View style={[styles.prepPill, { backgroundColor: `${PRIMARY_ORANGE}12` }]}>
          <Icon name="flash" size={13} color={PRIMARY_ORANGE} />
          <ThemeText style={[styles.prepText, { color: PRIMARY_ORANGE }]}>
            Est. prep time: {effectivePrepTime}
          </ThemeText>
        </View>
      )}

      {/* Cancelled badge */}
      {isCancelled && (
        <View style={styles.cancelledRow}>
          <Icon name="close-circle" size={18} color={CANCELLED_COLOR} />
          <ThemeText style={styles.cancelledText}>Order Cancelled</ThemeText>
        </View>
      )}

      {/* Timer / Delay */}
      {orderCreationTime &&
        !isTerminal &&
        (!isDelayed ? (
          <View
            style={[
              styles.timerBox,
              { backgroundColor: getColor('background'), borderColor: getColor('border') },
            ]}
          >
            <View style={styles.timerRow}>
              <Icon name="clock-outline" size={18} color={COMPLETED_COLOR} />
              <ThemeText style={[styles.timerText, { color: getColor('text') }]}>
                Estimated delivery in {formatTime(remainingSeconds)}
              </ThemeText>
            </View>
            <View style={[styles.progressBar, { backgroundColor: `${getColor('border')}60` }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: COMPLETED_COLOR, width: `${progressPercent}%` },
                ]}
              />
            </View>
          </View>
        ) : (
          <View style={styles.delayBox}>
            <Icon
              name={DELAY_MESSAGES[delayMessageIndex].icon}
              size={28}
              color="#856404"
              style={styles.delayIcon}
            />
            <ThemeText style={styles.delayText}>{DELAY_MESSAGES[delayMessageIndex].text}</ThemeText>
            <ThemeText style={styles.delaySubtext}>Your order is taking a bit longer</ThemeText>
            <ThemeText style={styles.delaySubtext}>Thank you for your patience</ThemeText>
          </View>
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  // Rider card
  riderCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F9731620',
    backgroundColor: '#FFF8F4',
    padding: 14,
    marginBottom: 16,
  },
  riderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  riderCardLabel: {
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: Fonts.medium,
  },
  riderMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: PRIMARY_ORANGE,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: `${PRIMARY_ORANGE}40`,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  riderInfo: {
    flex: 1,
  },
  riderName: {
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  riderPhone: {
    fontFamily: Fonts.regular,
    fontSize: 12,
  },
  miniMapWrap: {
    width: 90,
    height: 70,
    borderRadius: 10,
    overflow: 'hidden',
  },
  miniMap: {
    width: '100%',
    height: '100%',
  },
  miniMapPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  callText: {
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
    fontSize: 14,
  },
  // Stepper
  stepper: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  stepColumn: {
    flex: 1,
    alignItems: 'center',
  },
  circleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: CIRCLE_SIZE,
  },
  halfLine: {
    flex: 1,
    height: LINE_HEIGHT,
    borderRadius: LINE_HEIGHT / 2,
  },
  halfLineSpacer: {
    flex: 1,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 14,
  },
  stepTime: {
    fontFamily: Fonts.regular,
    fontSize: 9,
    textAlign: 'center',
    marginTop: 2,
  },
  // Prep time pill
  prepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 10,
    marginBottom: 4,
  },
  prepText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
  },
  cancelledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  cancelledText: {
    fontFamily: Fonts.bold,
    color: CANCELLED_COLOR,
    fontSize: 14,
  },
  timerBox: {
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timerText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    marginLeft: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  delayBox: {
    backgroundColor: '#FFF3CD',
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
    alignItems: 'center',
  },
  delayIcon: {
    marginBottom: 6,
  },
  delayText: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    textAlign: 'center',
    color: '#856404',
  },
  delaySubtext: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: '#856404',
    textAlign: 'center',
    marginTop: 2,
  },
});

const mapStyles = StyleSheet.create({
  storeBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 3,
  },
  riderBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 3,
  },
  storePinLarge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    elevation: 5,
  },
  riderPinLarge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    elevation: 5,
  },
  expandOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 6,
    padding: 3,
  },
});

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 35,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: '#1E293B',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
});

export default OrderProgress;
