import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemeText } from '../../../components/common/theme/ThemeText';
import { HOME_CATEGORIES, type HomeCategory, type HomeCategoryId } from '../homeCategories';

const ICON_SIZE = 40;

interface HomeCategoryStripProps {
  activeId: HomeCategoryId;
  onSelect: (id: HomeCategoryId) => void;
}

/**
 * Neutral stand-in shown until design supplies the six illustrated icons.
 * See the TODO on HomeCategory.Icon in homeCategories.ts for how to wire them up.
 */
const IconPlaceholder: React.FC<{ tint: string }> = ({ tint }) => (
  <View style={[styles.iconPlaceholder, { backgroundColor: `${tint}26`, borderColor: tint }]} />
);

const CategoryChip = React.memo(
  ({
    category,
    isActive,
    onSelect,
  }: {
    category: HomeCategory;
    isActive: boolean;
    onSelect: (id: HomeCategoryId) => void;
  }) => {
    const handlePress = useCallback(() => onSelect(category.id), [category.id, onSelect]);
    const { Icon } = category;

    return (
      <TouchableOpacity
        style={styles.chip}
        activeOpacity={0.7}
        onPress={handlePress}
        accessible
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
        accessibilityLabel={category.label}
      >
        <View style={styles.iconWrap}>
          {Icon ? (
            <Icon width={ICON_SIZE} height={ICON_SIZE} />
          ) : (
            <IconPlaceholder tint={category.accent} />
          )}
        </View>
        <ThemeText
          numberOfLines={1}
          style={[
            styles.label,
            isActive ? { color: category.accent, fontWeight: '700' } : styles.labelInactive,
          ]}
        >
          {category.label}
        </ThemeText>
      </TouchableOpacity>
    );
  }
);

CategoryChip.displayName = 'CategoryChip';

const HomeCategoryStrip: React.FC<HomeCategoryStripProps> = ({ activeId, onSelect }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.content}
    style={styles.container}
  >
    {HOME_CATEGORIES.map(category => (
      <CategoryChip
        key={category.id}
        category={category}
        isActive={category.id === activeId}
        onSelect={onSelect}
      />
    ))}
  </ScrollView>
);

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
    width: ICON_SIZE,
    height: ICON_SIZE,
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
  },
  labelInactive: {
    color: '#4B5563',
    fontWeight: '500',
  },
});

export default React.memo(HomeCategoryStrip);
