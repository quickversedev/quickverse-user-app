import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import SectionDivider from '../../../components/common/SectionDivider';
import { useTheme } from '../../../theme/ThemeContext';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 4;
const SPACING = 16;
const GAP = 8;
const ITEM_WIDTH = (width - SPACING * (COLUMN_COUNT + 1)) / COLUMN_COUNT;
const GRID_WIDTH = COLUMN_COUNT * ITEM_WIDTH + (COLUMN_COUNT - 1) * GAP;
const SKELETON_ITEMS = 8;

const CollectionsGridSkeleton: React.FC = () => {
  const shimmer = useRef(new Animated.Value(0)).current;
  const { getColor } = useTheme();

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [shimmer]);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  const baseColor = getColor('border');
  const highlightColor = getColor('card');

  const ShimmerBlock = ({ w, h, borderRadius = 8, style }: { w: number; h: number; borderRadius?: number; style?: object }) => (
    <View style={[{ width: w, height: h, borderRadius, backgroundColor: baseColor, overflow: 'hidden' }, style]}>
      <Animated.View
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: highlightColor,
          transform: [{ translateX }],
          opacity: 0.4,
        }}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <SectionDivider text="Collections" style={styles.sectionDivider} />
      <View style={styles.grid}>
        {Array.from({ length: SKELETON_ITEMS }).map((_, index) => (
          <View key={index} style={styles.itemContainer}>
            <ShimmerBlock w={ITEM_WIDTH} h={ITEM_WIDTH} borderRadius={12} />
            <ShimmerBlock w={ITEM_WIDTH * 0.85} h={14} borderRadius={4} style={{ marginTop: 8 }} />
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
});

export default CollectionsGridSkeleton;
