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
  const { getColor } = useTheme();

  const styles = StyleSheet.create({
    quantitySelector: {
      position: 'absolute',
      right: 2,
      bottom: 2,
      borderWidth: 1,
      borderColor: getColor('primary'),
      borderRadius: size === 'xs' ? 10 : size === 'small' ? 12 : 14,
      minWidth: size === 'xs' ? 60 : size === 'small' ? 70 : 80,
      height: size === 'xs' ? 28 : size === 'small' ? 32 : 36,
      paddingHorizontal: 0,
      paddingVertical: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: getColor('card'),
      zIndex: 3,
      shadowColor: getColor('shadow').color,
      shadowOffset: getColor('shadow').offset,
      shadowOpacity: getColor('shadow').opacity,
      shadowRadius: getColor('shadow').radius,
      elevation: 2,
    },
    qtyBtn: {
      paddingHorizontal: size === 'xs' ? 1 : size === 'small' ? 2 : 4,
      paddingVertical: size === 'xs' ? 1 : size === 'small' ? 1 : 2,
    },
    qtyText: {
      color: getColor('primary'),
      fontWeight: 'bold',
      minWidth: size === 'xs' ? 10 : size === 'small' ? 12 : 15,
      textAlign: 'center',
    },
    qtyNum: {
      color: getColor('text'),
      marginHorizontal: size === 'xs' ? 1 : size === 'small' ? 2 : 4,
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
