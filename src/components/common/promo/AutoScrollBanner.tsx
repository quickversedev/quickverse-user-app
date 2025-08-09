import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet } from 'react-native';
import PromoBanner from './PromoBanner';

const { width } = Dimensions.get('window');

interface BannerData {
  promo: string;
  title: string;
  subtitle: string;
  bannerButton?: { label: string; onPress: () => void };
  backgroundColor: string;
  isBannerImage: boolean;
}

interface AutoScrollBannerProps {
  bannerData: BannerData[];
  interval?: number;
}

const AutoScrollBanner: React.FC<AutoScrollBannerProps> = ({ bannerData, interval = 3000 }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [_currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % bannerData.length;
        const bannerWidth = width - 32 + 12; // Full width minus padding plus margin
        scrollViewRef.current?.scrollTo({
          x: nextIndex * bannerWidth,
          animated: true,
        });
        return nextIndex;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [bannerData.length, interval]);

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.bannerScrollContainer}
      pagingEnabled
      scrollEventThrottle={16}
    >
      {bannerData.map((banner, index) => (
        <PromoBanner
          key={index}
          promo={banner.promo}
          title={banner.title}
          subtitle={banner.subtitle}
          bannerButton={banner.bannerButton}
          size="medium"
          style={styles.bannerContainer}
          backgroundColor={banner.backgroundColor}
          isBannerImage={banner.isBannerImage}
        />
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
