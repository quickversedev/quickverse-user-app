import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

interface QuantitySelectorProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  size?: 'xs' | 'small' | 'regular';
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onIncrement,
  onDecrement,
  size = 'regular',
}) => {
  const { getColor, getTypography } = useTheme();

  const styles = StyleSheet.create({
    quantitySelector: {
      position: 'absolute',
      right: 2,
      bottom: 2,
      borderWidth: 1,
      borderColor: getColor('primary'),
      borderRadius:
        size === 'xs'
          ? getTypography('small') - 2
          : size === 'small'
          ? getTypography('small')
          : getTypography('caption'),
      minWidth: size === 'xs' ? 50 : size === 'small' ? 60 : 80,
      height: size === 'xs' ? 24 : size === 'small' ? 28 : 36,
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
      fontSize:
        size === 'xs'
          ? getTypography('small') - 2
          : size === 'small'
          ? getTypography('small')
          : getTypography('caption'),
      fontWeight: 'bold',
      minWidth: size === 'xs' ? 10 : size === 'small' ? 12 : 15,
      textAlign: 'center',
      fontFamily: 'BricolageGrotesque-Regular',
    },
    qtyNum: {
      color: getColor('text'),
      fontSize:
        size === 'xs'
          ? getTypography('small') - 2
          : size === 'small'
          ? getTypography('small')
          : getTypography('caption'),
      marginHorizontal: size === 'xs' ? 1 : size === 'small' ? 2 : 4,
      minWidth: size === 'xs' ? 12 : size === 'small' ? 14 : 18,
      textAlign: 'center',
      fontFamily: 'BricolageGrotesque-Regular',
    },
  });

  return (
    <View style={styles.quantitySelector}>
      <TouchableOpacity style={styles.qtyBtn} onPress={onDecrement}>
        <Text style={styles.qtyText}>-</Text>
      </TouchableOpacity>
      <Text style={styles.qtyNum}>{quantity}</Text>
      <TouchableOpacity style={styles.qtyBtn} onPress={onIncrement}>
        <Text style={styles.qtyText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

export default QuantitySelector;
