import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme/ThemeContext';
import SectionDivider from '../common/SectionDivider';

interface RecentSearch {
  id: string;
  text: string;
  icon: string;
}

interface RecentSearchesProps {
  searches: RecentSearch[];
  onSearchPress: (searchText: string) => void;
}

const RecentSearches: React.FC<RecentSearchesProps> = ({ searches, onSearchPress }) => {
  const { getColor, getTypography, theme } = useTheme();

  const styles = StyleSheet.create({
    section: {
      paddingHorizontal: 16,
      paddingVertical: 16,
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
  });

  return (
    <View style={styles.section}>
      <SectionDivider text="Recent Searches" fontSize={14} style={{ marginVertical: 16 }} />
      <View style={styles.container}>
        {searches.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.searchTag}
            onPress={() => onSearchPress(item.text)}
          >
            <MaterialCommunityIcons
              name={item.icon as keyof typeof MaterialCommunityIcons.glyphMap}
              size={16}
              color={getColor('subText')}
            />
            <Text style={styles.searchTagText}>{item.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default RecentSearches;
