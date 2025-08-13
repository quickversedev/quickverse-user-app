import { useNavigation } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, ViewStyle } from 'react-native';

import AutoScrollBanner from '../../../../components/common/promo/AutoScrollBanner';
import SectionDivider from '../../../../components/common/SectionDivider';
import VendorList from '../../../../components/modules/Vendor/VendorList';
import VendorProductList from '../../../../components/modules/Vendor/VendorProductList';
import { useAuth } from '../../../../contexts/login/AuthProvider';
import { useAddress } from '../../../../hooks';
import { usePages } from '../../../../hooks/usePages';
import useThemeStore from '../../../../store/themeStore';
import useVendorStore from '../../../../store/vendorStore';
import { AppNavigationProp } from '../../../../types/navigation';

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
  const { getPromotionsByPageId } = usePages();
  const { selectedAddress } = useAuth();
  const { address } = useAddress();
  const { vendor } = useVendorStore();
  const { pages } = usePages();
  const { theme } = useThemeStore();
  console.log('🔍 [ForYouContent] selectedAddress', selectedAddress);
  console.log('🔍 [ForYouContent] address', address);
  console.log('🔍 [ForYouContent] vendor', vendor);
  console.log('🔍 [ForYouContent] pages', pages);
  console.log('🔍 [ForYouContent] theme', theme);
  // Get promotions for ForYou page
  const bannerData = useMemo(() => {
    const promotions = getPromotionsByPageId('ForYou');
    return promotions || [];
  }, [getPromotionsByPageId]);
  return (
    <ScrollView
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      style={{ paddingVertical: 100 }}
    >
      {bannerData?.length > 0 && <AutoScrollBanner bannerData={bannerData} />}

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
