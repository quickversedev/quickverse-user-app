import Icon from '@react-native-vector-icons/material-design-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import type { Order } from '../../../types/order';

type OrderProgressProps = {
  status: Order['status'];
  orderCreationTime?: string | number;
  category?: string;
  preparationTime?: string;
  orderMasterStatus?: string;
  orderDate?: string;
};

const DELAY_MESSAGES = [
  { text: 'Finalizing your order...', icon: 'package-variant' },
  { text: 'Almost there!', icon: 'truck-fast' },
  { text: 'Just a moment...', icon: 'timer-sand' },
  { text: 'Preparing with care...', icon: 'chef-hat' },
  { text: 'On its way soon!', icon: 'map-marker-path' },
];

const STEPS = [
  { key: 'placed', label: 'Order Placed', icon: 'package-variant-closed' },
  { key: 'accepted', label: 'Accepted', icon: 'check-circle-outline' },
  { key: 'shipping', label: 'Shipping', icon: 'truck-delivery-outline' },
  { key: 'delivered', label: 'Delivered', icon: 'check-decagram' },
] as const;

const getActiveStepIndex = (status: Order['status']): number => {
  switch (status) {
    case 'payment_pending':
    case 'processing':
      return 0;
    case 'confirmed':
      return 1;
    case 'ready':
    case 'shipped':
    case 'shipping':
      return 2;
    case 'delivered':
      return 3;
    case 'cancelled':
    default:
      return -1;
  }
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const PulsingRing: React.FC<{ color: string }> = ({ color }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.8,
            duration: 800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.6,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [scaleAnim, opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.pulsingRing,
        {
          borderColor: color,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    />
  );
};

const STATUS_COLORS: Record<string, string> = {
  processing: '#FF9800',
  payment_pending: '#FF9800',
  confirmed: '#2196F3',
  ready: '#00BCD4',
  shipping: '#7E57C2',
  delivered: '#4CAF50',
  cancelled: '#F44336',
};

const OrderProgress: React.FC<OrderProgressProps> = ({
  status,
  orderCreationTime,
  category,
  preparationTime,
  orderMasterStatus,
  orderDate,
}) => {
  const { theme, getColor } = useTheme();
  const activeIndex = getActiveStepIndex(status);
  const isCancelled = status === 'cancelled';
  const isDelivered = status === 'delivered';
  const isTerminal = isCancelled || isDelivered;

  let deliveryTimeMinutes = 20;
  if (preparationTime) {
    const parsedTime = parseInt(preparationTime.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(parsedTime) && parsedTime > 0) {
      deliveryTimeMinutes = parsedTime;
    }
  } else {
    const isFood = category?.toLowerCase().includes('food');
    deliveryTimeMinutes = isFood ? 35 : 20;
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

    const initialElapsed = Math.floor((Date.now() - creationMs) / 1000);
    setElapsedSeconds(Math.max(0, initialElapsed));

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - creationMs) / 1000);
      setElapsedSeconds(Math.max(0, elapsed));
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

  const currentDelayMessage = DELAY_MESSAGES[delayMessageIndex];
  const activeColor = STATUS_COLORS[status] || theme.colors.secondary;

  const formattedOrderTime = orderDate
    ? new Date(orderDate).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : undefined;

  return (
    <View style={[styles.container, { backgroundColor: getColor('card') }]}>
      {/* Vertical Timeline */}
      <View style={styles.timeline}>
        {STEPS.map((step, index) => {
          const isCompleted = !isCancelled && index < activeIndex;
          const isActive = !isCancelled && index === activeIndex;
          const isFuture = isCancelled || index > activeIndex;

          const circleColor = isCompleted
            ? theme.colors.secondary
            : isActive
              ? activeColor
              : theme.colors.border;

          const labelColor = isCompleted || isActive ? getColor('text') : getColor('subText');
          const isLastStep = index === STEPS.length - 1;

          return (
            <View key={step.key} style={styles.stepRow}>
              {/* Left column: circle + connector */}
              <View style={styles.leftColumn}>
                <View style={styles.circleWrapper}>
                  {isActive && <PulsingRing color={activeColor} />}
                  <View
                    style={[
                      styles.circle,
                      isActive && styles.circleActive,
                      {
                        backgroundColor: isFuture ? 'transparent' : circleColor,
                        borderColor: circleColor,
                      },
                    ]}
                  >
                    {isCompleted && (
                      <Icon name="check" size={10} color="#FFFFFF" />
                    )}
                    {isActive && (
                      <View style={[styles.innerDot, { backgroundColor: '#FFFFFF' }]} />
                    )}
                  </View>
                </View>
                {!isLastStep && (
                  <View
                    style={[
                      styles.connector,
                      {
                        borderColor: isCompleted ? theme.colors.secondary : theme.colors.border,
                        borderStyle: isCompleted ? 'solid' : 'dashed',
                      },
                    ]}
                  />
                )}
              </View>

              {/* Right column: label + sub-text */}
              <View style={[styles.rightColumn, isLastStep && styles.lastStepRight]}>
                <View style={styles.labelRow}>
                  <Text
                    style={[
                      styles.stepLabel,
                      {
                        color: labelColor,
                        fontWeight: isActive || isCompleted ? '600' : '400',
                      },
                    ]}
                  >
                    {step.label}
                  </Text>
                  {index === 0 && formattedOrderTime && (
                    <Text style={[styles.timeText, { color: getColor('subText') }]}>
                      {formattedOrderTime}
                    </Text>
                  )}
                </View>
                {isActive && orderMasterStatus && (
                  <Text style={[styles.masterStatusText, { color: activeColor }]}>
                    {orderMasterStatus.replace(/_/g, ' ')}
                  </Text>
                )}
              </View>
            </View>
          );
        })}

        {/* Cancelled step — appended after the last reached step */}
        {isCancelled && (
          <View style={styles.stepRow}>
            <View style={styles.leftColumn}>
              <View style={styles.circleWrapper}>
                <View
                  style={[
                    styles.circle,
                    styles.circleActive,
                    { backgroundColor: '#F44336', borderColor: '#F44336' },
                  ]}
                >
                  <Icon name="close" size={10} color="#FFFFFF" />
                </View>
              </View>
            </View>
            <View style={[styles.rightColumn, styles.lastStepRight]}>
              <View style={styles.labelRow}>
                <Text style={[styles.stepLabel, { color: '#F44336', fontWeight: '600' }]}>
                  Cancelled
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Timer Section — only for active (non-terminal) orders */}
      {orderCreationTime && !isTerminal && (
        <>
          {!isDelayed ? (
            <View
              style={[
                styles.timerContainer,
                { backgroundColor: getColor('background'), borderColor: theme.colors.border },
              ]}
            >
              <View style={styles.timerRow}>
                <Icon name="clock-outline" size={18} color={activeColor} />
                <Text style={[styles.timerText, { color: getColor('text') }]}>
                  Estimated delivery in {formatTime(remainingSeconds)}
                </Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: theme.colors.overlay }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: activeColor, width: `${progressPercent}%` },
                  ]}
                />
              </View>
            </View>
          ) : (
            <View style={styles.delayContainer}>
              <Icon
                name={currentDelayMessage.icon}
                size={28}
                color="#856404"
                style={styles.delayIcon}
              />
              <Text style={styles.delayText}>{currentDelayMessage.text}</Text>
              <Text style={styles.delaySubtext}>Your order is taking a bit longer</Text>
              <Text style={styles.delaySubtext}>Thank you for your patience</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  timeline: {
    paddingLeft: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  leftColumn: {
    width: 32,
    alignItems: 'center',
  },
  circleWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  circleActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2.5,
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pulsingRing: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
  connector: {
    flex: 1,
    minHeight: 28,
    borderLeftWidth: 2,
    marginLeft: 0,
  },
  rightColumn: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 28,
    justifyContent: 'center',
    minHeight: 24,
  },
  lastStepRight: {
    paddingBottom: 0,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 24,
  },
  stepLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  timeText: {
    fontSize: 12,
    marginLeft: 8,
  },
  masterStatusText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  timerContainer: {
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
    fontSize: 14,
    fontWeight: '600',
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
  delayContainer: {
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
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    color: '#856404',
  },
  delaySubtext: {
    fontSize: 13,
    color: '#856404',
    textAlign: 'center',
    marginTop: 2,
  },
});

export default OrderProgress;
