import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { CATALOGUE_ACCENT, CATALOGUE_GUTTER } from '../../../constants/catalogue';
import { useTheme } from '../../../theme/ThemeContext';
import { ThemeText } from '../../common/theme/ThemeText';
import { couponTerms } from './CouponSheet';

/**
 * Coupons in the QV Cart design: a heading with "View All", then a green-bordered card
 * per applied coupon and a muted row prompting the ones still available.
 *
 * Applying is not done here — tapping through goes to CouponsScreen, and the discount
 * itself is computed server-side when the coupon id reaches checkout-summary. This
 * component only reflects what is selected.
 *
 * The "SAVED ₹25" badge shows the real figure: the caller passes `couponDiscount`
 * from the checkout summary, and for a delivery coupon the fee actually waived. Those
 * are server-computed, so the badge never guesses — a percentage coupon's saving
 * depends on the basket and its cap, which this component could not work out. With no
 * figure yet the badge falls back to the coupon's own terms.
 */

interface AvailableCoupon {
  id: string;
  code: string;
  mov: number;
  discountValue: number | null;
  type: string;
  uptoValue: number | null;
}

interface CouponSectionProps {
  couponLoading: boolean;
  /** Server-computed discount for the applied coupon, from the checkout summary. */
  appliedDiscount?: number;
  /** Delivery fee actually waived by the applied delivery coupon. */
  appliedDeliverySaving?: number;
  availableCoupons: AvailableCoupon[];
  selectedDiscountCoupon: AvailableCoupon | null;
  selectedDeliveryCoupon: AvailableCoupon | null;
  onCouponNavigation: () => void;
  onRemoveDiscountCoupon: () => void;
  onRemoveDeliveryCoupon: () => void;
  /**
   * Applies an offer straight from its row. Without it the row opens the coupon sheet, as
   * before; with it, "Apply" does what it says.
   */
  onApplyCoupon?: (coupon: AvailableCoupon) => void;
  /** Item total a coupon's minimum order is tested against, as the coupon sheet does. */
  cartTotal?: number;
}

const getBenefitLabel = (coupon: AvailableCoupon): string => {
  if (coupon.type === 'FREE_DELIVERY') return 'Free Delivery';
  if (coupon.type === 'FIXED' && coupon.discountValue != null) {
    return `Flat ₹${coupon.discountValue} OFF`;
  }
  if (coupon.type === 'PERCENTAGE' && coupon.discountValue != null) {
    return coupon.uptoValue
      ? `${coupon.discountValue}% OFF up to ₹${coupon.uptoValue}`
      : `${coupon.discountValue}% OFF`;
  }
  return 'Applied';
};

const CouponSection: React.FC<CouponSectionProps> = ({
  couponLoading,
  appliedDiscount = 0,
  appliedDeliverySaving = 0,
  availableCoupons,
  selectedDiscountCoupon,
  selectedDeliveryCoupon,
  onCouponNavigation,
  onRemoveDiscountCoupon,
  onRemoveDeliveryCoupon,
  onApplyCoupon,
  cartTotal,
}) => {
  const { getColor, theme } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: { marginTop: 14, marginHorizontal: CATALOGUE_GUTTER },
        headingRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        },
        heading: {
          fontSize: 12,
          lineHeight: 16,
          fontWeight: '700',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          color: getColor('subText'),
        },
        viewAll: {
          fontSize: 12,
          lineHeight: 16,
          fontWeight: '700',
          color: getColor('primary'),
        },
        card: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: getColor('white'),
          borderRadius: 16,
          padding: 12,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: `${CATALOGUE_ACCENT}4D`,
          shadowColor: theme.colors.shadow.color,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: theme.colors.shadow.opacity,
          shadowRadius: 3,
          elevation: 2,
        },
        badge: {
          width: 32,
          height: 32,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${CATALOGUE_ACCENT}26`,
        },
        cardText: { flex: 1, minWidth: 0 },
        codeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
        code: {
          fontSize: 12,
          lineHeight: 16,
          fontWeight: '700',
          letterSpacing: 0.6,
          color: getColor('text'),
        },
        benefit: {
          fontSize: 10,
          lineHeight: 13,
          fontWeight: '800',
          textTransform: 'uppercase',
          color: CATALOGUE_ACCENT,
          backgroundColor: `${CATALOGUE_ACCENT}26`,
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 4,
          overflow: 'hidden',
        },
        appliedNote: { fontSize: 11, lineHeight: 14, color: CATALOGUE_ACCENT },
        action: {
          fontSize: 12,
          lineHeight: 16,
          fontWeight: '800',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color: getColor('primary'),
          paddingHorizontal: 4,
          paddingVertical: 4,
        },
        // Muted, so an unapplied offer never competes with an applied one.
        offerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
          backgroundColor: getColor('overlay'),
          borderRadius: 16,
          padding: 12,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: getColor('border'),
        },
        offerText: { flex: 1, minWidth: 0 },
        offerTitle: {
          fontSize: 12,
          lineHeight: 16,
          fontWeight: '700',
          color: getColor('text'),
        },
        offerSub: { fontSize: 11, lineHeight: 14, color: getColor('subText') },
        // Code and its terms on one line, as the design lays each offer out.
        offerRowText: { flex: 1, minWidth: 0 },
        offerCode: {
          fontSize: 13,
          lineHeight: 17,
          fontWeight: '800',
          color: getColor('text'),
        },
        offerTerms: { fontSize: 11, lineHeight: 15, color: getColor('subText'), marginTop: 1 },
        offerLocked: { fontSize: 11, lineHeight: 15, color: getColor('error'), marginTop: 1 },
        actionDisabled: { color: getColor('subText') },
      }),
    [getColor, theme]
  );

  const applied = [
    selectedDiscountCoupon
      ? {
          coupon: selectedDiscountCoupon,
          onRemove: onRemoveDiscountCoupon,
          saved: appliedDiscount,
        }
      : null,
    selectedDeliveryCoupon
      ? {
          coupon: selectedDeliveryCoupon,
          onRemove: onRemoveDeliveryCoupon,
          saved: appliedDeliverySaving,
        }
      : null,
  ].filter(Boolean) as { coupon: AvailableCoupon; onRemove: () => void; saved: number }[];

  const appliedIds = applied.map(a => a.coupon.id);
  /**
   * The design lists each offer as its own row rather than a count. Capped so a shop
   * running a dozen promotions does not bury the bill under them — "View All" opens
   * the rest.
   */
  const unapplied = availableCoupons.filter(c => !appliedIds.includes(c.id)).slice(0, 3);
  const offerCount = availableCoupons.length;

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <ThemeText style={styles.heading}>Coupons &amp; Offers</ThemeText>
        {offerCount > 0 ? (
          <TouchableOpacity onPress={onCouponNavigation} accessibilityRole="button">
            <ThemeText style={styles.viewAll}>View All</ThemeText>
          </TouchableOpacity>
        ) : null}
      </View>

      {applied.map(({ coupon, onRemove, saved }) => (
        <View key={coupon.id} style={styles.card}>
          <View style={styles.badge}>
            <MaterialCommunityIcons name="check-decagram" size={18} color={CATALOGUE_ACCENT} />
          </View>
          <View style={styles.cardText}>
            <View style={styles.codeRow}>
              <ThemeText style={styles.code} numberOfLines={1}>
                {coupon.code}
              </ThemeText>
              <ThemeText style={styles.benefit}>
                {saved > 0 ? `Saved ₹${Math.round(saved)}` : getBenefitLabel(coupon)}
              </ThemeText>
            </View>
            <ThemeText style={styles.appliedNote}>Coupon applied successfully!</ThemeText>
          </View>
          <TouchableOpacity onPress={onCouponNavigation} accessibilityRole="button">
            <ThemeText style={styles.action}>Change</ThemeText>
          </TouchableOpacity>
        </View>
      ))}

      {couponLoading && applied.length === 0 ? (
        <View style={styles.offerRow}>
          <MaterialCommunityIcons name="tag-outline" size={18} color={getColor('primary')} />
          <View style={styles.offerText}>
            <ThemeText style={styles.offerTitle}>Checking offers…</ThemeText>
          </View>
        </View>
      ) : null}

      {unapplied.map(coupon => {
        // Below its minimum order the offer cannot be applied yet: say how far off it is, as the
        // coupon sheet does, instead of an Apply that does nothing.
        const shortfall =
          onApplyCoupon && cartTotal != null && coupon.mov > 0 ? coupon.mov - cartTotal : 0;
        const locked = shortfall > 0;
        return (
          <TouchableOpacity
            key={coupon.id}
            style={styles.offerRow}
            onPress={() => (onApplyCoupon ? onApplyCoupon(coupon) : onCouponNavigation())}
            disabled={locked}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ disabled: locked }}
            accessibilityLabel={`Apply coupon ${coupon.code}`}
          >
            <MaterialCommunityIcons name="tag-outline" size={18} color={getColor('primary')} />
            <View style={styles.offerRowText}>
              <ThemeText style={styles.offerCode} numberOfLines={1}>
                {coupon.code}
              </ThemeText>
              <ThemeText style={styles.offerTerms} numberOfLines={1}>
                {couponTerms(coupon)}
              </ThemeText>
              {locked ? (
                <ThemeText style={styles.offerLocked} numberOfLines={1}>
                  Add ₹{Math.ceil(shortfall)} more to unlock
                </ThemeText>
              ) : null}
            </View>
            <ThemeText style={[styles.action, locked && styles.actionDisabled]}>Apply</ThemeText>
          </TouchableOpacity>
        );
      })}

      {!couponLoading && offerCount === 0 && applied.length === 0 ? (
        <View style={styles.offerRow}>
          <MaterialCommunityIcons name="tag-outline" size={18} color={getColor('subText')} />
          <View style={styles.offerText}>
            <ThemeText style={styles.offerTitle}>No coupons available</ThemeText>
          </View>
        </View>
      ) : null}
    </View>
  );
};

export default CouponSection;
