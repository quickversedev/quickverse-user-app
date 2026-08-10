import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GRADIENT_FADE_DURATION,
  GRADIENT_LOCATIONS,
  HOME_CATEGORIES,
  type HomeCategoryId,
} from '../homeCategories';

/**
 * The coloured band behind the top of the home screen.
 *
 * WHY A FLOW CONTAINER, NOT AN OVERLAY
 * This renders as an ordinary in-flow View that WRAPS the sections it paints
 * (header → search → category strip → carousel → featured vendors) and sits as the
 * first child of the home ScrollView's content. Because it wraps them, it auto-sizes
 * to exactly their combined height:
 *   - no onLayout measurement, so no first-frame flash and no re-measure churn;
 *   - it terminates precisely at Featured Vendors, as the design requires;
 *   - it cannot dangle when HomePromotionCarousel or TopStoresNearYou return null
 *     (both do, on a fresh account) — it just shrinks.
 * A viewport-fixed absolute overlay would need a measured stop point and would fail
 * all three of those.
 *
 * WHY OPACITY CROSS-FADE, NOT COLOUR INTERPOLATION
 * react-native-linear-gradient registers BVLinearGradient as a legacy native
 * component, and its `colors` prop is not in Reanimated's animatable ColorProperties
 * list — per-stop interpolation from a worklet is not a supported path. So every
 * palette is a static LinearGradient layer and we animate `opacity`, which RN's own
 * Animated drives on the UI thread via useNativeDriver. No Reanimated needed.
 */

/**
 * How far the band bleeds above its own top edge, to cover the iOS bounce region.
 * The topmost gradient stop is a flat colour, so extending it upward as a solid
 * block is seamless. iOS only: Android shows an overscroll glow rather than
 * revealing background, and drawing outside parent bounds is less reliable there.
 */
const OVERSCROLL_BLEED = Platform.OS === 'ios' ? 320 : 0;

interface HomeGradientBandProps {
  activeId: HomeCategoryId;
  children: React.ReactNode;
}

const HomeGradientBand: React.FC<HomeGradientBandProps> = ({ activeId, children }) => {
  const insets = useSafeAreaInsets();

  const activeIndex = useMemo(() => {
    const idx = HOME_CATEGORIES.findIndex(c => c.id === activeId);
    return idx === -1 ? 0 : idx;
  }, [activeId]);

  // One opacity value per palette, created once and never recreated.
  const opacities = useRef(
    HOME_CATEGORIES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))
  ).current;

  /**
   * Only palettes the user has actually visited get mounted. On first render that is
   * just the default one, so we pay for a single LinearGradient rather than six.
   */
  const [mounted, setMounted] = useState<number[]>(() => [activeIndex]);

  useEffect(() => {
    setMounted(prev => (prev.includes(activeIndex) ? prev : [...prev, activeIndex]));
  }, [activeIndex]);

  useEffect(() => {
    const animations = opacities.map((value, i) =>
      Animated.timing(value, {
        toValue: i === activeIndex ? 1 : 0,
        duration: GRADIENT_FADE_DURATION,
        useNativeDriver: true,
      })
    );
    Animated.parallel(animations).start();
  }, [activeIndex, opacities]);

  return (
    <View style={[styles.band, { paddingTop: insets.top }]}>
      {mounted.map(index => {
        const category = HOME_CATEGORIES[index];
        if (!category) return null;

        return (
          <Animated.View
            key={category.id}
            pointerEvents="none"
            style={[styles.layer, { top: -OVERSCROLL_BLEED, opacity: opacities[index] }]}
          >
            {OVERSCROLL_BLEED > 0 && (
              <View style={{ height: OVERSCROLL_BLEED, backgroundColor: category.gradient[0] }} />
            )}
            <LinearGradient
              colors={category.gradient as unknown as string[]}
              locations={GRADIENT_LOCATIONS as number[]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.gradient}
            />
          </Animated.View>
        );
      })}

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  band: {
    // Establishes the containing block for the absolutely-positioned layers and,
    // critically, lets them paint above the band's own top edge on iOS.
    position: 'relative',
    overflow: 'visible',
    // Gives the mint stop room to read behind Featured Vendors before the band ends.
    paddingBottom: 10,
  },
  layer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradient: {
    flex: 1,
  },
});

export default React.memo(HomeGradientBand);
