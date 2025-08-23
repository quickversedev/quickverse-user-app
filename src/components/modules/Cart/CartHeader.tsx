import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/ThemeContext';

interface CartHeaderProps {
  onBack: () => void;
  onClearCart: () => void;
}

const CartHeader: React.FC<CartHeaderProps> = ({ onBack, onClearCart }) => {
  const { getColor, getTypography, theme } = useTheme();

  const styles = StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: 16,
    },
    headerBackBtn: { marginRight: 8 },
    headerTitle: {
      color: getColor('text'),
      fontWeight: 'bold',
      fontSize: getTypography('h2'),
      marginLeft: 8,
    },
    clearCartBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      // backgroundColor: '#F6285F',
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginLeft: 'auto',
    },
    clearCartText: {
      color: getColor('error'),
      marginLeft: 4,
      fontWeight: 'bold',
    },
  });

  const handleBackPress = useCallback(() => {
    onBack();
  }, [onBack]);

  const handleClearCartPress = useCallback(() => {
    onClearCart();
  }, [onClearCart]);

  return (
    <View style={styles.headerRow}>
      <TouchableOpacity onPress={handleBackPress} style={styles.headerBackBtn}>
        <MaterialCommunityIcons name="arrow-left" size={26} color={getColor('text')} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Cart</Text>
      <View style={{ flex: 1 }} />
      <TouchableOpacity style={styles.clearCartBtn} onPress={handleClearCartPress}>
        <MaterialCommunityIcons name="close-circle" size={22} color={getColor('error')} />
        <Text style={styles.clearCartText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CartHeader;
