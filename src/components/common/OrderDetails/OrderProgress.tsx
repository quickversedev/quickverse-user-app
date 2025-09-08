import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import type { Order } from '../../../types/order';

type OrderProgressProps = {
  status: Order['status'];
};

const STEPS = ['Order Placed', 'Accepted', 'Picked Up', 'Delivered'] as const;

const getActiveStepIndex = (status: Order['status']): number => {
  switch (status) {
    case 'pending':
      return 0;
    case 'confirmed':
    case 'preparing':
      return 1;
    case 'ready':
      return 2;
    case 'delivered':
      return 3;
    case 'cancelled':
    default:
      return 0;
  }
};

const OrderProgress: React.FC<OrderProgressProps> = ({ status }) => {
  const { theme } = useTheme();
  const activeIndex = getActiveStepIndex(status);

  return (
    <View style={styles.wrapper}>
      {STEPS.map((label, index) => {
        const isActiveOrDone = index <= activeIndex;
        const isLast = index === STEPS.length - 1;
        return (
          <View key={label} style={styles.stepContainer}>
            <View style={styles.row}>
              <View
                style={[
                  styles.circle,
                  {
                    backgroundColor: isActiveOrDone ? theme.colors.secondary : theme.colors.overlay,
                    borderColor: isActiveOrDone ? theme.colors.secondary : theme.colors.border,
                  },
                ]}
              />
              {!isLast && (
                <View
                  style={[
                    styles.connector,
                    {
                      borderColor: isActiveOrDone ? theme.colors.secondary : theme.colors.border,
                    },
                  ]}
                />
              )}
            </View>
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
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
  },
  row: {
    width: '100%',
    flexDirection: 'row',
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
    marginHorizontal: 8,
  },
  label: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
});

export default OrderProgress;
