import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../../contexts/login/AuthProvider';
import { useTheme } from '../../../theme/ThemeContext';
import { triggerAddToCartHaptic, triggerErrorHaptic } from '../../../utils/haptics';
import LoginPromptModal from '../../common/LoginPromptModal';
import { ThemeText } from '../../common/theme/ThemeText';

interface AddButtonProps {
  onPress: () => void;
  size?: 'xs' | 'small' | 'regular';
  numberOfVariants?: number;
  showVariantsCount?: boolean;
  disabled?: boolean;
}

const AddButton: React.FC<AddButtonProps> = ({
  onPress,
  size = 'regular',
  numberOfVariants = 1,
  showVariantsCount = false,
  disabled = false,
}) => {
  const { getColor, getTypography, theme } = useTheme();
  const { authData } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const hasMultipleVariants = numberOfVariants > 1;
  const shouldShowBadge = (size === 'small' || size === 'xs') && hasMultipleVariants;
  const shouldShowVariantsCount = size === 'regular' && showVariantsCount && hasMultipleVariants;

  const handleSafePress = () => {
    if (disabled) {
      return;
    }
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
      minWidth: size === 'xs' ? 45 : size === 'small' ? 40 : 60,
      height: size === 'xs' ? 28 : size === 'small' ? 32 : 36,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: getColor('card'),
      zIndex: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    addButtonWithVariants: {
      flexDirection: 'column',
    },
    addButtonText: {
      color: getColor('primary'),
      marginLeft: 4,
    },
    addButtonTextWithVariants: {
      marginLeft: 0,
      // marginBottom: 2,
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
        <TouchableOpacity style={styles.addButton} onPress={handleSafePress}>
          <MaterialCommunityIcons name="plus" size={20} color={getColor('primary')} />
          <View style={styles.badge}>
            <ThemeText variant="small" color={getColor('white')} style={styles.badgeText}>
              {numberOfVariants}
            </ThemeText>
          </View>
        </TouchableOpacity>

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
          <ThemeText
            variant="caption"
            color={getColor('primary')}
            style={[styles.addButtonText, styles.addButtonTextWithVariants]}
          >
            ADD
          </ThemeText>
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
          <ThemeText variant="caption" color={getColor('primary')} style={styles.addButtonText}>
            ADD +
          </ThemeText>
        )}
      </TouchableOpacity>

      {renderLoginModal()}
    </>
  );
};

export default AddButton;
