import { useEffect, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import PromoBanner from '../../../components/common/promo/PromoBanner';
import { usePromotions } from '../../../hooks/usePromotions';

const { width } = Dimensions.get('window');

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
  const scrollViewRef = useRef<ScrollView>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_currentIndex, setCurrentIndex] = useState(0);

  const { promotions } = usePromotions('Home');
  const displayPromotions = promotions;

  // Auto-scroll logic
  useEffect(() => {
    if (displayPromotions.length <= 1) return;
    const interval = 3000;
    const timer = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % displayPromotions.length;
        const bannerWidth = width - 32 + 12; // Full width minus padding plus margin
        scrollViewRef.current?.scrollTo({
          x: nextIndex * bannerWidth,
          animated: true,
        });
        return nextIndex;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [displayPromotions.length]);

  if (displayPromotions.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bannerScrollContainer}
        pagingEnabled
        scrollEventThrottle={16}
      >
        {displayPromotions.map((banner, index) => (
          <PromoBanner
            key={banner.promoId ?? index}
            promo={{ ...banner, bannerImage: true }}
            size={178}
            style={styles.bannerContainer}
            aspectRatio={1.5}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
  },
  bannerScrollContainer: {
    paddingHorizontal: 16,
  },
  bannerContainer: {
    width: width - 32, // Full width minus padding
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
});

export default HomePromotionCarousel;
