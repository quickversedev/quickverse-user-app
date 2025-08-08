import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme/ThemeContext';

interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  placeholder?: string;
}

const SearchHeader: React.FC<SearchHeaderProps> = ({
  searchQuery,
  onSearchChange,
  placeholder = 'Search for vendors and products...',
}) => {
  const { getColor, getTypography } = useTheme();
  const navigation = useNavigation();
  const searchInputRef = useRef<TextInput>(null);

  // Auto-focus the search input when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 20,
      backgroundColor: getColor('background'),
    },
    backButton: {
      marginRight: 12,
      padding: 4,
    },
    searchContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: getColor('card'),
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderWidth: 1,
      borderBottomWidth: 2,
      borderColor: getColor('primary'),
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      color: getColor('text'),
      fontSize: getTypography('body'),
      paddingVertical: 4,
    },
  });

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={getColor('text')} />
      </TouchableOpacity>
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color={getColor('subText')}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor={getColor('subText')}
          value={searchQuery}
          onChangeText={onSearchChange}
          ref={searchInputRef}
        />
      </View>
    </View>
  );
};

export default SearchHeader;
