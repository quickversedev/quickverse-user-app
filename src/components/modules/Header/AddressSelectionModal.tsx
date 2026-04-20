import debounce from 'lodash.debounce';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../../contexts/login/AuthProvider';
import { useLocation } from '../../../hooks/Permissions/useLocation';
import { useAddress } from '../../../hooks/useAddress';
import { RootStackParamList } from '../../../routes/AppStack';
import AddressCard from '../../../screens/profile/Address/AddressCard';
import {
  getAddressFromCoordinates,
  getAutocompleteSuggestions,
  type SearchResult,
} from '../../../services/api/olaLocationService';
import { useTheme } from '../../../theme/ThemeContext';
import { Address } from '../../../types/address';
import LoginButton from '../../common/LoginButton';
import SectionDivider from '../../common/SectionDivider';

const { height: screenHeight } = Dimensions.get('window');
const CLOSE_BUTTON_SIZE = 40;
const ADDRESS_CARD_HEIGHT = 82; // Approximate height of each address card (70 minHeight + 12 marginBottom)
const MAX_VISIBLE_ADDRESSES = 3; // Max addresses before scrolling

interface AddressSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onAddressSelect: (address: Address) => void;
  selectedAddress?: Address | null;
  needCompulsoryAddress?: boolean;
  scrollToNewest?: boolean;
}

export const AddressSelectionModal: React.FC<AddressSelectionModalProps> = ({
  visible,
  onClose,
  onAddressSelect,
  selectedAddress,
  needCompulsoryAddress = false,
  scrollToNewest = false,
}) => {
  const { getColor, getTypography, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { addresses, loading, fetchAddresses } = useAddress();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { setSelectedAddress, authData } = useAuth();
  const { getCurrentLocation, checkLocationPermission, requestLocationPermission } = useLocation();
  const addressScrollRef = useRef<ScrollView>(null);
  const isLoggedIn = Boolean(authData?.jwt);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [currentLocationLoading, setCurrentLocationLoading] = useState(false);

  // Fetch addresses when modal opens
  useEffect(() => {
    if (visible && isLoggedIn) {
      fetchAddresses();
    }
  }, [visible, isLoggedIn]);

  const handleClose = () => {
    // Prevent closing if address is compulsory and no address is selected
    if (needCompulsoryAddress && !selectedAddress) {
      return; // Don't allow closing
    }
    onClose();
  };

  const handleAddressSelect = (address: Address) => {
    onAddressSelect(address);
    handleClose();
  };

  const handleAddNewAddress = () => {
    onClose();
    navigation.navigate('AddAddress', { source: 'modal' });
  };

  // Debounced search function
  const fetchAutocompleteSuggestions = useMemo(
    () =>
      debounce(async (currentSearchQuery: string) => {
        if (!currentSearchQuery.trim()) {
          setSearchResults([]);
          setSearchLoading(false);
          setShowSearchResults(false);
          return;
        }

        setSearchLoading(true);
        setShowSearchResults(true);

        try {
          const results = await getAutocompleteSuggestions(currentSearchQuery);
          setSearchResults(results);
        } catch (err: unknown) {
          const error = err as { response?: { data?: unknown }; message?: string };
          console.warn(
            'Error during Ola Maps autocomplete:',
            error.response?.data || error.message || err
          );
          setSearchResults([]);
        } finally {
          setSearchLoading(false);
        }
      }, 400), // 400ms debounce
    []
  );

  const handleSearchInputChange = (text: string) => {
    setSearchQuery(text);
    fetchAutocompleteSuggestions(text);
  };

  const handleSearchResultSelect = (result: SearchResult) => {
    setSearchQuery(result.structured_formatting.main_text);
    setSearchResults([]);
    setShowSearchResults(false);

    // Parse the secondary text to extract components
    const secondaryParts = result.structured_formatting.secondary_text.split(',');
    const city = result.structured_formatting.main_text;
    const state = secondaryParts[1]?.trim() || '';
    const postalCode = secondaryParts[2]?.trim() || '';
    const latitude = result.geometry.location.lat;
    const longitude = result.geometry.location.lng;

    // Convert search result to Address object
    const newAddress: Address = {
      addressID: result.place_id || `search_${Date.now()}`,
      name: city,
      phone: '',
      city: city,
      state: state,
      tag: 'home',
      addressLine1: result.structured_formatting.secondary_text,
      addressLine2: '',
      addressLine3: '',
      postalCode: postalCode,
      coordinates: {
        longitude: longitude,
        latitude: latitude,
      },
    };

    // Update selected address through AuthProvider
    setSelectedAddress(newAddress);

    // Close the modal
    handleClose();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleUseCurrentLocation = async () => {
    setCurrentLocationLoading(true);
    try {
      let permission = await checkLocationPermission();
      if (permission !== 'granted') {
        permission = await requestLocationPermission();
      }

      if (permission !== 'granted') {
        console.warn('Location permission denied by user');
        return;
      }

      // Race both high-accuracy GPS and network location in parallel
      const location = await Promise.any([
        getCurrentLocation({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }),
        getCurrentLocation({ enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 }),
      ]);

      console.log('🔵 [AddressModal] Got location:', location.latitude, location.longitude);

      if (!location.latitude || !location.longitude) {
        throw new Error('Could not get current location coordinates');
      }

      let addressComponents;
      try {
        // Get address details from coordinates using reverse geocoding
        addressComponents = await getAddressFromCoordinates({
          latitude: location.latitude,
          longitude: location.longitude,
        });
        console.log('🔵 [AddressModal] Geocode result:', JSON.stringify(addressComponents));
      } catch (geocodeError) {
        console.warn('Reverse geocoding failed, using coordinates only:', geocodeError);
        // Fallback to empty components if reverse geocoding fails
        addressComponents = {
          city: 'Current Location',
          state: '',
          formatted_address:
            'Current GPS Location: ' +
            location.latitude.toFixed(4) +
            ', ' +
            location.longitude.toFixed(4),
          postalCode: '',
        };
      }

      // Create a new address object with current location and address details (or fallback)
      const currentLocationAddress: Address = {
        addressID: `current_location_${Date.now()}`,
        name: 'Current Location',
        phone: '',
        city: addressComponents.city || 'Current Location',
        state: addressComponents.state || '',
        tag: 'current',
        addressLine1: addressComponents.formatted_address || 'Current GPS Location',
        addressLine2: '',
        addressLine3: '',
        postalCode: addressComponents.postalCode || '',
        coordinates: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
      };

      // Set as selected address
      console.log('🔵 [AddressModal] Setting address:', JSON.stringify({
        city: currentLocationAddress.city,
        state: currentLocationAddress.state,
        addressLine1: currentLocationAddress.addressLine1,
      }));
      setSelectedAddress(currentLocationAddress);
      handleClose();
    } catch (error) {
      console.error('Failed to get current location:', error);
    } finally {
      setCurrentLocationLoading(false);
    }
  };

  // Show all saved addresses - newest first
  const filteredAddresses = useMemo(() => [...addresses].reverse(), [addresses]);

  // Scroll to selected address (or newest) when modal opens
  useEffect(() => {
    if (visible && !loading && filteredAddresses.length > 0) {
      const timer = setTimeout(() => {
        if (scrollToNewest) {
          addressScrollRef.current?.scrollTo({ y: 0, animated: true });
        } else if (selectedAddress) {
          const selectedIndex = filteredAddresses.findIndex(
            a => a.addressID === selectedAddress.addressID
          );
          if (selectedIndex > 0) {
            addressScrollRef.current?.scrollTo({
              y: selectedIndex * ADDRESS_CARD_HEIGHT,
              animated: true,
            });
          }
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible, scrollToNewest, loading, filteredAddresses.length, selectedAddress]);

  // Calculate dynamic height for addresses container
  const addressCount = filteredAddresses.length;
  const visibleCount = Math.min(addressCount, MAX_VISIBLE_ADDRESSES);
  const addressesHeight =
    addressCount === 0
      ? 150 // Empty state height (increased to fit icon and text)
      : visibleCount * ADDRESS_CARD_HEIGHT;

  const themedStyles = StyleSheet.create({
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    // Close button - TOP LEFT
    closeButtonContainer: {
      position: 'absolute',
      top: insets.top + 16,
      left: 16,
      zIndex: 100,
    },
    closeButton: {
      width: CLOSE_BUTTON_SIZE,
      height: CLOSE_BUTTON_SIZE,
      borderRadius: CLOSE_BUTTON_SIZE / 2,
      backgroundColor: getColor('card'),
      justifyContent: 'center',
      alignItems: 'center',
      ...Platform.select({
        android: {
          elevation: 8,
        },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
        },
      }),
    },
    // Search bar - BELOW CLOSE BUTTON
    topSearchContainer: {
      position: 'absolute',
      top: insets.top + 70,
      left: 16,
      right: 16,
      zIndex: 90,
      ...Platform.select({
        android: {
          elevation: 90,
        },
      }),
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: getColor('card'),
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 12,
      ...Platform.select({
        android: {
          elevation: 4,
        },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
        },
      }),
    },
    searchIcon: {
      marginRight: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: getTypography('body'),
      color: getColor('text'),
      includeFontPadding: false,
    },
    searchResultsContainer: {
      backgroundColor: getColor('card'),
      borderRadius: 12,
      maxHeight: 400,
      marginTop: 8,
      ...Platform.select({
        android: {
          elevation: 8,
        },
        ios: {
          shadowColor: theme.colors.shadow.color,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: theme.colors.shadow.opacity,
          shadowRadius: theme.colors.shadow.radius,
        },
      }),
      overflow: 'hidden',
    },
    searchResultItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
      backgroundColor: 'transparent',
    },
    searchResultMainText: {
      color: getColor('text'),
      fontSize: getTypography('body'),
      fontWeight: '500',
      includeFontPadding: false,
    },
    searchResultSecondaryText: {
      color: getColor('subText'),
      fontSize: getTypography('caption'),
      includeFontPadding: false,
      marginTop: 2,
    },
    // Address card - positioned below search bar (responsive height)
    modalContainer: {
      position: 'absolute',
      top: insets.top + 140,
      left: 16,
      right: 16,
      maxHeight: screenHeight * 0.6, // Safety max
      paddingBottom: 16,
      backgroundColor: getColor('background'),
      borderRadius: 16,
      ...Platform.select({
        android: {
          elevation: 20,
        },
        ios: {
          shadowColor: theme.colors.shadow.color,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: theme.colors.shadow.opacity,
          shadowRadius: theme.colors.shadow.radius,
        },
      }),
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    sectionDividerContainer: {
      marginBottom: 12,
    },
    addressesContainer: {
      height: addressesHeight,
      maxHeight: MAX_VISIBLE_ADDRESSES * ADDRESS_CARD_HEIGHT,
    },
    addressCardContainer: {},
    currentLocationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 8,
      backgroundColor: getColor('card'),
      borderWidth: 1,
      borderColor: getColor('border'),
    },
    currentLocationButtonText: {
      color: getColor('text'),
      fontSize: getTypography('body'),
      fontWeight: '500',
      marginLeft: 8,
      includeFontPadding: false,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: getColor('primary'),
      borderStyle: 'dashed',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderRadius: 12,
      marginTop: 8,
    },
    addButtonText: {
      color: getColor('primary'),
      fontSize: getTypography('body'),
      fontWeight: '600',
      marginLeft: 8,
      includeFontPadding: false,
    },
    emptyContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 20,
      minHeight: 80,
    },
    emptyText: {
      fontSize: getTypography('body'),
      color: getColor('subText'),
      textAlign: 'center',
      includeFontPadding: false,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 20,
      minHeight: 60,
    },
    closeArea: {
      ...StyleSheet.absoluteFillObject,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      hardwareAccelerated={true}
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* Visual dimming layer */}
          <View style={themedStyles.backdrop} pointerEvents="none" />

          {/* Area above modal that closes when tapped (disabled if needCompulsoryAddress) */}
          {!needCompulsoryAddress && (
            <TouchableOpacity
              style={themedStyles.closeArea}
              onPress={handleClose}
              activeOpacity={1}
            />
          )}

          {/* Close button - TOP LEFT */}
          <View style={themedStyles.closeButtonContainer}>
            <TouchableOpacity
              style={themedStyles.closeButton}
              onPress={handleClose}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close address selection"
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="close" size={20} color={getColor('text')} />
            </TouchableOpacity>
          </View>

          {/* Search bar - same modal experience whether compulsory or not */}
          <View style={themedStyles.topSearchContainer} pointerEvents="box-none">
            <View style={themedStyles.searchBar}>
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color={getColor('subText')}
                style={themedStyles.searchIcon}
              />
              <TextInput
                style={themedStyles.searchInput}
                placeholder="Search Locality"
                placeholderTextColor={getColor('placeholder')}
                value={searchQuery}
                onChangeText={handleSearchInputChange}
                accessible={true}
                accessibilityRole="search"
                accessibilityLabel="Search for locations"
                returnKeyType="search"
                autoCapitalize="words"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={handleClearSearch}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={22}
                    color={getColor('subText')}
                  />
                </TouchableOpacity>
              )}
              {searchLoading && (
                <ActivityIndicator
                  size="small"
                  color={getColor('primary')}
                  style={{ marginLeft: 8 }}
                />
              )}
            </View>

            {/* Search results dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <View style={themedStyles.searchResultsContainer}>
                <FlatList
                  data={searchResults}
                  keyExtractor={(item, index) => item.place_id || index.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={themedStyles.searchResultItem}
                      onPress={() => handleSearchResultSelect(item)}
                      activeOpacity={0.7}
                    >
                      <Text style={themedStyles.searchResultMainText}>
                        {item.structured_formatting.main_text}
                      </Text>
                      <Text style={themedStyles.searchResultSecondaryText}>
                        {item.structured_formatting.secondary_text}
                      </Text>
                    </TouchableOpacity>
                  )}
                  style={{ maxHeight: 400 }}
                  contentContainerStyle={{ paddingVertical: 4 }}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                />
              </View>
            )}
          </View>

          {/* Address selection card - positioned below search bar */}
          <View style={themedStyles.modalContainer}>
            <View style={themedStyles.content}>
              {/* Section Divider */}
              <View style={themedStyles.sectionDividerContainer}>
                <SectionDivider text="CHOOSE DELIVERY ADDRESS" fontSize={12} />
              </View>

              {/* Addresses Section or Login Prompt */}
              {!isLoggedIn ? (
                <>
                  {/* Use Current Location Button for non-logged-in users */}
                  <TouchableOpacity
                    style={themedStyles.currentLocationButton}
                    onPress={handleUseCurrentLocation}
                    disabled={currentLocationLoading}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={
                      currentLocationLoading ? 'Getting location...' : 'Use current location'
                    }
                    activeOpacity={0.8}
                  >
                    {currentLocationLoading ? (
                      <ActivityIndicator
                        size="small"
                        color={getColor('primary')}
                        style={{ marginRight: 10 }}
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name="crosshairs-gps"
                        size={20}
                        color={getColor('text')}
                        style={{ marginRight: 10 }}
                      />
                    )}
                    <Text style={themedStyles.currentLocationButtonText}>
                      {currentLocationLoading ? 'Getting Location...' : 'Use Current Location'}
                    </Text>
                  </TouchableOpacity>

                  <View style={themedStyles.emptyContainer}>
                    <Text style={themedStyles.emptyText}>
                      Log in to save addresses.
                    </Text>
                    <LoginButton />
                  </View>
                </>
              ) : (
                <>
                  {/* Addresses Container */}
                  <View style={themedStyles.addressesContainer}>
                    {loading ? (
                      <View style={themedStyles.loadingContainer}>
                        <ActivityIndicator size="small" color={getColor('primary')} />
                      </View>
                    ) : filteredAddresses.length === 0 ? (
                      <View style={themedStyles.emptyContainer}>
                        <MaterialCommunityIcons
                          name="map-marker-off"
                          size={40}
                          color={getColor('subText')}
                          style={{ marginBottom: 12 }}
                        />
                        <Text style={themedStyles.emptyText}>
                          No addresses found. Add your first address.
                        </Text>
                      </View>
                    ) : (
                      <ScrollView
                        ref={addressScrollRef}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 8, paddingHorizontal: 4 }}
                        style={{ flex: 1 }}
                        nestedScrollEnabled={true}
                      >
                        {filteredAddresses.map((address, index) => (
                          <View
                            key={address.addressID || index}
                            style={themedStyles.addressCardContainer}
                          >
                            <AddressCard
                              address={address}
                              size="small"
                              onPress={() => handleAddressSelect(address)}
                              isSelected={selectedAddress?.addressID === address.addressID}
                              onLongPress={() => {
                                // TODO: Show edit menu
                                console.log('Long press - Edit address:', address.addressID);
                              }}
                            />
                          </View>
                        ))}
                      </ScrollView>
                    )}
                  </View>

                  {/* Use Current Location Button - same modal as home location selector */}
                  <TouchableOpacity
                    style={themedStyles.currentLocationButton}
                    onPress={handleUseCurrentLocation}
                    disabled={currentLocationLoading}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={
                      currentLocationLoading ? 'Getting location...' : 'Use current location'
                    }
                    activeOpacity={0.8}
                  >
                    {currentLocationLoading ? (
                      <ActivityIndicator
                        size="small"
                        color={getColor('primary')}
                        style={{ marginRight: 10 }}
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name="crosshairs-gps"
                        size={20}
                        color={getColor('text')}
                        style={{ marginRight: 10 }}
                      />
                    )}
                    <Text style={themedStyles.currentLocationButtonText}>
                      {currentLocationLoading ? 'Getting Location...' : 'Use Current Location'}
                    </Text>
                  </TouchableOpacity>

                  {/* Add Address Button */}
                  <TouchableOpacity
                    style={themedStyles.addButton}
                    onPress={handleAddNewAddress}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Add new address"
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="plus" size={20} color={getColor('primary')} />
                    <Text style={themedStyles.addButtonText}>Add Address Details</Text>
                  </TouchableOpacity>

                  {/* Manage Addresses Button */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 12,
                      marginTop: 4,
                    }}
                    onPress={() => {
                      onClose();
                      navigation.navigate('Address');
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="cog-outline" size={18} color={getColor('subText')} />
                    <Text style={{ color: getColor('subText'), fontSize: 13, fontWeight: '600', marginLeft: 6 }}>
                      Manage Saved Addresses
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default AddressSelectionModal;
