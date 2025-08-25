import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../../contexts/login/AuthProvider';
import { useTheme } from '../../../theme/ThemeContext';
import type { Address } from '../../../types/address';
import { ThemeText } from '../../common/theme/ThemeText';
import { AddressSelectionModal } from './AddressSelectionModal';

export const LocationSelector = () => {
  const { theme } = useTheme();
  const { selectedAddress, setSelectedAddress, authData } = useAuth();
  const [showAddressModal, setShowAddressModal] = useState(false);
  // Selected address is managed by AuthProvider (initialized in AppInitializer and user selection)

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
    setShowAddressModal(false);
  };

  const getDisplayAddress = () => {
    if (selectedAddress) {
      let displayText = '';

      // For searched addresses, show city and state if available
      if (selectedAddress.city && selectedAddress.state) {
        displayText = `${selectedAddress.city}, ${selectedAddress.state}`;
      }
      // Fallback to city and postal code
      else if (selectedAddress.city && selectedAddress.postalCode) {
        displayText = `${selectedAddress.city} - ${selectedAddress.postalCode}`;
      }
      // Just show city if available
      else {
        displayText = selectedAddress.city;
      }
      // Fallback to address

      // Add ellipsis if text is too long (more than 25 characters)
      if (displayText.length > 25) {
        return `${displayText.substring(0, 22)}...`;
      }

      return displayText;
    }
    return 'Select Address';
  };

  const getDisplayName = () => {
    const username = authData?.username;
    console.log('username', username);
    if (username && username.trim().length > 0) {
      return `Hey, ${username.split(' ')[0]}`;
    }
    return 'Hey, Howdy';
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
        <Icon name="map-marker" size={24} color={theme.colors.main} style={styles.icon} />
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
