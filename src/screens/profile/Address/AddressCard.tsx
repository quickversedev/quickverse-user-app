import React from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Icons } from '../../../assets';
import { useTheme } from '../../../theme/ThemeContext';
import { Address } from '../../../types/address';
import { getAddressDisplayName, getAddressTag, getConcatenatedAddress } from './utils/addressUtils';

type AddressCardSize = 'regular' | 'small';

interface AddressCardProps {
  address: Address;
  size?: AddressCardSize;
  onPress?: () => void;
  isSelected?: boolean;
  onLongPress?: () => void;
}

const AddressCard = ({ address, size = 'regular', onPress, isSelected, onLongPress }: AddressCardProps) => {
  const { getColor, getTypography, theme } = useTheme();

  const themedStyles = StyleSheet.create({
    card: {
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      padding: size === 'small' ? 12 : 20,
      marginBottom: 12,
      minHeight: size === 'small' ? 70 : 140,
      ...Platform.select({
        android: {
          elevation: size === 'small' ? 2 : 8,
        },
        ios: {
          shadowColor: theme.colors.shadow.color,
          shadowOffset: size === 'small' ? { width: 0, height: 1 } : theme.colors.shadow.offset,
          shadowOpacity: size === 'small' ? 0.1 : theme.colors.shadow.opacity,
          shadowRadius: size === 'small' ? 2 : theme.colors.shadow.radius,
        },
      }),
    },
    // Regular size styles
    header: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    addressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    houseIcon: {
      width: size === 'small' ? 40 : 44,
      height: size === 'small' ? 40 : 44,
      borderRadius: theme.borderRadius.full,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: size === 'small' ? 12 : 12,
      backgroundColor: getColor('primary'),
    },
    addressType: {
      color: getColor('text'),
      fontSize: size === 'small' ? getTypography('body') : getTypography('subtitle'),
      fontWeight: size === 'small' ? '600' : 'bold',
      includeFontPadding: false,
    },
    nameSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    personIcon: {
      width: 16,
      height: 16,
      borderRadius: theme.borderRadius.full,
      justifyContent: 'center',
      alignItems: 'center',
    },
    name: {
      color: getColor('subText'),
      fontSize: getTypography('body'),
      fontWeight: '500',
      includeFontPadding: false,
      lineHeight: getTypography('body') * 1.2,
    },
    address: {
      color: getColor('subText'),
      fontSize: getTypography('body'),
      lineHeight: getTypography('body') * 1.4,
      includeFontPadding: false,
      flexShrink: 1,
      marginBottom: 20,
      width: '100%',
    },
    addressSection: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      width: '95%',
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 8,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    editText: {
      fontSize: getTypography('body'),
      fontWeight: '600',
      color: getColor('primary'),
      includeFontPadding: false,
    },
    deleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    deleteText: {
      fontSize: getTypography('body'),
      fontWeight: '600',
      color: getColor('error'),
      includeFontPadding: false,
      marginRight: 8,
    },
    deleteIcon: {
      width: 20,
      height: 20,
      backgroundColor: getColor('error'),
      borderRadius: theme.borderRadius.full,
      justifyContent: 'center',
      alignItems: 'center',
    },
    deleteIconText: {
      fontSize: 12,
      color: getColor('white'),
      fontWeight: 'bold',
    },
    // Small size styles
    smallCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    smallContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    smallAddress: {
      color: getColor('subText'),
      fontSize: getTypography('caption'),
      lineHeight: getTypography('caption') * 1.3,
      includeFontPadding: false,
      flexShrink: 1,
      marginTop: 2,
    },
    checkmarkIcon: {
      width: 24,
      height: 24,
      backgroundColor: getColor('primary'),
      borderRadius: theme.borderRadius.full,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkmarkText: {
      fontSize: 14,
      color: getColor('white'),
      fontWeight: 'bold',
    },
    // Radio button styles
    radioOuter: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: getColor('subText'),
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 12,
    },
    radioOuterSelected: {
      borderColor: getColor('primary'),
      backgroundColor: getColor('primary'),
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: getColor('card'),
    },
    // Small card action buttons
    smallActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    smallEditButton: {
      padding: 4,
    },
    smallEditText: {
      fontSize: getTypography('caption'),
      color: getColor('primary'),
      fontWeight: '600',
    },
  });

  // const handleEdit = () => {
  //   // TODO: Implement edit functionality
  // };

  // const handleDelete = () => {
  //   // TODO: Implement delete functionality
  // };

  // Small size variant
  if (size === 'small') {
    return (
      <TouchableOpacity
        style={themedStyles.card}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={500}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Address card for ${getAddressTag(address)}. Long press to edit.`}
        accessibilityHint="Double tap to select, long press to edit"
        activeOpacity={0.7}
      >
        <View style={themedStyles.smallCard}>
          <View style={themedStyles.smallContent}>
            <View style={themedStyles.houseIcon}>
              <MaterialCommunityIcons name="home-outline" size={24} color={getColor('background')} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={themedStyles.addressType}
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel={`Address type: ${getAddressTag(address)}`}
              >
                {getAddressTag(address)}
              </Text>
              <Text
                style={themedStyles.smallAddress}
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel={`Address: ${getConcatenatedAddress(address)}`}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {getConcatenatedAddress(address)}
              </Text>
            </View>
          </View>
          {/* Radio button on right */}
          <View style={[themedStyles.radioOuter, isSelected && themedStyles.radioOuterSelected]}>
            {isSelected && <View style={themedStyles.radioInner} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Regular size variant
  return (
    <View
      style={themedStyles.card}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Address card for ${getAddressDisplayName(address)}`}
      accessibilityHint="Double tap to edit this address"
    >
      <View style={themedStyles.addressContainer}>
        <View style={themedStyles.houseIcon}>
          <Image source={Icons.home} />
        </View>
        <View>
          <View style={themedStyles.header}>
            <Text
              style={themedStyles.addressType}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={`Address type: ${getAddressTag(address)}`}
            >
              {getAddressTag(address)}
            </Text>
          </View>

          <View style={themedStyles.nameSection}>
            <View style={themedStyles.personIcon}>
              <Image source={Icons.man} />
            </View>
            <Text
              style={themedStyles.name}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={`Name: ${getAddressDisplayName(address)}`}
            >
              {getAddressDisplayName(address)}
            </Text>
          </View>

          <View style={themedStyles.addressSection}>
            <Text
              style={themedStyles.address}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={`Address: ${getConcatenatedAddress(address)}`}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {getConcatenatedAddress(address)}
            </Text>
          </View>
        </View>
      </View>
      {/* <View style={themedStyles.actions}>
        <TouchableOpacity
          style={themedStyles.editButton}
          onPress={handleEdit}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Edit address"
          accessibilityHint="Opens the edit address form"
          activeOpacity={0.7}
        >
          <Text style={themedStyles.editText}>Edit Address {'>'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={themedStyles.deleteButton}
          onPress={handleDelete}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Delete address"
          accessibilityHint="Removes this address from your saved addresses"
          activeOpacity={0.7}
        >
          <Text style={themedStyles.deleteText}>Delete Address</Text>
          <View style={themedStyles.deleteIcon}>
            <Text style={themedStyles.deleteIconText}>✕</Text>
          </View>
        </TouchableOpacity>
      </View> */}
    </View>
  );
};

export default AddressCard;
