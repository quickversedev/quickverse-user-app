import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import {
    Dimensions,
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Or Feather
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../theme/ThemeContext';
import { RootStackParamList } from '../../routes/AppStack';
import { Images } from '../../assets';
import { SearchBar } from '../../components/modules/Header/SearchBar';
import PromotionCarousel from '../Home/components/PromotionCarousel';
import SectionDivider from '../../components/common/SectionDivider';
import useVendorStore from '../../store/vendorStore';
import { getStoreStatus } from '../../utils/storeUtils';
import VendorCard2 from '../../components/modules/Vendor/VendorCard2'; // Updated to V2
import VendorShowcaseWidget from '../../components/modules/Vendor/VendorShowcaseWidget';
import { Vendor } from '../../types/vendor';
import FloatingCartsStack from '../../components/common/Cart/FloatingCartsStack';

type CategoryScreenRouteProp = RouteProp<RootStackParamList, 'Category'>;

const { width } = Dimensions.get('window');

const CategoryScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<CategoryScreenRouteProp>();
    const { theme } = useTheme();

    // Default to Food if no params (for testing/safety)
    const categoryName = route.params?.categoryName || 'Food';
    const isGrocery = categoryName.toLowerCase().includes('grocery');

    const { getVendorsByCategory } = useVendorStore();
    const categoryVendors = React.useMemo(() => {
        const vendors = getVendorsByCategory(categoryName);
        return vendors.filter(vendor => getStoreStatus(vendor).isOpen);
    }, [categoryName, getVendorsByCategory]);

    // Cart Logic
    // Cart Logic

    const handleVendorPress = (vendor: Vendor) => {
        // @ts-ignore - Assuming VendorProduct exists in stack but might not be typed yet in this file
        navigation.navigate('VendorProduct', { vendor });
    };

    const handleSearchPress = React.useCallback(() => {
        navigation.navigate('Search');
    }, [navigation]);

    const headerImage = isGrocery
        ? Images.groceryCategoryIllustration
        : Images.foodCategoryIllustration;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: '#FFF6EC' }]}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.headerTopBar}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Feather name="arrow-left" size={24} color="#000" />
                        </TouchableOpacity>

                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitleMain}>{categoryName}</Text>
                            <Text style={styles.headerTitleSub}>for you</Text>
                        </View>
                    </View>

                    <View style={styles.imageContainer}>
                        <Image source={headerImage} style={styles.headerImage} resizeMode="contain" />
                        <LinearGradient
                            colors={['rgba(255, 246, 236, 0)', '#FFF6EC', '#FFF6EC']}
                            locations={[0, 0.4, 1]}
                            style={styles.headerBlur}
                        />
                    </View>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <SearchBar
                        onPress={handleSearchPress}
                        placeholder={isGrocery ? "Search for 'Milk'" : "Search for 'Shawarma'"}
                    />
                </View>

                {/* Promo Banners */}
                <View style={styles.promoContainer}>
                    <PromotionCarousel />
                </View>

                {/* Horizontal List 1 */}
                <SectionDivider
                    text="{SOME copy}"
                    style={{ marginVertical: 16, paddingHorizontal: 40 }}
                    textStyle={{
                        color: '#4B5563',
                        fontWeight: '600',
                        fontFamily: 'serif',
                        fontStyle: 'italic',
                        fontSize: 16,
                    }}
                />

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                    {categoryVendors.map((vendor) => (
                        <View key={vendor.shopId} style={{ marginRight: 16 }}>
                            <VendorCard2
                                vendor={vendor}
                                size={160} // Fixed width for horizontal items
                                onPress={handleVendorPress}
                            />
                        </View>
                    ))}
                </ScrollView>

                {/* Store List */}
                <SectionDivider
                    text="{SOME copy}"
                    style={{ marginVertical: 16, paddingHorizontal: 40 }}
                    textStyle={{
                        color: '#4B5563',
                        fontWeight: '600',
                        fontFamily: 'serif',
                        fontStyle: 'italic',
                        fontSize: 16,
                    }}
                />

                <View style={{ paddingHorizontal: 20 }}>
                    {categoryVendors.map((vendor) => (
                        <View key={vendor.shopId}>
                            {/* <VendorCard2
                                vendor={vendor}
                                size="large"
                                onPress={handleVendorPress}
                            /> */}
                            <View style={{ marginTop: 8, marginBottom: 24 }}>
                                <VendorShowcaseWidget
                                    vendor={vendor}
                                    onPressExplore={() => handleVendorPress(vendor)}
                                />
                            </View>
                        </View>
                    ))}
                </View>

            </ScrollView>
            <FloatingCartsStack />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center', // Center content horizontally
        marginTop: 20,
        position: 'relative',
        // marginBottom: 100,
    },
    headerTopBar: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 10,
        height: 60, // Fixed height for alignment
    },
    backButton: {
        position: 'absolute',
        left: 20,
        // top is removed, centered by flex/absolute vertical center
        padding: 8,
        backgroundColor: '#fff',
        borderRadius: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        zIndex: 10,
    },
    headerTitleContainer: {
        flexDirection: 'row', // Single line
        alignItems: 'baseline',
        paddingTop: 0, // Removed padding
        zIndex: 1,
    },
    headerTitleMain: {
        fontSize: 38,
        fontWeight: '700',
        color: '#6B7280',
    },
    headerTitleSub: {
        fontSize: 38,
        fontWeight: '400',
        fontStyle: 'italic',
        fontFamily: 'serif',
        color: '#9CA3AF',
        marginLeft: 8, // Space between "Food" and "for you"
    },
    imageContainer: {
        width: 280,
        height: 238, // Cropped height (250 * 0.85) for 15% crop
        marginTop: -60,
        zIndex: 100,
        overflow: 'hidden', // Crop the bottom
        position: 'relative',
    },
    headerImage: {
        width: 280,
        height: 280, // Original height
    },
    headerBlur: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        zIndex: 101,
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
        marginTop: -20,
        zIndex: 1000,
    },
    promoContainer: {
        // marginBottom: 24,
    },
    horizontalList: {
        paddingLeft: 20,
        paddingRight: 20,
        marginBottom: 0,
    },
});

export default CategoryScreen;
