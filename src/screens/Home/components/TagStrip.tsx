import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import { ThemeText } from '../../../components/common/theme/ThemeText';
import productsService from '../../../services/productsService';
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

const TAG_ICONS: Record<string, React.FC<SvgProps>> = {
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
    const Icon = TAG_ICONS[tag.id];

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
          {Icon ? (
            <Icon width={ICON_SIZE} height={ICON_SIZE} />
          ) : (
            <View
              style={[
                styles.iconPlaceholder,
                { backgroundColor: color.bg, borderColor: color.text },
              ]}
            />
          )}
        </View>
        <ThemeText numberOfLines={1} style={[styles.label, { color: color.text }]}>
          {tag.label}
        </ThemeText>
      </TouchableOpacity>
    );
  }
);

TagChip.displayName = 'TagChip';

const TagStrip: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const [tags, setTags] = useState<ProductTagOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    productsService
      .fetchProductTags()
      .then(result => {
        if (!cancelled) setTags(result);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePress = useMemo(
    () => (tag: ProductTagOption) => {
      navigation.navigate('TagProducts', {
        tagCode: tag.id,
        tagLabel: tag.label,
      });
    },
    [navigation]
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
    width: 56,
  },
  iconWrap: {
    width: ICON_SIZE + 4,
    height: ICON_SIZE + 4,
    borderRadius: (ICON_SIZE + 4) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconPlaceholder: {
    width: ICON_SIZE - 6,
    height: ICON_SIZE - 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default React.memo(TagStrip);
