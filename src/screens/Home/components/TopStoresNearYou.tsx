import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo } from 'react';
import { Dimensions, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { Vendor } from '../../../types/vendor';
import { AppNavigationProp } from '../../../types/navigation';
import { getCleanImageUri } from '../../../utils/imageUtils';
import { getDistanceInKm } from '../../../utils/distance';
import { isStoreOpen } from '../../../utils/storeUtils';
import { ThemeText } from '../../../components/common/theme/ThemeText';
import { useAuth } from '../../../contexts/login/AuthProvider';
import useVendorStore from '../../../store/vendorStore';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import MaterialIcons from '@react-native-vector-icons/material-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 4;
const LOGO_SIZE = 44;

const StoreItem = React.memo(
  ({ vendor, onPress }: { vendor: Vendor; onPress: (v: Vendor) => void }) => {
    const storeStatus = useMemo(
      () =>
        isStoreOpen({
          openingTime: vendor.openingTime,
          closingTime: vendor.closingTime,
          storeActive: vendor.storeActive,
        }),
      [vendor.openingTime, vendor.closingTime, vendor.storeActive]
    );

    const isClosed = !storeStatus.isOpen;
    const logoUri = getCleanImageUri(vendor.logo);

    return (
      <TouchableOpacity
        style={[styles.card, isClosed && styles.cardClosed]}
        activeOpacity={isClosed ? 1 : 0.7}
        onPress={() => !isClosed && onPress(vendor)}
      >
        <View style={styles.logoContainer}>
          {logoUri ? (
            <Image source={{ uri: logoUri }} style={styles.logo} resizeMode="cover" />
          ) : (
            <View style={styles.logoPlaceholder}>
              <MaterialIcons name="store" size={22} color="#FFFFFF" />
            </View>
          )}
        </View>
        <ThemeText style={styles.storeName} numberOfLines={1}>
          {vendor.name}
        </ThemeText>
        <View style={styles.deliveryRow}>
          <FontAwesome6 name="bolt-lightning" iconStyle="solid" size={9} color="#D97706" />
          <ThemeText style={styles.deliveryTime}>{vendor.preparationTime || '30 mins'}</ThemeText>
        </View>
      </TouchableOpacity>
    );
  }
);

StoreItem.displayName = 'StoreItem';

interface TopStoresNearYouProps {
  /** Renders the "View all" affordance when provided. */
  onViewAll?: () => void;
}

const TopStoresNearYou = ({ onViewAll }: TopStoresNearYouProps) => {
  const navigation = useNavigation<AppNavigationProp>();
  const { theme } = useTheme();
  const { selectedAddress } = useAuth();
  const vendors = useVendorStore(s => s.vendors);
  const fetchVendors = useVendorStore(s => s.fetchVendors);

  useEffect(() => {
    if (vendors.length === 0 && selectedAddress?.coordinates) {
      fetchVendors(selectedAddress.coordinates);
    }
  }, [vendors.length, selectedAddress?.coordinates, fetchVendors]);

  const topVendors = useMemo(() => {
    const active = vendors.filter(v => {
      if (v.storeEnabled === false || v.storeActive === false) return false;
      return isStoreOpen({
        openingTime: v.openingTime,
        closingTime: v.closingTime,
        storeActive: v.storeActive,
      }).isOpen;
    });
    const userLat = selectedAddress?.coordinates?.latitude;
    const userLon = selectedAddress?.coordinates?.longitude;
    const byDistance = (a: Vendor, b: Vendor) => {
      if (!userLat || !userLon) return 0;
      const aLat = a.coordinates?.latitude ?? a.location?.coordinates?.[1];
      const aLon = a.coordinates?.longitude ?? a.location?.coordinates?.[0];
      const bLat = b.coordinates?.latitude ?? b.location?.coordinates?.[1];
      const bLon = b.coordinates?.longitude ?? b.location?.coordinates?.[0];
      const aDist =
        aLat != null && aLon != null ? getDistanceInKm(userLat, userLon, aLat, aLon) : Infinity;
      const bDist =
        bLat != null && bLon != null ? getDistanceInKm(userLat, userLon, bLat, bLon) : Infinity;
      return aDist - bDist;
    };
    const food = active
      .filter(v => v.category === 'Food')
      .sort(byDistance)
      .slice(0, 2);
    const grocery = active
      .filter(v => v.category === 'Grocery')
      .sort(byDistance)
      .slice(0, 2);
    return [...food, ...grocery];
  }, [vendors, selectedAddress?.coordinates?.latitude, selectedAddress?.coordinates?.longitude]);

  const handlePress = (vendor: Vendor) => {
    navigation.navigate('VendorProduct', { vendor });
  };

  if (topVendors.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <ThemeText style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Featured Vendors
        </ThemeText>
        {onViewAll ? (
          <TouchableOpacity onPress={onViewAll} activeOpacity={0.7} accessibilityRole="button">
            <ThemeText style={styles.viewAll}>View all</ThemeText>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.listContent}>
        {topVendors.map(vendor => (
          <StoreItem key={vendor.shopId} vendor={vendor} onPress={handlePress} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  viewAll: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  listContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardClosed: {
    opacity: 0.5,
  },
  logoContainer: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1E3A5F',
    marginBottom: 4,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeName: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 4,
    lineHeight: 12,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
    gap: 3,
  },
  deliveryTime: {
    fontSize: 9,
    fontWeight: '600',
    color: '#6B7280',
    lineHeight: 11,
  },
});

export default React.memo(TopStoresNearYou);
