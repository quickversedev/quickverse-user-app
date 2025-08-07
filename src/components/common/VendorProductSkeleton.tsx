import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = ((width - 32) / 3) * 0.9;

interface VendorProductSkeletonProps {
  showVendorCard?: boolean;
}

const VendorProductSkeleton: React.FC<VendorProductSkeletonProps> = ({ showVendorCard = true }) => {
  const { getColor } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      animatedValue.setValue(0);
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => {
        // Restart animation after completion
        setTimeout(startAnimation, 500);
      });
    };

    startAnimation();

    return () => {
      animatedValue.stopAnimation();
    };
  }, [animatedValue]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: getColor('background'),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      paddingBottom: 0,
    },
    backButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: getColor('border'),
      marginRight: 12,
      overflow: 'hidden',
    },
    headerTitle: {
      width: 120,
      height: 20,
      borderRadius: 10,
      backgroundColor: getColor('border'),
      overflow: 'hidden',
    },
    headerSpacer: {
      flex: 1,
    },
    headerIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: getColor('border'),
      overflow: 'hidden',
    },
    vendorCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: getColor('card'),
      borderRadius: 16,
      margin: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: getColor('border'),
    },
    vendorLogo: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginRight: 12,
      backgroundColor: getColor('border'),
      overflow: 'hidden',
    },
    vendorInfo: {
      flex: 1,
    },
    vendorName: {
      width: '80%',
      height: 16,
      borderRadius: 8,
      backgroundColor: getColor('border'),
      marginBottom: 8,
      overflow: 'hidden',
    },
    vendorMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    vendorMetaItem: {
      width: 60,
      height: 12,
      borderRadius: 6,
      backgroundColor: getColor('border'),
      marginRight: 8,
      overflow: 'hidden',
    },
    vendorMetaRating: {
      width: 40,
      height: 12,
      borderRadius: 6,
      backgroundColor: getColor('border'),
      marginLeft: 8,
      overflow: 'hidden',
    },
    vendorChevron: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: getColor('border'),
      overflow: 'hidden',
    },
    sectionDivider: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    sectionDividerText: {
      width: 150,
      height: 14,
      borderRadius: 7,
      backgroundColor: getColor('border'),
      overflow: 'hidden',
    },
    categoryContainer: {
      backgroundColor: getColor('background'),
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
    },
    categoryScroll: {
      flexDirection: 'row',
    },
    categoryItem: {
      alignItems: 'center',
      marginRight: 24,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    categoryIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: getColor('border'),
      marginBottom: 4,
      overflow: 'hidden',
    },
    categoryText: {
      width: 60,
      height: 12,
      borderRadius: 6,
      backgroundColor: getColor('border'),
      overflow: 'hidden',
    },
    productList: {
      flex: 1,
      padding: 8,
    },
    categoryHeader: {
      width: '100%',
      backgroundColor: getColor('background'),
      paddingVertical: 18,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
      marginTop: 16,
      marginBottom: 4,
    },
    categoryHeaderText: {
      width: 120,
      height: 18,
      borderRadius: 9,
      backgroundColor: getColor('border'),
      overflow: 'hidden',
    },
    productRow: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
    },
    productCard: {
      width: CARD_WIDTH,
      margin: 8,
      alignItems: 'center',
    },
    productImage: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: 12,
      backgroundColor: getColor('border'),
      marginBottom: 8,
      overflow: 'hidden',
    },
    productName: {
      width: '90%',
      height: 12,
      borderRadius: 6,
      backgroundColor: getColor('border'),
      marginBottom: 4,
      overflow: 'hidden',
    },
    productPrice: {
      width: '60%',
      height: 10,
      borderRadius: 5,
      backgroundColor: getColor('border'),
      overflow: 'hidden',
    },
    shimmer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: getColor('white'),
      opacity: 0.4,
    },
  });

  const shimmerOpacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 0],
  });

  const shimmerTranslateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const ShimmerOverlay = () => (
    <Animated.View
      style={[
        styles.shimmer,
        {
          opacity: shimmerOpacity,
          transform: [{ translateX: shimmerTranslateX }],
        },
      ]}
    />
  );

  const renderCategorySkeleton = () => (
    <View style={styles.categoryContainer}>
      <View style={styles.categoryScroll}>
        {Array.from({ length: 6 }).map((_, index) => (
          <View key={index} style={styles.categoryItem}>
            <View style={styles.categoryIcon}>
              <ShimmerOverlay />
            </View>
            <View style={styles.categoryText}>
              <ShimmerOverlay />
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderProductSkeleton = () => (
    <View style={styles.productList}>
      {Array.from({ length: 2 }).map((_, sectionIndex) => (
        <View key={sectionIndex}>
          <View style={styles.categoryHeader}>
            <View style={styles.categoryHeaderText}>
              <ShimmerOverlay />
            </View>
          </View>
          <View style={styles.productRow}>
            {Array.from({ length: 3 }).map((_, productIndex) => (
              <View key={productIndex} style={styles.productCard}>
                <View style={styles.productImage}>
                  <ShimmerOverlay />
                </View>
                <View style={styles.productName}>
                  <ShimmerOverlay />
                </View>
                <View style={styles.productPrice}>
                  <ShimmerOverlay />
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.backButton}>
          <ShimmerOverlay />
        </View>
        <View style={styles.headerTitle}>
          <ShimmerOverlay />
        </View>
        <View style={styles.headerSpacer} />
        <View style={styles.headerIcon}>
          <ShimmerOverlay />
        </View>
      </View>

      {/* Vendor Card */}
      {showVendorCard && (
        <View style={styles.vendorCard}>
          <View style={styles.vendorLogo}>
            <ShimmerOverlay />
          </View>
          <View style={styles.vendorInfo}>
            <View style={styles.vendorName}>
              <ShimmerOverlay />
            </View>
            <View style={styles.vendorMeta}>
              <View style={styles.vendorMetaItem}>
                <ShimmerOverlay />
              </View>
              <View style={styles.vendorMetaItem}>
                <ShimmerOverlay />
              </View>
              <View style={styles.vendorMetaRating}>
                <ShimmerOverlay />
              </View>
            </View>
          </View>
          <View style={styles.vendorChevron}>
            <ShimmerOverlay />
          </View>
        </View>
      )}

      {/* Section Divider */}
      <View style={styles.sectionDivider}>
        <View style={styles.sectionDividerText}>
          <ShimmerOverlay />
        </View>
      </View>

      {/* Categories */}
      {renderCategorySkeleton()}

      {/* Products */}
      {renderProductSkeleton()}
    </View>
  );
};

export default VendorProductSkeleton;
