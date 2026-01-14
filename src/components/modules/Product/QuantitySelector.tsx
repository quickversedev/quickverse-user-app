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
      minWidth: size === 'xs' ? 56 : size === 'small' ? 64 : 72,
      height: size === 'xs' ? 26 : size === 'small' ? 30 : 34,
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
      minWidth: size === 'xs' ? 24 : size === 'small' ? 28 : 32,
      minHeight: size === 'xs' ? 26 : size === 'small' ? 30 : 34,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: size === 'xs' ? 2 : size === 'small' ? 3 : 4,
    },
    qtyText: {
      fontSize: size === 'xs' ? 16 : size === 'small' ? 18 : 20,
      color: getColor('primary'),
      fontWeight: '600',
      textAlign: 'center',
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    qtyNum: {
      color: getColor('text'),
      fontWeight: '600',
      marginHorizontal: size === 'xs' ? 2 : size === 'small' ? 4 : 6,
      minWidth: size === 'xs' ? 14 : size === 'small' ? 16 : 20,
      textAlign: 'center',
      includeFontPadding: false,
      textAlignVertical: 'center',
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
