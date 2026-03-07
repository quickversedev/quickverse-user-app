import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRecentSearches } from '../../hooks/useRecentSearches';
import { useTheme } from '../../theme/ThemeContext';
import { ThemeText } from '../common/theme/ThemeText';

interface RecentSearchesProps {
  onSearchPress: (searchText: string) => void;
}

const RecentSearches: React.FC<RecentSearchesProps> = ({ onSearchPress }) => {
  const { getColor } = useTheme();
  const { recentSearches, clearRecentSearches } = useRecentSearches();

  const styles = StyleSheet.create({
    section: {
      paddingHorizontal: 16,
      paddingTop: 20,
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    titleText: {
      fontSize: 14,
      fontWeight: '600',
      color: getColor('subText'),
      letterSpacing: 0.5,
    },
    clearButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: getColor('card'),
    },
    clearButtonText: {
      color: getColor('primary'),
      fontWeight: '500',
    },
    container: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    searchTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: getColor('card'),
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: getColor('border'),
    },
    searchTagText: {
      color: getColor('text'),
      marginLeft: 8,
      fontSize: 14,
    },
    removeButton: {
      marginLeft: 8,
      padding: 2,
    },
  });

  // Don't render if no recent searches
  if (recentSearches.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.headerContainer}>
        <ThemeText style={styles.titleText}>Recent Searches</ThemeText>
        <TouchableOpacity style={styles.clearButton} onPress={clearRecentSearches}>
          <ThemeText variant="caption" style={styles.clearButtonText}>
            Clear All
          </ThemeText>
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        {recentSearches.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.searchTag}
            onPress={() => onSearchPress(item.text)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="history" size={16} color={getColor('subText')} />
            <ThemeText style={styles.searchTagText}>{item.text}</ThemeText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default RecentSearches;
