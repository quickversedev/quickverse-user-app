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
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: getColor('background'),
      borderRadius: 8,
      marginTop: 4,
      elevation: 8,
      shadowColor: getColor('shadow'),
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      zIndex: 1000,
      maxHeight: 300,
    },
    suggestionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
    },
    suggestionText: {
      ...getTypography('body2'),
      color: getColor('text'),
      flex: 1,
      marginLeft: 12,
    },
    iconContainer: {
      width: 20,
      alignItems: 'center',
    },
    icon: {
      fontSize: 16,
      color: getColor('primary'),
    },
    recentIcon: {
      color: getColor('secondary'),
    },
    smartIcon: {
      color: getColor('accent'),
    },
    loadingContainer: {
      padding: 16,
      alignItems: 'center',
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
          name={item.icon as any}
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
