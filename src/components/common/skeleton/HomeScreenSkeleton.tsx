import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width } = Dimensions.get('window');

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
}

const SkeletonItem: React.FC<SkeletonProps> = ({ width, height, borderRadius = 8 }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const widthNum = typeof width === 'string' ? 100 : width;

  useEffect(() => {
    const startAnimation = () => {
      animatedValue.setValue(0);
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(startAnimation, 500);
      });
    };

    startAnimation();

    return () => {
      animatedValue.stopAnimation();
    };
  }, [animatedValue]);

  const shimmerOpacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 0],
  });

  const shimmerTranslateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-widthNum, widthNum],
  });

  return (
    <View
      style={[
        styles.skeletonItem,
        {
          width: width as any,
          height,
          borderRadius,
          overflow: 'hidden',
        },
      ]}
    >
      <Animated.View
        style={[
          styles.wave,
          {
            opacity: shimmerOpacity,
            transform: [{ translateX: shimmerTranslateX }],
          },
        ]}
      />
    </View>
  );
};

export const HomeScreenSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <SkeletonItem width={120} height={20} />
          <SkeletonItem width={40} height={40} borderRadius={20} />
        </View>
        <View style={styles.searchBar}>
          <SkeletonItem width="100%" height={48} borderRadius={24} />
        </View>
      </View>

      {/* Navigation Items Skeleton */}
      <View style={styles.navigationSection}>
        <View style={styles.navigationRow}>
          {[1, 2, 3, 4].map(index => (
            <View key={index} style={styles.navItem}>
              <SkeletonItem width={60} height={60} borderRadius={30} />
              <SkeletonItem width={50} height={12} />
            </View>
          ))}
        </View>
      </View>

      {/* Featured Products Skeleton */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <SkeletonItem width={150} height={20} />
          <SkeletonItem width={80} height={16} />
        </View>
        <View style={styles.productsRow}>
          {[1, 2, 3].map(index => (
            <View key={index} style={styles.productCard}>
              <SkeletonItem width="100%" height={120} borderRadius={12} />
              <View style={styles.productInfo}>
                <SkeletonItem width="80%" height={16} />
                <SkeletonItem width="60%" height={14} />
                <SkeletonItem width="40%" height={16} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Promotions Skeleton */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <SkeletonItem width={120} height={20} />
        </View>
        <View style={styles.promotionsContainer}>
          {[1, 2].map(index => (
            <View key={index} style={styles.promotionCard}>
              <SkeletonItem width="100%" height={100} borderRadius={12} />
            </View>
          ))}
        </View>
      </View>

      {/* Vendors Skeleton */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <SkeletonItem width={140} height={20} />
          <SkeletonItem width={80} height={16} />
        </View>
        <View style={styles.vendorsContainer}>
          {[1, 2, 3].map(index => (
            <View key={index} style={styles.vendorCard}>
              <View style={styles.vendorHeader}>
                <SkeletonItem width={80} height={80} borderRadius={40} />
                <View style={styles.vendorInfo}>
                  <SkeletonItem width={120} height={18} />
                  <SkeletonItem width={80} height={14} />
                  <SkeletonItem width={60} height={12} />
                </View>
              </View>
              <View style={styles.vendorProducts}>
                {[1, 2, 3].map(productIndex => (
                  <SkeletonItem key={productIndex} width={80} height={80} borderRadius={8} />
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: '#111827',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: '#111827',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchBar: {
    marginBottom: 8,
  },
  navigationSection: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  productsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productCard: {
    width: (width - 48) / 3,
    marginRight: 8,
  },
  productInfo: {
    marginTop: 8,
    gap: 4,
  },
  promotionsContainer: {
    gap: 12,
  },
  promotionCard: {
    marginBottom: 8,
  },
  vendorsContainer: {
    gap: 16,
  },
  vendorCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#5c5d5e',
  },
  vendorHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  vendorInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
    gap: 4,
  },
  vendorProducts: {
    flexDirection: 'row',
    gap: 8,
  },
  bottomSpacing: {
    height: 100,
  },
  skeletonItem: {
    backgroundColor: '#7e7f80', // Same as getColor('border')
  },
  wave: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#a8abad', // Same as getColor('white')
    opacity: 0.3,
  },
});
