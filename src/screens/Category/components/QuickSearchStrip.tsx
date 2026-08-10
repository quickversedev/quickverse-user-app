import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemeText } from '../../../components/common/theme/ThemeText';
import { useTheme } from '../../../theme/ThemeContext';
import { getQuickSearchKeywords, type QuickSearchKeyword } from '../quickSearchKeywords';

const ICON_SIZE = 18;

interface QuickSearchStripProps {
  category: 'Food' | 'Grocery';
  /** Receives the keyword's `query`, not its label. */
  onSelect: (query: string) => void;
}

const QuickSearchChip = React.memo(
  ({
    keyword,
    onSelect,
    styles,
  }: {
    keyword: QuickSearchKeyword;
    onSelect: (query: string) => void;
    styles: ReturnType<typeof getStyles>;
  }) => {
    const handlePress = useCallback(() => onSelect(keyword.query), [keyword.query, onSelect]);
    const { Icon } = keyword;

    return (
      <TouchableOpacity
        style={styles.chip}
        activeOpacity={0.7}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Search for ${keyword.label}`}
      >
        {Icon ? (
          <Icon width={ICON_SIZE} height={ICON_SIZE} />
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
        <ThemeText style={styles.chipText} numberOfLines={1}>
          {keyword.label}
        </ThemeText>
      </TouchableOpacity>
    );
  }
);

QuickSearchChip.displayName = 'QuickSearchChip';

/**
 * Horizontally scrollable row of keyword chips shown under the CategoryScreen
 * search bar. Purely presentational — the category is passed in rather than read
 * from the route, so React.memo can actually bail out (CategoryScreen rebuilds
 * its FlatList header element on every render).
 */
const QuickSearchStrip: React.FC<QuickSearchStripProps> = ({ category, onSelect }) => {
  const { getColor } = useTheme();
  const styles = useMemo(() => getStyles(getColor), [getColor]);
  const keywords = getQuickSearchKeywords(category);

  return (
    <ScrollView
      // Remount on category change so the scroll offset resets to the start —
      // switching Food <-> Grocery updates params in place without unmounting.
      key={category}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={styles.container}
    >
      {keywords.map(keyword => (
        <QuickSearchChip key={keyword.id} keyword={keyword} onSelect={onSelect} styles={styles} />
      ))}
    </ScrollView>
  );
};

type GetColor = ReturnType<typeof useTheme>['getColor'];

const getStyles = (getColor: GetColor) =>
  StyleSheet.create({
    container: {
      paddingTop: 4,
      paddingBottom: 12,
    },
    content: {
      paddingHorizontal: 16,
      gap: 6,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: getColor('card'),
      borderRadius: 16,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: getColor('border'),
    },
    chipText: {
      color: getColor('text'),
      marginLeft: 5,
      fontSize: 12,
      fontWeight: '600',
    },
    iconPlaceholder: {
      width: ICON_SIZE,
      height: ICON_SIZE,
      borderRadius: 8,
      backgroundColor: getColor('border'),
    },
  });

export default React.memo(QuickSearchStrip);
