import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRecentSearches } from '../../hooks/useRecentSearches';
import { useTheme } from '../../theme/ThemeContext';
import SectionDivider from '../common/SectionDivider';

interface RecentSearchesProps {
  onSearchPress: (searchText: string) => void;
}

const RecentSearches: React.FC<RecentSearchesProps> = ({ onSearchPress }) => {
  const { getColor, getTypography, theme } = useTheme();
  const { recentSearches, clearRecentSearches } = useRecentSearches();

  const styles = StyleSheet.create({
    section: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      paddingRight: 0, // Remove right padding since headerContainer has its own
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 16,
    },
    titleContainer: {
      flex: 1, // Take available space
    },
    clearButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginLeft: 8, // Add margin to separate from title
    },
    container: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    searchTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: getColor('border'),
    },
    searchTagText: {
      color: getColor('text'),
      fontSize: getTypography('caption'),
      marginLeft: 6,
    },
    clearButtonText: {
      color: getColor('primary'),
      fontSize: getTypography('caption'),
      fontWeight: '500',
    },
  });

  // Don't render if no recent searches
  if (recentSearches.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <SectionDivider text="Recent Searches" fontSize={14} />
        </View>
        <TouchableOpacity style={styles.clearButton} onPress={clearRecentSearches}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        {recentSearches.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.searchTag}
            onPress={() => onSearchPress(item.text)}
          >
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <MaterialCommunityIcons name={item.icon as any} size={16} color={getColor('subText')} />
            <Text style={styles.searchTagText}>{item.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default RecentSearches;
