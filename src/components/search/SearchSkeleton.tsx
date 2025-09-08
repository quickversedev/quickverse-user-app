import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

const SearchSkeleton: React.FC = () => {
  const { getColor } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    skeletonCard: {
      width: '32%',
      height: 120,
      backgroundColor: getColor('card'),
      borderRadius: 12,
      marginBottom: 16,
      overflow: 'hidden',
    },
    skeletonImage: {
      width: '100%',
      height: 60,
      backgroundColor: getColor('border'),
    },
    skeletonContent: {
      padding: 8,
    },
    skeletonTitle: {
      height: 12,
      backgroundColor: getColor('border'),
      borderRadius: 6,
      marginBottom: 4,
    },
    skeletonSubtitle: {
      height: 8,
      backgroundColor: getColor('border'),
      borderRadius: 4,
      width: '60%',
    },
  });

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5, 6].map(item => (
        <View key={item} style={styles.skeletonCard}>
          <View style={styles.skeletonImage} />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonSubtitle} />
          </View>
        </View>
      ))}
    </View>
  );
};

export default SearchSkeleton;
