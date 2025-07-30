import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
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
import CategoryLogo from '../../../../components/common/CategoryLogo';
import PromoBanner from '../../../../components/common/promo/PromoBanner';
import VendorEmptyState from '../../../../components/common/VendorEmptyState';
import VendorCard from '../../../../components/modules/Vendor/VendorCard';
import { RootStackParamList } from '../../../../routes/AppStack';
import useVendorStore from '../../../../store/vendorStore';
import { useTheme } from '../../../../theme/ThemeContext';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 columns with margins

interface PharmacyContentProps {
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollEventThrottle?: number;
  contentContainerStyle?: ViewStyle;
  showsVerticalScrollIndicator?: boolean;
}

export const PharmacyContent: React.FC<PharmacyContentProps> = ({
  onScroll,
  scrollEventThrottle,
  contentContainerStyle,
  showsVerticalScrollIndicator,
}) => {
  const { theme } = useTheme();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { getVendorsByCategory } = useVendorStore();
  const pharmacyVendors = getVendorsByCategory('Pharmacy');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      marginTop: 100,
      alignItems: 'center',
      paddingVertical: 20,
      paddingHorizontal: 16,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#E91E63',
      textAlign: 'center',
      marginBottom: 8,
    },
    logoContainer: {
      alignItems: 'center',
      marginTop: 16,
    },
    logo: {
      width: 120,
      height: 80,
      borderRadius: 12,
    },
    promoBanner: {
      backgroundColor: '#C2185B',
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
      backgroundColor: '#E91E63',
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
    bannerContainer: {
      marginVertical: 12,
      marginHorizontal: 12,
      // You can add more custom styles here if needed
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
      {pharmacyVendors.length > 0 ? (
        <>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <CategoryLogo category="Pharmacy" style={styles.logo} resizeMode="cover" />
            </View>
          </View>

          {/* Promotional Banner */}
          <PromoBanner
            promo="pharmacyPromo"
            title="Upto 30% OFF on Medicines"
            subtitle="Order genuine medicines and health supplies online"
            bannerButton={{ label: 'Order Medicines', onPress: () => {} }}
            size="small"
            style={styles.bannerContainer}
            backgroundColor="red"
          />

          {/* Vendors Grid */}
          <Text style={styles.sectionTitle}>Pharmacy</Text>
          <View style={styles.vendorGrid}>
            {pharmacyVendors.map(vendor => (
              <VendorCard
                key={vendor.shopId}
                vendor={vendor}
                onPress={vendor => navigation.navigate('VendorProduct', { vendor })}
                favoriteColor="#E91E63"
              />
            ))}
          </View>
        </>
      ) : (
        <View style={styles.header}>
          <VendorEmptyState category="Pharmacy" />
        </View>
      )}
    </Animated.ScrollView>
  );
};
