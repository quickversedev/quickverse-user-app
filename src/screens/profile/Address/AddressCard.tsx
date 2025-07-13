import React from 'react';
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { Address } from '../../../types/address';
import { getAddressDisplayName, getAddressTag, getConcatenatedAddress } from './utils/addressUtils';

const { width } = Dimensions.get('window');

const AddressCard = ({ address }: { address: Address }) => {
  const { getColor, getTypography, theme } = useTheme();

  const themedStyles = StyleSheet.create({
    card: {
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      padding: Math.max(16, width * 0.04),
      marginBottom: 16,
      minHeight: 120,
      ...Platform.select({
        android: {
          elevation: 4,
        },
        ios: {
          shadowColor: theme.colors.shadow.color,
          shadowOffset: theme.colors.shadow.offset,
          shadowOpacity: theme.colors.shadow.opacity,
          shadowRadius: theme.colors.shadow.radius,
        },
      }),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      flexWrap: 'wrap',
    },
    tag: {
      color: getColor('white'),
      backgroundColor: getColor('primary'),
      borderRadius: theme.borderRadius.full,
      paddingHorizontal: Math.max(12, width * 0.03),
      paddingVertical: 4,
      fontSize: getTypography('caption'),
      fontWeight: 'bold',
      marginRight: 8,
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    defaultTag: {
      color: getColor('primary'),
      fontSize: getTypography('caption'),
      fontWeight: 'bold',
      marginLeft: 8,
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    name: {
      color: getColor('text'),
      fontSize: getTypography('body'),
      fontWeight: '600',
      marginBottom: 4,
      includeFontPadding: false,
      lineHeight: getTypography('body') * 1.2,
    },
    address: {
      color: getColor('text'),
      fontSize: getTypography('body'),
      marginBottom: 4,
      lineHeight: getTypography('body') * 1.4,
      includeFontPadding: false,
      flexShrink: 1,
    },
    actions: {
      flexDirection: 'row',
      marginTop: 12,
      justifyContent: 'flex-start',
    },
    actionButton: {
      minHeight: 44,
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginRight: 24,
    },
    actionText: {
      fontSize: getTypography('body'),
      fontWeight: 'bold',
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
  });

  const handleEdit = () => {
    // TODO: Implement edit functionality
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality
  };

  return (
    <View
      style={themedStyles.card}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Address card for ${getAddressDisplayName(address)}`}
      accessibilityHint="Double tap to edit this address"
    >
      <View style={themedStyles.header}>
        <Text
          style={themedStyles.tag}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={`Address type: ${getAddressTag(address)}`}
        >
          {getAddressTag(address)}
        </Text>
        {address.isDefault && (
          <Text
            style={themedStyles.defaultTag}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel="Default address"
          >
            Default
          </Text>
        )}
      </View>

      <Text
        style={themedStyles.name}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={`Name: ${getAddressDisplayName(address)}`}
      >
        {getAddressDisplayName(address)}
      </Text>
      <Text
        style={themedStyles.address}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={`Address: ${getConcatenatedAddress(address)}`}
      >
        {getConcatenatedAddress(address)}
      </Text>

      <View style={themedStyles.actions}>
        <TouchableOpacity
          style={themedStyles.actionButton}
          onPress={handleEdit}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Edit address"
          accessibilityHint="Opens the edit address form"
          activeOpacity={0.7}
        >
          <Text style={[themedStyles.actionText, { color: getColor('primary') }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={themedStyles.actionButton}
          onPress={handleDelete}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Delete address"
          accessibilityHint="Removes this address from your saved addresses"
          activeOpacity={0.7}
        >
          <Text style={[themedStyles.actionText, { color: getColor('error') }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AddressCard;
