import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAuth } from '../../contexts/login/AuthProvider';
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
  const { selectedAddress } = useAuth();

  // Get region from selected address or fallback to Pune
  const getRegion = useCallback(() => {
    if (selectedAddress?.coordinates?.latitude && selectedAddress?.coordinates?.longitude) {
      return {
        latitude: selectedAddress.coordinates.latitude,
        longitude: selectedAddress.coordinates.longitude,
        latitudeDelta: 0.062, // Even larger view to show more area
        longitudeDelta: 0.062,
      };
    }
    return {
      latitude: 18.5204, // Default to Pune
      longitude: 73.8567,
      latitudeDelta: 0.06,
      longitudeDelta: 0.06,
    };
  }, [selectedAddress]);

  const [region, setRegion] = useState(getRegion());
  const [shouldRenderMap, setShouldRenderMap] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  // const mapRef = useRef<MapView>(null);

  // Generate vendors in 5km radius around selected address
  const generateVendors = useCallback((centerLat: number, centerLng: number): Vendor[] => {
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
    const maxRadius = 5; // 5km radius

    for (let i = 0; i < 15; i++) {
      // Generate random distance within 5km
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
  }, []);

  // Memoized vendors based on selected address
  const memoizedVendors = useMemo(() => {
    if (selectedAddress?.coordinates?.latitude && selectedAddress?.coordinates?.longitude) {
      return generateVendors(
        selectedAddress.coordinates.latitude,
        selectedAddress.coordinates.longitude
      );
    }
    return [];
  }, [selectedAddress, generateVendors]);

  // Initialize map when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRenderMap(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Update region and vendors when selectedAddress changes
  useEffect(() => {
    if (selectedAddress?.coordinates?.latitude && selectedAddress?.coordinates?.longitude) {
      const newRegion = getRegion();
      setRegion(newRegion);
      setVendors(memoizedVendors);
    }
  }, [selectedAddress]);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Trigger handleRefreshVendors when navigating to this screen
      handleRefreshVendors();
    }, [selectedAddress])
  );

  const handleRefreshVendors = () => {
    // Force complete re-render of the Explore screen
    setIsRefreshing(true);
    setIsAutoRefreshing(true);
    setShouldRenderMap(false);
    setVendors([]);

    // Reset map and regenerate everything after a short delay
    setTimeout(() => {
      if (selectedAddress?.coordinates?.latitude && selectedAddress?.coordinates?.longitude) {
        const newRegion = getRegion();
        const newVendors = generateVendors(
          selectedAddress.coordinates.latitude,
          selectedAddress.coordinates.longitude
        );

        setRegion(newRegion);
        setVendors(newVendors);
        setShouldRenderMap(true);
        setIsRefreshing(false);

        // Clear auto-refresh state after a short delay
        setTimeout(() => {
          setIsAutoRefreshing(false);
        }, 500);
      }
    }, 100);
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

    loadingText: {
      color: getColor('text'),
      marginLeft: 12,
      fontSize: 16,
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
    customMapPin: {
      width: 50,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: 25,
      borderWidth: 2,
      borderColor: '#FF6B6B',
    },
  });

  return (
    <View style={styles.container}>
      {/* Full Screen Map */}
      <View style={styles.mapContainer}>
        {shouldRenderMap ? (
          <MapView
            // ref={mapRef}
            style={styles.map}
            region={region}
            showsUserLocation={false}
            showsMyLocationButton={true}
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
            {/* Show selected address marker */}
            {selectedAddress?.coordinates && (
              <>
                <Marker
                  coordinate={{
                    latitude: selectedAddress.coordinates.latitude,
                    longitude: selectedAddress.coordinates.longitude,
                  }}
                  title={selectedAddress.name || 'Selected Address'}
                  description={selectedAddress.addressLine1}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View style={[styles.currentLocationDot, { backgroundColor: '#FF9800' }]} />
                </Marker>

                {/* Show 5km radius circle */}
                <Circle
                  center={{
                    latitude: selectedAddress.coordinates.latitude,
                    longitude: selectedAddress.coordinates.longitude,
                  }}
                  radius={5000} // 5km in meters
                  fillColor="rgba(255, 152, 0, 0.15)" // More visible orange fill
                  strokeColor="rgba(255, 152, 0, 0.8)" // Much more visible orange border
                  strokeWidth={3} // Thicker border
                />

                {/* Additional smaller circle for better visibility */}
                <Circle
                  center={{
                    latitude: selectedAddress.coordinates.latitude,
                    longitude: selectedAddress.coordinates.longitude,
                  }}
                  radius={1000} // 1km inner circle
                  fillColor="rgba(255, 152, 0, 0.05)" // Very light fill
                  strokeColor="rgba(255, 152, 0, 0.4)" // Medium visibility border
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
                anchor={{ x: 0.5, y: 1.0 }}
              >
                <View style={styles.customMapPin}>
                  <MaterialCommunityIcons name="map-marker" size={30} color="#FF6B6B" />
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
            <Text style={styles.radiusText}>
              {isRefreshing || isAutoRefreshing
                ? 'Refreshing vendors...'
                : selectedAddress?.coordinates
                ? `5km radius from ${selectedAddress.name || 'your saved address'} (${
                    vendors.length
                  } vendors)`
                : '5km radius from your location'}
            </Text>
          </View>
        </View>

        {/* Refresh Button */}
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={handleRefreshVendors}
          activeOpacity={0.85}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color={getColor('primary')} />
          ) : (
            <MaterialCommunityIcons name="refresh" size={24} color={getColor('primary')} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ExploreScreen;
