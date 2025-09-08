import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { SmartBizAddress } from '../../../store/address/smartBizAddressStore';
import { useTheme } from '../../../theme/ThemeContext';
import { SmartBizAddressSelectionModal } from './SmartBizAddressSelectionModal';

interface SmartBizAddressSelectionModalDemoProps {
  vendorId: string;
  onAddressSelect?: (address: SmartBizAddress) => void;
}

export const SmartBizAddressSelectionModalDemo: React.FC<
  SmartBizAddressSelectionModalDemoProps
> = ({ vendorId, onAddressSelect }) => {
  const { getColor, getTypography, theme } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<SmartBizAddress | null>(null);

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleAddressSelect = (address: SmartBizAddress) => {
    setSelectedAddress(address);
    onAddressSelect?.(address);
  };

  const getFormattedAddress = () => {
    if (!selectedAddress) {
      return 'Select SmartBiz delivery address';
    }

    const { address } = selectedAddress;
    const parts = [address.addressLine1, address.city, address.state].filter(Boolean);
    return parts.join(', ');
  };

  const themedStyles = StyleSheet.create({
    container: {
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      padding: 16,
      margin: 16,
    },
    title: {
      fontSize: getTypography('h3'),
      fontWeight: 'bold',
      color: getColor('text'),
      marginBottom: 16,
      includeFontPadding: false,
    },
    addressButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: getColor('background'),
      borderRadius: theme.borderRadius.sm,
      padding: 16,
      borderWidth: 1,
      borderColor: getColor('border'),
    },
    addressText: {
      flex: 1,
      fontSize: getTypography('body'),
      color: getColor('text'),
      marginRight: 12,
      includeFontPadding: false,
    },
    selectButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: getColor('main'),
      borderRadius: theme.borderRadius.md,
      padding: 12,
      marginTop: 12,
    },
    selectButtonText: {
      color: getColor('white'),
      fontSize: getTypography('body'),
      fontWeight: '600',
      marginLeft: 8,
      includeFontPadding: false,
    },
    selectedAddressContainer: {
      backgroundColor: getColor('overlay'),
      borderRadius: theme.borderRadius.sm,
      padding: 12,
      marginTop: 12,
    },
    selectedAddressTitle: {
      fontSize: getTypography('caption'),
      fontWeight: '600',
      color: getColor('main'),
      marginBottom: 4,
      includeFontPadding: false,
    },
    selectedAddressText: {
      fontSize: getTypography('body'),
      color: getColor('text'),
      includeFontPadding: false,
    },
  });

  return (
    <View style={themedStyles.container}>
      <Text style={themedStyles.title}>SmartBiz Address Selection</Text>

      <TouchableOpacity
        style={themedStyles.addressButton}
        onPress={handleOpenModal}
        activeOpacity={0.8}
      >
        <Text style={themedStyles.addressText}>{getFormattedAddress()}</Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color={getColor('subText')} />
      </TouchableOpacity>

      {selectedAddress && (
        <View style={themedStyles.selectedAddressContainer}>
          <Text style={themedStyles.selectedAddressTitle}>Selected Address:</Text>
          <Text style={themedStyles.selectedAddressText}>
            {selectedAddress.address.name} - {selectedAddress.address.addressLine1}
          </Text>
          <Text style={themedStyles.selectedAddressText}>
            {selectedAddress.address.city}, {selectedAddress.address.state} -{' '}
            {selectedAddress.address.pincode}
          </Text>
          {selectedAddress.address.tag && (
            <Text style={themedStyles.selectedAddressText}>Tag: {selectedAddress.address.tag}</Text>
          )}
        </View>
      )}

      <TouchableOpacity
        style={themedStyles.selectButton}
        onPress={handleOpenModal}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="map-marker" size={20} color={getColor('white')} />
        <Text style={themedStyles.selectButtonText}>Select SmartBiz Address</Text>
      </TouchableOpacity>

      <SmartBizAddressSelectionModal
        visible={showModal}
        onClose={handleCloseModal}
        onAddressSelect={handleAddressSelect}
        selectedAddress={selectedAddress}
        vendorId={vendorId}
      />
    </View>
  );
};
