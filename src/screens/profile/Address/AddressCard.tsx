import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

type Address = {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  tag: string;
  isDefault?: boolean;
};

const AddressCard = ({ address }: { address: Address }) => {
  const { getColor, getTypography, theme } = useTheme();

  const themedStyles = StyleSheet.create({
    card: {
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      padding: 16,
      marginBottom: 16,
      shadowColor: theme.colors.shadow.color,
      shadowOffset: theme.colors.shadow.offset,
      shadowOpacity: theme.colors.shadow.opacity,
      shadowRadius: theme.colors.shadow.radius,
      elevation: 4,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    tag: {
      color: getColor('white'),
      backgroundColor: getColor('primary'),
      borderRadius: theme.borderRadius.full,
      paddingHorizontal: 12,
      paddingVertical: 4,
      fontSize: getTypography('caption'),
      fontWeight: 'bold',
      marginRight: 8,
    },
    defaultTag: {
      color: getColor('primary'),
      fontSize: getTypography('caption'),
      fontWeight: 'bold',
      marginLeft: 8,
    },
    name: {
      color: getColor('text'),
      fontSize: getTypography('body'),
      fontWeight: '600',
      marginBottom: 2,
    },
    address: {
      color: getColor('text'),
      fontSize: getTypography('body'),
      marginBottom: 2,
    },
    actions: {
      flexDirection: 'row',
      marginTop: 12,
    },
    actionText: {
      fontSize: getTypography('body'),
      fontWeight: 'bold',
      marginRight: 24,
    },
  });

  return (
    <View style={themedStyles.card}>
      <View style={themedStyles.header}>
        <Text style={themedStyles.tag}>{address.tag}</Text>
        {address.isDefault && <Text style={themedStyles.defaultTag}>Default</Text>}
      </View>

      <Text style={themedStyles.name}>{address.name}</Text>
      <Text style={themedStyles.address}>{address.addressLine1}</Text>
      {address.addressLine2 && <Text style={themedStyles.address}>{address.addressLine2}</Text>}
      <Text style={themedStyles.address}>
        {address.city}, {address.state} - {address.pincode}
      </Text>

      <View style={themedStyles.actions}>
        <TouchableOpacity>
          <Text style={[themedStyles.actionText, { color: getColor('primary') }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={[themedStyles.actionText, { color: getColor('error') }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AddressCard;
