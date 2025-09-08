import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSearchSuggestions } from '../../hooks/useSearchSuggestions';
import { useTheme } from '../../theme/ThemeContext';
import SearchSuggestions from './SearchSuggestions';

interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onSuggestionPress?: (suggestion: string) => void;
  onClearSearch?: () => void;
  onSubmitEditing?: () => void;
  placeholder?: string;
}

const SearchHeader: React.FC<SearchHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onSuggestionPress,
  onClearSearch,
  onSubmitEditing,
  placeholder = 'Search for vendors and products...',
}) => {
  const { getColor } = useTheme();
  const navigation = useNavigation();
  const searchInputRef = useRef<TextInput>(null);
  // Removed focus tracking; we control visibility with showSuggestions
  const [showSuggestions, setShowSuggestions] = useState(false);

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
    setShowSuggestions(false);
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for touch events
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleClearPress = () => {
    onSearchChange('');
    if (onClearSearch) {
      onClearSearch();
    }
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const handleOutsidePress = () => {
    setShowSuggestions(false);
    searchInputRef.current?.blur();
  };

  // Ensure suggestions open while typing (especially after clearing)
  const handleChangeText = (text: string) => {
    onSearchChange(text);
    setShowSuggestions(text.length > 0);
  };

  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 20,
      backgroundColor: getColor('background'),
      zIndex: 10000,
      elevation: 16,
      position: 'relative',
      overflow: 'visible',
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
      position: 'relative',
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      color: getColor('text'),
      paddingVertical: 4,
    },
    clearButton: {
      marginLeft: 8,
      padding: 4,
    },
  });

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
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
            onChangeText={handleChangeText}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onSubmitEditing={onSubmitEditing}
            returnKeyType="search"
            ref={searchInputRef}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClearPress}>
              <MaterialCommunityIcons name="close-circle" size={20} color={getColor('subText')} />
            </TouchableOpacity>
          )}
        </View>
        <SearchSuggestions
          suggestions={suggestions}
          isLoading={isLoading}
          onSuggestionPress={handleSuggestionPress}
          visible={showSuggestions && searchQuery.length > 0 && suggestions.length > 0}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

export default SearchHeader;
