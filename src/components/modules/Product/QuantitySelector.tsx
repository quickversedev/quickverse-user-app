import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { ThemeText } from '../../common/theme/ThemeText';

interface QuantitySelectorProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  size?: 'xs' | 'small' | 'regular';
  disabled?: boolean;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onIncrement,
  onDecrement,
  size = 'regular',
  disabled = false,
}) => {
  const { getColor, theme } = useTheme();

  const styles = StyleSheet.create({
    quantitySelector: {
      position: 'absolute',
      right: 2,
      bottom: 2,
      borderWidth: 1.5,
      borderColor: getColor('primary'),
      borderRadius: theme.borderRadius.sm,
      minWidth: size === 'xs' ? 60 : size === 'small' ? 70 : 80,
      height: size === 'xs' ? 28 : size === 'small' ? 32 : 36,
      paddingHorizontal: 0,
      paddingVertical: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: getColor('card'),
      zIndex: 3,
      shadowColor: theme.colors.shadow.color,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.colors.shadow.opacity,
      shadowRadius: theme.colors.shadow.radius,
      elevation: 2,
    },
    qtyBtn: {
      minWidth: size === 'xs' ? 28 : size === 'small' ? 32 : 36,
      minHeight: size === 'xs' ? 28 : size === 'small' ? 32 : 36,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: size === 'xs' ? 2 : size === 'small' ? 4 : 6,
    },
    qtyText: {
      fontSize: size === 'xs' ? 14 : size === 'small' ? 16 : 18,
      color: getColor('primary'),
      fontWeight: '600',
      minWidth: size === 'xs' ? 10 : size === 'small' ? 16 : 15,
      textAlign: 'center',
    },
    qtyNum: {
      color: getColor('text'),
      fontWeight: '600',
      marginHorizontal: size === 'xs' ? 1 : size === 'small' ? 2 : 3,
      minWidth: size === 'xs' ? 12 : size === 'small' ? 14 : 18,
      textAlign: 'center',
    },
  });

  const getVariant = () => {
    if (size === 'xs') return 'small';
    if (size === 'small') return 'small';
    return 'caption';
  };

  return (
    <View style={styles.quantitySelector}>
      <TouchableOpacity style={styles.qtyBtn} onPress={onDecrement} disabled={disabled}>
        <ThemeText
          variant={getVariant()}
          style={[styles.qtyText, disabled && { opacity: 0.5 }]}
          color={getColor('primary')}
        >
          -
        </ThemeText>
      </TouchableOpacity>
      <ThemeText
        variant={getVariant()}
        style={[styles.qtyNum, disabled && { opacity: 0.5 }]}
        color={getColor('text')}
      >
        {quantity}
      </ThemeText>
      <TouchableOpacity style={styles.qtyBtn} onPress={onIncrement} disabled={disabled}>
        <ThemeText
          variant={getVariant()}
          style={[styles.qtyText, disabled && { opacity: 0.5 }]}
          color={getColor('primary')}
        >
          +
        </ThemeText>
      </TouchableOpacity>
    </View>
  );
};

export default QuantitySelector;
