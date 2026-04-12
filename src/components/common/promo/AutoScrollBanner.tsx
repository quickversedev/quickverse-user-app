import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet } from 'react-native';
import { Promotion } from '../../../types/pages';
import PromoBanner from './PromoBanner';

const { width } = Dimensions.get('window');

interface AutoScrollBannerProps {
  bannerData: Promotion[];
  interval?: number;
  onBannerPress?: (promo: Promotion) => void;
}

const AutoScrollBanner: React.FC<AutoScrollBannerProps> = ({ bannerData, interval = 3000, onBannerPress }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [_currentIndex, setCurrentIndex] = useState(0);

  // Only show promotions that are actual banner images
  const bannerItems = useMemo(
    () => bannerData.filter(item => item.bannerImage),
    [bannerData],
  );

  useEffect(() => {
    if (bannerItems.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % bannerItems.length;
        const bannerWidth = width - 32 + 12; // Full width minus padding plus margin
        scrollViewRef.current?.scrollTo({
          x: nextIndex * bannerWidth,
          animated: true,
        });
        return nextIndex;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [bannerItems.length, interval]);

  if (bannerItems.length === 0) return null;

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.bannerScrollContainer}
      pagingEnabled
      scrollEventThrottle={16}
    >
      {bannerItems.map((banner, index) => (
        <PromoBanner key={index} promo={banner} size="medium" style={styles.bannerContainer} onPress={onBannerPress} />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  bannerScrollContainer: {
    paddingHorizontal: 16,
  },
  bannerContainer: {
    width: width - 32, // Full width minus padding
    marginVertical: 8,
    marginRight: 12,
  },
});

export default AutoScrollBanner;
