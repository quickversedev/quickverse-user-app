import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import CategoryLogo from '../../../../components/common/CategoryLogo';
import PromoBanner from '../../../../components/common/promo/PromoBanner';
import VendorCard from '../../../../components/modules/Vendor/VendorCard';
import VendorEmptyState from '../../../../components/modules/Vendor/VendorEmptyState';
import { RootStackParamList } from '../../../../routes/AppStack';
import useVendorStore from '../../../../store/vendorStore';
import { useTheme } from '../../../../theme/ThemeContext';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 columns with margins

interface FoodContentProps {
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollEventThrottle?: number;
  contentContainerStyle?: ViewStyle;
  showsVerticalScrollIndicator?: boolean;
}

export const FoodContent: React.FC<FoodContentProps> = ({
  onScroll,
  scrollEventThrottle,
  contentContainerStyle,
  showsVerticalScrollIndicator,
}) => {
  const { theme } = useTheme();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { getVendorsByCategory } = useVendorStore();
  const foodVendors = getVendorsByCategory('Food');

  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const bannerData = [
    {
      promo: 'foodPromo',
      title: 'Get 25% OFF!',
      subtitle: 'On your first order with code WELCOME',
      bannerButton: { label: 'Order Now', onPress: () => {} },
      backgroundColor: 'green',
      isBannerImage: false,
    },
    {
      promo: 'foodPromo',
      title: 'Free Delivery',
      subtitle: 'On orders above ₹200',
      bannerButton: { label: 'Shop Now', onPress: () => {} },
      backgroundColor: 'blue',
      isBannerImage: false,
    },
    {
      promo: 'foodPromo',
      title: '',
      subtitle: '',
      backgroundColor: 'orange',
      isBannerImage: true,
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % bannerData.length;
        const bannerWidth = width - 32 + 12; // Full width minus padding plus margin
        scrollViewRef.current?.scrollTo({
          x: nextIndex * bannerWidth,
          animated: true,
        });
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [bannerData.length]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      marginTop: 30,
      alignItems: 'center',
      paddingVertical: 20,
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
    bannerScrollContainer: {
      paddingHorizontal: 16,
    },
    bannerContainer: {
      width: width - 32, // Full width minus padding
      marginVertical: 8,
      marginRight: 12,
    },
  });

  return (
    <Animated.ScrollView
      style={styles.container}
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
    >
      {foodVendors.length > 0 ? (
        <>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <CategoryLogo category="Food" style={styles.logo} resizeMode="cover" />
            </View>
          </View>

          {/* Promotional Banner */}
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bannerScrollContainer}
            pagingEnabled
            scrollEventThrottle={16}
          >
            {bannerData.map((banner, index) => (
              <PromoBanner
                key={index}
                promo={banner.promo}
                title={banner.title}
                subtitle={banner.subtitle}
                bannerButton={banner.bannerButton}
                size="medium"
                style={styles.bannerContainer}
                backgroundColor={banner.backgroundColor}
                isBannerImage={banner.isBannerImage}
              />
            ))}
          </ScrollView>

          {/* Vendors Grid */}
          <Text style={styles.sectionTitle}>Food Delivery</Text>
          <View style={styles.vendorGrid}>
            {foodVendors.map(vendor => (
              <VendorCard
                key={vendor.shopId}
                vendor={vendor}
                onPress={vendor => navigation.navigate('VendorProduct', { vendor })}
                favoriteColor="#FF6B35"
                disabled={!vendor.storeActive}
              />
            ))}
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
