import React, { useCallback, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { ThemeText } from '../../common/theme/ThemeText';

interface CartHeaderProps {
  onBack: () => void;
  onClearCart: () => void;
}

const CartHeader: React.FC<CartHeaderProps> = ({ onBack, onClearCart }) => {
  const { getColor, getTypography, theme } = useTheme();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.sm,
      padding: 24,
      margin: 20,
      minWidth: 280,
    },
    modalTitle: {
      marginBottom: 16,
    },
    modalMessage: {
      marginBottom: 24,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: theme.borderRadius.sm,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: getColor('border'),
      marginRight: 8,
    },
    confirmButton: {
      backgroundColor: getColor('error'),
      marginLeft: 8,
    },
  });

  const handleBackPress = useCallback(() => {
    onBack();
  }, [onBack]);

  const handleClearCartPress = useCallback(() => {
    setShowConfirmModal(true);
  }, []);

  const handleConfirmClear = useCallback(() => {
    setShowConfirmModal(false);
    onClearCart();
  }, [onClearCart]);

  const handleCancelClear = useCallback(() => {
    setShowConfirmModal(false);
  }, []);

  return (
    <>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleBackPress} style={styles.headerBackBtn}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={getColor('text')} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.clearCartBtn} onPress={handleClearCartPress}>
          <MaterialCommunityIcons name="close-circle" size={22} color={getColor('error')} />
          <Text style={styles.clearCartText}>Clear Cart</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelClear}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemeText variant="h2" color={getColor('text')} style={styles.modalTitle}>
              Clear Cart
            </ThemeText>
            <ThemeText variant="body" color={getColor('subText')} style={styles.modalMessage}>
              Are you sure you want to clear your cart?
            </ThemeText>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelClear}
              >
                <ThemeText variant="body" color={getColor('text')}>
                  Cancel
                </ThemeText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirmClear}
              >
                <ThemeText variant="body" color={getColor('white')}>
                  Clear Cart
                </ThemeText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default CartHeader;
