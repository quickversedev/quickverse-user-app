import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import { ThemeText } from '../../../components/common/theme/ThemeText';
import useProductTagsStore from '../../../store/tags/productTagsStore';
import useVendorStore from '../../../store/vendorStore';
import { AppNavigationProp } from '../../../types/navigation';
import { ProductTagOption } from '../../../types/product';

import BestSellerIcon from '../../../assets/svg/tags/best-seller.svg';
import BeveragesIcon from '../../../assets/svg/tags/beverages.svg';
import BreakfastIcon from '../../../assets/svg/tags/breakfast.svg';
import ComboIcon from '../../../assets/svg/tags/combo.svg';
import DessertsIcon from '../../../assets/svg/tags/desserts.svg';
import DinnerIcon from '../../../assets/svg/tags/dinner.svg';
import HealthyIcon from '../../../assets/svg/tags/healthy.svg';
import LunchIcon from '../../../assets/svg/tags/lunch.svg';
import SnacksIcon from '../../../assets/svg/tags/snacks.svg';
import StreetFoodIcon from '../../../assets/svg/tags/street-food.svg';
import Under99Icon from '../../../assets/svg/tags/under-99.svg';
import Under199Icon from '../../../assets/svg/tags/under-199.svg';
import Under299Icon from '../../../assets/svg/tags/under-299.svg';

/**
 * Chip artwork now comes from the server as `imageUrl`, uploaded per tag in the admin
 * dashboard — that is what lets a tag be added or restyled without shipping an app.
 *
 * These bundled SVGs are the fallback for the thirteen tags that predate that field and
 * have no image uploaded yet. A tag with no entry here and no imageUrl renders its
 * initial, so a brand-new tag is never invisible. Once every seeded tag has an image in
 * the dashboard this map and the files under assets/svg/tags can be deleted.
 */
const LEGACY_TAG_ICONS: Record<string, React.FC<SvgProps>> = {
  breakfast: BreakfastIcon,
  lunch: LunchIcon,
  dinner: DinnerIcon,
  'street-food': StreetFoodIcon,
  beverages: BeveragesIcon,
  desserts: DessertsIcon,
  snacks: SnacksIcon,
  healthy: HealthyIcon,
  combo: ComboIcon,
  'best-seller': BestSellerIcon,
  'under-99': Under99Icon,
  'under-199': Under199Icon,
  'under-299': Under299Icon,
};

const ICON_SIZE = 40;

const CHIP_COLORS = [
  { bg: '#FEF3C7', text: '#92400E' },
  { bg: '#DBEAFE', text: '#1E40AF' },
  { bg: '#D1FAE5', text: '#065F46' },
  { bg: '#FCE7F3', text: '#9D174D' },
  { bg: '#EDE9FE', text: '#5B21B6' },
  { bg: '#FEE2E2', text: '#991B1B' },
  { bg: '#E0F2FE', text: '#075985' },
  { bg: '#FEF9C3', text: '#854D0E' },
  { bg: '#F0FDF4', text: '#166534' },
  { bg: '#FFF7ED', text: '#9A3412' },
];

const TagChip = React.memo(
  ({
    tag,
    colorIndex,
    onPress,
  }: {
    tag: ProductTagOption;
    colorIndex: number;
    onPress: (tag: ProductTagOption) => void;
  }) => {
    const color = CHIP_COLORS[colorIndex % CHIP_COLORS.length];
    const LegacyIcon = LEGACY_TAG_ICONS[tag.id];

    // A dead or slow S3 URL must not leave a blank circle, so a failed load drops
    // through to the same fallback an image-less tag gets.
    const [imageFailed, setImageFailed] = useState(false);
    const showRemoteImage = Boolean(tag.imageUrl) && !imageFailed;

    /**
     * A price band carries its amount on the icon rather than in the caption below.
     * At this chip width "Under \u20b9199" could not fit on one line, and the number is
     * the part that matters — pushing it onto a second line or truncating it to
     * "Under \u20b91\u2026" buried the only thing distinguishing the three bands.
     *
     * The caption then drops the amount so it is not shown twice. The strip trails off
     * to the server's label if it is not in the "<something> \u20b9<amount>" shape, so an
     * admin renaming the tag can never blank the caption.
     */
    const priceBadge = tag.maxPrice != null ? `\u20b9${tag.maxPrice}` : null;
    const caption = priceBadge
      ? tag.label.replace(/\s*\u20b9\s*[\d,]+\s*$/, '').trim() || tag.label
      : tag.label;

    return (
      <TouchableOpacity
        style={styles.chip}
        activeOpacity={0.7}
        onPress={() => onPress(tag)}
        accessible
        accessibilityRole="button"
        accessibilityLabel={tag.label}
      >
        <View style={[styles.iconWrap, { backgroundColor: color.bg }]}>
          {showRemoteImage ? (
            <Image
              source={{ uri: tag.imageUrl }}
              style={styles.image}
              resizeMode="contain"
              onError={() => setImageFailed(true)}
            />
          ) : LegacyIcon ? (
            <LegacyIcon width={ICON_SIZE} height={ICON_SIZE} />
          ) : (
            <ThemeText style={[styles.initial, { color: color.text }]}>
              {tag.label.charAt(0).toUpperCase()}
            </ThemeText>
          )}

          {priceBadge && (
            <View style={[styles.priceBadge, { backgroundColor: color.text }]}>
              <ThemeText style={[styles.priceBadgeText, { color: color.bg }]}>
                {priceBadge}
              </ThemeText>
            </View>
          )}
        </View>
        <ThemeText numberOfLines={2} style={[styles.label, { color: color.text }]}>
          {caption}
        </ThemeText>
      </TouchableOpacity>
    );
  }
);

TagChip.displayName = 'TagChip';

const TagStrip: React.FC<{ shopCategory?: string }> = ({ shopCategory }) => {
  const navigation = useNavigation<AppNavigationProp>();

  const { vendors, getVendorsByCategory } = useVendorStore();
  const scope = shopCategory ?? '_all';

  /**
   * The same shop list TagProductsScreen will query with. It is passed to the server so
   * the non-empty filter is evaluated against these shops — otherwise a tag could be
   * non-empty platform-wide, survive the filter, and still open an empty screen here.
   */
  const shopIds = useMemo(() => {
    const list = shopCategory ? getVendorsByCategory(shopCategory) : vendors;
    return list.map(v => v.shopId);
  }, [vendors, shopCategory, getVendorsByCategory]);

  const tags = useProductTagsStore(state => state.byScope[scope]?.tags) ?? [];
  const fetchTags = useProductTagsStore(state => state.fetchTags);

  useEffect(() => {
    // Wait for the vendor list; fetching with an empty scope would count nothing and
    // cache an empty vocabulary for the whole TTL.
    if (shopIds.length === 0) return;
    fetchTags(scope, shopIds);
  }, [fetchTags, scope, shopIds]);

  const handlePress = useCallback(
    (tag: ProductTagOption) => {
      navigation.navigate('TagProducts', {
        tagCode: tag.id,
        tagLabel: tag.label,
        shopCategory,
      });
    },
    [navigation, shopCategory]
  );

  if (tags.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={styles.container}
    >
      {tags.map((tag, index) => (
        <TagChip key={tag.id} tag={tag} colorIndex={index} onPress={handlePress} />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  content: {
    paddingHorizontal: 16,
    gap: 18,
  },
  chip: {
    alignItems: 'center',
    width: 60,
  },
  iconWrap: {
    width: ICON_SIZE + 4,
    height: ICON_SIZE + 4,
    borderRadius: (ICON_SIZE + 4) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    // Not hidden: the price badge deliberately sits over the circle's bottom edge, and
    // clipping is what would cut it in half.
    overflow: 'visible',
  },
  priceBadge: {
    position: 'absolute',
    bottom: -3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 7,
  },
  priceBadgeText: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
  },
  image: {
    width: ICON_SIZE + 4,
    height: ICON_SIZE + 4,
    // The circle is drawn here rather than by clipping the parent: iconWrap has to stay
    // overflow:visible for the price badge, so a square upload would otherwise render square.
    borderRadius: (ICON_SIZE + 4) / 2,
  },
  initial: {
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
    fontWeight: '600',
    // Two lines, because "Under ₹199" does not fit on one at this width and was being
    // truncated to "Under ₹1…" — losing the number, which is the whole point of the tag.
    // The height is fixed at both lines so a one-word chip still aligns with a wrapped
    // one instead of the row going ragged.
    height: 28,
  },
});

export default React.memo(TagStrip);
