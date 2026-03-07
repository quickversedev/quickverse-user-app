import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import AutoScrollBanner from '../../../../components/common/promo/AutoScrollBanner';
import VendorCard from '../../../../components/modules/Vendor/VendorCard';
import VendorEmptyState from '../../../../components/modules/Vendor/VendorEmptyState';
import { usePromotions } from '../../../../hooks/usePromotions';
import { RootStackParamList } from '../../../../routes/AppStack';
import useVendorStore from '../../../../store/vendorStore';
import { useTheme } from '../../../../theme/ThemeContext';
import { Vendor } from '../../../../types/vendor';
import { getStoreStatus } from '../../../../utils/storeUtils';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 columns with margins

interface FoodContentProps {
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollEventThrottle?: number;
  contentContainerStyle?: ViewStyle;
  showsVerticalScrollIndicator?: boolean;
}

const FoodContentComponent: React.FC<FoodContentProps> = ({
  onScroll,
  scrollEventThrottle,
  contentContainerStyle,
  showsVerticalScrollIndicator,
}) => {
  const { theme } = useTheme();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Subscribe to vendor store changes - filter out closed stores
  const { getVendorsByCategory } = useVendorStore();
  const allFoodVendors = getVendorsByCategory('Food');
  const foodVendors = useMemo(
    () => allFoodVendors.filter(vendor => getStoreStatus(vendor).isOpen),
    [allFoodVendors]
  );
  const hasVendors = foodVendors.length > 0;

  const { promotions: bannerData, hasPromotions } = usePromotions('Food');

  // Memoize vendor press handler
  const handleVendorPress = useCallback(
    (vendor: Vendor) => {
      navigation.navigate('VendorProduct', { vendor });
    },
    [navigation]
  );
  // Auto-navigate to the only vendor's product screen when there is exactly one store
  const hasNavigatedToSingleVendor = useRef(false);
  useEffect(() => {
    if (!hasNavigatedToSingleVendor.current && foodVendors.length === 1) {
      hasNavigatedToSingleVendor.current = true;
      navigation.navigate('VendorProduct', { vendor: foodVendors[0] });
    }
  }, [foodVendors, navigation]);
  //console.log('foodVendors', bannerData);
  // Memoize styles to prevent recreation on every render
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
          paddingVertical: 65,
        },
        header: {
          marginTop: 30,
          alignItems: 'center',

          paddingHorizontal: 16,
        },
        title: {
          fontSize: 32,
          fontWeight: 'bold',
          color: '#FF6B35',
          textAlign: 'center',
          marginBottom: 8,
        },
        logoContainer: {
          alignItems: 'center',
          marginTop: 16,
        },
        logo: {
          width: 450,
          height: 200,
          borderRadius: 12,
        },
        starbucksBanner: {
          backgroundColor: '#1B4332',
          marginHorizontal: 16,
          marginVertical: 16,
          borderRadius: 12,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        bannerContent: {
          flex: 1,
        },
        bannerTitle: {
          color: '#fff',
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: 4,
        },
        bannerSubtitle: {
          color: '#fff',
          fontSize: 12,
          marginBottom: 8,
        },
        bannerButton: {
          backgroundColor: '#2D6A4F',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 6,
          alignSelf: 'flex-start',
        },
        bannerButtonText: {
          color: '#fff',
          fontSize: 12,
          fontWeight: 'bold',
        },
        bannerImage: {
          width: 60,
          height: 60,
          borderRadius: 8,
          backgroundColor: '#fff',
        },
        sectionTitle: {
          marginHorizontal: 16,
          marginTop: 20,
          marginBottom: 12,
          fontSize: 20,
          fontWeight: 'bold',
          color: theme.colors.text,
        },
        vendorGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
        },
        vendorCard: {
          width: cardWidth,
          backgroundColor: theme.colors.card,
          borderRadius: 12,
          marginBottom: 16,
          overflow: 'hidden',
          elevation: 3,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        },
        vendorImage: {
          width: '100%',
          height: 120,
          resizeMode: 'cover',
        },
        vendorInfo: {
          padding: 12,
        },
        vendorName: {
          color: theme.colors.text,
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: 4,
        },
        vendorRating: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 4,
        },
        ratingText: {
          color: theme.colors.text,
          fontSize: 14,
          marginLeft: 4,
        },
        vendorMeta: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        metaText: {
          color: theme.colors.subText,
          fontSize: 12,
          marginLeft: 4,
        },
        favoriteButton: {
          position: 'absolute',
          top: 8,
          right: 8,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 12,
          padding: 4,
        },
      }),
    [theme.colors.background, theme.colors.text, theme.colors.card, theme.colors.subText]
  );

  return (
    <Animated.ScrollView
      style={styles.container}
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
    >
      {hasVendors ? (
        <>
          {/* Header */}
          {/* <View style={styles.header}>
            <View style={styles.logoContainer}>
              <CategoryLogo category="Food" style={styles.logo} resizeMode="cover" />
            </View>
          </View> */}

          {/* Promotional Banner */}
          {hasPromotions && <AutoScrollBanner bannerData={bannerData} />}

          {/* Vendors Grid */}
          <Text style={styles.sectionTitle}>Food Delivery</Text>
          <View style={styles.vendorGrid}>
            {foodVendors.map(vendor => {
              const storeStatus = getStoreStatus(vendor);
              return (
                <VendorCard
                  key={vendor.shopId}
                  vendor={vendor}
                  onPress={handleVendorPress}
                  favoriteColor="#FF6B35"
                  disabled={!storeStatus.isOpen}
                />
              );
            })}
          </View>
        </>
      ) : (
        <View style={styles.header}>
          <VendorEmptyState category="Food" />
        </View>
      )}
    </Animated.ScrollView>
  );
};

FoodContentComponent.displayName = 'FoodContent';

export const FoodContent = React.memo(FoodContentComponent);
