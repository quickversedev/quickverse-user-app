import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import { SectionDivider } from '../../components/common';
import PromoBanner from '../../components/common/promo/PromoBanner';
import { ThemeText } from '../../components/common/theme/ThemeText';
import { useAuth } from '../../contexts/login/AuthProvider';
import useCouponStore from '../../store/cart/couponStore';
import { useTheme } from '../../theme/ThemeContext';
import { Promotion } from '../../types/pages';
import { Vendor } from '../../types/vendor';
import { formatTimeToAMPM } from '../../utils/storeUtils';

interface VendorProfileRouteParams {
  vendor: Vendor;
}
type VendorProfileRouteProp = RouteProp<
  { VendorProfile: VendorProfileRouteParams },
  'VendorProfile'
>;

const { width: screenWidth } = Dimensions.get('window');

// Utility function to calculate contrasting colors
const getContrastingColors = (backgroundColor: string) => {
  // Convert hex to RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return contrasting colors based on background brightness
  if (luminance > 0.5) {
    // Light background - use dark text
    return {
      titleColor: '#000000',
      subtitleColor: '#333333',
    };
  } else {
    // Dark background - use light text
    return {
      titleColor: '#ffffff',
      subtitleColor: '#cccccc',
    };
  }
};

const VendorProfileComponent: React.FC = () => {
  const { getColor, getTypography } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<VendorProfileRouteProp>();
  const { vendor } = route.params;
  const { authData } = useAuth();

  // Coupon store integration
  const { availableCoupons, fetchVendorOffers } = useCouponStore();

  const [currentOffer, setCurrentOffer] = useState(0);
  const offersScrollRef = useRef<ScrollView>(null);

  // Calculate responsive card width and spacing
  const cardWidth = useMemo(() => {
    const horizontalPadding = 32; // 16px on each side
    const availableWidth = screenWidth - horizontalPadding;
    return Math.min(availableWidth * 0.95, 320); // 95% of available width, max 320px
  }, []);

  const scrollOffset = cardWidth + 12;

  // Fetch coupons when component mounts
  useEffect(() => {
    if (authData?.jwt) {
      fetchVendorOffers(vendor.shopId, authData);
    }
  }, [fetchVendorOffers, vendor.shopId, authData]);

  // Get coupons for this vendor
  const vendorCoupons = useMemo(() => {
    return availableCoupons[vendor.shopId] || [];
  }, [availableCoupons, vendor.shopId]);

  // Convert coupons to Promotion format for PromoBanner
  const couponPromotions = useMemo((): Promotion[] => {
    return vendorCoupons.map(coupon => {
      const backgroundColor = getColor('primary');
      const contrastingColors = getContrastingColors(backgroundColor);

      return {
        shopId: vendor.shopId,
        title: coupon.code,
        subtitle: coupon.description,
        size: 'small',
        imageURL: '', // Empty string since coupons don't have images, PromoBanner will use fallback
        backgroundColor: backgroundColor,
        bannerImage: false, // Use regular mode for coupons
        // Add contrasting colors to the promotion object
        titleColor: contrastingColors.titleColor,
        subtitleColor: contrastingColors.subtitleColor,
      };
    });
  }, [vendorCoupons, getColor, vendor.shopId]);

  // Memoized values
  const vendorCoordinates = useMemo(() => {
    if (vendor.coordinates) {
      return {
        latitude: vendor.coordinates.latitude,
        longitude: vendor.coordinates.longitude,
      };
    } else if (vendor.location) {
      return {
        latitude: vendor.location.coordinates[1],
        longitude: vendor.location.coordinates[0],
      };
    }
    return null;
  }, [vendor.coordinates, vendor.location]);

  const formattedAddress = useMemo(() => {
    if (vendor.shopAddress) {
      const { address, city, state, postalCode } = vendor.shopAddress;
      return `${address}, ${city}, ${state} - ${postalCode}`;
    }
    return 'Address not available';
  }, [vendor.shopAddress]);

  const renderRating = useCallback(() => {
    if (!vendor.rating || vendor.rating === 0) {
      return (
        <ThemeText variant="caption" color={getColor('text')} style={styles.statValue}>
          Not Rated
        </ThemeText>
      );
    }
    return (
      <ThemeText variant="caption" color={getColor('text')} style={styles.statValue}>
        {vendor.rating}
      </ThemeText>
    );
  }, [vendor.rating, getColor]);

  const handlePhoneCall = useCallback(async () => {
    if (!vendor.phone) {
      console.warn('No phone number available for vendor');
      return;
    }

    try {
      // Format the phone number properly - remove all non-digit characters except +
      const formattedPhone = vendor.phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');

      // Use the standard tel: scheme which is more reliable
      const phoneUrl = `tel:${formattedPhone}`;

      // Try to open the phone app directly
      await Linking.openURL(phoneUrl);
    } catch (error) {
      console.error('Error making phone call:', error);

      // If the first attempt fails, try with a simpler approach
      try {
        // Remove all formatting and try again
        const cleanPhone = vendor.phone.replace(/\D/g, '');
        const fallbackUrl = `tel:${cleanPhone}`;
        await Linking.openURL(fallbackUrl);
      } catch (fallbackError) {
        console.error('Fallback phone call also failed:', fallbackError);

        // Show user-friendly error message
        Alert.alert(
          'Phone Call Error',
          'Unable to make phone call. Please try again or contact support.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    }
  }, [vendor.phone]);

  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Auto-scroll offers if there are multiple coupons
  useEffect(() => {
    if (couponPromotions.length > 1) {
      const interval = setInterval(() => {
        setCurrentOffer(prev => (prev === couponPromotions.length - 1 ? 0 : prev + 1));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [couponPromotions.length]);

  useEffect(() => {
    if (offersScrollRef.current && couponPromotions.length > 1) {
      const scrollToX = currentOffer * scrollOffset;
      offersScrollRef.current.scrollTo({
        x: scrollToX,
        animated: true,
      });
    }
  }, [currentOffer, couponPromotions.length, scrollOffset]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: getColor('background'),
        },
        banner: {
          width: '100%',
          height: 180,
        },
        backButton: {
          position: 'absolute',
          top: 50,
          left: 16,
          backgroundColor: 'rgba(0,0,0,0.4)',
          borderRadius: 15,
          padding: 8,
          zIndex: 2,
        },
        profileCard: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: getColor('card'),
          borderRadius: 16,
          padding: 16,
          marginHorizontal: 16,
          marginTop: -40,
          elevation: 4,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 8,
          zIndex: 2,
        },
        logo: {
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: getColor('border'),
          marginRight: 16,
        },
        info: {
          flex: 1,
          justifyContent: 'center',
        },
        name: {
          marginBottom: 2,
        },
        saveRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 2,
        },
        saveBtn: {
          backgroundColor: getColor('background'),
          borderRadius: 8,
          paddingHorizontal: 10,
          paddingVertical: 4,
          marginRight: 8,
          flexDirection: 'row',
          alignItems: 'center',
        },
        saveBtnText: {
          marginLeft: 4,
        },
        callBtn: {
          marginLeft: 8,
          backgroundColor: getColor('primary'),
          borderRadius: 20,
          padding: 8,
          opacity: vendor.phone ? 1 : 0.5,
        },
        rowStats: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginHorizontal: 16,
          marginTop: 18,
          marginBottom: 18,
        },
        statCol: {
          alignItems: 'center',
          flex: 1,
        },
        statIcon: {
          marginBottom: 2,
        },
        statLabel: {
          marginTop: 2,
        },
        statValue: {
          marginTop: 2,
        },
        offersRow: {
          flexDirection: 'row',
          marginHorizontal: 16,
          marginTop: 16,
          marginBottom: 16,
        },
        offerCard: {
          width: cardWidth,
          marginRight: 12,
        },
        sectionTitle: {
          marginHorizontal: 16,
          marginTop: 18,
          marginBottom: 8,
        },
        reviewCount: {
          marginLeft: 4,
        },
        mapContainer: {
          marginHorizontal: 16,
          marginTop: 28,
          marginBottom: 24,
          backgroundColor: getColor('card'),
          borderRadius: 12,
          padding: 12,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
        },
        mapAddress: {
          marginBottom: 4,
        },
        mapSubAddress: {
          marginBottom: 8,
        },
        map: {
          width: '100%',
          height: 140,
          borderRadius: 8,
        },
        noOffersText: {
          textAlign: 'center',
          fontStyle: 'italic',
          marginHorizontal: 16,
          marginTop: 8,
          marginBottom: 8,
        },
        navigationButton: {
          position: 'absolute',
          bottom: 12,
          right: 12,
          backgroundColor: getColor('card'),
          borderRadius: 20,
          paddingHorizontal: 12,
          paddingVertical: 8,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
          elevation: 4,
        },
        navigationButtonText: {
          marginLeft: 4,
        },
      }),
    [getColor, getTypography, cardWidth]
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: vendor.banner || vendor.logo }}
            style={styles.banner}
            resizeMode="cover"
          />
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image source={{ uri: vendor.logo }} style={styles.logo} />
          <View style={styles.info}>
            <ThemeText variant="h2" color={getColor('text')} style={styles.name}>
              {vendor.name}
            </ThemeText>
            <View style={styles.saveRow}>
              <TouchableOpacity style={styles.saveBtn}>
                <MaterialCommunityIcons
                  name="bookmark-outline"
                  size={18}
                  color={getColor('subText')}
                />
                <ThemeText variant="caption" color={getColor('subText')} style={styles.saveBtnText}>
                  Save To Collections
                </ThemeText>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            style={styles.callBtn}
            onPress={handlePhoneCall}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Call ${vendor.name}`}
            accessibilityHint="Opens phone app to call this vendor"
            activeOpacity={0.8}
            disabled={!vendor.phone}
          >
            <MaterialCommunityIcons
              name="phone"
              size={22}
              color={vendor.phone ? getColor('background') : getColor('subText')}
            />
          </TouchableOpacity>
        </View>
        {/* Stats Row */}
        <View style={styles.rowStats}>
          <View style={styles.statCol}>
            <MaterialCommunityIcons
              name="flash"
              size={18}
              color={getColor('primary')}
              style={styles.statIcon}
            />
            <ThemeText variant="caption" color={getColor('text')} style={styles.statValue}>
              {vendor.preparationTime}
            </ThemeText>
            <ThemeText variant="body" color={getColor('subText')} style={styles.statLabel}>
              Prepare Time
            </ThemeText>
          </View>
          <View style={styles.statCol}>
            <MaterialCommunityIcons name="star" size={18} color="#1ec28b" style={styles.statIcon} />
            {renderRating()}
            <ThemeText variant="body" color={getColor('subText')} style={styles.statLabel}>
              Rating
            </ThemeText>
          </View>
          <View style={styles.statCol}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={18}
              color={getColor('subText')}
              style={styles.statIcon}
            />
            <ThemeText variant="caption" color={getColor('text')} style={styles.statValue}>
              {formatTimeToAMPM(vendor.openingTime)} - {formatTimeToAMPM(vendor.closingTime)}
            </ThemeText>
            <ThemeText variant="body" color={getColor('subText')} style={styles.statLabel}>
              Timings
            </ThemeText>
          </View>
        </View>
        {/* Offers/Coupons */}
        {couponPromotions.length > 0 && (
          <ScrollView
            ref={offersScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.offersRow}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={scrollOffset}
            snapToAlignment="start"
          >
            {couponPromotions.map((promotion, _index) => (
              <View key={`${promotion.shopId}-${promotion.title}`} style={styles.offerCard}>
                <PromoBanner
                  promo={promotion}
                  size="small"
                  style={{
                    marginBottom: 0,
                    titleColor: (promotion as { titleColor?: string; subtitleColor?: string })
                      .titleColor,
                    subtitleColor: (promotion as { titleColor?: string; subtitleColor?: string })
                      .subtitleColor,
                  }}
                />
              </View>
            ))}
          </ScrollView>
        )}
        {/* Directions/Map Section */}

        <SectionDivider text="Location Details" fontSize={20} />
        <View style={styles.mapContainer}>
          <ThemeText variant="body" color={getColor('text')} style={styles.mapAddress}>
            {formattedAddress}
          </ThemeText>

          {vendorCoordinates && (
            <View style={{ position: 'relative' }}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: vendorCoordinates.latitude,
                  longitude: vendorCoordinates.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                showsUserLocation={false}
                showsMyLocationButton={false}
                zoomEnabled={true}
                scrollEnabled={true}
                rotateEnabled={false}
                pitchEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: vendorCoordinates.latitude,
                    longitude: vendorCoordinates.longitude,
                  }}
                  title={vendor.name}
                  description={formattedAddress}
                />
              </MapView>

              {/* Navigation Button Overlay */}
              <TouchableOpacity
                style={styles.navigationButton}
                onPress={async () => {
                  try {
                    // Check which map apps are available
                    const appleMapsUrl = `https://maps.apple.com/?daddr=${vendorCoordinates.latitude},${vendorCoordinates.longitude}`;
                    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${vendorCoordinates.latitude},${vendorCoordinates.longitude}`;

                    const canOpenAppleMaps = await Linking.canOpenURL(appleMapsUrl);
                    const canOpenGoogleMaps = await Linking.canOpenURL(googleMapsUrl);

                    const options = [];

                    if (canOpenAppleMaps) {
                      options.push({
                        text: 'Apple Maps',
                        onPress: () => Linking.openURL(appleMapsUrl),
                      });
                    }

                    if (canOpenGoogleMaps) {
                      options.push({
                        text: 'Google Maps',
                        onPress: () => Linking.openURL(googleMapsUrl),
                      });
                    }

                    if (options.length === 0) {
                      // Fallback: try to open Apple Maps anyway (iOS default)
                      try {
                        await Linking.openURL(appleMapsUrl);
                      } catch (error) {
                        Alert.alert('Error', 'No map apps available on this device.');
                      }
                      return;
                    }

                    if (options.length === 1) {
                      // Only one option available, open it directly
                      options[0].onPress();
                      return;
                    }

                    // Show options for map apps
                    Alert.alert('Open Directions', 'Choose your preferred map app:', [
                      ...options,
                      {
                        text: 'Cancel',
                        style: 'cancel',
                      },
                    ]);
                  } catch (error) {
                    console.error('Error checking map apps:', error);
                    // Fallback to simple alert
                    Alert.alert('Open Directions', 'Choose your preferred map app:', [
                      {
                        text: 'Apple Maps',
                        onPress: () => {
                          const appleMapsUrl = `https://maps.apple.com/?daddr=${vendorCoordinates.latitude},${vendorCoordinates.longitude}`;
                          Linking.openURL(appleMapsUrl);
                        },
                      },
                      {
                        text: 'Google Maps',
                        onPress: () => {
                          const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${vendorCoordinates.latitude},${vendorCoordinates.longitude}`;
                          Linking.openURL(googleMapsUrl);
                        },
                      },
                      {
                        text: 'Cancel',
                        style: 'cancel',
                      },
                    ]);
                  }
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Open directions in map app"
                accessibilityHint="Opens a menu to choose between Apple Maps and Google Maps"
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="directions" size={20} color={getColor('primary')} />
                <ThemeText
                  variant="caption"
                  color={getColor('primary')}
                  style={styles.navigationButtonText}
                >
                  Directions
                </ThemeText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

VendorProfileComponent.displayName = 'VendorProfile';

export default React.memo(VendorProfileComponent);
