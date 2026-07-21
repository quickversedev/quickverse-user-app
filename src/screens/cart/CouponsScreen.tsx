import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../routes/AppStack';
import couponService from '../../services/api/couponSevice';
import useCartStore from '../../store/cart/cartStore';
import useConfigStore from '../../store/configStore';
import useVendorStore from '../../store/vendorStore';
import { useTheme } from '../../theme/ThemeContext';

export interface AvailableCoupon {
  id: string;
  code: string;
  mov: number;
  discountValue: number | null;
  type: 'FREE_DELIVERY' | 'FIXED' | 'PERCENTAGE' | string;
  uptoValue: number | null;
  regionIds: string[];
  shopIds: string[];
  serviceTypes: string[];
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

type CouponsScreenRouteProp = RouteProp<RootStackParamList, 'Coupons'>;

const getCouponTitle = (coupon: AvailableCoupon): string => {
  if (coupon.type === 'FREE_DELIVERY') return 'Free Delivery';
  if (coupon.type === 'FIXED')
    return coupon.discountValue != null ? `₹${coupon.discountValue} Off` : 'Flat Discount';
  if (coupon.type === 'PERCENTAGE')
    return coupon.discountValue != null ? `${coupon.discountValue}% Off` : 'Percentage Discount';
  return 'Special Offer';
};

const getCouponSubtitle = (
  coupon: AvailableCoupon
): { prefix: string; highlight: string; suffix: string } => {
  if (coupon.type === 'FREE_DELIVERY') {
    if (coupon.mov > 0)
      return { prefix: 'Free delivery on orders above', highlight: `₹${coupon.mov}`, suffix: '' };
    return { prefix: 'Free delivery on this order', highlight: '', suffix: '' };
  }

  if (coupon.type === 'FIXED' && coupon.discountValue != null) {
    if (coupon.mov > 0)
      return {
        prefix: 'Flat',
        highlight: `₹${coupon.discountValue} Off`,
        suffix: `on orders above ₹${coupon.mov}`,
      };
    return { prefix: 'Flat', highlight: `₹${coupon.discountValue} Off`, suffix: 'on this order' };
  }

  if (coupon.type === 'PERCENTAGE' && coupon.discountValue != null) {
    const uptoSuffix = coupon.uptoValue != null ? ` upto ₹${coupon.uptoValue}` : '';
    if (coupon.mov > 0)
      return {
        prefix: 'Get',
        highlight: `${coupon.discountValue}% Off${uptoSuffix}`,
        suffix: `on orders above ₹${coupon.mov}`,
      };
    return {
      prefix: 'Get',
      highlight: `${coupon.discountValue}% Off${uptoSuffix}`,
      suffix: 'on this order',
    };
  }

  return { prefix: 'Special discount on this order', highlight: '', suffix: '' };
};

interface CouponCardProps {
  coupon: AvailableCoupon;
  isSelected: boolean;
  onApply: (coupon: AvailableCoupon) => void;
  calculatedCartTotal: number;
}

const CouponCard: React.FC<CouponCardProps> = ({
  coupon,
  isSelected,
  onApply,
  calculatedCartTotal,
}) => {
  const isCouponApplicable = calculatedCartTotal >= coupon.mov;
  const remainingAmount = Math.max(0, coupon.mov - calculatedCartTotal);
  const { getColor, getTypography, theme } = useTheme();
  const ff = theme.typography.fontFamily;
  const subtitle = getCouponSubtitle(coupon);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: getColor('card'),
          borderColor: isSelected ? getColor('primary') : getColor('border'),
        },
        Platform.select({
          ios: {
            shadowColor: theme.colors.shadow.color,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isSelected ? 0.15 : theme.colors.shadow.opacity,
            shadowRadius: theme.colors.shadow.radius,
          },
          android: { elevation: isSelected ? 5 : 3 },
        }),
      ]}
    >
      <View style={styles.cardInner}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconBadge, { backgroundColor: `${getColor('primary')}15` }]}>
            <MaterialCommunityIcons
              name={coupon.type === 'FREE_DELIVERY' ? 'truck-outline' : 'ticket-percent-outline'}
              size={20}
              color={getColor('primary')}
            />
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Text
              style={{
                fontFamily: ff,
                fontWeight: '700',
                fontSize: getTypography('body'),
                color: getColor('text'),
                flex: 1,
              }}
              numberOfLines={1}
            >
              {getCouponTitle(coupon)}
            </Text>
            <View
              style={[
                styles.codePill,
                { borderColor: getColor('primary'), backgroundColor: `${getColor('primary')}10` },
              ]}
            >
              <Text
                style={{
                  fontFamily: ff,
                  fontWeight: '700',
                  fontSize: getTypography('small'),
                  color: getColor('primary'),
                  letterSpacing: 0.6,
                }}
              >
                {coupon.code}
              </Text>
            </View>
          </View>

          <View style={styles.subtitleRow}>
            {subtitle.prefix ? (
              <Text
                style={{
                  fontFamily: ff,
                  fontSize: getTypography('caption'),
                  color: getColor('subText'),
                }}
              >
                {subtitle.prefix}{' '}
              </Text>
            ) : null}
            {subtitle.highlight ? (
              <Text
                style={{
                  fontFamily: ff,
                  fontSize: getTypography('caption'),
                  color: getColor('primary'),
                  fontWeight: '700',
                }}
              >
                {subtitle.highlight}
              </Text>
            ) : null}
            {subtitle.suffix ? (
              <Text
                style={{
                  fontFamily: ff,
                  fontSize: getTypography('caption'),
                  color: getColor('subText'),
                }}
              >
                {' '}
                {subtitle.suffix}
              </Text>
            ) : null}
          </View>

          {!isCouponApplicable && (
            <Text
              style={{
                fontFamily: ff,
                fontSize: getTypography('small'),
                color: getColor('error'),
                marginTop: 4,
                fontWeight: '500',
              }}
            >
              {coupon.type === 'FREE_DELIVERY'
                ? `Add items worth ₹${Math.ceil(remainingAmount)} more to get Free Delivery`
                : coupon.type === 'PERCENTAGE'
                  ? `Add items worth ₹${Math.ceil(remainingAmount)} more to unlock ${coupon.discountValue}% OFF`
                  : `Add items worth ₹${Math.ceil(remainingAmount)} more to unlock ₹${coupon.discountValue} OFF`}
            </Text>
          )}

          {coupon.uptoValue != null && (
            <Text
              style={{
                fontFamily: ff,
                fontSize: getTypography('small'),
                color: getColor('subText'),
                marginTop: 2,
              }}
            >
              Max discount: ₹{coupon.uptoValue}
            </Text>
          )}
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: getColor('border') }]} />

      <View style={styles.cardFooter}>
        {coupon.mov > 0 && (
          <View style={styles.metaRow}>
            <MaterialCommunityIcons
              name="information-outline"
              size={12}
              color={getColor('subText')}
              style={{ marginRight: 3 }}
            />
            <Text
              style={{
                fontFamily: ff,
                fontSize: getTypography('small'),
                color: getColor('subText'),
              }}
            >
              Min. order ₹{coupon.mov}
            </Text>
          </View>
        )}
        <TouchableOpacity
          disabled={!isCouponApplicable}
          style={[
            styles.applyBtn,
            {
              backgroundColor: isSelected ? getColor('primary') : 'transparent',
              borderColor: getColor('primary'),
              opacity: isCouponApplicable ? 1 : 0.5,
            },
          ]}
          onPress={() => onApply(coupon)}
          activeOpacity={0.75}
        >
          {isSelected && (
            <MaterialCommunityIcons
              name="check"
              size={13}
              color={getColor('background')}
              style={{ marginRight: 3 }}
            />
          )}
          <Text
            style={{
              fontFamily: ff,
              fontWeight: '700',
              fontSize: getTypography('small'),
              color: isSelected ? getColor('background') : getColor('primary'),
            }}
          >
            {isSelected ? 'Applied' : 'Apply'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface CouponSection {
  title: string;
  sectionType: 'discount' | 'delivery';
  data: AvailableCoupon[];
}

const CouponsScreen: React.FC = () => {
  const route = useRoute<CouponsScreenRouteProp>();
  const navigation = useNavigation();
  const { getColor, getTypography, theme } = useTheme();
  const ff = theme.typography.fontFamily;
  const { getRegionId } = useConfigStore(state => state);
  const { carts, activeCartId } = useCartStore();
  const { vendors } = useVendorStore();

  const passedCoupons: AvailableCoupon[] | undefined = (route.params as any)?.coupons;
  const passedLoading: boolean = (route.params as any)?.loading ?? false;
  const passedDiscountCoupon: AvailableCoupon | null =
    (route.params as any)?.selectedDiscountCoupon ?? null;
  const passedDeliveryCoupon: AvailableCoupon | null =
    (route.params as any)?.selectedDeliveryCoupon ?? null;
  const onApplyDiscountCallback: ((coupon: AvailableCoupon | null) => void) | undefined = (
    route.params as any
  )?.onApplyDiscount;
  const onApplyDeliveryCallback: ((coupon: AvailableCoupon | null) => void) | undefined = (
    route.params as any
  )?.onApplyDelivery;
  const calculatedCartTotal = (route.params as any)?.cartTotal ?? 0;

  const [coupons, setCoupons] = useState<AvailableCoupon[]>(passedCoupons ?? []);
  const [loading, setLoading] = useState<boolean>(passedCoupons == null ? true : passedLoading);
  const [error, setError] = useState<string>('');
  const [selectedDiscountId, setSelectedDiscountId] = useState<string | null>(
    passedDiscountCoupon?.id ?? null
  );
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(
    passedDeliveryCoupon?.id ?? null
  );

  const cart = activeCartId ? carts[activeCartId] : Object.values(carts)[0];
  const vendor = cart?.cartId
    ? vendors.find(v => v.shopId === cart.cartId.replace('vendor_', ''))
    : undefined;

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await couponService.getAvailableCoupons(
        getRegionId() as string,
        vendor?.shopId ?? '',
        vendor?.category?.toUpperCase() ?? 'FOOD'
      );
      setCoupons(data);
    } catch (_e) {
      setError('Failed to load coupons');
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, [getRegionId, vendor?.shopId, vendor?.category]);

  useEffect(() => {
    if (passedCoupons != null) return;
    fetchCoupons();
  }, []);

  const sections: CouponSection[] = useMemo(() => {
    const discountCoupons = coupons.filter(c => c.type === 'FIXED' || c.type === 'PERCENTAGE');
    const deliveryCoupons = coupons.filter(c => c.type === 'FREE_DELIVERY');
    const result: CouponSection[] = [];
    if (discountCoupons.length > 0) {
      result.push({ title: 'Discount Offers', sectionType: 'discount', data: discountCoupons });
    }
    if (deliveryCoupons.length > 0) {
      result.push({ title: 'Free Delivery', sectionType: 'delivery', data: deliveryCoupons });
    }
    return result;
  }, [coupons]);

  const handleApplyDiscount = useCallback(
    (coupon: AvailableCoupon) => {
      if (selectedDiscountId === coupon.id) {
        setSelectedDiscountId(null);
        onApplyDiscountCallback?.(null);
      } else {
        setSelectedDiscountId(coupon.id);
        onApplyDiscountCallback?.(coupon);
      }
    },
    [selectedDiscountId, onApplyDiscountCallback]
  );

  const handleApplyDelivery = useCallback(
    (coupon: AvailableCoupon) => {
      if (selectedDeliveryId === coupon.id) {
        setSelectedDeliveryId(null);
        onApplyDeliveryCallback?.(null);
      } else {
        setSelectedDeliveryId(coupon.id);
        onApplyDeliveryCallback?.(coupon);
      }
    },
    [selectedDeliveryId, onApplyDeliveryCallback]
  );

  if (!cart?.cartId) return null;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: getColor('background') }]}
      edges={['top']}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: getColor('background'), borderBottomColor: getColor('border') },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[
            styles.backButton,
            { backgroundColor: getColor('card') },
            Platform.select({
              ios: {
                shadowColor: theme.colors.shadow.color,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: theme.colors.shadow.opacity,
                shadowRadius: theme.colors.shadow.radius,
              },
              android: { elevation: 2 },
            }),
          ]}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={getColor('text')} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: ff,
            fontWeight: '700',
            fontSize: getTypography('subtitle'),
            color: getColor('text'),
          }}
        >
          Available Coupons
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.doneButton}
          activeOpacity={0.7}
        >
          <Text
            style={{
              fontFamily: ff,
              fontWeight: '700',
              fontSize: getTypography('body'),
              color: getColor('primary'),
            }}
          >
            Done
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={getColor('primary')} />
          <Text style={{ fontFamily: ff, color: getColor('subText'), marginTop: 8 }}>
            Fetching offers...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={getColor('error')} />
          <Text style={{ fontFamily: ff, color: getColor('error'), textAlign: 'center' }}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: getColor('primary') }]}
            onPress={fetchCoupons}
          >
            <Text style={{ fontFamily: ff, fontWeight: '600', color: getColor('background') }}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      ) : coupons.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons
            name="ticket-percent-outline"
            size={56}
            color={getColor('subText')}
          />
          <Text
            style={{
              fontFamily: ff,
              color: getColor('subText'),
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            No coupons available right now
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name={
                  section.sectionType === 'delivery' ? 'truck-outline' : 'ticket-percent-outline'
                }
                size={18}
                color={getColor('text')}
              />
              <Text
                style={{
                  fontFamily: ff,
                  fontWeight: '700',
                  fontSize: getTypography('body'),
                  color: getColor('text'),
                  marginLeft: 6,
                }}
              >
                {section.title}
              </Text>
              <Text
                style={{
                  fontFamily: ff,
                  fontSize: getTypography('small'),
                  color: getColor('subText'),
                  marginLeft: 6,
                }}
              >
                ({section.data.length})
              </Text>
            </View>
          )}
          renderItem={({ item, section }) => (
            <CouponCard
              coupon={item}
              isSelected={
                section.sectionType === 'discount'
                  ? item.id === selectedDiscountId
                  : item.id === selectedDeliveryId
              }
              onApply={
                section.sectionType === 'discount' ? handleApplyDiscount : handleApplyDelivery
              }
              calculatedCartTotal={calculatedCartTotal}
            />
          )}
          renderSectionFooter={() => <View style={{ height: 12 }} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  doneButton: {
    width: 40,
    alignItems: 'flex-end',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  list: {
    padding: 16,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  card: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardInner: {
    flexDirection: 'row',
    padding: 14,
    gap: 10,
  },
  cardLeft: {
    paddingTop: 2,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codePill: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  subtitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    marginHorizontal: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
});

export default CouponsScreen;
