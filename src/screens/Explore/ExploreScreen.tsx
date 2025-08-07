import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useLocation } from '../../hooks/Permissions/useLocation';
import { useTheme } from '../../theme/ThemeContext';

// Vendor data type
interface Vendor {
  id: string;
  name: string;
  type: 'restaurant' | 'grocery' | 'pharmacy' | 'retail';
  rating: number;
  distance: number;
  coordinate: {
    latitude: number;
    longitude: number;
  };
}

const ExploreScreen = () => {
  const { getColor, theme } = useTheme();
  const {
    checkLocationPermission,
    requestLocationPermission,
    getCurrentLocation,
    location: currentLocation,
  } = useLocation();

  const [region, setRegion] = useState({
    latitude: 18.5204, // Default to Pune
    longitude: 73.8567,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [loading, setLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [_locationStatus, setLocationStatus] = useState('Initializing...');
  const [shouldRenderMap, setShouldRenderMap] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const mapRef = useRef<MapView>(null);

  // Generate random vendors within 3km radius
  const generateRandomVendors = (centerLat: number, centerLng: number): Vendor[] => {
    const vendorTypes: Vendor['type'][] = ['restaurant', 'grocery', 'pharmacy', 'retail'];
    const vendorNames = [
      'Quick Bites',
      'Fresh Mart',
      'Health Plus',
      'Urban Store',
      'Tasty Corner',
      'Green Grocery',
      'MediCare',
      'City Market',
      'Food Hub',
      'Daily Needs',
      'Wellness Store',
      'Local Mart',
    ];

    const vendors: Vendor[] = [];
    const maxRadius = 3; // 3km radius

    for (let i = 0; i < 10; i++) {
      // Generate random distance within 3km
      const distance = Math.random() * maxRadius;

      // Generate random angle
      const angle = Math.random() * 2 * Math.PI;

      // Convert distance to degrees (approximate)
      // 1 degree latitude ≈ 111km, 1 degree longitude ≈ 111km * cos(latitude)
      const latDelta = distance / 111;
      const lngDelta = distance / (111 * Math.cos((centerLat * Math.PI) / 180));

      // Calculate new coordinates
      const latitude = centerLat + latDelta * Math.cos(angle);
      const longitude = centerLng + lngDelta * Math.sin(angle);

      const vendor: Vendor = {
        id: `vendor_${i}`,
        name: vendorNames[Math.floor(Math.random() * vendorNames.length)],
        type: vendorTypes[Math.floor(Math.random() * vendorTypes.length)],
        rating: Math.floor(Math.random() * 5) + 1,
        distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
        coordinate: { latitude, longitude },
      };

      vendors.push(vendor);
    }

    return vendors;
  };

  // Get vendor icon based on type
  const getVendorIcon = (type: Vendor['type']) => {
    switch (type) {
      case 'restaurant':
        return 'food-fork-drink';
      case 'grocery':
        return 'shopping';
      case 'pharmacy':
        return 'medical-bag';
      case 'retail':
        return 'store';
      default:
        return 'map-marker';
    }
  };

  // Get vendor color based on type
  const getVendorColor = (type: Vendor['type']) => {
    switch (type) {
      case 'restaurant':
        return '#FF6B6B'; // Red
      case 'grocery':
        return '#4ECDC4'; // Teal
      case 'pharmacy':
        return '#45B7D1'; // Blue
      case 'retail':
        return '#96CEB4'; // Green
      default:
        return '#FFA500'; // Orange
    }
  };

  // Delay map rendering to avoid crash
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRenderMap(true);
    }, 1000); // 1 second delay

    return () => clearTimeout(timer);
  }, []);

  // On mount, fetch and center on current location
  useEffect(() => {
    (async () => {
      try {
        setLocationStatus('Checking permissions...');
        const hasPermission = await checkLocationPermission();
        if (!hasPermission) {
          setLocationStatus('Requesting permissions...');
          await requestLocationPermission();
        }
        setLocationStatus('Getting location...');
        getCurrentLocation();
        setLocationStatus('Location ready');
      } catch (error) {
        console.error('Error initializing location:', error);
        setLocationStatus('Error getting location');
      }
    })();
  }, [checkLocationPermission, getCurrentLocation, requestLocationPermission]);

  // When current location is available, center map and generate vendors
  useEffect(() => {
    if (
      typeof currentLocation.latitude === 'number' &&
      typeof currentLocation.longitude === 'number'
    ) {
      const newRegion = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);

      // Generate random vendors around current location
      const randomVendors = generateRandomVendors(
        currentLocation.latitude,
        currentLocation.longitude
      );
      setVendors(randomVendors);
    }
  }, [currentLocation.latitude, currentLocation.longitude]);

  const handleGetCurrentLocation = async () => {
    setLoading(true);
    try {
      setLocationStatus('Getting current location...');

      // Actually fetch current location
      const newCoords = await getCurrentLocation();

      console.log('New coordinates received:', newCoords);

      if (
        newCoords &&
        typeof newCoords.latitude === 'number' &&
        typeof newCoords.longitude === 'number'
      ) {
        const newLocation = {
          latitude: newCoords.latitude,
          longitude: newCoords.longitude,
        };

        console.log('Setting new location:', newLocation);

        const newRegion = {
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        // Update the region state
        setRegion(newRegion);

        // Use animateToRegion for smooth animation to current location
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }

        // Regenerate vendors for new location
        const randomVendors = generateRandomVendors(newLocation.latitude, newLocation.longitude);
        setVendors(randomVendors);

        setLocationStatus('Location updated successfully');
        console.log('Location updated and vendors regenerated');
      } else {
        console.error('Invalid coordinates received:', newCoords);
        setLocationStatus('Error: Invalid location data');
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      setLocationStatus('Error updating location');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: getColor('background'),
    },
    mapContainer: {
      flex: 1,
      overflow: 'hidden',
    },
    map: {
      ...StyleSheet.absoluteFillObject,
    },
    header: {
      position: 'absolute',
      top: 50,
      left: 20,
      right: 20,
      backgroundColor: getColor('card'),
      padding: 16,
      borderRadius: theme.borderRadius.md,
      zIndex: 10,
      elevation: 6,
      shadowColor: theme.colors.shadow.color,
      shadowOffset: theme.colors.shadow.offset,
      shadowOpacity: theme.colors.shadow.opacity,
      shadowRadius: theme.colors.shadow.radius,
    },
    title: {
      color: getColor('text'),
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    subtitle: {
      color: getColor('subText'),
      fontSize: 14,
      fontWeight: '400',
    },
    currentLocationButton: {
      position: 'absolute',
      bottom: 100,
      right: 20,
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      padding: 12,
      elevation: 6,
      shadowColor: theme.colors.shadow.color,
      shadowOffset: theme.colors.shadow.offset,
      shadowOpacity: theme.colors.shadow.opacity,
      shadowRadius: theme.colors.shadow.radius,
    },
    currentLocationDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#2196F3',
      borderWidth: 3,
      borderColor: '#fff',
      shadowColor: '#2196F3',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 6,
      elevation: 6,
    },
    vendorMarker: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 3,
      borderColor: '#fff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 20,
    },
    loadingContainer: {
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
    },
    loadingText: {
      color: getColor('text'),
      marginLeft: 12,
      fontSize: 16,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      color: getColor('text'),
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 16,
    },
    retryButton: {
      backgroundColor: getColor('primary'),
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: theme.borderRadius.md,
    },
    retryButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    mapLoadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: getColor('card'),
    },
    radiusIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: getColor('border'),
    },
    radiusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#2196F3',
      marginRight: 8,
    },
    radiusText: {
      color: getColor('subText'),
      fontSize: 12,
    },
  });

  // Show error state if map failed to load
  if (mapError) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="map-marker-alert" size={64} color={getColor('subText')} />
          <Text style={styles.errorText}>{mapError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => setMapError(null)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Full Screen Map */}
      <View style={styles.mapContainer}>
        {shouldRenderMap ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            region={region}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={true}
            showsScale={true}
            showsBuildings={true}
            showsIndoors={true}
            rotateEnabled={true}
            scrollEnabled={true}
            zoomEnabled={true}
            pitchEnabled={true}
            toolbarEnabled={false}
          >
            {/* Show current location marker if available */}
            {currentLocation.latitude && currentLocation.longitude && (
              <>
                <Marker
                  coordinate={{
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                  }}
                  title="Current Location"
                  description="Your current location"
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View style={styles.currentLocationDot} />
                </Marker>

                {/* Show 3km radius circle */}
                <Circle
                  center={{
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                  }}
                  radius={3000} // 3km in meters
                  fillColor="rgba(33, 150, 243, 0.1)" // Light blue with transparency
                  strokeColor="rgba(33, 150, 243, 0.3)" // Blue border
                  strokeWidth={2}
                />
              </>
            )}

            {/* Show vendor markers */}
            {vendors.map(vendor => (
              <Marker
                key={vendor.id}
                coordinate={vendor.coordinate}
                title={vendor.name}
                description={`${vendor.type} • ${vendor.rating}★ • ${vendor.distance}km`}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View
                  style={[styles.vendorMarker, { backgroundColor: getVendorColor(vendor.type) }]}
                >
                  <MaterialCommunityIcons
                    name={
                      getVendorIcon(vendor.type) as keyof typeof MaterialCommunityIcons.glyphMap
                    }
                    size={16}
                    color="#fff"
                  />
                </View>
              </Marker>
            ))}
          </MapView>
        ) : (
          <View style={styles.mapLoadingContainer}>
            <ActivityIndicator size="large" color={getColor('primary')} />
            <Text style={[styles.loadingText, { marginTop: 16 }]}>Loading map...</Text>
          </View>
        )}

        {/* Header Overlay */}
        <View style={styles.header}>
          <Text style={styles.title}>Explore</Text>
          <Text style={styles.subtitle}>Discover vendors and products near you</Text>
          <View style={styles.radiusIndicator}>
            <View style={styles.radiusDot} />
            <Text style={styles.radiusText}>3km radius from your location</Text>
          </View>
        </View>

        {/* Current Location Button */}
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={handleGetCurrentLocation}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={getColor('primary')} />
          ) : (
            <MaterialCommunityIcons name="crosshairs-gps" size={24} color={getColor('primary')} />
          )}
        </TouchableOpacity>

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={getColor('primary')} />
              <Text style={styles.loadingText}>Getting your location...</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export default ExploreScreen;
