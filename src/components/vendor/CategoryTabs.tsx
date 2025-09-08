import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { ThemeText } from '../common/theme/ThemeText';

export interface CategoryItem {
  id: string;
  name: string;
  icon: string | ImageSourcePropType;
}

interface CategoryTabsProps {
  categories: CategoryItem[];
  selectedCategoryId: string;
  onSelect: (id: string) => void;
  iconOpacity?: Animated.AnimatedInterpolation<number>;
  iconSize?: Animated.AnimatedInterpolation<number>;
  disabled?: boolean;
}

const { width } = Dimensions.get('window');

const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  selectedCategoryId,
  onSelect,
  iconOpacity,
  iconSize,
  disabled = false,
}) => {
  const { getColor, theme } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (categories.length === 0 || !selectedCategoryId || !scrollRef.current) return;
    const index = categories.findIndex(c => c.id === selectedCategoryId);
    if (index === -1) return;
    setTimeout(() => {
      const categoryWidth = 120;
      const scrollToX = Math.max(0, index * categoryWidth - width / 2 + categoryWidth / 2);
      scrollRef.current?.scrollTo({ x: scrollToX, animated: true });
    }, 100);
  }, [categories, selectedCategoryId]);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: getColor('background'),
      paddingHorizontal: 16,
      borderBottomWidth: 2,
      borderBottomColor: getColor('border'),
    },
    item: {
      alignItems: 'center',
      marginRight: 24,
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderBottomWidth: 3,
      borderBottomColor: 'transparent',
      minHeight: 40,
    },
    itemActive: {
      borderBottomColor: getColor('primary'),
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.sm,
      shadowColor: getColor('primary'),
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    icon: {
      width: 32,
      height: 32,
      marginBottom: 4,
      borderRadius: theme.borderRadius.sm,
      overflow: 'hidden',
    },
  });

  const getIconSource = (icon: string | ImageSourcePropType): ImageSourcePropType => {
    return typeof icon === 'string' ? { uri: icon } : icon;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8 }}
      >
        {categories.map(cat => (
          <View
            key={cat.id}
            style={[
              styles.item,
              selectedCategoryId === cat.id && styles.itemActive,
              disabled && { opacity: 0.6 },
            ]}
          >
            <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => onSelect(cat.id)}>
              <Animated.Image
                source={getIconSource(cat.icon)}
                style={[
                  styles.icon,
                  iconOpacity ? { opacity: iconOpacity } : null,
                  iconSize ? { height: iconSize, width: iconSize } : null,
                ]}
              />
              <ThemeText
                variant="caption"
                color={selectedCategoryId === cat.id ? getColor('primary') : getColor('subText')}
                style={selectedCategoryId === cat.id ? { fontWeight: 'bold' } : {}}
              >
                {cat.name}
              </ThemeText>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default CategoryTabs;
