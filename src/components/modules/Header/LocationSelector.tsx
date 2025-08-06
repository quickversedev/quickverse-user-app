import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../../contexts/login/AuthProvider';
import { useAddress } from '../../../hooks';
import { useLocation } from '../../../hooks/Permissions/useLocation';
import { findClosestAddressWithinRadius } from '../../../screens/profile/Address/utils/addressUtils';
import { useTheme } from '../../../theme/ThemeContext';
import { Address } from '../../../types/address';
import { ThemeText } from '../../common/theme/ThemeText';
import { AddressSelectionModal } from './AddressSelectionModal';

export const LocationSelector = () => {
  const { theme } = useTheme();
  const { selectedAddress, setSelectedAddress } = useAuth();
  const [showAddressModal, setShowAddressModal] = useState(false);
  const { addresses } = useAddress();
  const { location, isGranted, getCurrentLocation } = useLocation();

  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Auto-select closest address within 200m radius when location is available
  useEffect(() => {
    if (
      isGranted &&
      location.latitude &&
      location.longitude &&
      addresses.length > 0 &&
      !selectedAddress
    ) {
      const currentLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
      };

      const closestAddressResult = findClosestAddressWithinRadius(currentLocation, addresses, 200);

      if (closestAddressResult) {
        setSelectedAddress(closestAddressResult.address as Address);
      }
    }
  }, [
    isGranted,
    location.latitude,
    location.longitude,
    addresses,
    selectedAddress,
    setSelectedAddress,
  ]);

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
    setShowAddressModal(false);
  };

  const getDisplayAddress = () => {
    if (selectedAddress) {
      // For searched addresses, show city and state if available
      if (selectedAddress.city && selectedAddress.state) {
        return `${selectedAddress.city}, ${selectedAddress.state}`;
      }
      // Fallback to city and postal code
      if (selectedAddress.city && selectedAddress.postalCode) {
        return `${selectedAddress.city} - ${selectedAddress.postalCode}`;
      }
      // Just show city if available
      if (selectedAddress.city) {
        return selectedAddress.city;
      }
      // Fallback to address
      return selectedAddress.address || 'Selected Address';
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
