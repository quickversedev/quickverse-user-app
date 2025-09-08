import { useCallback, useEffect, useState } from 'react';
import { getSmartSuggestions } from '../assets/searchSuggestions';
import { getRecentSearches } from '../services/localStorage/storage.service';

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'smart' | 'trending';
  icon: string;
  priority: number;
}

export const useSearchSuggestions = (searchQuery: string) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches on mount
  useEffect(() => {
    const loadRecentSearches = () => {
      const stored = getRecentSearches();
      if (stored) {
        const recentTexts = stored.map((item: any) => item.text || item);
        setRecentSearches(recentTexts);
      }
    };

    loadRecentSearches();
  }, []);

  // Generate suggestions based on search query
  const generateSuggestions = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);

      try {
        // Get smart suggestions from database
        const smartSuggestions = getSmartSuggestions(query, recentSearches);

        const suggestionsList: SearchSuggestion[] = [];

        // Always add the typed query as the first suggestion (highest priority)
        suggestionsList.push({
          id: 'typed_query',
          text: query.trim(),
          type: 'smart',
          icon: 'magnify',
          priority: 2000, // Highest priority
        });

        // Add recent searches that match (high priority)
        recentSearches.forEach((recent, index) => {
          if (
            recent.toLowerCase().includes(query.toLowerCase()) &&
            recent.toLowerCase() !== query.toLowerCase()
          ) {
            suggestionsList.push({
              id: `recent_${index}`,
              text: recent,
              type: 'recent',
              icon: 'history',
              priority: 1000 - index, // Higher priority for more recent searches
            });
          }
        });

        // Add smart suggestions from database
        smartSuggestions.forEach((suggestion, index) => {
          // Skip if already added as recent search or if it's the same as the typed query
          const isRecent = recentSearches.some(
            recent => recent.toLowerCase() === suggestion.toLowerCase()
          );
          const isTypedQuery = suggestion.toLowerCase() === query.toLowerCase();

          if (!isRecent && !isTypedQuery) {
            suggestionsList.push({
              id: `smart_${index}`,
              text: suggestion,
              type: 'smart',
              icon: 'lightbulb-outline',
              priority: 500 - index,
            });
          }
        });

        // Sort by priority and limit to 8 suggestions
        const sortedSuggestions = suggestionsList
          .sort((a, b) => b.priority - a.priority)
          .slice(0, 8);

        setSuggestions(sortedSuggestions);
      } catch (error) {
        console.error('Error generating suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [recentSearches]
  );

  // Update suggestions when query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      generateSuggestions(searchQuery);
    }, 200); // Reduced debounce for faster suggestions

    return () => clearTimeout(timeoutId);
  }, [searchQuery, generateSuggestions]);

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    suggestions,
    isLoading,
    clearSuggestions,
    generateSuggestions,
  };
};
