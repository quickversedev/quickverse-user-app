import debounce from 'lodash.debounce';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Images } from '../../../../assets';
import SectionDivider from '../../../../components/common/SectionDivider';
import { useLocation } from '../../../../hooks/Permissions/useLocation';
import {
  getAddressFromCoordinates,
  getAutocompleteSuggestions,
  type Location,
  type SearchResult,
} from '../../../../services/api/locationService';
import { useTheme } from '../../../../theme/ThemeContext';
import { getRegionFromLocation } from '../utils/mapUtils';

const { width, height } = Dimensions.get('window');

interface MapLocationStepProps {
  onLocationSelect: (location: Location) => void;
}

const PIN_SIZE = Math.max(48, width * 0.12);
const MAP_HEIGHT = height * 0.65;

const MapLocationStep = ({ onLocationSelect }: MapLocationStepProps) => {
  const { getColor, getTypography, theme } = useTheme();
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
  const [region, setRegion] = useState({
    latitude: 18.5204, // Default to Pune
    longitude: 73.8567,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedAddressDescription, setSelectedAddressDescription] = useState<string>('');
  const mapRef = useRef<MapView>(null);

  // Function to get address from coordinates with proper error handling
  const getAddressFromCoordinatesWithLoading = async (coordinates: Location): Promise<string> => {
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
      setSelectedAddressDescription('Location selected (address unavailable)');
    }
  };

  // On mount, fetch and center on current location
  useEffect(() => {
    (async () => {
      const hasPermission = await checkLocationPermission();
      if (!hasPermission) {
        await requestLocationPermission();
      }
      getCurrentLocation();
    })();
  }, [checkLocationPermission, getCurrentLocation, requestLocationPermission]);

  // When current location is available, center map and update selected location
  useEffect(() => {
    if (
      typeof currentLocation.latitude === 'number' &&
      typeof currentLocation.longitude === 'number'
    ) {
      const newLocation = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      };

      setRegion(getRegionFromLocation(newLocation));

      // Update selected location and get address
      updateSelectedLocationAndAddress(newLocation);
    }
  }, [currentLocation.latitude, currentLocation.longitude]);

  const handleGetCurrentLocation = async () => {
    try {
      console.log('Getting current location...');

      // // Get current location and wait for it to be available
      // const coords = await getCurrentLocation();
      // console.log('Current location obtained:', coords);

      const newLocation = {
        latitude: Number(currentLocation.latitude),
        longitude: Number(currentLocation.longitude),
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

  const latitude = selectedLocation?.latitude ?? 18.5204;
  const longitude = selectedLocation?.longitude ?? 73.8567;

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
      onLocationSelect(selectedLocation);
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
      backgroundColor: getColor('background'),
    },
    mapContainer: {
      // borderTopLeftRadius: theme.borderRadius.md,
      // borderTopRightRadius: theme.borderRadius.md,
      overflow: 'hidden',
      height: MAP_HEIGHT,
      width: '100%',
      backgroundColor: getColor('card'),
    },
    map: {
      ...StyleSheet.absoluteFillObject,
      borderTopLeftRadius: theme.borderRadius.md,
      borderTopRightRadius: theme.borderRadius.md,
    },
    centerPinContainer: {
      position: 'absolute',
      left: width / 2 - PIN_SIZE / 2,
      top: MAP_HEIGHT / 2 - PIN_SIZE,
      width: PIN_SIZE,
      height: PIN_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 20,
      pointerEvents: 'none',
    },
    centerPin: {
      width: PIN_SIZE,
      height: PIN_SIZE,
      resizeMode: 'contain',
    },
    searchBarContainer: {
      position: 'absolute',
      top: 20,
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 10,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '92%',
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 8,
      elevation: 6,
      shadowColor: theme.colors.shadow.color,
      shadowOffset: theme.colors.shadow.offset,
      shadowOpacity: theme.colors.shadow.opacity,
      shadowRadius: theme.colors.shadow.radius,
    },
    searchInput: {
      flex: 1,
      height: 40,
      fontSize: getTypography('body'),
    },
    resultsContainer: {
      width: '92%',
      borderRadius: theme.borderRadius.md,
      maxHeight: 200,
      overflow: 'hidden', // Ensures children don't overflow the border
      backgroundColor: getColor('card'),
      alignSelf: 'center',
      elevation: 4,
      shadowColor: theme.colors.shadow.color,
      shadowOffset: theme.colors.shadow.offset,
      shadowOpacity: theme.colors.shadow.opacity,
      shadowRadius: theme.colors.shadow.radius,
    },
    resultItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
      backgroundColor: 'transparent',
    },
    currentLocationButtonContainer: {
      position: 'absolute',
      bottom: 40,
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 10,
    },
    currentLocationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: theme.borderRadius.md,
      elevation: 6,
      shadowColor: theme.colors.shadow.color,
      shadowOffset: theme.colors.shadow.offset,
      shadowOpacity: theme.colors.shadow.opacity,
      shadowRadius: theme.colors.shadow.radius,
    },
    currentLocationText: {
      fontSize: getTypography('body'),
      fontWeight: '500',
    },
    bottomSheet: {
      flex: 1,
      backgroundColor: getColor('card'),
      borderTopLeftRadius: theme.borderRadius.md,
      borderTopRightRadius: theme.borderRadius.md,
      paddingTop: 10,
      // paddingBottom: 32,
      paddingHorizontal: 24,
      alignItems: 'center',
      shadowColor: theme.colors.shadow.color,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: theme.colors.shadow.opacity,
      shadowRadius: theme.colors.shadow.radius,
      elevation: 12,
      marginTop: -24,
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
      padding: 16,
      marginBottom: 16,
    },
    selectedLocationText: {
      color: getColor('text'),
      fontSize: getTypography('body'),
      lineHeight: 20,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
    },
    loadingText: {
      color: getColor('subText'),
      fontSize: getTypography('caption'),
      marginLeft: 8,
    },
    outlinedButton: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: getColor('primary'),
      borderRadius: theme.borderRadius.md,
      paddingVertical: 10,
      paddingHorizontal: 32,
      marginTop: 8,
      backgroundColor: 'transparent',
    },
    outlinedButtonText: {
      color: getColor('primary'),
      fontWeight: '600',
      fontSize: getTypography('body'),
      letterSpacing: 0.5,
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View
        style={themedStyles.outerContainer}
        accessible={true}
        accessibilityLabel="Map location selection screen"
      >
        {/* Map with rounded top corners */}
        <View style={themedStyles.mapContainer}>
          <MapView
            ref={mapRef}
            style={themedStyles.map}
            region={region}
            onRegionChangeComplete={handleRegionChangeComplete}
            showsUserLocation={true}
            showsMyLocationButton={false}
            onPress={Keyboard.dismiss}
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
          {/* Center Pin Overlay */}
          <View pointerEvents="none" style={themedStyles.centerPinContainer}>
            <Image source={Images.mapLocation} style={themedStyles.centerPin} />
          </View>
          {/* Search Bar Overlay */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={themedStyles.searchBarContainer}
          >
            <View
              style={[
                themedStyles.searchBar,
                { backgroundColor: getColor('card'), borderColor: getColor('border') },
              ]}
            >
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
                      <Text style={{ color: getColor('text'), fontWeight: 'bold' }}>
                        {result.structured_formatting.main_text}
                      </Text>
                      <Text style={{ color: getColor('subText'), fontSize: 12 }}>
                        {result.structured_formatting.secondary_text}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </KeyboardAvoidingView>
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
              <MaterialCommunityIcons
                name="crosshairs-gps"
                size={20}
                color={getColor('primary')}
                style={{ marginRight: 8 }}
              />
              <Text style={[themedStyles.currentLocationText, { color: getColor('text') }]}>
                Use Current Location
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Bottom Sheet Section */}
        <View style={themedStyles.bottomSheet}>
          <SectionDivider text="DELIVERY ADDRESS" style={{ marginBottom: 16 }} fontSize={14} />

          {selectedLocation && (
            <View style={themedStyles.selectedLocationContainer}>
              {addressLoading ? (
                <View style={themedStyles.loadingContainer}>
                  <ActivityIndicator size="small" color={getColor('primary')} />
                  <Text style={themedStyles.loadingText}>Getting address...</Text>
                </View>
              ) : (
                <Text style={themedStyles.selectedLocationText} numberOfLines={3}>
                  {selectedAddressDescription || 'Location selected'}
                </Text>
              )}
            </View>
          )}

          <TouchableOpacity
            style={themedStyles.outlinedButton}
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
              name="plus"
              size={20}
              color={getColor('primary')}
              style={{ marginRight: 8 }}
            />
            <Text style={themedStyles.outlinedButtonText}>Add Address Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default MapLocationStep;
