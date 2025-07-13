import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView from 'react-native-maps';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import axiosInstance from '../../../config/api/axios.config';
import { useLocationPermission } from '../../../hooks/Permissions/usePermissions';
import { useTheme } from '../../../theme/ThemeContext';

const { width, height } = Dimensions.get('window');

interface Location {
  latitude: number;
  longitude: number;
}

interface MapLocationStepProps {
  onLocationSelect: (location: Location) => void;
}

interface SearchResult {
  place: string;
  latitude?: number;
  longitude?: number;
}

const PIN_SIZE = 48;
const MAP_HEIGHT = height * 0.8;

const MapLocationStep = ({ onLocationSelect }: MapLocationStepProps) => {
  const { getColor, getTypography, theme } = useTheme();
  const {
    checkLocationPermission,
    requestLocationPermission,
    getCurrentLocation,
    location: currentLocation,
  } = useLocationPermission();

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
  console.log('searchResults', searchResults);
  // When current location is available, center map and update selected location
  useEffect(() => {
    if (currentLocation.latitude && currentLocation.longitude) {
      setRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setSelectedLocation({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });
    }
  }, [currentLocation.latitude, currentLocation.longitude]);

  const handleGetCurrentLocation = () => {
    getCurrentLocation();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        'https://maps.olakrutrim.com/places/v1/autocomplete',
        {
          params: {
            text: searchQuery,
            apiKey: '4BCmnjxofvyjOnyJ0Sn6lHBBQ0yv6TALIrsRvE36',
          },
        }
      );
      setSearchResults(response.data.suggestions || []);
    } catch (err) {
      // handle error
    } finally {
      setLoading(false);
    }
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
      marginTop: 4,
      elevation: 4,
      shadowColor: theme.colors.shadow.color,
      shadowOffset: theme.colors.shadow.offset,
      shadowOpacity: theme.colors.shadow.opacity,
      shadowRadius: theme.colors.shadow.radius,
    },
    resultItem: {
      padding: 12,
      borderBottomWidth: 1,
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
  });

  return (
    <View style={themedStyles.outerContainer}>
      {/* Map with rounded top corners */}
      <View style={themedStyles.mapContainer}>
        <MapView
          style={themedStyles.map}
          region={region}
          onRegionChangeComplete={handleRegionChangeComplete}
          showsUserLocation={true}
          showsMyLocationButton={false}
        />
        {/* Center Pin Overlay */}
        <View pointerEvents="none" style={themedStyles.centerPinContainer}>
          <Image
            source={require('../../../assets/images/map-location.png')}
            style={themedStyles.centerPin}
          />
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
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
            {loading && (
              <ActivityIndicator
                size="small"
                color={getColor('primary')}
                style={{ marginLeft: 8 }}
              />
            )}
          </View>
          {searchResults.length > 0 && (
            <View style={[themedStyles.resultsContainer, { backgroundColor: getColor('card') }]}>
              {searchResults.map((result, index) => (
                <TouchableOpacity
                  key={index}
                  style={[themedStyles.resultItem, { borderBottomColor: getColor('border') }]}
                  onPress={() => {
                    setSearchQuery(result.place);
                    setSearchResults([]);
                  }}
                >
                  <Text style={{ color: getColor('text') }}>{result.place}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </KeyboardAvoidingView>
        {/* Use Current Location Button Overlay */}
        <View style={themedStyles.currentLocationButtonContainer}>
          <TouchableOpacity
            style={[themedStyles.currentLocationButton, { backgroundColor: getColor('card') }]}
            onPress={handleGetCurrentLocation}
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
  );
};

export default MapLocationStep;
