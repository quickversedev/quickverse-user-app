import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useContext } from 'react';
import { Image, Platform, SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { Images } from '../../assets';
import FloatingCartsStack from '../../components/common/Cart/FloatingCartsStack';
import { TabBarVisibilityContext } from '../../navigation/TabNavigation';

import { SearchBar } from '../../components/modules/Header/SearchBar';
import { useAuth } from '../../contexts/login/AuthProvider';
import { useAppStateRefresh } from '../../hooks/useAppStateRefresh';
import useVendorStore from '../../store/vendorStore';
import { useTheme } from '../../theme/ThemeContext';
import { AppNavigationProp } from '../../types/navigation';
import CategoryCards from './components/CategoryCards';
import HomeHeader from './components/HomeHeader';
import HomePromotionCarousel from './components/HomePromotionCarousel';
// @ts-ignore
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const HomeMainScreen_2 = React.memo(() => {
    const { theme } = useTheme();
    const { getVendorsNearLocation } = useVendorStore();
    const { selectedAddress } = useAuth();

    // Auto-refresh vendors when app comes back from background
    useAppStateRefresh({
        onForeground: async () => {
            try {
                if (selectedAddress?.coordinates?.latitude && selectedAddress?.coordinates?.longitude) {
                    // Refresh vendors for current location
                    getVendorsNearLocation({
                        latitude: selectedAddress.coordinates.latitude,
                        longitude: selectedAddress.coordinates.longitude,
                        radius: 5,
                    });
                }
            } catch (error) {
                console.warn('Error refreshing vendors on home screen:', error);
            }
        },
        refreshThreshold: 100000, // Refresh after 100 seconds in background
    });

    const navigation = useNavigation<AppNavigationProp>();

    const handleSearchPress = useCallback(() => {
        navigation.navigate('Search');
    }, [navigation]);

    const tabBarContext = useContext(TabBarVisibilityContext);
    const bottomHeight = tabBarContext?.tabBarHeight || 50;

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <HomeHeader />

                <View style={styles.carouselContainer}>
                    <HomePromotionCarousel />
                </View>

                <View style={styles.searchContainer}>
                    <SearchBar onPress={handleSearchPress} />
                </View>

                <View style={styles.cardsContainer}>
                    <CategoryCards />
                </View>

                <View style={[styles.bottomIllustrationContainer, { bottom: bottomHeight, height: width * 0.48, overflow: 'hidden' }]} pointerEvents="none">
                    <Image
                        source={Images.homeScreenIllustration}
                        style={{ width: width, height: width * 0.5 }}
                        resizeMode="contain"
                    />
                </View>

            </View>

            <FloatingCartsStack />
        </SafeAreaView>
    );
});

HomeMainScreen_2.displayName = 'HomeMainScreen_2';

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    container: {
        flex: 1,
    },
    carouselContainer: {
        marginBottom: 24,
    },
    searchContainer: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    cardsContainer: {
        marginTop: 8,
    },
    bottomIllustrationContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        // zIndex: -1, // Removed to ensure visibility
    }
});

export default HomeMainScreen_2;
