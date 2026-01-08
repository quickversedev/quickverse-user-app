import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef } from 'react';
import { Animated, NativeScrollEvent, NativeSyntheticEvent, ViewStyle } from 'react-native';

import AutoScrollBanner from '../../../../components/common/promo/AutoScrollBanner';
import SectionDivider from '../../../../components/common/SectionDivider';
import VendorList from '../../../../components/modules/Vendor/VendorList';
import VendorProductList from '../../../../components/modules/Vendor/VendorProductList';
import { usePromotions } from '../../../../hooks';
import useVendorStore from '../../../../store/vendorStore';
import { AppNavigationProp } from '../../../../types/navigation';
import { Product } from '../../../../types/product';
import { Vendor } from '../../../../types/vendor';
import { getStoreStatus } from '../../../../utils/storeUtils';

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
  const { vendors: allVendors } = useVendorStore();
  const { promotions: bannerData, hasPromotions } = usePromotions('ForYou');

  // Filter out closed stores for home screen
  const vendors = useMemo(() =>
    allVendors.filter(vendor => getStoreStatus(vendor).isOpen),
    [allVendors]
  );

  // Memoize vendor press handler
  const handleVendorPress = useCallback(
    (vendor: Vendor) => {
      navigation.navigate('VendorProduct', { vendor });
    },
    [navigation]
  );

  // Memoize product press handler
  const handleProductPress = useCallback((_product: Product) => {
    // Handle product press if needed
  }, []);

  // No outer ScrollView; padding handled by FlatList contentContainerStyle

  const scrollY = useRef(new Animated.Value(0)).current;

  return (
    <VendorProductList
      vendors={vendors}
      onVendorPress={handleVendorPress}
      onProductPress={handleProductPress}
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle ?? 16}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      contentContainerStyle={contentContainerStyle}
      scrollY={scrollY}
      header={
        <>
          {hasPromotions && <AutoScrollBanner bannerData={bannerData} />}
          <SectionDivider text="SHOPS" fontSize={16} style={{ marginVertical: 12 }} />
          <VendorList />
          {/* <BadgeTagDemo /> */}
          <SectionDivider text="BESTSELLERS" fontSize={16} style={{ marginVertical: 12 }} />
        </>
      }
    />
  );
};

ForYouContentComponent.displayName = 'ForYouContent';

export const ForYouContent = React.memo(ForYouContentComponent);
