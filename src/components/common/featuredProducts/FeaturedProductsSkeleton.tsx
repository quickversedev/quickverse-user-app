import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

const PRODUCT_CARD_WIDTH = 110;

interface FeaturedProductsSkeletonProps {
  count?: number;
}

const FeaturedProductsSkeleton: React.FC<FeaturedProductsSkeletonProps> = ({ count = 3 }) => {
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
      flexDirection: 'row',
      paddingLeft: 0,
    },
    skeletonCard: {
      width: PRODUCT_CARD_WIDTH,
      marginRight: 10,
    },
    imageSkeleton: {
      width: '90%',
      aspectRatio: 1,
      borderRadius: 12,
      backgroundColor: getColor('border'),
      marginBottom: 8,
      overflow: 'hidden',
    },
    textSkeleton: {
      height: 12,
      borderRadius: 6,
      backgroundColor: getColor('border'),
      marginBottom: 4,
      overflow: 'hidden',
    },
    priceSkeleton: {
      height: 10,
      borderRadius: 5,
      backgroundColor: getColor('border'),
      width: '60%',
      overflow: 'hidden',
    },
    shimmer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: getColor('white'),
      opacity: 0.3,
    },
  });

  const shimmerOpacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 0],
  });

  const shimmerTranslateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-PRODUCT_CARD_WIDTH, PRODUCT_CARD_WIDTH],
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

  return (
    <View style={styles.container}>
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={index} style={styles.skeletonCard}>
          <View style={styles.imageSkeleton}>
            <ShimmerOverlay />
          </View>
          <View style={styles.textSkeleton}>
            <ShimmerOverlay />
          </View>
          <View style={styles.priceSkeleton}>
            <ShimmerOverlay />
          </View>
        </View>
      ))}
    </View>
  );
};

export default FeaturedProductsSkeleton;
