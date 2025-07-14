import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../../contexts/login/AuthProvider';
import { useTheme } from '../../../theme/ThemeContext';
import { Address } from '../../../types/address';
import { ThemeText } from '../../common/theme/ThemeText';
import { AddressSelectionModal } from './AddressSelectionModal';

export const LocationSelector = () => {
  const { theme } = useTheme();
  const { selectedAddress, setSelectedAddress } = useAuth();
  const [showAddressModal, setShowAddressModal] = useState(false);

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
    setShowAddressModal(false);
  };

  const getDisplayAddress = () => {
    if (selectedAddress) {
      return `${selectedAddress.city} - ${selectedAddress.zipCode}`;
    }
    return 'Select Address';
  };

  const getDisplayName = () => {
    if (selectedAddress?.name) {
      return `Hey, ${selectedAddress.name.split(' ')[0]}`;
    }
    return 'Hey, User';
  };

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={() => setShowAddressModal(true)}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Select delivery address"
        accessibilityHint="Opens address selection modal"
        activeOpacity={0.7}
      >
        <Icon name="map-marker" size={24} color={theme.colors.primary} style={styles.icon} />
        <View style={styles.textContainer}>
          <ThemeText variant="body" style={styles.greeting}>
            {getDisplayName()}
          </ThemeText>
          <View style={styles.addressRow}>
            <ThemeText variant="caption" color={theme.colors.subText} style={styles.address}>
              {getDisplayAddress()}
            </ThemeText>
            <Icon
              name="chevron-down"
              size={20}
              color={theme.colors.subText}
              style={styles.chevron}
            />
          </View>
        </View>
      </TouchableOpacity>

      <AddressSelectionModal
        visible={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onAddressSelect={handleAddressSelect}
        selectedAddress={selectedAddress}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  textContainer: {
    flexDirection: 'column',
  },
  greeting: {
    fontWeight: '500',
    marginBottom: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  address: {
    marginRight: 4,
  },
  chevron: {
    marginTop: 2,
  },
});
