import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, ViewStyle } from 'react-native';

import AutoScrollBanner from '../../../../components/common/promo/AutoScrollBanner';
import SectionDivider from '../../../../components/common/SectionDivider';
import VendorList from '../../../../components/modules/Vendor/VendorList';
import VendorProductList from '../../../../components/modules/Vendor/VendorProductList';
import useVendorStore from '../../../../store/vendorStore';
import { AppNavigationProp } from '../../../../types/navigation';

const bannerData = [
  {
    promo: 'foodPromo',
    title: 'Get 25% OFF!',
    subtitle: 'On your first order with code WELCOME',
    bannerButton: { label: 'Order Now', onPress: () => {} },
    backgroundColor: 'green',
    isBannerImage: false,
  },
  {
    promo: 'foodPromo',
    title: '',
    subtitle: '',
    backgroundColor: 'green',
    isBannerImage: true,
  },
  {
    promo: 'foodPromo',
    title: 'Free Delivery!',
    subtitle: 'On orders above ₹200',
    bannerButton: { label: 'Shop Now', onPress: () => {} },
    backgroundColor: 'blue',
    isBannerImage: false,
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
  const navigation = useNavigation<AppNavigationProp>();
  const { vendors } = useVendorStore();

  return (
    <ScrollView
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      style={{ paddingVertical: 100 }}
    >
      <AutoScrollBanner bannerData={bannerData} />

      <SectionDivider text="RESTAURANTS" fontSize={16} />
      <VendorList />
      {/* <BadgeTagDemo /> */}
      <SectionDivider text="BESTSELLERS" fontSize={16} />
      <VendorProductList
        vendors={vendors}
        onVendorPress={vendor => navigation.navigate('VendorProduct', { vendor })}
        onProductPress={_product => {}}
        useFlatList={false} // Disable FlatList when nested in ScrollView
      />
    </ScrollView>
  );
};
