import axios from 'axios';
import debounce from 'lodash.debounce';
import React, { useEffect, useMemo, useState } from 'react';
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
import { v4 as uuidv4 } from 'uuid';
import { Images } from '../../../../assets';
import { useLocation } from '../../../../hooks/Permissions/useLocation';
import { useTheme } from '../../../../theme/ThemeContext';
import { getRegionFromLocation } from '../utils/mapUtils';

const { width, height } = Dimensions.get('window');

interface Location {
  latitude: number;
  longitude: number;
}

interface MapLocationStepProps {
  onLocationSelect: (location: Location) => void;
}

interface SearchResult {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

const PIN_SIZE = Math.max(48, width * 0.12);
const MAP_HEIGHT = height * 0.8;

const OLA_MAPS_AUTOCOMPLETE_ENDPOINT = 'https://api.olamaps.io/places/v1/autocomplete';
const OLA_API_KEY = '4BCmnjxofvyjOnyJ0Sn6lHBBQ0yv6TALIrsRvE36';

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
  const [region, setRegion] = useState({
    latitude: 18.5204, // Default to Pune
    longitude: 73.8567,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  // On mount, fetch and center on current location
  useEffect(() => {
    (async () => {
      const hasPermission = await checkLocationPermission();
      if (!hasPermission) {
        await requestLocationPermission();
      }
      getCurrentLocation();
    })();
  }, []);

  // When current location is available, center map and update selected location
  useEffect(() => {
    if (
      typeof currentLocation.latitude === 'number' &&
      typeof currentLocation.longitude === 'number'
    ) {
      setRegion(
        getRegionFromLocation({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        })
      );
      setSelectedLocation({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });
    }
  }, [currentLocation.latitude, currentLocation.longitude]);

  const handleGetCurrentLocation = () => {
    getCurrentLocation();
    if (
      typeof currentLocation.latitude === 'number' &&
      typeof currentLocation.longitude === 'number'
    ) {
      setRegion(
        getRegionFromLocation({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        })
      );
      setSelectedLocation({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });
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
        const requestId = uuidv4();

        try {
          const response = await axios.get(OLA_MAPS_AUTOCOMPLETE_ENDPOINT, {
            params: {
              input: currentSearchQuery,
              api_key: OLA_API_KEY,
              location: `${Number(latitude)},${Number(longitude)}`,
            },
            headers: {
              Accept: 'application/json',
              'X-Request-Id': requestId,
            },
          });
          if (response.data && Array.isArray(response.data.predictions)) {
            setSearchResults(response.data.predictions);
          } else {
            console.warn('OlaPlaceAutocomplete: Unexpected response structure', response.data);
            setSearchResults([]);
          }
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
    setSelectedLocation({ latitude: newRegion.latitude, longitude: newRegion.longitude });
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
      marginTop: 16,
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
                        setRegion({
                          latitude: result.geometry.location.lat,
                          longitude: result.geometry.location.lng,
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01,
                        });
                        setSelectedLocation({
                          latitude: result.geometry.location.lat,
                          longitude: result.geometry.location.lng,
                        });
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
          <TouchableOpacity
            style={themedStyles.outlinedButton}
            onPress={handleLocationConfirm}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Confirm address location"
            accessibilityHint="Confirms the selected location and proceeds to address details"
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
            <Text style={themedStyles.outlinedButtonText}>confirm Address</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default MapLocationStep;
