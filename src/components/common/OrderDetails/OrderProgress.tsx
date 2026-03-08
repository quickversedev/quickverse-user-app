import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../../../theme/ThemeContext';
import type { Order } from '../../../types/order';

type OrderProgressProps = {
  status: Order['status'];
  orderCreationTime?: string | number;
  category?: string; // Add category prop
  preparationTime?: string; // e.g. "20 MIN" from vendor
};

const DELAY_MESSAGES = [
  { text: 'Finalizing your order...', icon: 'package-variant' },
  { text: 'Almost there!', icon: 'truck-fast' },
  { text: 'Just a moment...', icon: 'timer-sand' },
  { text: 'Preparing with care...', icon: 'chef-hat' },
  { text: 'On its way soon!', icon: 'map-marker-path' },
];

const STEPS = ['Order Placed', 'Accepted', 'Picked Up', 'Delivered'] as const;

const getActiveStepIndex = (status: Order['status']): number => {
  switch (status) {
    case 'payment_pending':
      return 0;
    case 'confirmed':
    case 'processing':
      return 1;
    case 'ready':
    case 'shipped':
      return 2;
    case 'delivered':
      return 3;
    case 'cancelled':
    default:
      return 0;
  }
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
}) => {
  const { theme } = useTheme();
  const activeIndex = getActiveStepIndex(status);

  // Determine delivery time based on preparationTime (e.g. "20 MIN", "45 mins"), otherwise fallback to category defaults
  let deliveryTimeMinutes = 20; // default

  if (preparationTime) {
    const parsedTime = parseInt(preparationTime.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(parsedTime) && parsedTime > 0) {
      deliveryTimeMinutes = parsedTime;
    }
  } else {
    // Fallback if no preparation time provided
    const isFood = category?.toLowerCase().includes('food');
    deliveryTimeMinutes = isFood ? 35 : 20;
  }

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [delayMessageIndex, setDelayMessageIndex] = useState(0);

  const isDelayed = elapsedSeconds >= deliveryTimeMinutes * 60;
  const remainingSeconds = Math.max(0, deliveryTimeMinutes * 60 - elapsedSeconds);
  const progressPercent = Math.min(100, (elapsedSeconds / (deliveryTimeMinutes * 60)) * 100);

  // Timer effect - updates every second
  useEffect(() => {
    if (!orderCreationTime || status === 'delivered' || status === 'cancelled') return;

    const creationMs =
      typeof orderCreationTime === 'string'
        ? new Date(orderCreationTime).getTime()
        : orderCreationTime;

    // Set initial elapsed time
    const initialElapsed = Math.floor((Date.now() - creationMs) / 1000);
    setElapsedSeconds(Math.max(0, initialElapsed));

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - creationMs) / 1000);
      setElapsedSeconds(Math.max(0, elapsed));
    }, 1000);

    return () => clearInterval(interval);
  }, [orderCreationTime, status]);

  // Delay message rotation - every 5 seconds
  useEffect(() => {
    if (!isDelayed) return;

    const interval = setInterval(() => {
      setDelayMessageIndex(prev => (prev + 1) % DELAY_MESSAGES.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isDelayed]);

  const currentDelayMessage = DELAY_MESSAGES[delayMessageIndex];

  return (
    <View style={styles.container}>
      {/* Timer Section */}
      {orderCreationTime && status !== 'delivered' && status !== 'cancelled' && (
        <>
          {!isDelayed ? (
            <View
              style={[
                styles.timerContainer,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              ]}
            >
              <View style={styles.timerRow}>
                <Icon name="clock-outline" size={20} color={theme.colors.secondary} />
                <Text style={[styles.timerText, { color: theme.colors.text }]}>
                  Estimated delivery in {formatTime(remainingSeconds)}
                </Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: theme.colors.overlay }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: theme.colors.secondary, width: `${progressPercent}%` },
                  ]}
                />
              </View>
            </View>
          ) : (
            <View style={styles.delayContainer}>
              <Icon
                name={currentDelayMessage.icon}
                size={32}
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

      {/* Progress Steps */}
      <View style={styles.stepsWrapper}>
        {/* Connector Line Background */}
        <View style={styles.connectorRow}>
          {STEPS.slice(0, -1).map((_, index) => {
            const isActiveOrDone = index + 1 <= activeIndex;
            return (
              <View
                key={index}
                style={[
                  styles.connector,
                  {
                    borderColor: isActiveOrDone ? theme.colors.secondary : theme.colors.border,
                  },
                ]}
              />
            );
          })}
        </View>
        {/* Circles and Labels */}
        <View style={styles.stepsRow}>
          {STEPS.map((label, index) => {
            const isActiveOrDone = index <= activeIndex;
            return (
              <View key={label} style={styles.stepContainer}>
                <View
                  style={[
                    styles.circle,
                    {
                      backgroundColor: isActiveOrDone
                        ? theme.colors.secondary
                        : theme.colors.overlay,
                      borderColor: isActiveOrDone ? theme.colors.secondary : theme.colors.border,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.label,
                    { color: isActiveOrDone ? theme.colors.text : theme.colors.subText },
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  stepsWrapper: {
    position: 'relative',
    marginHorizontal: 16,
    marginVertical: 16,
  },
  connectorRow: {
    position: 'absolute',
    top: 9,
    left: '12.5%',
    right: '12.5%',
    flexDirection: 'row',
  },
  stepsRow: {
    flexDirection: 'row',
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
  },
  circle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  connector: {
    flex: 1,
    height: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
  },
  label: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  timerContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timerText: {
    fontSize: 16,
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  delayIcon: {
    marginBottom: 8,
  },
  delayText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: '#856404',
  },
  delaySubtext: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default OrderProgress;
