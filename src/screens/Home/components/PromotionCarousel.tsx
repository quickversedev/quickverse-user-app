import React from 'react';
import { View } from 'react-native';
import AutoScrollBanner from '../../../components/common/promo/AutoScrollBanner';
import { usePromotions } from '../../../hooks/usePromotions';

const PromotionCarousel = ({ category = 'Food' }: { category?: 'Food' | 'Grocery' }) => {
    // Can use 'Food' or 'Grocery' or a new category 'Home'
    const { promotions } = usePromotions(category);

    const mockPromotions = [
        {
            shopId: 'mock-shop',
            title: 'Mock Promotion',
            subtitle: 'Mock Subtitle',
            imageURL: require('../../../assets/images/homescreen_mockPromotion-poster.png'),
            backgroundColor: '#105030',
            size: 'medium',
            bannerImage: true
        }
    ];

    const finalPromotions = (promotions && promotions.length > 0) ? promotions : mockPromotions;

    // Fallback to empty checks inside AutoScrollBanner or here
    if (!finalPromotions || finalPromotions.length === 0) {
        return null;
    }

    return (
        <View style={{ marginVertical: 10 }}>
            <AutoScrollBanner bannerData={finalPromotions} />
        </View>
    );
};

export default PromotionCarousel;
