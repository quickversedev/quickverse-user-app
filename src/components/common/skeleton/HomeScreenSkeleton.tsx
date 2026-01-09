import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

const { width } = Dimensions.get('window');

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}

const SkeletonItem: React.FC<SkeletonProps> = ({
  width: itemWidth,
  height,
  borderRadius = 8,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const { getColor } = useTheme();

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width: itemWidth as number | 'auto',
          height,
          borderRadius,
          backgroundColor: getColor('border'),
          opacity,
        },
        style,
      ]}
    />
  );
};

export const HomeScreenSkeleton: React.FC = () => {
  const { getColor, theme } = useTheme();

  // Card dimensions matching VendorCard small size
  const vendorCardWidth = (width - 48) / 3;
  const vendorImageHeight = vendorCardWidth * 0.7;

  // Product card dimensions
  const productCardWidth = (width - 48) / 2.5;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: getColor('background'),
    },
    // Header styles
    header: {
      backgroundColor: getColor('background'),
      paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) - 15 : 0,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 8,
    },
    locationSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    bannerSection: {
      width: '100%',
      height: Platform.OS === 'ios' ? 150 : 130,
      paddingHorizontal: 0,
    },
    searchSection: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    navTabs: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 12,
      paddingBottom: 8,
      borderBottomWidth: 3,
      borderBottomColor: getColor('border'),
    },
    navTab: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
    },
    // Content styles
    content: {
      paddingTop: 16,
      paddingBottom: 160,
    },
    promoBanner: {
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    sectionDivider: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginVertical: 12,
      gap: 12,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: getColor('border'),
    },
    // Vendor list (horizontal)
    vendorListContainer: {
      paddingVertical: 16,
    },
    vendorList: {
      paddingHorizontal: 16,
    },
    vendorCard: {
      width: vendorCardWidth,
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      marginRight: 20,
      overflow: 'hidden',
    },
    vendorCardInfo: {
      padding: 8,
      gap: 6,
    },
    vendorRating: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    vendorMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    // Product list (vertical)
    productSection: {
      paddingHorizontal: 16,
    },
    productVendorHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      marginTop: 16,
      gap: 12,
    },
    productVendorInfo: {
      flex: 1,
      gap: 4,
    },
    productRow: {
      flexDirection: 'row',
      gap: 12,
    },
    productCard: {
      width: productCardWidth,
      marginBottom: 16,
    },
    productCardInfo: {
      marginTop: 8,
      gap: 4,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Top Row: Location + Profile */}
        <View style={styles.topRow}>
          <View style={styles.locationSection}>
            <SkeletonItem width={20} height={20} borderRadius={4} />
            <View>
              <SkeletonItem width={80} height={12} borderRadius={4} />
              <SkeletonItem width={120} height={16} borderRadius={4} style={{ marginTop: 4 }} />
            </View>
          </View>
          <SkeletonItem width={40} height={40} borderRadius={20} />
        </View>

        {/* Banner Image */}
        <View style={styles.bannerSection}>
          <SkeletonItem width="100%" height="100%" borderRadius={0} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <SkeletonItem width="100%" height={48} borderRadius={24} />
        </View>

        {/* Navigation Tabs */}
        <View style={styles.navTabs}>
          {[1, 2, 3].map(index => (
            <View key={index} style={styles.navTab}>
              <SkeletonItem width={24} height={24} borderRadius={4} />
              <SkeletonItem width={50} height={12} borderRadius={4} />
            </View>
          ))}
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Promo Banner */}
        <View style={styles.promoBanner}>
          <SkeletonItem width="100%" height={140} borderRadius={12} />
        </View>

        {/* SHOPS Section Divider */}
        <View style={styles.sectionDivider}>
          <View style={styles.dividerLine} />
          <SkeletonItem width={60} height={16} borderRadius={4} />
          <View style={styles.dividerLine} />
        </View>

        {/* Horizontal Vendor List */}
        <View style={styles.vendorListContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.vendorList}
          >
            {[1, 2, 3, 4].map(index => (
              <View key={index} style={styles.vendorCard}>
                <SkeletonItem
                  width={vendorCardWidth}
                  height={vendorImageHeight}
                  borderRadius={0}
                />
                <View style={styles.vendorCardInfo}>
                  <SkeletonItem width="80%" height={14} borderRadius={4} />
                  <View style={styles.vendorRating}>
                    <SkeletonItem width={16} height={16} borderRadius={4} />
                    <SkeletonItem width={24} height={12} borderRadius={4} />
                  </View>
                  <View style={styles.vendorMeta}>
                    <SkeletonItem width={16} height={16} borderRadius={4} />
                    <SkeletonItem width={50} height={12} borderRadius={4} />
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* BESTSELLERS Section Divider */}
        <View style={styles.sectionDivider}>
          <View style={styles.dividerLine} />
          <SkeletonItem width={100} height={16} borderRadius={4} />
          <View style={styles.dividerLine} />
        </View>

        {/* Product List with Vendor Headers */}
        <View style={styles.productSection}>
          {[1, 2].map(vendorIndex => (
            <View key={vendorIndex}>
              {/* Vendor Header */}
              <View style={styles.productVendorHeader}>
                <SkeletonItem width={50} height={50} borderRadius={25} />
                <View style={styles.productVendorInfo}>
                  <SkeletonItem width={120} height={16} borderRadius={4} />
                  <SkeletonItem width={80} height={12} borderRadius={4} />
                </View>
                <SkeletonItem width={70} height={32} borderRadius={16} />
              </View>

              {/* Products Row */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 8 }}
              >
                <View style={styles.productRow}>
                  {[1, 2, 3].map(productIndex => (
                    <View key={productIndex} style={styles.productCard}>
                      <SkeletonItem
                        width={productCardWidth}
                        height={productCardWidth}
                        borderRadius={12}
                      />
                      <View style={styles.productCardInfo}>
                        <SkeletonItem width="90%" height={14} borderRadius={4} />
                        <SkeletonItem width="60%" height={12} borderRadius={4} />
                        <SkeletonItem width="40%" height={16} borderRadius={4} />
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};
