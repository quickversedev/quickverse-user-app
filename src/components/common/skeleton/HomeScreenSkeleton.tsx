import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../theme/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const CAROUSEL_BANNER_HEIGHT = 178;

// Shared shimmer animation value for all skeleton items
const useShimmer = () => {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerValue, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerValue]);

  return shimmerValue;
};

interface SkeletonBlockProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
  shimmerValue: Animated.Value;
  baseColor: string;
  highlightColor: string;
}

const SkeletonBlock: React.FC<SkeletonBlockProps> = ({
  width: blockWidth,
  height,
  borderRadius = 8,
  style,
  shimmerValue,
  baseColor,
  highlightColor,
}) => {
  const translateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View
      style={[
        {
          width: blockWidth as number | 'auto',
          height,
          borderRadius,
          backgroundColor: baseColor,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: highlightColor,
          transform: [{ translateX }],
          opacity: 0.4,
        }}
      />
    </View>
  );
};

export const HomeScreenSkeleton: React.FC = () => {
  const { getColor, theme } = useTheme();
  const shimmerValue = useShimmer();

  const baseColor = getColor('border');
  const highlightColor = getColor('card');

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    container: {
      flex: 1,
      backgroundColor: getColor('background'),
    },
    // Match HomeHeader paddingTop: 16, paddingBottom: 8
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    locationSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    locationText: {
      gap: 6,
    },
    // Match HomeMainScreen_2 carouselContainer marginTop:0, marginBottom:2
    // plus HomePromotionCarousel inner paddingVertical 2 + 4 → visual 6px gaps
    carouselContainer: {
      marginTop: 2,
      marginBottom: 6,
      paddingHorizontal: 16,
    },
    bannerShadowWrap: {
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    dotsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
    },
    // Mirrors HomeCategoryStrip: 6 chips, 16px gutters, 18px gap
    categoryStrip: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      gap: 18,
      marginBottom: 14,
    },
    categoryChip: {
      width: 56,
      alignItems: 'center',
    },
    searchContainer: {
      paddingHorizontal: 16,
      marginBottom: 24,
    },
    cardsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      gap: 16,
    },
    // Category card skeleton with inner content
    cardSkeleton: {
      width: CARD_WIDTH,
      height: 140,
      borderRadius: 16,
      backgroundColor: baseColor,
      overflow: 'hidden',
      padding: 16,
      justifyContent: 'space-between',
    },
    bottomPlaceholder: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: width * 0.48,
      backgroundColor: baseColor,
      opacity: 0.15,
    },
  });

  const S = (props: Omit<SkeletonBlockProps, 'shimmerValue' | 'baseColor' | 'highlightColor'>) => (
    <SkeletonBlock
      {...props}
      shimmerValue={shimmerValue}
      baseColor={baseColor}
      highlightColor={highlightColor}
    />
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.container}>
        {/* Header: greeting + location + profile avatar */}
        <View style={styles.header}>
          <View style={styles.locationSection}>
            <S width={24} height={24} borderRadius={6} />
            <View style={styles.locationText}>
              <S width={100} height={12} borderRadius={4} />
              <S width={150} height={14} borderRadius={4} />
            </View>
          </View>
          <S width={40} height={40} borderRadius={20} />
        </View>

        {/* Search bar — sits directly under the header, above the carousel */}
        <View style={styles.searchContainer}>
          <S width={width - 32} height={48} borderRadius={24} />
        </View>

        {/* Category strip */}
        <View style={styles.categoryStrip}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <View key={i} style={styles.categoryChip}>
              <S width={34} height={34} borderRadius={10} />
              <S width={36} height={9} borderRadius={3} style={{ marginTop: 5 }} />
            </View>
          ))}
        </View>

        {/* Promotion carousel banner with page dots */}
        <View style={styles.carouselContainer}>
          <View style={styles.bannerShadowWrap}>
            <S width={width - 32} height={CAROUSEL_BANNER_HEIGHT} borderRadius={12} />
          </View>
          <View style={styles.dotsRow}>
            <S width={16} height={6} borderRadius={3} />
            <S width={6} height={6} borderRadius={3} />
            <S width={6} height={6} borderRadius={3} />
          </View>
        </View>

        {/* Category cards with inner text placeholders */}
        <View style={styles.cardsContainer}>
          <View style={styles.cardSkeleton}>
            <View>
              <S width={CARD_WIDTH * 0.6} height={14} borderRadius={4} />
              <S width={CARD_WIDTH * 0.75} height={10} borderRadius={3} style={{ marginTop: 6 }} />
            </View>
            <S width={60} height={60} borderRadius={12} style={{ alignSelf: 'flex-end' }} />
          </View>
          <View style={styles.cardSkeleton}>
            <View>
              <S width={CARD_WIDTH * 0.65} height={14} borderRadius={4} />
              <S width={CARD_WIDTH * 0.7} height={10} borderRadius={3} style={{ marginTop: 6 }} />
            </View>
            <S width={60} height={60} borderRadius={12} style={{ alignSelf: 'flex-end' }} />
          </View>
        </View>

        {/* Bottom illustration placeholder */}
        <View style={styles.bottomPlaceholder} />
      </View>
    </SafeAreaView>
  );
};
