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
      top: 72,
      left: 16,
      right: 16,
      backgroundColor: getColor('card'),
      borderRadius: 12,
      elevation: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      zIndex: 9999,
      maxHeight: 280,
      borderWidth: 1,
      borderColor: getColor('border'),
      overflow: 'hidden',
    },
    suggestionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
      backgroundColor: 'transparent',
    },
    suggestionText: {
      fontSize: getTypography('body'),
      color: getColor('text'),
      flex: 1,
      marginLeft: 14,
      fontWeight: '400',
    },
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: getColor('background'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: {
      fontSize: 16,
      color: getColor('subText'),
    },
    recentIcon: {
      color: getColor('subText'),
    },
    smartIcon: {
      color: getColor('primary'),
    },
    loadingContainer: {
      padding: 20,
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
  });

  if (!visible) return null;

  const renderSuggestion = ({ item, index }: { item: SearchSuggestion; index: number }) => (
    <TouchableOpacity
      style={[
        styles.suggestionItem,
        index === suggestions.length - 1 && { borderBottomWidth: 0 },
      ]}
      onPress={() => onSuggestionPress(item.text)}
      activeOpacity={0.6}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name={item.type === 'smart' ? 'map-marker-outline' : 'magnify'}
          style={[
            styles.icon,
            item.type === 'smart' && styles.smartIcon,
          ]}
        />
      </View>
      <Text style={styles.suggestionText} numberOfLines={1}>
        {item.text}
      </Text>
      <MaterialCommunityIcons
        name="arrow-top-left"
        size={18}
        color={getColor('subText')}
      />
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
