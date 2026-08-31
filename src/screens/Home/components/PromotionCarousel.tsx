import React from 'react';
import { View } from 'react-native';
import AutoScrollBanner from '../../../components/common/promo/AutoScrollBanner';
import { usePromotions } from '../../../hooks/usePromotions';
import { Promotion } from '../../../types/pages';

interface PromotionCarouselProps {
  category?: 'Food' | 'Grocery';
  onBannerPress?: (promo: Promotion) => void;
}

const PromotionCarousel = ({ category = 'Food', onBannerPress }: PromotionCarouselProps) => {
  // Can use 'Food' or 'Grocery' or a new category 'Home'
  const { promotions } = usePromotions(category);

  /**
   * Placeholder poster, __DEV__ only. Promotions are now filtered to open shops, so an
   * empty list is a routine state — a whole category's posters can belong to shops that
   * are shut. Shipping this mock in that case would put a fake store in front of users,
   * so in release builds an empty list renders nothing at all.
   */
  const mockPromotions = __DEV__
    ? [
        {
          shopId: 'mock-shop',
          title: 'Mock Promotion',
          subtitle: 'Mock Subtitle',
          imageURL: require('../../../assets/images/homescreen_mockPromotion-poster.png'),
          backgroundColor: '#105030',
          size: 'medium',
          bannerImage: true,
        },
      ]
    : [];

  const finalPromotions = promotions && promotions.length > 0 ? promotions : mockPromotions;

  // Fallback to empty checks inside AutoScrollBanner or here
  if (!finalPromotions || finalPromotions.length === 0) {
    return null;
  }

  return (
    <View style={{ marginVertical: 10 }}>
      <AutoScrollBanner bannerData={finalPromotions} onBannerPress={onBannerPress} />
    </View>
  );
};

export default PromotionCarousel;
