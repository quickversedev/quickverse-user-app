import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { SectionDivider } from '../../components/common';
import PromoBanner from '../../components/common/promo/PromoBanner';
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
  const { availableCoupons, loading: couponsLoading, fetchVendorOffers } = useCouponStore();

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
    fetchVendorOffers(vendor.shopId, authData);
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
      return <Text style={styles.statValue}>Not Rated</Text>;
    }
    return <Text style={styles.statValue}>{vendor.rating}</Text>;
  }, [vendor.rating]);

  const handlePhoneCall = useCallback(() => {
    if (vendor.phone) {
      Linking.openURL(`tel:${vendor.phone}`);
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
          color: getColor('text'),
          fontSize: getTypography('h1'),
          fontWeight: 'bold',
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
          color: getColor('subText'),
          fontSize: getTypography('caption'),
          marginLeft: 4,
          fontWeight: 'bold',
        },
        callBtn: {
          marginLeft: 8,
          backgroundColor: getColor('primary'),
          borderRadius: 20,
          padding: 8,
        },
        rowStats: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginHorizontal: 16,
          marginTop: 18,
          marginBottom: 8,
        },
        statCol: {
          alignItems: 'center',
          flex: 1,
        },
        statIcon: {
          marginBottom: 2,
        },
        statLabel: {
          color: getColor('subText'),
          fontSize: getTypography('body'),
          fontWeight: 'bold',
          marginTop: 2,
        },
        statValue: {
          color: getColor('text'),
          fontSize: getTypography('caption'),
          marginTop: 2,
        },
        offersRow: {
          flexDirection: 'row',
          marginHorizontal: 16,
          marginTop: 8,
          marginBottom: 8,
        },
        offerCard: {
          width: cardWidth,
          marginRight: 12,
        },
        sectionTitle: {
          color: getColor('text'),
          fontSize: getTypography('h2'),
          fontWeight: 'bold',
          marginHorizontal: 16,
          marginTop: 18,
          marginBottom: 8,
        },
        reviewCount: {
          color: getColor('subText'),
          marginLeft: 4,
          fontSize: getTypography('caption'),
        },
        mapContainer: {
          marginHorizontal: 16,
          marginTop: 8,
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
          color: getColor('text'),
          fontWeight: 'bold',
          fontSize: getTypography('body'),
          marginBottom: 4,
        },
        mapSubAddress: {
          color: getColor('subText'),
          fontSize: getTypography('caption'),
          marginBottom: 8,
        },
        map: {
          width: '100%',
          height: 140,
          borderRadius: 8,
        },
        noOffersText: {
          color: getColor('subText'),
          fontSize: getTypography('body'),
          textAlign: 'center',
          fontStyle: 'italic',
          marginHorizontal: 16,
          marginTop: 8,
          marginBottom: 8,
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
            <Text style={styles.name}>{vendor.name}</Text>
            <View style={styles.saveRow}>
              <TouchableOpacity style={styles.saveBtn}>
                <MaterialCommunityIcons
                  name="bookmark-outline"
                  size={18}
                  color={getColor('subText')}
                />
                <Text style={styles.saveBtnText}>Save To Collections</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={styles.callBtn} onPress={handlePhoneCall}>
            <MaterialCommunityIcons name="phone" size={22} color={getColor('background')} />
          </TouchableOpacity>
        </View>
        {/* Stats Row */}
        <View style={styles.rowStats}>
          <View style={styles.statCol}>
            <MaterialCommunityIcons
              name="flash"
              size={18}
              color={getColor('subText')}
              style={styles.statIcon}
            />
            <Text style={styles.statValue}>{vendor.preparationTime}</Text>
            <Text style={styles.statLabel}>Delivery Time</Text>
          </View>
          <View style={styles.statCol}>
            <MaterialCommunityIcons name="star" size={18} color="#1ec28b" style={styles.statIcon} />
            {renderRating()}
            <Text style={styles.statLabel}>Ratings</Text>
          </View>
          <View style={styles.statCol}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={18}
              color={getColor('subText')}
              style={styles.statIcon}
            />
            <Text style={styles.statValue}>
              {formatTimeToAMPM(vendor.openingTime)} - {formatTimeToAMPM(vendor.closingTime)}
            </Text>
            <Text style={styles.statLabel}>Timings</Text>
          </View>
        </View>
        {/* Offers/Coupons */}
        {couponPromotions.length > 0 ? (
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
        ) : (
          !couponsLoading && (
            <Text style={styles.noOffersText}>No offers available at the moment</Text>
          )
        )}
        {/* Directions/Map Section */}

        <SectionDivider text="Location Details" />
        <View style={styles.mapContainer}>
          <Text style={styles.mapAddress}>{formattedAddress}</Text>
          <Text style={styles.mapSubAddress}>{formattedAddress}</Text>
          {vendorCoordinates && (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: vendorCoordinates.latitude,
                longitude: vendorCoordinates.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              pointerEvents="none"
            >
              <Marker
                coordinate={{
                  latitude: vendorCoordinates.latitude,
                  longitude: vendorCoordinates.longitude,
                }}
              />
            </MapView>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

VendorProfileComponent.displayName = 'VendorProfile';

export default React.memo(VendorProfileComponent);
