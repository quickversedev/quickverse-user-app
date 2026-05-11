import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet } from 'react-native';
import { Promotion } from '../../../types/pages';
import PromoBanner from './PromoBanner';

const { width } = Dimensions.get('window');
const SIDE_PADDING = 16;
const BANNER_GAP = 12;
const BANNER_WIDTH = width - SIDE_PADDING * 2;
const SNAP_INTERVAL = BANNER_WIDTH + BANNER_GAP;

interface AutoScrollBannerProps {
  bannerData: Promotion[];
  interval?: number;
  onBannerPress?: (promo: Promotion) => void;
}

const PAUSE_AFTER_INTERACTION_MS = 5000;

const AutoScrollBanner: React.FC<AutoScrollBannerProps> = ({
  bannerData,
  interval = 3000,
  onBannerPress,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [_currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);
  const pauseUntilRef = useRef(0);

  // Only show promotions that are actual banner images
  const bannerItems = useMemo(() => bannerData.filter(item => item.bannerImage), [bannerData]);

  useEffect(() => {
    if (bannerItems.length === 0) return;

    const timer = setInterval(() => {
      if (Date.now() < pauseUntilRef.current) return;
      const nextIndex = (currentIndexRef.current + 1) % bannerItems.length;
      currentIndexRef.current = nextIndex;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * SNAP_INTERVAL,
        animated: true,
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
          key={index}
          promo={banner}
          size="medium"
          style={[styles.bannerContainer, index === bannerItems.length - 1 && { marginRight: 0 }]}
          onPress={onBannerPress}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  bannerScrollContainer: {
    paddingHorizontal: SIDE_PADDING,
  },
  bannerContainer: {
    width: BANNER_WIDTH,
    marginVertical: 8,
    marginRight: BANNER_GAP,
    
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
});

export default AutoScrollBanner;
