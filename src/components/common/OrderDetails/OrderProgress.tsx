import Icon from '@react-native-vector-icons/material-design-icons';
import React, { useEffect, useState } from 'react';
import { Linking, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import type { Order } from '../../../types/order';
import { Fonts } from '../theme/fonts';
import { ThemeText } from '../theme/ThemeText';

type OrderProgressProps = {
  status: Order['status'];
  orderCreationTime?: string | number;
  category?: string;
  preparationTime?: string;
  orderMasterStatus?: string;
  orderDate?: string;
  deliveryPartnerName?: string;
  deliveryPartnerPhone?: string;
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
  if (oms === 'out_for_delivery') return 3;
  if (oms === 'order_picked_up') return 2;
  if (oms === 'reached_location' || oms === 'partner_assigned') return 1;
  if (status === 'shipping' || status === 'shipped') return 1;

  return 0;
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const OrderProgress: React.FC<OrderProgressProps> = ({
  status,
  orderCreationTime,
  category,
  preparationTime,
  orderMasterStatus,
  orderDate,
  deliveryPartnerName,
  deliveryPartnerPhone,
}) => {
  const { getColor } = useTheme();
  const activeIndex = getActiveStepIndex(status, orderMasterStatus);
  const isCancelled = status === 'cancelled';
  const isDelivered = status === 'delivered';
  const isTerminal = isCancelled || isDelivered;

  let deliveryTimeMinutes = 20;
  if (preparationTime) {
    const parsedTime = parseInt(preparationTime.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(parsedTime) && parsedTime > 0) deliveryTimeMinutes = parsedTime;
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

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: getColor('card'), borderColor: getColor('border') },
      ]}
    >
      {/* Delivery Partner Card */}
      {deliveryPartnerName && (
        <View
          style={[
            styles.partnerCard,
            {
              backgroundColor: `${getColor('primary')}0A`,
              borderColor: `${getColor('primary')}25`,
            },
          ]}
        >
          <View style={styles.partnerInfo}>
            <ThemeText style={[styles.partnerLabel, { color: getColor('primary') }]}>
              Delivery Partner
            </ThemeText>
            <ThemeText style={[styles.partnerName, { color: getColor('text') }]}>
              {deliveryPartnerName}
            </ThemeText>
            {deliveryPartnerPhone && (
              <ThemeText style={[styles.partnerPhone, { color: getColor('subText') }]}>
                {deliveryPartnerPhone}
              </ThemeText>
            )}
          </View>
          {deliveryPartnerPhone && (
            <TouchableOpacity
              style={[styles.callButton, { backgroundColor: getColor('primary') }]}
              onPress={() => Linking.openURL(`tel:${deliveryPartnerPhone}`)}
              activeOpacity={0.8}
            >
              <Icon name="phone" size={16} color="#FFFFFF" />
              <ThemeText style={styles.callText}>Call</ThemeText>
            </TouchableOpacity>
          )}
        </View>
      )}

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

          return (
            <View key={step.key} style={styles.stepColumn}>
              <View style={styles.circleRow}>
                {/* Left half-line */}
                {index > 0 ? (
                  <View
                    style={[
                      styles.halfLine,
                      {
                        backgroundColor: leftLineGreen ? COMPLETED_COLOR : getColor('border'),
                      },
                    ]}
                  />
                ) : (
                  <View style={styles.halfLineSpacer} />
                )}

                {/* Circle */}
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

                {/* Right half-line */}
                {index < STEPS.length - 1 ? (
                  <View
                    style={[
                      styles.halfLine,
                      {
                        backgroundColor: rightLineGreen ? COMPLETED_COLOR : getColor('border'),
                      },
                    ]}
                  />
                ) : (
                  <View style={styles.halfLineSpacer} />
                )}
              </View>

              {/* Label */}
              <ThemeText
                style={[
                  styles.stepLabel,
                  {
                    color: labelColor,
                    fontFamily: labelFontFamily,
                  },
                ]}
                numberOfLines={2}
              >
                {step.label}
              </ThemeText>

              {/* Time for Order Placed */}
              {index === 0 && formattedOrderTime && (
                <ThemeText style={[styles.stepTime, { color: getColor('subText') }]}>
                  {formattedOrderTime}
                </ThemeText>
              )}
            </View>
          );
        })}
      </View>

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
      android: {
        elevation: 1,
      },
    }),
  },
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerLabel: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    marginBottom: 4,
  },
  partnerName: {
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
  partnerPhone: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    marginTop: 2,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
  },
  callText: {
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
    fontSize: 14,
  },
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

export default OrderProgress;
