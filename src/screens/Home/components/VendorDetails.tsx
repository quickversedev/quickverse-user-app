import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/ThemeContext';
import { Vendor } from '../../../types/vendor';

// Define the route params type
interface VendorProductRouteParams {
  vendor: Vendor;
}

type VendorProductRouteProp = RouteProp<
  { VendorProduct: VendorProductRouteParams },
  'VendorProduct'
>;

const VendorProduct: React.FC = () => {
  const { getColor, getTypography } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<VendorProductRouteProp>();
  const { vendor } = route.params;

  const renderRating = () => {
    if (!vendor.rating || vendor.rating === 0) {
      return <Text style={styles.ratingText}>Not Rated</Text>;
    }
    return <Text style={styles.ratingText}>{vendor.rating}</Text>;
  };

  const formatAddress = () => {
    if (vendor.shopAddress) {
      const { address, city, state, postalCode } = vendor.shopAddress;
      return `${address}, ${city}, ${state} - ${postalCode}`;
    }
    return 'Address not available';
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: getColor('background'),
    },
    image: {
      width: '100%',
      height: 220,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      backgroundColor: getColor('border'),
    },
    content: {
      padding: 20,
    },
    name: {
      color: getColor('text'),
      fontSize: getTypography('h1'),
      fontWeight: 'bold',
      marginBottom: 8,
    },
    description: {
      color: getColor('subText'),
      fontSize: getTypography('body'),
      marginBottom: 12,
    },
    info: {
      color: getColor('text'),
      fontSize: getTypography('body'),
      marginBottom: 6,
    },
    hours: {
      color: getColor('text'),
      fontSize: getTypography('body'),
      marginBottom: 6,
      fontWeight: 'bold',
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    ratingText: {
      color: getColor('text'),
      fontSize: getTypography('body'),
      fontWeight: 'bold',
      marginLeft: 8,
    },
    address: {
      color: getColor('text'),
      fontSize: getTypography('body'),
      marginBottom: 6,
      fontStyle: 'italic',
    },
    backButton: {
      position: 'absolute',
      top: 36,
      left: 16,
      backgroundColor: 'rgba(0,0,0,0.4)',
      borderRadius: 20,
      padding: 6,
      zIndex: 2,
    },
    backText: {
      color: '#fff',
      fontSize: 18,
    },
  });

  return (
    <View style={styles.container}>
      <View>
        <Image
          source={{ uri: vendor.banner || vendor.logo }}
          style={styles.image}
          resizeMode="cover"
        />
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{'<'} Back</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.name}>{vendor.name}</Text>
        <Text style={styles.description}>{vendor.description}</Text>

        {/* Rating */}
        <View style={styles.ratingContainer}>
          <MaterialCommunityIcons name="star" size={20} color="#FFD700" />
          {renderRating()}
        </View>

        <Text style={styles.info}>Owner: {vendor.owner}</Text>
        <Text style={styles.info}>Phone: {vendor.phone}</Text>
        <Text style={styles.hours}>{`Hours: ${vendor.openingTime} - ${vendor.closingTime}`}</Text>
        <Text style={styles.info}>Preparation Time: {vendor.preparationTime}</Text>
        <Text style={styles.info}>Category: {vendor.category}</Text>
        <Text style={styles.address}>{formatAddress()}</Text>
      </ScrollView>
    </View>
  );
};

export default VendorProduct;
