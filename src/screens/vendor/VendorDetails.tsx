import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useMemo } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { ThemeText } from '../../components/common/theme/ThemeText';
import { useTheme } from '../../theme/ThemeContext';
import { Vendor } from '../../types/vendor';
import { formatTimeToAMPM } from '../../utils/storeUtils';

// Define the route params type
interface VendorProductRouteParams {
  vendor: Vendor;
}

type VendorProductRouteProp = RouteProp<
  { VendorProduct: VendorProductRouteParams },
  'VendorProduct'
>;

const VendorDetailsComponent: React.FC = () => {
  const { getColor } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<VendorProductRouteProp>();
  const { vendor } = route.params;

  const renderRating = useCallback(() => {
    if (!vendor.rating || vendor.rating === 0) {
      return (
        <ThemeText variant="body" color={getColor('text')}>
          Not Rated
        </ThemeText>
      );
    }
    return (
      <ThemeText variant="body" color={getColor('text')}>
        {vendor.rating}
      </ThemeText>
    );
  }, [vendor.rating, getColor]);

  const formatAddress = useCallback(() => {
    if (vendor.shopAddress) {
      const { address, city, state, postalCode } = vendor.shopAddress;
      return `${address}, ${city}, ${state} - ${postalCode}`;
    }
    return 'Address not available';
  }, [vendor.shopAddress]);

  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
        ratingContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 12,
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
      }),
    [getColor]
  );

  return (
    <View style={styles.container}>
      <View>
        <Image
          source={{ uri: vendor.banner || vendor.logo }}
          style={styles.image}
          resizeMode="cover"
        />
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <ThemeText variant="body" color="#fff" style={{ fontSize: 18 }}>
            {'<'} Back
          </ThemeText>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <ThemeText variant="h1" color={getColor('text')} style={{ marginBottom: 8 }}>
          {vendor.name}
        </ThemeText>
        <ThemeText variant="body" color={getColor('subText')} style={{ marginBottom: 12 }}>
          {vendor.description}
        </ThemeText>

        {/* Rating */}
        <View style={styles.ratingContainer}>
          <MaterialCommunityIcons name="star" size={20} color="#FFD700" />
          {renderRating()}
        </View>

        <ThemeText variant="body" color={getColor('text')} style={{ marginBottom: 6 }}>
          Owner: {vendor.owner}
        </ThemeText>
        <ThemeText variant="body" color={getColor('text')} style={{ marginBottom: 6 }}>
          Phone: {vendor.phone}
        </ThemeText>
        <ThemeText variant="body" color={getColor('text')} style={{ marginBottom: 6 }}>
          {`Hours: ${formatTimeToAMPM(vendor.openingTime)} - ${formatTimeToAMPM(
            vendor.closingTime
          )}`}
        </ThemeText>
        <ThemeText variant="body" color={getColor('text')} style={{ marginBottom: 6 }}>
          Preparation Time: {vendor.preparationTime}
        </ThemeText>
        <ThemeText variant="body" color={getColor('text')} style={{ marginBottom: 6 }}>
          Category: {vendor.category}
        </ThemeText>
        <ThemeText variant="body" color={getColor('text')} style={{ fontStyle: 'italic' }}>
          {formatAddress()}
        </ThemeText>
      </ScrollView>
    </View>
  );
};

VendorDetailsComponent.displayName = 'VendorDetails';

export default React.memo(VendorDetailsComponent);
