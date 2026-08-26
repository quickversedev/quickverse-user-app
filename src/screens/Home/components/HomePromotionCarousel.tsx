import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import PromoBanner from '../../../components/common/promo/PromoBanner';
import { usePromotions } from '../../../hooks/usePromotions';
import useVendorStore from '../../../store/vendorStore';
import { AppNavigationProp } from '../../../types/navigation';
import { Promotion } from '../../../types/pages';

const { width } = Dimensions.get('window');
const SIDE_PADDING = 16;
const BANNER_GAP = 12;
const BANNER_WIDTH = width - SIDE_PADDING * 2;
const SNAP_INTERVAL = BANNER_WIDTH + BANNER_GAP;
const PAUSE_AFTER_INTERACTION_MS = 5000;
const AUTO_SCROLL_INTERVAL_MS = 3000;

// Static promotions (kept for fallback/reference — replaced by /v3/pages "Home" promotions)
// const STATIC_PROMOTIONS = [
//   {
//     shopId: 'static_1',
//     title: '',
//     subtitle: '',
//     size: 'large',
//     backgroundColor: '#FFFFFF',
//     bannerImage: true,
//     // @ts-ignore
//     imageURL: require('../../../assets/images/homePromo/qv-homePromo_1.png'),
//   },
//   {
//     shopId: 'static_2',
//     title: '',
//     subtitle: '',
//     size: 'large',
//     backgroundColor: '#FFFFFF',
//     bannerImage: true,
//     // @ts-ignore
//     imageURL: require('../../../assets/images/homePromo/qv-homePromo_2.png'),
//   },
//   {
//     shopId: 'static_3',
//     title: '',
//     subtitle: '',
//     size: 'large',
//     backgroundColor: '#FFFFFF',
//     bannerImage: true,
//     // @ts-ignore
//     imageURL: require('../../../assets/images/homePromo/qv-homePromo_3.png'),
//   },
// ];

const HomePromotionCarousel = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const { vendors, getVendorById } = useVendorStore();
  const { promotions } = usePromotions('Home');

  const scrollViewRef = useRef<ScrollView>(null);
  const currentIndexRef = useRef(0);
  const pauseUntilRef = useRef(0);
  const [, setCurrentIndex] = useState(0);

  const bannerItems = useMemo(() => promotions.filter(item => item.bannerImage), [promotions]);

  /**
   * Snap back to the first banner whenever the set changes.
   *
   * The ScrollView keeps its horizontal offset across re-renders. If the list shrinks
   * while auto-scroll has advanced — e.g. a pull-to-refresh picks up a poster that the
   * admin moved to another time slot — the old offset points past the end and the
   * carousel renders as blank space. The auto-scroll effect below cannot correct it,
   * because it early-returns for a single banner.
   */
  useEffect(() => {
    currentIndexRef.current = 0;
    setCurrentIndex(0);
    scrollViewRef.current?.scrollTo({ x: 0, animated: false });
  }, [bannerItems.length]);

  useEffect(() => {
    if (bannerItems.length <= 1) return;

    const timer = setInterval(() => {
      if (Date.now() < pauseUntilRef.current) return;
      const nextIndex = (currentIndexRef.current + 1) % bannerItems.length;
      currentIndexRef.current = nextIndex;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * SNAP_INTERVAL,
        animated: true,
      });
    }, AUTO_SCROLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [bannerItems.length]);

  const handleBannerPress = useCallback(
    (promo: Promotion) => {
      const shopId = promo.shopId ? String(promo.shopId) : '';
      if (!shopId || shopId.startsWith('static_') || shopId === 'mock-shop') return;
      let vendor = getVendorById(shopId);
      if (!vendor) {
        vendor = vendors.find(v => String(v.shopId) === shopId) || null;
      }
      if (vendor) {
        // @ts-ignore - VendorProduct route type lives on AppStack
        navigation.navigate('VendorProduct', { vendor });
      }
    },
    [getVendorById, vendors, navigation]
  );

  if (bannerItems.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bannerScrollContainer}
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        scrollEnabled={bannerItems.length > 1}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => {
          pauseUntilRef.current = Date.now() + PAUSE_AFTER_INTERACTION_MS;
        }}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SNAP_INTERVAL);
          currentIndexRef.current = idx;
          setCurrentIndex(idx);
          pauseUntilRef.current = Date.now() + PAUSE_AFTER_INTERACTION_MS;
        }}
      >
        {bannerItems.map((banner, index) => (
          <View
            key={banner.promoId ?? index}
            style={[styles.bannerShadow, index === bannerItems.length - 1 && { marginRight: 0 }]}
          >
            <PromoBanner
              promo={{ ...banner, bannerImage: true }}
              size={150}
              style={styles.bannerContainer}
              aspectRatio={8 / 3}
              onPress={handleBannerPress}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 58,
    paddingBottom: 2,
  },
  bannerScrollContainer: {
    paddingHorizontal: SIDE_PADDING,
    // Kept non-zero so the banner card's drop shadow isn't clipped.
    paddingVertical: 4,
  },
  bannerShadow: {
    width: BANNER_WIDTH,
    marginRight: BANNER_GAP,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    borderRadius: 8,
  },
  bannerContainer: {
    width: '100%',
    borderRadius: 8,
  },
});

export default HomePromotionCarousel;
