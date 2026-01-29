import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import PromoBanner from '../../../components/common/promo/PromoBanner';
import { usePromotions } from '../../../hooks/usePromotions';

const { width } = Dimensions.get('window');

// Mock data (moved from PromotionCarousel)
const MOCK_PROMOTIONS = [
    {
        shopId: 'mock_1',
        title: 'Design Clients',
        subtitle: 'If you struggle to get design clients, read this.',
        size: 'large',
        backgroundColor: '#F5F5F5',
        bannerImage: true,
        imageURL: require('../../../assets/images/homescreen_mockPromotion-poster.png'),
    },
    {
        shopId: 'mock_2',
        title: 'Food Delivery',
        subtitle: 'Get 50% off on your first order',
        size: 'large',
        backgroundColor: '#FF6B35',
        bannerImage: true,
        imageURL: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    }
];

const HomePromotionCarousel = () => {
    const { promotions } = usePromotions('Food');
    const scrollViewRef = useRef<ScrollView>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_currentIndex, setCurrentIndex] = useState(0);

    const displayPromotions = useMemo(() => {
        if (promotions && promotions.length > 0) {
            return promotions;
        }
        return MOCK_PROMOTIONS;
    }, [promotions]);

    // Auto-scroll logic (copied from AutoScrollBanner but adapted if needed)
    useEffect(() => {
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
                        key={index}
                        promo={banner}
                        // Use a custom size number for even larger height if needed, 
                        // or 'large' (approx 160px height). User asked for "bigger height".
                        // Medium was 100. Large is 160.
                        // I'll stick to 'large' or maybe 200 via number if large isn't big enough.
                        // Let's us 'large' first as it's a standard size. 
                        // Actually, I'll use a custom size of 220 to be safe for "bigger".
                        size={178}
                        style={styles.bannerContainer}
                        aspectRatio={1.5} // slightly taller aspect ratio
                    />
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
    },
    bannerScrollContainer: {
        paddingHorizontal: 16,
    },
    bannerContainer: {
        width: width - 32, // Full width minus padding
        marginRight: 12,
    },
});

export default HomePromotionCarousel;
