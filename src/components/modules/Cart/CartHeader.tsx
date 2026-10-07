import React, { useCallback, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { CATALOGUE_GUTTER } from '../../../constants/catalogue';
import { useTheme } from '../../../theme/ThemeContext';
import { ThemeText } from '../../common/theme/ThemeText';

interface CartHeaderProps {
  onBack: () => void;
  onClearCart: () => void;
  /** Total units in the cart; drives the design's count pill beside the title. */
  itemCount?: number;
  title?: string;
}

const CartHeader: React.FC<CartHeaderProps> = ({
  onBack,
  onClearCart,
  itemCount = 0,
  title = 'Your Cart',
}) => {
  const { getColor, getTypography, theme } = useTheme();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const styles = StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: CATALOGUE_GUTTER,
      paddingTop: 12,
      paddingBottom: 4,
    },
    // Title and count travel together and own the free space, so the title is never
    // squeezed by a sibling — a flex spacer beside it clipped "Your Cart" to "Your".
    titleGroup: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerBackBtn: { marginRight: 8 },
    headerTitle: {
      color: getColor('text'),
      fontWeight: '800',
      fontSize: 20,
      lineHeight: 26,
      marginLeft: 4,
      // Never let a sibling squeeze this below its own width: at flexShrink 1 the
      // row compressed it until "Your Cart" wrapped and rendered as "Your".
      flexShrink: 0,
    },
    // "3 Items" beside the title, as the design has it.
    countPill: {
      marginLeft: 8,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
      backgroundColor: getColor('overlay'),
    },
    countText: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '700',
      color: getColor('subText'),
    },
    clearCartBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 8,
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
        <View style={styles.titleGroup}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          {itemCount > 0 ? (
            <View style={styles.countPill}>
              <ThemeText style={styles.countText}>
                {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
              </ThemeText>
            </View>
          ) : null}
        </View>
        <TouchableOpacity style={styles.clearCartBtn} onPress={handleClearCartPress}>
          <MaterialCommunityIcons name="delete-sweep" size={18} color={getColor('error')} />
          <Text style={styles.clearCartText}>Clear</Text>
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
