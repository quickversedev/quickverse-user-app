import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme/ThemeContext';
import { Vendor } from '../../types/vendor';

// Mock reviews and offers
type Review = {
  id: string;
  user: string;
  date: string;
  text: string;
};
const mockReviews: Review[] = [
  {
    id: '1',
    user: 'Amar Singh',
    date: '18th May 2025, 18:45p.m.',
    text: 'Ordered their Choco Fudge and Mango Tango via delivery — came perfectly packed and still frozen! Flavors were rich and creamy. Just wish the portion was a bit bigger for the price. Still, totally worth it!',
  },
  {
    id: '2',
    user: 'Amar Singh',
    date: '18th May 2025, 18:45p.m.',
    text: 'Ordered their Choco Fudge and Mango Tango via delivery — came perfectly packed and still frozen! Flavors were rich and creamy. Just wish the portion was a bit bigger for the price. Still, totally worth it!',
  },
];

const mockOffers = [
  {
    id: '1',
    image: require('../../assets/images/bg_1.png'),
    text: 'Get 25% OFF when you pay with District',
  },
  {
    id: '2',
    image: require('../../assets/images/bg_1.png'),
    text: 'Get 25% OFF when you pay with District',
  },
];

interface VendorProfileRouteParams {
  vendor: Vendor;
}
type VendorProfileRouteProp = RouteProp<
  { VendorProfile: VendorProfileRouteParams },
  'VendorProfile'
>;

const VendorProfile: React.FC = () => {
  const { getColor, getTypography } = useTheme();
  const route = useRoute<VendorProfileRouteProp>();
  const { vendor } = route.params;

  const [currentOffer, setCurrentOffer] = useState(0);
  const offersScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentOffer(prev => (prev === mockOffers.length - 1 ? 0 : prev + 1));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (offersScrollRef.current) {
      offersScrollRef.current.scrollTo({
        x: currentOffer * 220, // Adjust 220 if your offerCard width+margin is different
        animated: true,
      });
    }
  }, [currentOffer]);

  const handlePhoneCall = () => {
    if (vendor.phone) {
      Linking.openURL(`tel:${vendor.phone}`);
    }
  };

  const formatAddress = () => {
    if (vendor.shopAddress) {
      const { address, city, state, postalCode } = vendor.shopAddress;
      return `${address}, ${city}, ${state} - ${postalCode}`;
    }
    return 'Address not available';
  };

  const getVendorCoordinates = () => {
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
  };

  const renderRating = () => {
    if (!vendor.rating || vendor.rating === 0) {
      return <Text style={styles.statValue}>Not Rated</Text>;
    }
    return (
      <Text style={styles.statValue}>
        {vendor.rating} <Text style={styles.reviewCount}>(32)</Text>
      </Text>
    );
  };

  const renderStars = () => {
    if (!vendor.rating || vendor.rating === 0) {
      return <Text style={styles.reviewRating}>Not Rated</Text>;
    }

    const fullStars = Math.floor(vendor.rating);
    const hasHalfStar = vendor.rating % 1 !== 0;

    return (
      <>
        {[1, 2, 3, 4, 5].map(i => (
          <MaterialCommunityIcons
            key={i}
            name={
              i <= fullStars
                ? 'star'
                : hasHalfStar && i === fullStars + 1
                ? 'star-half-full'
                : 'star-outline'
            }
            size={22}
            color={
              i <= fullStars || (hasHalfStar && i === fullStars + 1)
                ? '#FFD700'
                : getColor('border')
            }
            style={styles.reviewStar}
          />
        ))}
        <Text style={styles.reviewRating}>{vendor.rating}</Text>
        <Text style={styles.reviewCount}>(32)</Text>
      </>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: getColor('background'),
    },
    banner: {
      width: '100%',
      height: 180,
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
      // fontWeight: 'bold',
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
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: getColor('card'),
      borderRadius: 12,
      marginRight: 12,
      padding: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    offerImage: {
      width: 48,
      height: 48,
      borderRadius: 8,
      marginRight: 10,
      backgroundColor: getColor('border'),
    },
    offerText: {
      color: getColor('text'),
      fontSize: getTypography('body'),
      fontWeight: 'bold',
    },
    sectionTitle: {
      color: getColor('text'),
      fontSize: getTypography('h2'),
      fontWeight: 'bold',
      marginHorizontal: 16,
      marginTop: 18,
      marginBottom: 8,
    },
    reviewStarsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginBottom: 4,
    },
    reviewStar: {
      marginRight: 2,
    },
    reviewRating: {
      color: getColor('text'),
      fontWeight: 'bold',
      marginLeft: 6,
      fontSize: getTypography('body'),
    },
    reviewCount: {
      color: getColor('subText'),
      marginLeft: 4,
      fontSize: getTypography('caption'),
    },
    reviewInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: getColor('card'),
      borderRadius: 8,
      marginHorizontal: 16,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 8,
    },
    reviewInputIcon: {
      marginRight: 8,
    },
    reviewInput: {
      flex: 1,
      color: getColor('text'),
      fontSize: getTypography('body'),
    },
    reviewCard: {
      backgroundColor: getColor('card'),
      borderRadius: 12,
      marginHorizontal: 16,
      marginTop: 8,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'flex-start',
      elevation: 1,
    },
    reviewAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: getColor('border'),
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    reviewContent: {
      flex: 1,
    },
    reviewUser: {
      color: getColor('text'),
      fontWeight: 'bold',
      fontSize: getTypography('body'),
    },
    reviewDate: {
      color: getColor('subText'),
      fontSize: getTypography('caption'),
      marginBottom: 2,
    },
    reviewText: {
      color: getColor('text'),
      fontSize: getTypography('body'),
    },
    showMore: {
      color: getColor('primary'),
      textAlign: 'center',
      marginVertical: 8,
      fontWeight: 'bold',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <Image
          source={{ uri: vendor.banner || vendor.logo }}
          style={styles.banner}
          resizeMode="cover"
        />
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
              {vendor.openingTime} - {vendor.closingTime}
            </Text>
            <Text style={styles.statLabel}>Timings</Text>
          </View>
        </View>
        {/* Offers */}
        <ScrollView
          ref={offersScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.offersRow}
          scrollEventThrottle={26}
        >
          {mockOffers.map(offer => (
            <View key={offer.id} style={styles.offerCard}>
              <Image source={offer.image} style={styles.offerImage} />
              <Text style={styles.offerText}>{offer.text}</Text>
            </View>
          ))}
        </ScrollView>
        {/* Reviews */}
        <Text style={styles.sectionTitle}>Reviews</Text>
        <View style={styles.reviewStarsRow}>{renderStars()}</View>
        <View style={styles.reviewInputRow}>
          <MaterialCommunityIcons
            name="pencil"
            size={20}
            color={getColor('subText')}
            style={styles.reviewInputIcon}
          />
          <TextInput
            style={styles.reviewInput}
            placeholder="Write your review"
            placeholderTextColor={getColor('subText')}
          />
        </View>
        {mockReviews.map(review => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewAvatar}>
              <MaterialCommunityIcons name="account" size={22} color={getColor('subText')} />
            </View>
            <View style={styles.reviewContent}>
              <Text style={styles.reviewUser}>{review.user}</Text>
              <Text style={styles.reviewDate}>{review.date}</Text>
              <Text style={styles.reviewText}>{review.text}</Text>
            </View>
          </View>
        ))}
        <TouchableOpacity>
          <Text style={styles.showMore}>SHOW MORE</Text>
        </TouchableOpacity>
        {/* Directions/Map Section */}
        <Text style={styles.sectionTitle}>Get Directions</Text>
        <View
          style={{
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
          }}
        >
          <Text
            style={{
              color: getColor('text'),
              fontWeight: 'bold',
              fontSize: getTypography('body'),
              marginBottom: 4,
            }}
          >
            {formatAddress()}
          </Text>
          <Text
            style={{
              color: getColor('subText'),
              fontSize: getTypography('caption'),
              marginBottom: 8,
            }}
          >
            {formatAddress()}
          </Text>
          {getVendorCoordinates() && (
            <MapView
              style={{ width: '100%', height: 140, borderRadius: 8 }}
              initialRegion={{
                latitude: getVendorCoordinates()!.latitude,
                longitude: getVendorCoordinates()!.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              pointerEvents="none"
            >
              <Marker
                coordinate={{
                  latitude: getVendorCoordinates()!.latitude,
                  longitude: getVendorCoordinates()!.longitude,
                }}
              />
            </MapView>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default VendorProfile;
