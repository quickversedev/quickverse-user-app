import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, ViewStyle } from 'react-native';

import AutoScrollBanner from '../../../../components/common/promo/AutoScrollBanner';
import SectionDivider from '../../../../components/common/SectionDivider';
import VendorList from '../../../../components/modules/Vendor/VendorList';
import VendorProductList from '../../../../components/modules/Vendor/VendorProductList';
import { usePages } from '../../../../hooks/usePages';
import useVendorStore from '../../../../store/vendorStore';
import { AppNavigationProp } from '../../../../types/navigation';

interface ForYouContentProps {
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollEventThrottle?: number;
  contentContainerStyle?: ViewStyle;
  showsVerticalScrollIndicator?: boolean;
}

const ForYouContentComponent: React.FC<ForYouContentProps> = ({
  onScroll,
  scrollEventThrottle,
  contentContainerStyle,
  showsVerticalScrollIndicator,
}) => {
  const navigation = useNavigation<AppNavigationProp>();
  const { vendors } = useVendorStore();
  const { getPromotionsByPageId } = usePages();

  // Get promotions for ForYou page
  const bannerData = useMemo(() => {
    const promotions = getPromotionsByPageId('ForYou');
    return promotions || [];
  }, [getPromotionsByPageId]);

  // Memoize vendor press handler
  const handleVendorPress = useCallback(
    (vendor: any) => {
      navigation.navigate('VendorProduct', { vendor });
    },
    [navigation]
  );

  // Memoize product press handler
  const handleProductPress = useCallback((_product: any) => {
    // Handle product press if needed
  }, []);

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
        onVendorPress={handleVendorPress}
        onProductPress={handleProductPress}
        useFlatList={false} // Disable FlatList when nested in ScrollView
      />
    </ScrollView>
  );
};

ForYouContentComponent.displayName = 'ForYouContent';

export const ForYouContent = React.memo(ForYouContentComponent);
