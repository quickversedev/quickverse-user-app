import { DEFAULT_FALLBACK_COORDINATES } from '../../../../constants/location';
import debounce from 'lodash.debounce';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { Images } from '../../../../assets';
import SectionDivider from '../../../../components/common/SectionDivider';
import { useLocation } from '../../../../hooks/Permissions/useLocation';
import {
  getAddressFromCoordinates,
  getAutocompleteSuggestions,
  type AddressComponents,
  type Location,
  type SearchResult,
} from '../../../../services/api/olaLocationService';
import { useTheme } from '../../../../theme/ThemeContext';
import { getRegionFromLocation } from '../utils/mapUtils';

const { width, height } = Dimensions.get('window');

interface MapLocationStepProps {
  onLocationSelect: (location: Location, selectedAddressDescription: AddressComponents) => void;
}

const PIN_SIZE = Math.max(48, width * 0.12);

const MapLocationStep = ({ onLocationSelect }: MapLocationStepProps) => {
  const { getColor, getTypography, theme } = useTheme();
  const insets = useSafeAreaInsets();

  const {
    checkLocationPermission,
    requestLocationPermission,
    getCurrentLocation,
    location: currentLocation,
  } = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [region, setRegion] = useState({
    latitude: DEFAULT_FALLBACK_COORDINATES.latitude,
    longitude: DEFAULT_FALLBACK_COORDINATES.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedAddressDescription, setSelectedAddressDescription] = useState<AddressComponents>({
    country: '',
    state: '',
    city: '',
    postalCode: '',
    formatted_address: '',
    road: '',
    locality: '',
  });
  const mapRef = useRef<MapView>(null);

  // Function to get address from coordinates with proper error handling
  const getAddressFromCoordinatesWithLoading = async (
    coordinates: Location
  ): Promise<AddressComponents> => {
    setAddressLoading(true);
    try {
      const address = await getAddressFromCoordinates(coordinates);
      return address;
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.warn('Error fetching address from coordinates:', err);
      throw error;
    } finally {
      setAddressLoading(false);
    }
  };

  // Function to update selected location and get address
  const updateSelectedLocationAndAddress = async (newLocation: Location) => {
    setSelectedLocation(newLocation);

    try {
      const address = await getAddressFromCoordinatesWithLoading(newLocation);
      setSelectedAddressDescription(address);
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.warn('Failed to get address:', err.message);
      setSelectedAddressDescription({
        country: '',
        state: '',
        city: '',
        postalCode: '',
        formatted_address: '',
        road: '',
        locality: '',
      });
    }
  };

  // On mount, resolve coordinates before showing the map
  useEffect(() => {
    const fallback = {
      latitude: DEFAULT_FALLBACK_COORDINATES.latitude,
      longitude: DEFAULT_FALLBACK_COORDINATES.longitude,
    };

    const applyLocation = (loc: { latitude: number; longitude: number }) => {
      setRegion(getRegionFromLocation(loc));
      updateSelectedLocationAndAddress(loc);
      setMapReady(true);
    };

    (async () => {
      const status = await checkLocationPermission();
      if (status !== 'granted') {
        const result = await requestLocationPermission();
        if (result !== 'granted') {
          applyLocation(fallback);
          return;
        }
      }
      try {
        const coords = await getCurrentLocation();
        applyLocation({ latitude: coords.latitude, longitude: coords.longitude });
      } catch {
        applyLocation(fallback);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGetCurrentLocation = async () => {
    try {
      // Race both high-accuracy GPS and network location in parallel
      // Whichever resolves first wins — avoids slow sequential fallback
      const coords = await Promise.any([
        getCurrentLocation({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }),
        getCurrentLocation({ enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 }),
      ]);

      const { latitude, longitude } = coords;

      if (!latitude || !longitude) {
        console.warn('Could not get current location');
        return;
      }

      const newLocation = {
        latitude: Number(latitude),
        longitude: Number(longitude),
      };

      // Update the map region to center on current location
      const newRegion = getRegionFromLocation(newLocation);

      // Use animateToRegion for smooth animation to current location
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      } else {
        setRegion(newRegion);
      }

      // Update selected location and get address
      await updateSelectedLocationAndAddress(newLocation);
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  const latitude = selectedLocation?.latitude ?? DEFAULT_FALLBACK_COORDINATES.latitude;
  const longitude = selectedLocation?.longitude ?? DEFAULT_FALLBACK_COORDINATES.longitude;

  const fetchAutocompleteSuggestions = useMemo(
    () =>
      debounce(async (currentSearchQuery: string) => {
        if (!currentSearchQuery.trim()) {
          setSearchResults([]);
          setLoading(false);
          return;
        }

        setLoading(true);

        try {
          const location = { latitude: Number(latitude), longitude: Number(longitude) };
          const results = await getAutocompleteSuggestions(currentSearchQuery, location);
          setSearchResults(results);
        } catch (err: unknown) {
          const error = err as { response?: { data?: unknown }; message?: string };
          console.warn(
            'Error during Ola Maps autocomplete:',
            error.response?.data || error.message || err
          );
          setSearchResults([]);
        } finally {
          setLoading(false);
        }
      }, 400), // 400ms debounce
    [latitude, longitude]
  );

  const handleSearchInputChange = (text: string) => {
    setSearchQuery(text);
    fetchAutocompleteSuggestions(text);
  };

  // Update selectedLocation when map region changes
  const handleRegionChangeComplete = (newRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }) => {
    const newLocation = {
      latitude: newRegion.latitude,
      longitude: newRegion.longitude,
    };

    // Update selected location and get address
    updateSelectedLocationAndAddress(newLocation);
  };

  const handleLocationConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation, selectedAddressDescription);
    }
  };

  // Check if selected location is the same as current location
  const isCurrentLocationSelected = () => {
    if (!selectedLocation || !currentLocation.latitude || !currentLocation.longitude) {
      return false;
    }
    const latDiff = Math.abs(selectedLocation.latitude - currentLocation.latitude);
    const lngDiff = Math.abs(selectedLocation.longitude - currentLocation.longitude);
    return latDiff < 0.0001 && lngDiff < 0.0001; // Very small threshold for comparison
  };

  // Theme-driven styles
  const themedStyles = StyleSheet.create({
    outerContainer: {
      flex: 1,
    },
    mapContainer: {
      flex: 1,
      overflow: 'hidden',
      width: '100%',
      backgroundColor: getColor('card'),
    },
    map: {
      ...StyleSheet.absoluteFillObject,
    },
    centerPinContainer: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 20,
      pointerEvents: 'none',
    },
    centerPinOffset: {
      marginTop: -PIN_SIZE / 2,
    },
    centerPin: {
      width: PIN_SIZE,
      height: PIN_SIZE,
      resizeMode: 'contain',
    },
    searchBarContainer: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? Math.max(insets.top + 12, 16) : insets.top + 12,
      left: 64,
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
      width: '100%',
      height: 40,
      borderRadius: 20,
      paddingHorizontal: 14,
      backgroundColor: getColor('card'),
      ...Platform.select({
        android: {
          elevation: 4,
        },
        ios: {
          shadowColor: theme.colors.shadow.color,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
        },
      }),
    },
    searchIconBadge: {
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      height: 40,
      color: getColor('text'),
      fontSize: getTypography('body'),
    },
    resultsContainer: {
      width: '100%',
      borderRadius: theme.borderRadius.md,
      maxHeight: 220,
      overflow: 'hidden',
      backgroundColor: getColor('card'),
      elevation: 8,
      shadowColor: theme.colors.shadow.color,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      zIndex: 100,
      marginTop: 8,
      borderWidth: 1,
      borderColor: getColor('border'),
    },
    resultItem: {
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
      backgroundColor: 'transparent',
      flexDirection: 'row',
      alignItems: 'center',
    },
    resultIconBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    resultTextContainer: {
      flex: 1,
    },
    currentLocationButtonContainer: {
      position: 'absolute',
      bottom: 36,
      right: 16,
      zIndex: 10,
    },
    currentLocationButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 8,
      shadowColor: theme.colors.shadow.color,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      borderWidth: 1,
      borderColor: getColor('border'),
    },
    bottomSheet: {
      backgroundColor: getColor('card'),
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 16,
      paddingBottom: insets.bottom + 16,
      paddingHorizontal: 20,
      shadowColor: theme.colors.shadow.color,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 16,
      marginTop: -20,
    },
    bottomSheetContent: {
      width: '100%',
      alignItems: 'center',
    },
    buttonContainer: {
      width: '100%',
      paddingTop: 16,
    },
    bottomSheetTitle: {
      color: getColor('subText'),
      fontSize: getTypography('h2'),
      fontWeight: '600',
      letterSpacing: 1.5,
      marginBottom: 24,
      textAlign: 'center',
      textTransform: 'uppercase',
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
      width: '100%',
      paddingBottom: 8,
    },
    selectedLocationContainer: {
      width: '100%',
      backgroundColor: getColor('background'),
      borderRadius: theme.borderRadius.md,
      padding: 14,
      borderWidth: 1,
      borderColor: getColor('border'),
    },
    addressIconBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    selectedLocationText: {
      color: getColor('text'),
      fontSize: getTypography('body'),
      lineHeight: 22,
      fontWeight: '500',
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
    },
    loadingText: {
      color: getColor('subText'),
      fontSize: getTypography('body'),
      marginLeft: 12,
      fontWeight: '500',
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      justifyContent: 'center',
      borderRadius: theme.borderRadius.md,
      paddingVertical: 16,
      paddingHorizontal: 32,
      backgroundColor: getColor('primary'),
      ...Platform.select({
        ios: {
          shadowColor: getColor('primary'),
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          elevation: 6,
        },
      }),
    },
    primaryButtonDisabled: {
      backgroundColor: getColor('border'),
      ...Platform.select({
        ios: {
          shadowOpacity: 0,
        },
        android: {
          elevation: 0,
        },
      }),
    },
    primaryButtonText: {
      color: '#1F2937',
      fontWeight: '700',
      fontSize: getTypography('body'),
      letterSpacing: 0.5,
    },
    primaryButtonTextDisabled: {
      color: getColor('subText'),
    },
    currentLocationDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#2196F3', // Google Maps blue
      borderWidth: 3,
      borderColor: '#fff',
      shadowColor: '#2196F3',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 6,
      elevation: 6,
    },
    currentLocationInner: {
      width: PIN_SIZE * 0.6,
      height: PIN_SIZE * 0.6,
      borderRadius: PIN_SIZE * 0.3,
      backgroundColor: getColor('background'),
    },
  });

  return (
    <View style={{ flex: 1 }}>
      <View
        style={themedStyles.outerContainer}
        accessible={true}
        accessibilityLabel="Map location selection screen"
      >
        {/* Map with rounded top corners */}
        <View style={themedStyles.mapContainer}>
          {!mapReady ? (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: getColor('card'),
              }}
            >
              <ActivityIndicator size="large" color={getColor('primary')} />
            </View>
          ) : (
            <>
              <MapView
                ref={mapRef}
                style={themedStyles.map}
                region={region}
                onRegionChangeComplete={handleRegionChangeComplete}
                showsUserLocation={true}
                showsMyLocationButton={false}
                onPress={() => {
                  Keyboard.dismiss();
                  if (searchResults.length > 0) {
                    setSearchResults([]);
                  }
                }}
              >
                {/* Show current location marker if available */}
                {currentLocation.latitude && currentLocation.longitude && (
                  <Marker
                    coordinate={{
                      latitude: currentLocation.latitude,
                      longitude: currentLocation.longitude,
                    }}
                    title="Current Location"
                    description="Your current location"
                    anchor={{ x: 0.5, y: 0.5 }}
                  >
                    <View style={themedStyles.currentLocationDot} />
                  </Marker>
                )}

                {/* Show selected location marker if different from current location */}
                {selectedLocation && !isCurrentLocationSelected() && (
                  <Marker
                    coordinate={{
                      latitude: selectedLocation.latitude,
                      longitude: selectedLocation.longitude,
                    }}
                    pinColor="red"
                    title="Selected Location"
                    description="Selected address location"
                  />
                )}
              </MapView>
              {/* Center Pin Overlay - Only show when no search results */}
              {searchResults.length === 0 && (
                <View pointerEvents="none" style={themedStyles.centerPinContainer}>
                  <Image
                    source={Images.mapLocation}
                    style={[themedStyles.centerPin, themedStyles.centerPinOffset]}
                  />
                </View>
              )}
            </>
          )}
          {/* Search Bar Overlay */}
          <View pointerEvents="box-none" style={themedStyles.searchBarContainer}>
            <View style={themedStyles.searchBar}>
              <View style={themedStyles.searchIconBadge}>
                <MaterialCommunityIcons name="magnify" size={20} color={getColor('subText')} />
              </View>
              <TextInput
                style={themedStyles.searchInput}
                placeholder="Search Location"
                placeholderTextColor={getColor('placeholder')}
                value={searchQuery}
                onChangeText={handleSearchInputChange}
                accessible={true}
                accessibilityRole="search"
                accessibilityLabel="Search for a location"
                accessibilityHint="Type to search for places and addresses"
                returnKeyType="search"
                autoCapitalize="words"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
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
              {loading && (
                <ActivityIndicator
                  size="small"
                  color={getColor('primary')}
                  style={{ marginLeft: 8 }}
                />
              )}
            </View>
            {searchResults.length > 0 && (
              <View style={[themedStyles.resultsContainer]}>
                <ScrollView
                  style={{ maxHeight: 200 }}
                  contentContainerStyle={{ paddingVertical: 4 }}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled={true}
                >
                  {searchResults.map((result, index) => (
                    <TouchableOpacity
                      key={result.place_id || index}
                      style={themedStyles.resultItem}
                      onPress={() => {
                        const newLocation = {
                          latitude: result.geometry.location.lat,
                          longitude: result.geometry.location.lng,
                        };

                        setRegion({
                          latitude: newLocation.latitude,
                          longitude: newLocation.longitude,
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01,
                        });

                        // Update selected location and get address
                        updateSelectedLocationAndAddress(newLocation);
                        setSearchQuery(result.structured_formatting.main_text);
                        setSearchResults([]);
                      }}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${result.structured_formatting.main_text}`}
                      accessibilityHint={`Selects ${result.structured_formatting.main_text} as the location`}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          themedStyles.resultIconBadge,
                          { backgroundColor: `${getColor('subText')}15` },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="map-marker-outline"
                          size={18}
                          color={getColor('subText')}
                        />
                      </View>
                      <View style={themedStyles.resultTextContainer}>
                        <Text style={{ color: getColor('text'), fontWeight: '600', fontSize: 14 }}>
                          {result.structured_formatting.main_text}
                        </Text>
                        <Text
                          style={{ color: getColor('subText'), fontSize: 12, marginTop: 2 }}
                          numberOfLines={1}
                        >
                          {result.structured_formatting.secondary_text}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
          {/* Use Current Location Button Overlay */}
          <View style={themedStyles.currentLocationButtonContainer}>
            <TouchableOpacity
              style={[themedStyles.currentLocationButton, { backgroundColor: getColor('card') }]}
              onPress={handleGetCurrentLocation}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Use current location"
              accessibilityHint="Centers the map on your current location"
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="crosshairs-gps" size={22} color={getColor('primary')} />
            </TouchableOpacity>
          </View>
        </View>
        {/* Bottom Sheet Section */}
        <View style={themedStyles.bottomSheet}>
          <View style={themedStyles.bottomSheetContent}>
            <SectionDivider text="DELIVERY ADDRESS" style={{ marginBottom: 8 }} fontSize={14} />

            {selectedLocation && (
              <View style={themedStyles.selectedLocationContainer}>
                {addressLoading ? (
                  <View style={themedStyles.loadingContainer}>
                    <ActivityIndicator size="small" color={getColor('primary')} />
                    <Text style={themedStyles.loadingText}>Getting address...</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', flex: 1 }}>
                    <View
                      style={[
                        themedStyles.addressIconBadge,
                        { backgroundColor: `${getColor('primary')}15` },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="map-marker"
                        size={22}
                        color={getColor('primary')}
                      />
                    </View>
                    <Text
                      style={[themedStyles.selectedLocationText, { flex: 1 }]}
                      numberOfLines={5}
                    >
                      {selectedAddressDescription.formatted_address ||
                        selectedAddressDescription.city ||
                        selectedAddressDescription.state ||
                        selectedAddressDescription.country ||
                        'Location selected'}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={themedStyles.buttonContainer}>
            <TouchableOpacity
              style={[
                themedStyles.primaryButton,
                !selectedLocation && themedStyles.primaryButtonDisabled,
              ]}
              onPress={handleLocationConfirm}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Add address details"
              accessibilityHint="Opens form to add more address details"
              accessibilityState={{ disabled: !selectedLocation }}
              activeOpacity={0.85}
              disabled={!selectedLocation}
            >
              <MaterialCommunityIcons
                name="arrow-right"
                size={20}
                color={!selectedLocation ? getColor('subText') : '#1F2937'}
                style={{ marginRight: 8 }}
              />
              <Text
                style={[
                  themedStyles.primaryButtonText,
                  !selectedLocation && themedStyles.primaryButtonTextDisabled,
                ]}
              >
                Add Address Details
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default MapLocationStep;
