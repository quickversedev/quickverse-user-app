import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSearchSuggestions } from '../../hooks/useSearchSuggestions';
import { useTheme } from '../../theme/ThemeContext';
import SearchSuggestions from './SearchSuggestions';

interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onSuggestionPress?: (suggestion: string) => void;
  placeholder?: string;
}

const SearchHeader: React.FC<SearchHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onSuggestionPress,
  placeholder = 'Search for vendors and products...',
}) => {
  const { getColor, getTypography } = useTheme();
  const navigation = useNavigation();
  const searchInputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Use search suggestions hook
  const { suggestions, isLoading, clearSuggestions } = useSearchSuggestions(searchQuery);

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

  const handleSuggestionPress = (suggestion: string) => {
    onSearchChange(suggestion);
    if (onSuggestionPress) {
      onSuggestionPress(suggestion);
    }
    clearSuggestions();
    setIsFocused(false);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for touch events
    setTimeout(() => {
      setIsFocused(false);
    }, 200);
  };

  const handleClearPress = () => {
    onSearchChange('');
    searchInputRef.current?.focus();
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
      zIndex: 1,
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
    clearButton: {
      marginLeft: 8,
      padding: 4,
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
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          ref={searchInputRef}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClearPress}>
            <MaterialCommunityIcons name="close-circle" size={20} color={getColor('subText')} />
          </TouchableOpacity>
        )}
        <SearchSuggestions
          suggestions={suggestions}
          isLoading={isLoading}
          onSuggestionPress={handleSuggestionPress}
          visible={isFocused && searchQuery.length > 0 && suggestions.length > 0}
        />
      </View>
    </View>
  );
};

export default SearchHeader;
