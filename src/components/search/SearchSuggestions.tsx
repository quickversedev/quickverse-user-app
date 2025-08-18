import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SearchSuggestion } from '../../hooks/useSearchSuggestions';
import { useTheme } from '../../theme/ThemeContext';

interface SearchSuggestionsProps {
  suggestions: SearchSuggestion[];
  isLoading: boolean;
  onSuggestionPress: (suggestion: string) => void;
  visible: boolean;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  suggestions,
  isLoading,
  onSuggestionPress,
  visible,
}) => {
  const { getColor, getTypography } = useTheme();

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 60, // Position below the header
      left: 16,
      right: 16,
      backgroundColor: getColor('background'),
      borderRadius: 8,
      marginTop: 4,
      elevation: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      zIndex: 9999,
      maxHeight: 300,
      borderWidth: 1,
      borderColor: getColor('border'),
    },
    suggestionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
      backgroundColor: getColor('background'),
    },
    suggestionText: {
      fontSize: getTypography('body'),
      color: getColor('text'),
      flex: 1,
      marginLeft: 12,
      fontWeight: '500',
    },
    iconContainer: {
      width: 20,
      alignItems: 'center',
    },
    icon: {
      fontSize: 18,
      color: getColor('primary'),
    },
    recentIcon: {
      color: getColor('primary'),
    },
    smartIcon: {
      color: getColor('primary'),
    },
    loadingContainer: {
      padding: 16,
      alignItems: 'center',
      backgroundColor: getColor('background'),
    },
  });

  if (!visible) return null;

  const renderSuggestion = ({ item }: { item: SearchSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => onSuggestionPress(item.text)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name={item.icon as string}
          style={[
            styles.icon,
            item.type === 'recent' && styles.recentIcon,
            item.type === 'smart' && styles.smartIcon,
          ]}
        />
      </View>
      <Text style={styles.suggestionText} numberOfLines={1}>
        {item.text}
      </Text>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={getColor('primary')} />
        </View>
      );
    }

    if (suggestions.length === 0) {
      return null; // Don't show anything when no suggestions
    }

    return (
      <FlatList
        data={suggestions}
        renderItem={renderSuggestion}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    );
  };

  return <View style={styles.container}>{renderContent()}</View>;
};

export default SearchSuggestions;
