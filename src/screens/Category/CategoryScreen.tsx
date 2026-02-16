import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { Images } from '../../assets';
import FloatingCartsStack from '../../components/common/Cart/FloatingCartsStack';
import SectionDivider from '../../components/common/SectionDivider';
import { SearchBar } from '../../components/modules/Header/SearchBar';
import VendorCard2 from '../../components/modules/Vendor/VendorCard2'; // Updated to V2
import VendorShowcaseWidget from '../../components/modules/Vendor/VendorShowcaseWidget';
import { Collection, fetchCollectionsFromApi } from '../../data/collectionsData';
import { RootStackParamList } from '../../routes/AppStack';
import useVendorStore from '../../store/vendorStore';
import { useTheme } from '../../theme/ThemeContext';
import { Vendor } from '../../types/vendor';
import PromotionCarousel from '../Home/components/PromotionCarousel';
import CollectionsGrid from './components/CollectionsGrid';
import CollectionsGridSkeleton from './components/CollectionsGridSkeleton';

type CategoryScreenRouteProp = RouteProp<RootStackParamList, 'Category'>;

const { width } = Dimensions.get('window');

const CategoryScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<CategoryScreenRouteProp>();
    const { theme } = useTheme();

    // Default to Food if no params (for testing/safety)
    const categoryName = route.params?.categoryName || 'Food';
    const isGrocery = categoryName.toLowerCase().includes('grocery');

    const vendors = useVendorStore(state => state.vendors);
    const getVendorsByCategory = useVendorStore(state => state.getVendorsByCategory);
    const categoryVendors = React.useMemo(() => {
        const list = getVendorsByCategory(categoryName);
        return list;
    }, [categoryName, getVendorsByCategory, vendors]);

    // Cart Logic
    // Collections Logic (Grocery Only)
    const [collections, setCollections] = useState<Collection[]>([]);
    const [collectionsLoading, setCollectionsLoading] = useState(false);

    useEffect(() => {
        const loadCollections = async () => {
            if (!isGrocery || categoryVendors.length === 0) {
                setCollectionsLoading(false);
                return;
            }
            setCollectionsLoading(true);
            try {
                const storeId = categoryVendors[0].shopId;
                const sections = await fetchCollectionsFromApi(storeId);
                if (sections.length > 0) {
                    setCollections(sections[0].collections);
                } else {
                    setCollections([]);
                }
            } catch (error) {
                console.error('[CategoryScreen] Failed to load collections:', error);
                setCollections([]);
            } finally {
                setCollectionsLoading(false);
            }
        };

        loadCollections();
    }, [isGrocery, categoryVendors]);

    // Cart Logic

    const handleVendorPress = (vendor: Vendor) => {
        // @ts-ignore - Assuming VendorProduct exists in stack but might not be typed yet in this file
        navigation.navigate('VendorProduct', { vendor });
    };

    const handleSearchPress = React.useCallback(() => {
        navigation.navigate('Search');
    }, [navigation]);

    const navigateToOtherCategory = React.useCallback(() => {
        const otherCategory = isGrocery ? 'Food' : 'Grocery';
        navigation.navigate('Category', { categoryName: otherCategory });
    }, [navigation, isGrocery]);

    const headerImage = isGrocery
        ? Images.groceryCategoryIllustration
        : Images.foodCategoryIllustration;

    const hasNoVendors = categoryVendors.length === 0;
    const otherCategoryLabel = isGrocery ? 'Food' : 'Grocery';

    const renderHeader = () => (
        <View>
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
                        colors={['rgba(255, 255, 255, 0)', '#FFFFFF', '#FFFFFF']}
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

            {/* Conditional Content if Vendors Exist */}
            {!hasNoVendors && (
                <>
                    {/* Collections Grid (Grocery Only) */}
                    {isGrocery && collectionsLoading && <CollectionsGridSkeleton />}
                    {isGrocery && !collectionsLoading && collections.length > 0 && (
                        <CollectionsGrid
                            collections={collections}
                            shopId={categoryVendors[0]?.shopId}
                        />
                    )}

                    {/* Horizontal list of store cards */}
                    <SectionDivider
                        text="Browse stores"
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
                                    size={160}
                                    onPress={handleVendorPress}
                                />
                            </View>
                        ))}
                    </ScrollView>

                    {/* Full store list with showcase */}
                    <SectionDivider
                        text="Stores for you"
                        style={{ marginVertical: 16, paddingHorizontal: 40 }}
                        textStyle={{
                            color: '#4B5563',
                            fontWeight: '600',
                            fontFamily: 'serif',
                            fontStyle: 'italic',
                            fontSize: 16,
                        }}
                    />
                </>
            )}
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateMessage}>
                No {categoryName} stores near you right now. Try browsing {otherCategoryLabel} instead.
            </Text>
            <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={navigateToOtherCategory}
                activeOpacity={0.8}
            >
                <Text style={styles.emptyStateButtonText}>Browse {otherCategoryLabel}</Text>
                <Feather name="arrow-right" size={20} color="#fff" />
            </TouchableOpacity>
        </View>
    );

    const renderItem = ({ item }: { item: Vendor }) => (
        <View style={{ paddingHorizontal: 20 }}>
            <View style={{ marginTop: 8, marginBottom: 24 }}>
                <VendorShowcaseWidget
                    vendor={item}
                    onPressExplore={() => handleVendorPress(item)}
                />
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
            <FlatList
                data={hasNoVendors ? [] : categoryVendors}
                renderItem={renderItem}
                keyExtractor={(item) => item.shopId}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmpty}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                windowSize={5}
            />
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
    emptyStateContainer: {
        marginTop: 32,
        marginHorizontal: 24,
        paddingVertical: 28,
        paddingHorizontal: 24,
        backgroundColor: '#fff',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
    },
    emptyStateMessage: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 20,
    },
    emptyStateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#6B7280',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    emptyStateButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});

export default CategoryScreen;
