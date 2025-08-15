import debounce from 'lodash.debounce';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAuth } from '../../../contexts/login/AuthProvider';
import { useLocation } from '../../../hooks/Permissions/useLocation';
import { useAddress } from '../../../hooks/useAddress';
import AddAddressModal from '../../../screens/profile/Address/AddAddressModal';
import AddressCard from '../../../screens/profile/Address/AddressCard';
import {
  getAddressFromCoordinates,
  getAutocompleteSuggestions,
  type Location,
  type SearchResult,
} from '../../../services/api/olaLocationService';
import { useTheme } from '../../../theme/ThemeContext';
import { Address } from '../../../types/address';
import LoginButton from '../../common/LoginButton';
import SectionDivider from '../../common/SectionDivider';

const { height: screenHeight } = Dimensions.get('window');
const MODAL_HEIGHT = screenHeight * 0.6;

interface AddressSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onAddressSelect: (address: Address) => void;
  selectedAddress?: Address | null;
  needCompulsoryAddress?: boolean;
}

export const AddressSelectionModal: React.FC<AddressSelectionModalProps> = ({
  visible,
  onClose,
  onAddressSelect,
  selectedAddress,
  needCompulsoryAddress = false,
}) => {
  const { getColor, getTypography, theme } = useTheme();
  const { addresses, loading } = useAddress();
  const { setSelectedAddress, authData } = useAuth();
  const { getCurrentLocation, isLoading: locationLoading } = useLocation();
  const isLoggedIn = Boolean(authData?.jwt);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Default location (Pune, India)
  const defaultLocation: Location = {
    latitude: 18.5204,
    longitude: 73.8567,
  };

  const handleClose = () => {
    onClose();
  };

  const handleAddressSelect = (address: Address) => {
    onAddressSelect(address);
    handleClose();
  };

  const handleAddNewAddress = () => {
    setShowAddModal(true);
  };

  const handleAddAddressSuccess = () => {
    setShowAddModal(false);
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
          const results = await getAutocompleteSuggestions(currentSearchQuery, defaultLocation);
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
        longitude: 0,
        latitude: 0,
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
    try {
      const location = await getCurrentLocation();
      if (location.latitude && location.longitude) {
        // Get address details from coordinates using reverse geocoding
        const addressComponents = await getAddressFromCoordinates({
          latitude: location.latitude,
          longitude: location.longitude,
        });

        // Create a new address object with current location and address details
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
        setSelectedAddress(currentLocationAddress);

        handleClose();
      }
    } catch (error) {
      console.error('Failed to get current location or address:', error);
      // Fallback: create address with just coordinates if reverse geocoding fails
      try {
        const location = await getCurrentLocation();
        if (location.latitude && location.longitude) {
          const fallbackAddress: Address = {
            addressID: `current_location_${Date.now()}`,
            name: 'Current Location',
            phone: '',
            city: 'Current Location',
            state: '',
            tag: 'current',
            addressLine1: 'Current GPS Location',
            addressLine2: '',
            addressLine3: '',
            postalCode: '',
            coordinates: {
              latitude: location.latitude,
              longitude: location.longitude,
            },
          };
          setSelectedAddress(fallbackAddress);

          handleClose();
        }
      } catch (fallbackError) {
        console.error('Failed to get current location as fallback:', fallbackError);
      }
    }
  };

  // Always show all saved addresses - no filtering
  const filteredAddresses = addresses;

  const themedStyles = StyleSheet.create({
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: MODAL_HEIGHT,
      backgroundColor: getColor('background'),
      borderTopLeftRadius: theme.borderRadius.md,
      borderTopRightRadius: theme.borderRadius.md,
      ...Platform.select({
        android: {
          elevation: 20,
        },
        ios: {
          shadowColor: theme.colors.shadow.color,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: theme.colors.shadow.opacity,
          shadowRadius: theme.colors.shadow.radius,
        },
      }),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      alignItems: 'center',
      paddingHorizontal: 20,
      borderBottomWidth: 1,
    },
    closeButton: {
      padding: 8,
      borderRadius: theme.borderRadius.full,
      backgroundColor: getColor('card'),
      minHeight: 40,
      minWidth: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    searchContainer: {
      marginTop: 16,
      marginBottom: 20,
      position: 'relative',
      zIndex: 10,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: getColor('border'),
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
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      maxHeight: 200,
      elevation: 8,
      shadowColor: theme.colors.shadow.color,
      shadowOffset: theme.colors.shadow.offset,
      shadowOpacity: theme.colors.shadow.opacity,
      shadowRadius: theme.colors.shadow.radius,
      zIndex: 20,
      overflow: 'hidden',
    },
    currentLocationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      // backgroundColor: getColor('primary'),
      paddingHorizontal: 16,
      // paddingVertical: 12,
      borderRadius: theme.borderRadius.md,
      // marginTop: 12,
      marginBottom: 16,
    },
    currentLocationButtonText: {
      color: getColor('white'),
      fontSize: getTypography('body'),
      fontWeight: '600',
      marginLeft: 8,
      includeFontPadding: false,
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
    sectionDividerContainer: {
      // marginVertical: 20,
    },
    addressesContainer: {
      flex: 1,
      borderRadius: theme.borderRadius.md,
      padding: 20,
      maxHeight: MODAL_HEIGHT * 0.6,
    },
    addressCardContainer: {
      // marginBottom: 4,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-end',
      marginTop: 8,
      marginBottom: 16,
    },
    editButtonText: {
      fontSize: getTypography('body'),
      color: getColor('primary'),
      fontWeight: '500',
      marginLeft: 4,
      includeFontPadding: false,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: getColor('primary'),
      paddingHorizontal: 20,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.md,
      minHeight: 56,
    },
    addButtonText: {
      color: getColor('primary'),
      fontSize: getTypography('body'),
      fontWeight: '600',
      marginLeft: 8,
      includeFontPadding: false,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: getTypography('body'),
      color: getColor('subText'),
      textAlign: 'center',
      includeFontPadding: false,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
      <View style={StyleSheet.absoluteFill}>
        {/* Backdrop */}
        <View style={[themedStyles.backdrop, { backgroundColor: 'rgba(0, 0, 0, 0.9)' }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
            activeOpacity={1}
          />
        </View>

        {/* Modal Content */}
        <View style={themedStyles.modalContainer}>
          <View style={themedStyles.header}>
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

          <View style={themedStyles.content}>
            {/* Search Bar and Current Location Button - Only show if needCompulsoryAddress is false */}
            {!needCompulsoryAddress && (
              <>
                <View style={themedStyles.searchContainer}>
                  <View style={themedStyles.searchBar}>
                    <MaterialCommunityIcons
                      name="magnify"
                      size={20}
                      color={getColor('subText')}
                      style={themedStyles.searchIcon}
                    />
                    <TextInput
                      style={themedStyles.searchInput}
                      placeholder="Search for locations worldwide..."
                      placeholderTextColor={getColor('placeholder')}
                      value={searchQuery}
                      onChangeText={handleSearchInputChange}
                      accessible={true}
                      accessibilityRole="search"
                      accessibilityLabel="Search for locations worldwide"
                      returnKeyType="search"
                      autoCapitalize="words"
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity
                        onPress={handleClearSearch}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel="Clear search"
                        accessibilityHint="Clears the search input"
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

                  {/* Search Results Dropdown */}
                  {showSearchResults && searchResults.length > 0 && (
                    <View
                      style={themedStyles.searchResultsContainer}
                      pointerEvents="box-none"
                      onStartShouldSetResponder={() => true}
                      onTouchStart={e => e.stopPropagation()}
                      onTouchMove={e => e.stopPropagation()}
                    >
                      <ScrollView
                        style={{ maxHeight: 200 }}
                        contentContainerStyle={{ paddingVertical: 4 }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={true}
                        nestedScrollEnabled={true}
                        scrollEnabled={true}
                        onScroll={event => {
                          // Prevent scroll events from propagating to parent scrollable components
                          event.stopPropagation();
                        }}
                        scrollEventThrottle={16}
                      >
                        {searchResults.map((result, index) => (
                          <TouchableOpacity
                            key={result.place_id || index}
                            style={themedStyles.searchResultItem}
                            onPress={() => handleSearchResultSelect(result)}
                            accessible={true}
                            accessibilityRole="button"
                            accessibilityLabel={`Select ${result.structured_formatting.main_text}`}
                            accessibilityHint={`Selects ${result.structured_formatting.main_text} as the location`}
                            activeOpacity={0.7}
                          >
                            <Text style={themedStyles.searchResultMainText}>
                              {result.structured_formatting.main_text}
                            </Text>
                            <Text style={themedStyles.searchResultSecondaryText}>
                              {result.structured_formatting.secondary_text}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={themedStyles.currentLocationButton}
                  onPress={handleUseCurrentLocation}
                  disabled={locationLoading}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Use current location"
                  accessibilityHint="Sets your current GPS location as the delivery address"
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="crosshairs-gps"
                    size={20}
                    color={getColor('white')}
                  />
                  <Text style={themedStyles.currentLocationButtonText}>
                    {locationLoading ? 'Getting Location...' : 'Use Current Location'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Section Divider */}
            <View style={themedStyles.sectionDividerContainer}>
              <SectionDivider text="CHOOSE DELIVERY ADDRESS" fontSize={16} />
            </View>

            {/* Addresses Section or Login Prompt */}
            {!isLoggedIn ? (
              <View style={themedStyles.emptyContainer}>
                <Text style={themedStyles.emptyText}>Please log in to manage your addresses.</Text>
                <LoginButton />
              </View>
            ) : (
              <>
                {/* Addresses Container */}
                <View style={themedStyles.addressesContainer}>
                  {loading ? (
                    <View style={themedStyles.loadingContainer}>
                      <Text style={themedStyles.emptyText}>Loading addresses...</Text>
                    </View>
                  ) : filteredAddresses.length === 0 ? (
                    <View style={themedStyles.emptyContainer}>
                      <MaterialCommunityIcons
                        name="map-marker-off"
                        size={48}
                        color={getColor('subText')}
                        style={{ marginBottom: 16 }}
                      />
                      <Text style={themedStyles.emptyText}>
                        No addresses found.{'\n'}Add your first address to get started.
                      </Text>
                    </View>
                  ) : (
                    <>
                      <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        style={{ flex: 1 }}
                        scrollEnabled={!showSearchResults}
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
                            />
                          </View>
                        ))}
                      </ScrollView>
                    </>
                  )}
                </View>

                {/* Add Address Button */}
                <TouchableOpacity
                  style={themedStyles.addButton}
                  onPress={handleAddNewAddress}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Add new address"
                  accessibilityHint="Opens the add address form"
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="plus" size={20} color={getColor('primary')} />
                  <Text style={themedStyles.addButtonText}>Add Address Details</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Add Address Modal */}
        <AddAddressModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddAddressSuccess}
        />
      </View>
    </Modal>
  );
};
