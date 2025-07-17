import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../../routes/AppStack';
import { useTheme } from '../../../theme/ThemeContext';
import { Vendor } from '../../../types/vendor';
import ProductCard from './ProductCard';
import { mockProducts } from './mockProducts';

// Types for category and product
interface Category {
  id: string;
  name: string;
  icon: number; // require returns a number for images
}
interface Product {
  id: string;
  name: string;
  price: number;
  mrp: number;
  rating: number;
  image: number; // require returns a number for images
  category: string;
  options: number;
}
// Removed unused FlatListItem type

// Mock categories
const mockCategories: Category[] = [
  { id: 'scoops', name: 'Scoops', icon: require('../../../assets/images/bg_1.png') },
  { id: 'sundaes', name: 'Sundaes', icon: require('../../../assets/images/bg_1.png') },
  { id: 'cones', name: 'Cones', icon: require('../../../assets/images/bg_1.png') },
  { id: 'family', name: 'Family Packs', icon: require('../../../assets/images/bg_1.png') },
];

interface VendorProductRouteParams {
  vendor: Vendor;
}
type VendorProductRouteProp = RouteProp<
  { VendorProduct: VendorProductRouteParams },
  'VendorProduct'
>;

const { width } = Dimensions.get('window');
const CATEGORY_WIDTH = 90;

// Helper: create a row-based list with headers and product rows
const getRowBasedProductList = (
  categories: Category[],
  products: Product[],
  numColumns: number
) => {
  const rows: Array<
    { type: 'header'; category: Category } | { type: 'products'; products: Product[] }
  > = [];
  categories.forEach((cat: Category) => {
    rows.push({ type: 'header', category: cat });
    const catProducts = products.filter((p: Product) => p.category === cat.id);
    for (let i = 0; i < catProducts.length; i += numColumns) {
      rows.push({ type: 'products', products: catProducts.slice(i, i + numColumns) });
    }
  });
  return rows;
};

const VendorProduct: React.FC = () => {
  const { getColor, getTypography } = useTheme();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<VendorProductRouteProp>();
  const { vendor } = route.params;

  const renderRating = () => {
    if (!vendor.rating || vendor.rating === 0) {
      return <Text style={styles.ratingText}>Not Rated</Text>;
    }
    return <Text style={styles.ratingText}>{vendor.rating}</Text>;
  };

  const formatAddress = () => {
    if (vendor.shopAddress) {
      return vendor.shopAddress.city;
    }
    return 'Location';
  };

  const [selectedCategory, setSelectedCategory] = useState(mockCategories[0].id);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [hideCategory, setHideCategory] = useState(false);
  const categoryAnim = useRef(new Animated.Value(0)).current; // 0: shown, -CATEGORY_WIDTH: hidden
  const numColumns = 3;
  const rowProductList = getRowBasedProductList(mockCategories, mockProducts, numColumns);
  type RowProductListItem =
    | { type: 'header'; category: Category }
    | { type: 'products'; products: Product[] };
  const flatListRef = useRef<FlatList<RowProductListItem> | null>(null);

  // Map category id to index in flatProductList for scrollToIndex
  const categoryIndexMap: { [key: string]: number } = {};
  rowProductList.forEach((item, idx) => {
    if (item.type === 'header') {
      categoryIndexMap[item.category.id] = idx;
    }
  });

  // --- Viewability config and handler for FlatList ---
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 10, // lower threshold for better first header detection
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ item: RowProductListItem }> }) => {
      // Find the first visible header
      const firstHeader = viewableItems.find(item => item.item.type === 'header');
      if (
        firstHeader &&
        selectedCategory !==
          (firstHeader.item as { type: 'header'; category: Category }).category.id
      ) {
        setSelectedCategory(
          (firstHeader.item as { type: 'header'; category: Category }).category.id
        );
      }
    }
  ).current;
  // --- End viewability ---

  // On category select, scroll to its header
  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    const idx = categoryIndexMap[catId];
    if (idx !== undefined && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: idx, animated: true });
    }
  };

  // Animate category section in/out
  useEffect(() => {
    Animated.timing(categoryAnim, {
      toValue: hideCategory ? -CATEGORY_WIDTH : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [hideCategory]);

  // Listen to scroll and hide category when scrolling down (do not unhide on scroll up)
  const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
    useNativeDriver: false,
    listener: (event: { nativeEvent: { contentOffset: { y: number } } }) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      if (!hideCategory && offsetY > 10) setHideCategory(true);
      if (offsetY <= 0) {
        // At the very top, force select the first category
        if (selectedCategory !== mockCategories[0].id) {
          setSelectedCategory(mockCategories[0].id);
        }
      }
    },
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: getColor('background'),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      paddingBottom: 0,
    },
    backButton: {
      marginRight: 12,
    },
    vendorCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: getColor('card'),
      borderRadius: 16,
      margin: 16,
      marginBottom: 12,
      padding: 12,
      shadowColor: getColor('primary'),
      shadowOpacity: 0.2,
      shadowRadius: 8,
      borderWidth: 1,
      borderColor: getColor('primary'),
    },
    vendorLogo: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginRight: 12,
      backgroundColor: getColor('border'),
    },
    vendorInfo: {
      flex: 1,
    },
    vendorName: {
      color: getColor('text'),
      fontSize: getTypography('h2'),
      fontWeight: 'bold',
    },
    vendorMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    vendorMetaText: {
      color: getColor('subText'),
      fontSize: getTypography('caption'),
      marginRight: 8,
    },
    ratingBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#1ec28b',
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginLeft: 8,
    },
    ratingText: {
      color: '#fff',
      fontSize: getTypography('caption'),
      fontWeight: 'bold',
      marginLeft: 2,
    },
    categoryContainer: {
      width: CATEGORY_WIDTH,
      backgroundColor: getColor('background'),
      paddingTop: 8,
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      zIndex: 20,
      elevation: 10,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    categoryItem: {
      alignItems: 'center',
      marginBottom: 16,
      paddingVertical: 8,
      borderLeftWidth: 4,
      borderLeftColor: 'transparent',
    },
    categoryItemActive: {
      borderLeftColor: getColor('primary'),
      backgroundColor: getColor('card'),
      borderRadius: 12,
    },
    categoryIcon: {
      width: 40,
      height: 40,
      marginBottom: 4,
      borderRadius: 20,
    },
    productList: {
      flex: 1,
      padding: 8,
    },
    productCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: getColor('card'),
      borderRadius: 12,
      marginBottom: 16,
      padding: 12,
      shadowColor: getColor('shadow').color,
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    productImage: {
      width: 60,
      height: 60,
      borderRadius: 8,
      marginRight: 12,
      backgroundColor: getColor('border'),
    },
    productInfo: {
      flex: 1,
    },
    productName: {
      color: getColor('text'),
      fontSize: getTypography('body'),
      fontWeight: 'bold',
    },
    productMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    productRating: {
      color: '#1ec28b',
      fontWeight: 'bold',
      marginRight: 8,
    },
    productPriceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    productMRP: {
      color: getColor('subText'),
      fontSize: getTypography('caption'),
      textDecorationLine: 'line-through',
      marginRight: 6,
    },
    productPrice: {
      color: getColor('text'),
      fontSize: getTypography('body'),
      fontWeight: 'bold',
    },
    addButton: {
      borderWidth: 1,
      borderColor: getColor('primary'),
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginLeft: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    addButtonText: {
      color: getColor('primary'),
      fontWeight: 'bold',
      fontSize: getTypography('body'),
      marginLeft: 4,
    },
    bookmarkIcon: {
      marginLeft: 8,
    },
    headerTitle: {
      color: getColor('text'),
      fontSize: getTypography('h2'),
      fontWeight: 'bold',
    },
    vendorTime: {
      color: getColor('subText'),
      fontSize: getTypography('caption'),
      letterSpacing: 2,
      textAlign: 'center',
      marginBottom: 8,
    },
    categoryHeader: {
      width: '100%',
      backgroundColor: getColor('background'),
      paddingVertical: 18,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
      marginTop: 16,
      marginBottom: 4,
    },
    categoryHeaderText: {
      color: getColor('primary'),
      fontWeight: 'bold',
      fontSize: getTypography('h2'),
      letterSpacing: 1,
    },
    productRow: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
    },
    emptyProductCell: {
      flex: 1,
      margin: 8,
      backgroundColor: 'transparent',
    },
    unhideCategoryButton: {
      position: 'absolute',
      left: 0,
      top: 0,
      backgroundColor: getColor('primary'),
      borderTopRightRadius: 16,
      borderBottomRightRadius: 16,
      paddingVertical: 10,
      paddingHorizontal: 8,
      zIndex: 30,
      elevation: 4,
      flexDirection: 'row',
      alignItems: 'center',
    },
    unhideCategoryText: {
      color: getColor('background'),
      fontSize: getTypography('body'),
      marginRight: 4,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={getColor('text')} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{vendor.name}</Text>
        <View style={{ flex: 1 }} />
        <MaterialCommunityIcons name="heart-outline" size={24} color={getColor('primary')} />
      </View>

      {/* Vendor Card */}
      <TouchableOpacity
        style={styles.vendorCard}
        onPress={() => navigation.navigate('VendorProfile', { vendor })}
      >
        <Image source={{ uri: vendor.logo }} style={styles.vendorLogo} />
        <View style={styles.vendorInfo}>
          <Text style={styles.vendorName}>{vendor.name}</Text>
          <View style={styles.vendorMeta}>
            <Text style={styles.vendorMetaText}>⏱ {vendor.preparationTime}</Text>
            <Text style={styles.vendorMetaText}>| {formatAddress()}</Text>
            <View style={styles.ratingBox}>
              <MaterialCommunityIcons name="star" size={14} color="#fff" />
              {renderRating()}
            </View>
            <Text style={styles.vendorMetaText}>(242+)</Text>
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={28} color={getColor('primary')} />
      </TouchableOpacity>

      {/* Main Content: Categories + Products */}
      <View style={{ flex: 1 }}>
        {/* Category List (absolute overlay with animation) */}
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <Text
            style={{
              color: getColor('subText'),
              fontSize: getTypography('caption'),
              letterSpacing: 2,
            }}
          >
            {vendor.openingTime} - {vendor.closingTime}
          </Text>
        </View>
        <Animated.View
          style={[
            styles.categoryContainer,
            { transform: [{ translateX: categoryAnim }] },
            // Removed display logic using __getValue
          ]}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {mockCategories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryItem,
                  selectedCategory === cat.id && styles.categoryItemActive,
                ]}
                onPress={() => handleCategorySelect(cat.id)}
              >
                <Image source={cat.icon} style={styles.categoryIcon} />
                <Text
                  style={{
                    color: selectedCategory === cat.id ? getColor('primary') : getColor('subText'),
                    fontWeight: selectedCategory === cat.id ? 'bold' : 'normal',
                  }}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
        {/* Product List with headers */}
        <Animated.View style={[styles.productList, { width: width }]}>
          <Animated.FlatList
            ref={flatListRef}
            data={rowProductList}
            keyExtractor={(item, idx) => {
              if (item.type === 'header') return `header-${item.category.id}`;
              if (item.type === 'products') return `products-row-${idx}`;
              return `row-${idx}`;
            }}
            renderItem={({ item }) => {
              if (item.type === 'header') {
                return (
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryHeaderText}>{item.category.name}</Text>
                  </View>
                );
              } else if (item.type === 'products') {
                return (
                  <View style={styles.productRow}>
                    {item.products.map((product: Product) => (
                      <ProductCard
                        key={product.id}
                        image={product.image}
                        name={product.name}
                        price={product.price}
                        mrp={product.mrp}
                        rating={product.rating}
                        onAdd={() => {}}
                      />
                    ))}
                    {/* Fill empty columns if needed */}
                    {item.products.length < numColumns &&
                      Array.from({ length: numColumns - item.products.length }).map((_, idx) => (
                        <View key={`empty-${idx}`} style={styles.emptyProductCell} />
                      ))}
                  </View>
                );
              }
              return null;
            }}
            numColumns={1}
            key={'row-based'}
            showsVerticalScrollIndicator={false}
            getItemLayout={undefined}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
          />
          {/* Show button to unhide category when hidden */}
          {hideCategory && (
            <TouchableOpacity
              style={styles.unhideCategoryButton}
              onPress={() => setHideCategory(false)}
            >
              <Text style={styles.unhideCategoryText}>{selectedCategory}</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={getColor('background')}
              />
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </View>
  );
};

export default VendorProduct;
