import { useNavigation } from '@react-navigation/native';
import React, { useCallback } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  ViewStyle,
} from 'react-native';

import AutoScrollBanner from '../../../../components/common/promo/AutoScrollBanner';
import SectionDivider from '../../../../components/common/SectionDivider';
import VendorList from '../../../../components/modules/Vendor/VendorList';
import VendorProductList from '../../../../components/modules/Vendor/VendorProductList';
import { usePromotions } from '../../../../hooks';
import useVendorStore from '../../../../store/vendorStore';
import { AppNavigationProp } from '../../../../types/navigation';
import { Product } from '../../../../types/product';
import { Vendor } from '../../../../types/vendor';

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
  const { promotions: bannerData, hasPromotions } = usePromotions('ForYou');

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

  const styles = StyleSheet.create({
    scroll: {
      paddingBottom: 100,
      paddingTop: Platform.select({
        ios: 80,
        android: 100,
      }),
    },
  });

  return (
    <ScrollView
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      style={styles.scroll}
    >
      {hasPromotions && <AutoScrollBanner bannerData={bannerData} />}

      <SectionDivider text="SHOPS" fontSize={16} style={{ marginVertical: 12 }} />
      <VendorList />
      {/* <BadgeTagDemo /> */}
      <SectionDivider text="BESTSELLERS" fontSize={16} style={{ marginVertical: 12 }} />
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
