import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import MapView, { Callout, Circle, Marker } from 'react-native-maps';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { ThemeText } from '../../components/common/theme/ThemeText';
import { useAuth } from '../../contexts/login/AuthProvider';
import { useAppStateRefresh } from '../../hooks/useAppStateRefresh';
import useVendorStore from '../../store/vendorStore';
import { useTheme } from '../../theme/ThemeContext';
import { AppNavigationProp } from '../../types/navigation';
import { Vendor } from '../../types/vendor';

const ExploreScreen = () => {
  const { getColor, theme } = useTheme();
  const { selectedAddress } = useAuth();
  const navigation = useNavigation<AppNavigationProp>();

  // Get region from selected address or fallback to Pune
  const getRegion = useCallback(() => {
    if (selectedAddress?.coordinates?.latitude && selectedAddress?.coordinates?.longitude) {
      return {
        latitude: selectedAddress.coordinates.latitude,
        longitude: selectedAddress.coordinates.longitude,
        latitudeDelta: 0.08, // Even larger view to show more area
        longitudeDelta: 0.08,
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

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  // const mapRef = useRef<MapView>(null);

  // Get vendors from vendor store
  const { vendors, getVendorsNearLocation } = useVendorStore();

  // Helper function to get vendor coordinates
  const getVendorCoordinates = useCallback((vendor: Vendor) => {
    if (vendor.coordinates) {
      return {
        latitude: vendor.coordinates.latitude,
        longitude: vendor.coordinates.longitude,
      };
    } else if (vendor.location) {
      return {
        latitude: vendor.location.coordinates[1], // latitude
        longitude: vendor.location.coordinates[0], // longitude
      };
    }
    return null;
  }, []);

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
      shadowOffset: { width: 0, height: 2 },
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
      shadowOffset: { width: 0, height: 2 },
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
      flex: 1,
      width: 50,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iosVendorPin: {
      width: 32,
      height: 32,
      backgroundColor: getColor('error'),
      borderRadius: 16,
      borderWidth: 2,
      borderColor: getColor('white'),
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: getColor('shadow'),
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
      position: 'absolute',
      top: -16,
      left: -16,
    },
    iosVendorPinIcon: {
      color: getColor('white'),
      fontSize: 16,
    },
    androidVendorPin: {
      width: 36,
      height: 36,
      backgroundColor: getColor('error'),
      borderRadius: 18,
      borderWidth: 3,
      borderColor: getColor('white'),
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: getColor('shadow'),
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 6,
    },
    calloutContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    calloutCard: {
      width: 240,
      borderRadius: theme.borderRadius.md,
      padding: 12,
      borderWidth: 1,
      backgroundColor: getColor('card'),
    },
    calloutTitle: {
      fontWeight: '700',
      marginBottom: 4,
    },
    calloutSubtitle: {
      marginBottom: 4,
    },
    calloutDescription: {
      marginBottom: 12,
    },
    calloutActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      backgroundColor: 'transparent',
      marginTop: 8,
    },
    calloutButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: theme.borderRadius.sm,
    },
    calloutButtonText: {
      fontWeight: '600',
    },
  });

  // Custom vendor marker component for better cross-platform compatibility
  const VendorMarker = useCallback(
    ({ vendor, coordinates }: { vendor: Vendor; coordinates: any }) => {
      const calloutContent = (
        <Callout tooltip onPress={() => navigation.navigate('VendorProduct', { vendor })}>
          <TouchableOpacity
            onPress={() => navigation.navigate('VendorProduct', { vendor })}
            activeOpacity={0.8}
            style={styles.calloutContainer}
          >
            <View
              style={[
                styles.calloutCard,
                { backgroundColor: getColor('card'), borderColor: getColor('border') },
              ]}
            >
              <ThemeText variant="subtitle" color={getColor('text')} style={styles.calloutTitle}>
                {vendor.name || 'Vendor'}
              </ThemeText>
              <ThemeText
                variant="caption"
                color={getColor('subText')}
                style={styles.calloutSubtitle}
              >
                {typeof vendor.rating === 'number' && vendor.rating > 0
                  ? `${vendor.category || 'Vendor'} • ${vendor.rating}★`
                  : vendor.category || 'Vendor'}
              </ThemeText>
              <ThemeText
                variant="caption"
                color={getColor('text')}
                style={styles.calloutDescription}
                numberOfLines={2}
              >
                {vendor.description || ''}
              </ThemeText>
              <View style={styles.calloutActions}>
                <View style={[styles.calloutButton, { backgroundColor: getColor('primary') }]}>
                  <ThemeText
                    variant="small"
                    color={getColor('white')}
                    style={styles.calloutButtonText}
                  >
                    View
                  </ThemeText>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Callout>
      );

      if (Platform.OS === 'ios') {
        return (
          <Marker key={vendor.shopId} coordinate={coordinates} anchor={{ x: 0.5, y: 1.0 }}>
            <View style={styles.iosVendorPin}>
              <MaterialCommunityIcons name="store" size={16} color={getColor('white')} />
            </View>
            {calloutContent}
          </Marker>
        );
      }

      // Android marker with custom view
      return (
        <Marker key={vendor.shopId} coordinate={coordinates} anchor={{ x: 0.5, y: 1.0 }}>
          <View style={styles.androidVendorPin}>
            <MaterialCommunityIcons name="store" size={18} color={getColor('white')} />
          </View>
          {calloutContent}
        </Marker>
      );
    },
    [getColor, navigation, styles]
  );

  // Memoized vendors based on selected address
  const memoizedVendors = useMemo(() => {
    if (selectedAddress?.coordinates?.latitude && selectedAddress?.coordinates?.longitude) {
      return getVendorsNearLocation({
        latitude: selectedAddress.coordinates.latitude,
        longitude: selectedAddress.coordinates.longitude,
        radius: 5, // 5km radius
      });
    }
    return [];
  }, [selectedAddress, getVendorsNearLocation, vendors]);

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
    }
  }, [selectedAddress, memoizedVendors]);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Trigger handleRefreshVendors when navigating to this screen
      handleRefreshVendors();
    }, [selectedAddress])
  );

  // Auto-refresh vendors when app comes back from background
  useAppStateRefresh({
    onForeground: async () => {
      try {
        handleRefreshVendors();
      } catch (error) {
        console.warn('Error refreshing vendors:', error);
      }
    },
    refreshThreshold: 100000, // Refresh after 100 seconds in background
  });

  const handleRefreshVendors = () => {
    // Force complete re-render of the Explore screen
    setIsRefreshing(true);
    setIsAutoRefreshing(true);
    setShouldRenderMap(false);

    // Reset map and update vendors after a short delay
    setTimeout(() => {
      if (selectedAddress?.coordinates?.latitude && selectedAddress?.coordinates?.longitude) {
        const newRegion = getRegion();

        setRegion(newRegion);
        setShouldRenderMap(true);
        setIsRefreshing(false);

        // Clear auto-refresh state after a short delay
        setTimeout(() => {
          setIsAutoRefreshing(false);
        }, 500);
      }
    }, 100);
  };

  const radiusText =
    isRefreshing || isAutoRefreshing
      ? 'Refreshing vendors...'
      : selectedAddress?.coordinates
      ? `5km radius from ${selectedAddress.name || 'your saved address'} (${
          memoizedVendors.length
        } vendors)`
      : '5km radius from your location';

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
                  description={selectedAddress.addressLine1 || ''}
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
                  radius={4000} // 4km in meters
                  fillColor="rgba(255, 152, 0, 0.15)" // More visible orange fill
                  strokeColor="rgba(255, 152, 0, 0.8)" // Much more visible orange border
                  strokeWidth={2} // Thicker border
                />
              </>
            )}

            {/* Show vendor markers */}
            {vendors.map(vendor => {
              const coordinates = getVendorCoordinates(vendor);
              if (!coordinates) return null;

              return <VendorMarker key={vendor.shopId} vendor={vendor} coordinates={coordinates} />;
            })}
          </MapView>
        ) : (
          <View style={styles.mapLoadingContainer}>
            <ActivityIndicator size="large" color={getColor('primary')} />
            <ThemeText
              variant="body"
              color={getColor('text')}
              style={[styles.loadingText, { marginTop: 16 }]}
            >
              Loading map...
            </ThemeText>
          </View>
        )}

        {/* Header Overlay */}
        <View style={styles.header}>
          <ThemeText variant="h2" color={getColor('text')} style={styles.title}>
            Explore
          </ThemeText>
          <ThemeText variant="body" color={getColor('subText')} style={styles.subtitle}>
            Discover vendors and products near you
          </ThemeText>
          <View style={styles.radiusIndicator}>
            <View style={styles.radiusDot} />
            <ThemeText variant="caption" color={getColor('subText')} style={styles.radiusText}>
              {radiusText}
            </ThemeText>
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
