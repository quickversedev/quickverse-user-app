import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useAuth } from '../../../contexts/login/AuthProvider';
import useAddressStore from '../../../store/address/addressStore';
import { useTheme } from '../../../theme/ThemeContext';
import type { Address } from '../../../types/address';
import { ThemeText } from '../../common/theme/ThemeText';
import { AddressSelectionModal } from './AddressSelectionModal';
import MapIcon from '../../../assets/svg/header/location-pin.svg';

interface LocationSelectorProps {
  /**
   * Replaces the "Hey, {name}" greeting with arbitrary text — the home screen passes
   * a delivery ETA here. Omit to keep the greeting (Header.tsx relies on that).
   */
  titleOverride?: string;
}

export const LocationSelector = ({ titleOverride }: LocationSelectorProps = {}) => {
  const { theme } = useTheme();
  const { selectedAddress, setSelectedAddress, authData } = useAuth();
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [scrollToNewest, setScrollToNewest] = useState(false);
  const pendingOpenAddressModal = useAddressStore(s => s.pendingOpenAddressModal);
  const setPendingOpenAddressModal = useAddressStore(s => s.setPendingOpenAddressModal);

  // Auto-open modal when a new address was just added from AddAddressScreen
  useEffect(() => {
    if (pendingOpenAddressModal) {
      setPendingOpenAddressModal(false);
      setScrollToNewest(true);
      setShowAddressModal(true);
    }
  }, [pendingOpenAddressModal, setPendingOpenAddressModal]);
  // Selected address is managed by AuthProvider (initialized in AppInitializer and user selection)

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
    setShowAddressModal(false);
  };

  const getDisplayAddress = () => {
    if (selectedAddress) {
      let displayText = '';

      const city = selectedAddress.city;
      const isGenericCity = !city || city === 'Current Location' || city === 'Default';

      if (isGenericCity) {
        // Try extracting a meaningful location name from available fields
        const addr = selectedAddress.addressLine1 || '';
        const state = selectedAddress.state || '';

        if (state) {
          displayText = state;
        } else if (addr && !addr.includes('GPS') && !addr.match(/^\d+\.\d+/)) {
          // Use formatted address if it's not just coordinates
          displayText = addr.split(',').slice(0, 2).join(',').trim();
        } else {
          displayText = 'Current Location';
        }
      }
      // For searched addresses, show city and state if available
      else if (city && selectedAddress.state) {
        displayText = `${city}, ${selectedAddress.state}`;
      }
      // Fallback to city and postal code
      else if (city && selectedAddress.postalCode) {
        displayText = `${city} - ${selectedAddress.postalCode}`;
      }
      // Just show city if available
      else {
        displayText = city;
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
        <MapIcon width={24} height={24} style={styles.icon} />
        <View style={styles.textContainer}>
          <ThemeText variant="body" style={styles.greeting}>
            {titleOverride ?? getDisplayName()}
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
        onClose={() => {
          setShowAddressModal(false);
          setScrollToNewest(false);
        }}
        onAddressSelect={handleAddressSelect}
        selectedAddress={selectedAddress}
        scrollToNewest={scrollToNewest}
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    lineHeight: 21.6, // 135%
    letterSpacing: -0.3,
    marginBottom: 2,
    fontFamily: 'Bricolage Grotesque',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  address: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563', // Grey/600
    lineHeight: 15.4, // 110% of 14
    letterSpacing: -0.3,
    marginRight: 4,
    fontFamily: 'Bricolage Grotesque',
  },
  chevron: {
    marginTop: 2,
  },
});
