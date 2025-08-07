import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface VariantsModalSkeletonProps {
  variantCount?: number;
}

const VariantsModalSkeleton: React.FC<VariantsModalSkeletonProps> = ({ variantCount = 2 }) => {
  const { getColor, theme } = useTheme();
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
    content: {
      paddingHorizontal: 20,
    },
    productName: {
      width: '80%',
      height: 24,
      borderRadius: 12,
      backgroundColor: getColor('border'),
      marginTop: 20,
      overflow: 'hidden',
    },
    sectionDivider: {
      marginVertical: 16,
    },
    sectionDividerText: {
      width: 120,
      height: 18,
      borderRadius: 9,
      backgroundColor: getColor('border'),
      overflow: 'hidden',
    },
    variantsContainer: {
      marginTop: 8,
    },
    variantItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      padding: 8,
      marginBottom: 12,
    },
    variantImage: {
      width: 60,
      height: 60,
      borderRadius: 8,
      backgroundColor: getColor('border'),
      marginRight: 16,
      overflow: 'hidden',
    },
    variantInfo: {
      flex: 1,
    },
    variantName: {
      width: '90%',
      height: 16,
      borderRadius: 8,
      backgroundColor: getColor('border'),
      marginBottom: 8,
      overflow: 'hidden',
    },
    variantPriceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    currentPrice: {
      width: 60,
      height: 14,
      borderRadius: 7,
      backgroundColor: getColor('border'),
      marginRight: 8,
      overflow: 'hidden',
    },
    originalPrice: {
      width: 50,
      height: 12,
      borderRadius: 6,
      backgroundColor: getColor('border'),
      overflow: 'hidden',
    },
    variantRightContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 40,
    },
    addButton: {
      width: 80,
      height: 36,
      borderRadius: 18,
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

  const renderVariantSkeleton = () => (
    <View style={styles.variantsContainer}>
      {Array.from({ length: variantCount }).map((_, index) => (
        <View key={index} style={styles.variantItem}>
          <View style={styles.variantImage}>
            <ShimmerOverlay />
          </View>
          <View style={styles.variantInfo}>
            <View style={styles.variantName}>
              <ShimmerOverlay />
            </View>
            <View style={styles.variantPriceContainer}>
              <View style={styles.currentPrice}>
                <ShimmerOverlay />
              </View>
              <View style={styles.originalPrice}>
                <ShimmerOverlay />
              </View>
            </View>
          </View>
          <View style={styles.variantRightContainer}>
            <View style={styles.addButton}>
              <ShimmerOverlay />
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.content}>
      {/* Product Name */}
      <View style={styles.productName}>
        <ShimmerOverlay />
      </View>

      {/* Section Divider */}
      <View style={styles.sectionDivider}>
        <View style={styles.sectionDividerText}>
          <ShimmerOverlay />
        </View>
      </View>

      {/* Variants */}
      {renderVariantSkeleton()}
    </View>
  );
};

export default VariantsModalSkeleton;
