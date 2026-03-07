import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

const { width } = Dimensions.get('window');

// Match CategoryCards layout: 2 columns, (width - 48) / 2, height 140
const CARD_WIDTH = (width - 48) / 2;
const CAROUSEL_BANNER_HEIGHT = 178;

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

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    container: {
      flex: 1,
      backgroundColor: getColor('background'),
    },
    // Header – matches HomeHeader (LocationSelector + ProfileIcon)
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
      gap: 8,
    },
    // Carousel – matches HomePromotionCarousel (marginVertical 16, carouselContainer marginBottom 24)
    carouselContainer: {
      marginVertical: 16,
      marginBottom: 24,
    },
    carouselBanner: {
      width: width - 32,
      height: CAROUSEL_BANNER_HEIGHT,
      marginHorizontal: 16,
      marginRight: 28, // 16 + 12
    },
    // Search – matches SearchBar container (paddingHorizontal 16, marginBottom 24)
    searchContainer: {
      paddingHorizontal: 16,
      marginBottom: 24,
    },
    // Category cards – matches CategoryCards (paddingHorizontal 16, 2 cards, height 140)
    cardsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      marginTop: 8,
      marginBottom: 24,
    },
    categoryCard: {
      width: CARD_WIDTH,
      height: 140,
      borderRadius: 16,
      overflow: 'hidden',
    },
    // Bottom illustration area placeholder
    bottomPlaceholder: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: width * 0.48,
      backgroundColor: getColor('border'),
      opacity: 0.2,
    },
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header: Location + Profile */}
        <View style={styles.header}>
          <View style={styles.locationSection}>
            <SkeletonItem width={20} height={20} borderRadius={4} />
            <View>
              <SkeletonItem width={80} height={12} borderRadius={4} />
              <SkeletonItem width={120} height={16} borderRadius={4} style={{ marginTop: 4 }} />
            </View>
          </View>
          <SkeletonItem width={40} height={40} borderRadius={20} />
        </View>

        {/* Promotion carousel banner */}
        <View style={styles.carouselContainer}>
          <SkeletonItem
            width={width - 32}
            height={CAROUSEL_BANNER_HEIGHT}
            borderRadius={12}
            style={{ marginHorizontal: 16 }}
          />
        </View>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <SkeletonItem width="100%" height={48} borderRadius={24} />
        </View>

        {/* Category cards (2 cards like CategoryCards) */}
        <View style={styles.cardsContainer}>
          <SkeletonItem width={CARD_WIDTH} height={140} borderRadius={16} />
          <SkeletonItem width={CARD_WIDTH} height={140} borderRadius={16} />
        </View>

        {/* Bottom illustration area */}
        <View style={styles.bottomPlaceholder} />
      </View>
    </SafeAreaView>
  );
};
