import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

const SearchSkeleton: React.FC = () => {
  const { getColor } = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingTop: 20,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionLine: {
      flex: 1,
      height: 1,
      backgroundColor: getColor('border'),
    },
    sectionTitle: {
      width: 80,
      height: 14,
      backgroundColor: getColor('border'),
      borderRadius: 7,
      marginHorizontal: 12,
    },
    productsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    skeletonCard: {
      width: '48%',
      backgroundColor: getColor('card'),
      borderRadius: 12,
      marginBottom: 12,
      overflow: 'hidden',
    },
    skeletonImage: {
      width: '100%',
      aspectRatio: 1,
      backgroundColor: getColor('border'),
      borderRadius: 12,
    },
    skeletonContent: {
      padding: 10,
    },
    skeletonTitle: {
      height: 12,
      backgroundColor: getColor('border'),
      borderRadius: 6,
      marginBottom: 8,
      width: '85%',
    },
    skeletonPrice: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    skeletonPriceText: {
      height: 10,
      backgroundColor: getColor('border'),
      borderRadius: 5,
      width: '40%',
    },
    skeletonBadge: {
      height: 10,
      backgroundColor: getColor('border'),
      borderRadius: 5,
      width: 24,
    },
  });

  const SkeletonCard = () => (
    <Animated.View style={[styles.skeletonCard, { opacity: pulseAnim }]}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonPrice}>
          <View style={styles.skeletonPriceText} />
          <View style={styles.skeletonBadge} />
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Section Header Skeleton */}
      <Animated.View style={[styles.sectionHeader, { opacity: pulseAnim }]}>
        <View style={styles.sectionLine} />
        <View style={styles.sectionTitle} />
        <View style={styles.sectionLine} />
      </Animated.View>

      {/* Products Grid Skeleton */}
      <View style={styles.productsGrid}>
        {[1, 2, 3, 4, 5, 6].map(item => (
          <SkeletonCard key={item} />
        ))}
      </View>
    </View>
  );
};

export default SearchSkeleton;
