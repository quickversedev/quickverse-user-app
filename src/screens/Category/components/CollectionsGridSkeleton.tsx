import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import SectionDivider from '../../../components/common/SectionDivider';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 4;
const SPACING = 16;
const GAP = 8;
const ITEM_WIDTH = (width - SPACING * (COLUMN_COUNT + 1)) / COLUMN_COUNT;
const GRID_WIDTH = COLUMN_COUNT * ITEM_WIDTH + (COLUMN_COUNT - 1) * GAP;
const SKELETON_ITEMS = 8; // 2 rows of 4

const CollectionsGridSkeleton: React.FC = () => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <View style={styles.container}>
      <SectionDivider text="Collections" style={styles.sectionDivider} />
      <View style={styles.grid}>
        {Array.from({ length: SKELETON_ITEMS }).map((_, index) => (
          <View key={index} style={styles.itemContainer}>
            <Animated.View style={[styles.imagePlaceholder, { opacity }]} />
            <Animated.View style={[styles.textPlaceholder, { opacity }]} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingHorizontal: SPACING,
    alignItems: 'center',
  },
  sectionDivider: {
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: GAP,
    width: GRID_WIDTH,
  },
  itemContainer: {
    width: ITEM_WIDTH,
    marginBottom: 20,
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },
  textPlaceholder: {
    width: ITEM_WIDTH * 0.85,
    height: 14,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
});

export default CollectionsGridSkeleton;
