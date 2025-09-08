import React from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
}

const AddressCard = ({ address, size = 'regular', onPress, isSelected }: AddressCardProps) => {
  const { getColor, getTypography, theme } = useTheme();

  const themedStyles = StyleSheet.create({
    card: {
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      padding: size === 'small' ? 16 : 20,
      marginBottom: 16,
      minHeight: size === 'small' ? 80 : 140,
      ...Platform.select({
        android: {
          elevation: 8,
        },
        ios: {
          shadowColor: theme.colors.shadow.color,
          shadowOffset: theme.colors.shadow.offset,
          shadowOpacity: theme.colors.shadow.opacity,
          shadowRadius: theme.colors.shadow.radius,
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
      width: size === 'small' ? 20 : 24,
      height: size === 'small' ? 20 : 24,
      borderRadius: theme.borderRadius.full,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: size === 'small' ? 8 : 12,
    },
    addressType: {
      color: getColor('text'),
      fontSize: size === 'small' ? getTypography('body') : getTypography('subtitle'),
      fontWeight: 'bold',
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
      fontSize: getTypography('body'),
      lineHeight: getTypography('body') * 1.4,
      includeFontPadding: false,
      flexShrink: 1,
      marginTop: 4,
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
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Address card for ${getAddressTag(address)}`}
        accessibilityHint="Double tap to select this address"
        activeOpacity={0.7}
      >
        <View style={themedStyles.smallCard}>
          <View style={themedStyles.smallContent}>
            <View style={themedStyles.houseIcon}>
              <Image source={Icons.home} />
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
          {isSelected && (
            <View style={themedStyles.checkmarkIcon}>
              <Text style={themedStyles.checkmarkText}>✓</Text>
            </View>
          )}
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
