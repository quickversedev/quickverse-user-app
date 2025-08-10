import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../../contexts/login/AuthProvider';
import { useTheme } from '../../../theme/ThemeContext';
import { triggerAddToCartHaptic, triggerErrorHaptic } from '../../../utils/haptics';
import LoginPromptModal from '../../common/LoginPromptModal';

interface AddButtonProps {
  onPress: () => void;
  size?: 'xs' | 'small' | 'regular';
  numberOfVariants?: number;
  showVariantsCount?: boolean;
}

const AddButton: React.FC<AddButtonProps> = ({
  onPress,
  size = 'regular',
  numberOfVariants = 1,
  showVariantsCount = false,
}) => {
  const { getColor, getTypography, theme } = useTheme();
  const { authData } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const hasMultipleVariants = numberOfVariants > 1;
  const shouldShowBadge = (size === 'small' || size === 'xs') && hasMultipleVariants;
  const shouldShowVariantsCount = size === 'regular' && showVariantsCount && hasMultipleVariants;

  const handleSafePress = () => {
    if (authData?.jwt) {
      // Haptic feedback for successful add intent
      triggerAddToCartHaptic();
      onPress();
    } else {
      // Haptic feedback for blocked action
      triggerErrorHaptic();
      setShowLoginModal(true);
    }
  };

  const styles = StyleSheet.create({
    addButton: {
      position: 'absolute',
      right: 2,
      bottom: 2,
      borderWidth: 1,
      borderColor: getColor('primary'),
      borderRadius: theme.borderRadius.sm,
      minWidth: size === 'xs' ? 40 : size === 'small' ? 40 : 60,
      height: size === 'xs' ? 24 : size === 'small' ? 28 : 36,

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
    addButtonWithVariants: {
      flexDirection: 'column',
    },
    addButtonText: {
      color: getColor('primary'),
      fontWeight: 'bold',
      fontSize:
        size === 'xs'
          ? getTypography('small') - 2
          : size === 'small'
          ? getTypography('small')
          : getTypography('caption'),
      marginLeft: 4,
      fontFamily: 'BricolageGrotesque-Regular',
    },
    addButtonTextWithVariants: {
      marginLeft: 0,
      // marginBottom: 2,
      fontSize:
        size === 'xs'
          ? getTypography('small') - 5
          : size === 'small'
          ? getTypography('small') - 3
          : getTypography('small'),
    },
    variantsText: {
      color: getColor('subText'),
      fontSize:
        size === 'xs'
          ? getTypography('small') - 8
          : size === 'small'
          ? getTypography('small') - 6
          : getTypography('small') - 5,
      fontWeight: '500',
      fontFamily: 'BricolageGrotesque-Regular',
      textAlign: 'center',
    },
    divider: {
      width: '80%',
      height: 1,
      backgroundColor: getColor('primary'),
      marginVertical: 2,
    },
    badge: {
      position: 'absolute',
      top: -8,
      right: -5,
      backgroundColor: getColor('error'),
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 4,
      borderWidth: 2,
      borderColor: getColor('card'),
    },
    badgeText: {
      color: getColor('white'),
      fontSize: getTypography('small') - 4,
      fontWeight: 'bold',
      fontFamily: 'BricolageGrotesque-Regular',
    },
  });

  const renderLoginModal = () => (
    <LoginPromptModal
      visible={showLoginModal}
      onClose={() => setShowLoginModal(false)}
      title="Login required"
      message="Please log in to add items to your cart."
    />
  );

  // Small button with variants - show badge
  if (shouldShowBadge) {
    return (
      <>
        <View style={{ position: 'relative' }}>
          <TouchableOpacity style={styles.addButton} onPress={handleSafePress}>
            <MaterialCommunityIcons name="plus" size={20} color={getColor('primary')} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{numberOfVariants}</Text>
            </View>
          </TouchableOpacity>
        </View>
        {renderLoginModal()}
      </>
    );
  }

  // Regular button with variants - show "X OPTIONS"
  if (shouldShowVariantsCount) {
    return (
      <>
        <TouchableOpacity
          style={[styles.addButton, styles.addButtonWithVariants]}
          onPress={handleSafePress}
        >
          <Text style={[styles.addButtonText, styles.addButtonTextWithVariants]}>ADD</Text>
          <View style={styles.divider} />
          <Text style={styles.variantsText}>{numberOfVariants} OPTIONS</Text>
        </TouchableOpacity>
        {renderLoginModal()}
      </>
    );
  }

  // Default buttons (no variants or single variant)
  return (
    <>
      <TouchableOpacity style={styles.addButton} onPress={handleSafePress}>
        {size === 'xs' || size === 'small' ? (
          <MaterialCommunityIcons name="plus" size={20} color={getColor('primary')} />
        ) : (
          <Text style={styles.addButtonText}>ADD +</Text>
        )}
      </TouchableOpacity>

      {renderLoginModal()}
    </>
  );
};

export default AddButton;
