import React from 'react';
import { View } from 'react-native';
import AutoScrollBanner from '../../../components/common/promo/AutoScrollBanner';
import { usePromotions } from '../../../hooks/usePromotions';

const PromotionCarousel = () => {
    // Can use 'Food' or 'Grocery' or a new category 'Home'
    const { promotions } = usePromotions('Food');

    // Fallback to empty checks inside AutoScrollBanner or here
    if (!promotions || promotions.length === 0) {
        return null;
    }

    return (
        <View style={{ marginVertical: 10 }}>
            <AutoScrollBanner bannerData={promotions} />
        </View>
    );
};

export default PromotionCarousel;
