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

const { height } = Dimensions.get('window');
const CATEGORY_ITEM_HEIGHT = 90;
const SIDEBAR_WIDTH = 85;
const ICON_SIZE = 48;

const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  selectedCategoryId,
  onSelect,
  disabled = false,
}) => {
  const { getColor, theme } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (categories.length === 0 || !selectedCategoryId || !scrollRef.current) return;
    const index = categories.findIndex(c => c.id === selectedCategoryId);
    if (index === -1) return;
    setTimeout(() => {
      const scrollToY = Math.max(0, index * CATEGORY_ITEM_HEIGHT - height / 4);
      scrollRef.current?.scrollTo({ y: scrollToY, animated: true });
    }, 100);
  }, [categories, selectedCategoryId]);

  const getIconSource = (icon: string | ImageSourcePropType): ImageSourcePropType => {
    return typeof icon === 'string' ? { uri: icon } : icon;
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: getColor('card'),
      width: SIDEBAR_WIDTH,
      borderTopRightRadius: theme.borderRadius.md,
      borderTopLeftRadius: theme.borderRadius.md,
    },
    scrollContent: {
      paddingVertical: 8,
    },
    item: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 4,
      marginHorizontal: 2,
      marginVertical: 2,
      borderRadius: theme.borderRadius.sm,
      minHeight: CATEGORY_ITEM_HEIGHT,
    },
    itemActive: {
      backgroundColor: getColor('background'),
    },
    iconWrapper: {
      width: ICON_SIZE + 4,
      height: ICON_SIZE + 4,
      borderRadius: (ICON_SIZE + 4) / 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    iconWrapperActive: {
      borderColor: getColor('primary'),
      shadowColor: getColor('primary'),
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 6,
      elevation: 3,
    },
    icon: {
      width: ICON_SIZE,
      height: ICON_SIZE,
      borderRadius: ICON_SIZE / 2,
    },
    label: {
      textAlign: 'center',
      fontSize: 10,
      lineHeight: 13,
      paddingHorizontal: 2,
    },
    labelActive: {
      fontWeight: 'bold',
    },
    activeIndicator: {
      position: 'absolute',
      left: 0,
      top: '25%',
      bottom: '25%',
      width: 3,
      backgroundColor: getColor('primary'),
      borderTopRightRadius: 3,
      borderBottomRightRadius: 3,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map(cat => {
          const isActive = selectedCategoryId === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.item,
                isActive && styles.itemActive,
                disabled && { opacity: 0.5 },
              ]}
              onPress={() => onSelect(cat.id)}
              activeOpacity={0.7}
            >
              {isActive && <View style={styles.activeIndicator} />}
              <View style={[styles.iconWrapper, isActive && styles.iconWrapperActive]}>
                <Animated.Image
                  source={getIconSource(cat.icon)}
                  style={styles.icon}
                />
              </View>
              <ThemeText
                variant="small"
                color={isActive ? getColor('primary') : getColor('subText')}
                style={[styles.label, isActive && styles.labelActive]}
                numberOfLines={2}
              >
                {cat.name}
              </ThemeText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default CategoryTabs;
