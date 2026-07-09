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
          <PromoBanner
            key={banner.promoId ?? index}
            promo={{ ...banner, bannerImage: true }}
            size={150}
            style={[
              styles.bannerContainer,
              index === bannerItems.length - 1 && { marginRight: 0 },
            ]}
            aspectRatio={8 / 3}
            onPress={handleBannerPress}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 2,
  },
  bannerScrollContainer: {
    paddingHorizontal: SIDE_PADDING,
  },
  bannerContainer: {
    width: BANNER_WIDTH,
    marginRight: BANNER_GAP,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
});

export default HomePromotionCarousel;
