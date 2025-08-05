import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/ThemeContext';

interface AddButtonProps {
  onPress: () => void;
  size?: 'extra-small' | 'small' | 'regular';
  numberOfVariants?: number;
  showVariantsCount?: boolean;
}

const AddButton: React.FC<AddButtonProps> = ({
  onPress,
  size = 'regular',
  numberOfVariants = 1,
  showVariantsCount = false,
}) => {
  const { getColor, getTypography } = useTheme();

  const hasMultipleVariants = numberOfVariants > 1;
  const shouldShowBadge = (size === 'small' || size === 'extra-small') && hasMultipleVariants;
  const shouldShowVariantsCount = size === 'regular' && showVariantsCount && hasMultipleVariants;

  const styles = StyleSheet.create({
    addButton: {
      position: 'absolute',
      right: 2,
      bottom: 2,
      borderWidth: 1,
      borderColor: getColor('primary'),
      borderRadius:
        size === 'extra-small'
          ? getTypography('small') - 2
          : size === 'small'
          ? getTypography('small')
          : getTypography('caption'),
      minWidth: size === 'extra-small' ? 40 : size === 'small' ? 50 : 70,
      height: size === 'extra-small' ? 24 : size === 'small' ? 28 : 36,
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
    addButtonWithVariants: {
      flexDirection: 'column',
      // height: size === 'small' ? 40 : 48,
      // minWidth: size === 'small' ? 60 : 80,
      // paddingVertical: 4,
    },
    addButtonText: {
      color: getColor('primary'),
      fontWeight: 'bold',
      fontSize:
        size === 'extra-small'
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
        size === 'extra-small'
          ? getTypography('small') - 5
          : size === 'small'
          ? getTypography('small') - 3
          : getTypography('small'),
    },
    variantsText: {
      color: getColor('subText'),
      fontSize:
        size === 'extra-small'
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

  // Small button with variants - show badge
  if (shouldShowBadge) {
    return (
      <View style={{ position: 'relative' }}>
        <TouchableOpacity style={styles.addButton} onPress={onPress}>
          <MaterialCommunityIcons name="plus" size={20} color={getColor('primary')} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{numberOfVariants}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  // Regular button with variants - show "X OPTIONS"
  if (shouldShowVariantsCount) {
    return (
      <TouchableOpacity style={[styles.addButton, styles.addButtonWithVariants]} onPress={onPress}>
        <Text style={[styles.addButtonText, styles.addButtonTextWithVariants]}>ADD</Text>
        <View style={styles.divider} />
        <Text style={styles.variantsText}>{numberOfVariants} OPTIONS</Text>
      </TouchableOpacity>
    );
  }

  // Default buttons (no variants or single variant)
  return (
    <TouchableOpacity style={styles.addButton} onPress={onPress}>
      {size === 'small' ? (
        <MaterialCommunityIcons name="plus" size={20} color={getColor('primary')} />
      ) : (
        <Text style={styles.addButtonText}>ADD +</Text>
      )}
    </TouchableOpacity>
  );
};

export default AddButton;
