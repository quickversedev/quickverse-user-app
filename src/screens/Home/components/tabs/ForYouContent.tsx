import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Images } from '../../../../assets';
import SectionDivider from '../../../../components/common/SectionDivider';
import VendorList from '../../../../components/modules/Vendor/VendorList';
import VendorProductList from '../../../../components/modules/Vendor/VendorProductList';
import useVendorStore from '../../../../store/vendorStore';
import { useTheme } from '../../../../theme/ThemeContext';
import { AppNavigationProp } from '../../../../types/navigation';

const { width } = Dimensions.get('window');
const cardWidth = width * 0.9;

const dummyRecommendations = [
  {
    id: '1',
    type: 'restaurant',
    name: 'Healthy Bites Cafe',
    description: 'Based on your healthy eating preferences',
    image: Images.bg1,
    tag: 'Recommended',
  },
  {
    id: '2',
    type: 'grocery',
    name: 'Organic Essentials Pack',
    description: 'Similar to your last grocery order',
    image: Images.bg1,
    tag: 'Recent',
  },
  {
    id: '3',
    type: 'pharmacy',
    name: 'Wellness Package',
    description: 'Recommended health products',
    image: Images.bg1,
    tag: 'New',
  },
  {
    id: '4',
    type: 'restaurant',
    name: 'Quick Bites Express',
    description: 'Popular in your area',
    image: Images.bg1,
    tag: 'Trending',
  },
  {
    id: '5',
    type: 'grocery',
    name: 'Fresh Fruits Bundle',
    description: 'Seasonal picks for you',
    image: Images.bg1,
    tag: 'Season Special',
  },
];

interface ForYouContentProps {
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollEventThrottle?: number;
  contentContainerStyle?: ViewStyle;
  showsVerticalScrollIndicator?: boolean;
}

export const ForYouContent: React.FC<ForYouContentProps> = ({
  onScroll,
  scrollEventThrottle,
  contentContainerStyle,
  showsVerticalScrollIndicator,
}) => {
  const { theme } = useTheme();
  const navigation = useNavigation<AppNavigationProp>();
  const { vendors } = useVendorStore();

  return (
    <Animated.ScrollView
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      style={{ paddingVertical: 100 }}
    >
      <SectionDivider text="RESTAURANTS" fontSize={16} />
      <VendorList />
      <SectionDivider text="BESTSELLERS" fontSize={16} />
      <VendorProductList
        vendors={vendors}
        onVendorPress={vendor => navigation.navigate('VendorProduct', { vendor })}
        onProductPress={product => console.log('Product pressed:', product.name)}
      />
    </Animated.ScrollView>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  itemCard: {
    width: cardWidth,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  itemImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  itemInfo: {
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  type: {
    marginTop: 8,
  },
});
