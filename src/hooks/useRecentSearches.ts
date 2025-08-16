import { useCallback, useEffect, useState } from 'react';
import {
  addRecentSearch,
  getRecentSearches,
  removeRecentSearches,
  setRecentSearches,
} from '../services/localStorage/storage.service';

export interface RecentSearch {
  id: string;
  text: string;
  icon: string;
}

export const useRecentSearches = () => {
  const [recentSearches, setRecentSearchesState] = useState<RecentSearch[]>([]);

  // Load recent searches from storage on mount
  useEffect(() => {
    const loadRecentSearches = () => {
      const storedSearches = getRecentSearches();
      if (storedSearches) {
        setRecentSearchesState(storedSearches);
      }
    };

    loadRecentSearches();
  }, []);

  // Add a new search to recent searches
  const addSearch = useCallback((searchText: string, icon: string = 'magnify') => {
    if (!searchText.trim()) return;

    addRecentSearch(searchText, icon);

    // Update local state
    setRecentSearchesState(prevSearches => {
      const filteredSearches = prevSearches.filter(
        search => search.text.toLowerCase() !== searchText.toLowerCase()
      );

      const newSearch: RecentSearch = {
        id: Date.now().toString(),
        text: searchText,
        icon: icon,
      };

      const updatedSearches = [newSearch, ...filteredSearches];
      return updatedSearches.slice(0, 10); // Keep only 10 searches
    });
  }, []);

  // Clear all recent searches
  const clearRecentSearches = useCallback(() => {
    removeRecentSearches();
    setRecentSearchesState([]);
  }, []);

  // Remove a specific search
  const removeSearch = useCallback(
    (searchId: string) => {
      const updatedSearches = recentSearches.filter(search => search.id !== searchId);
      setRecentSearches(updatedSearches);
      setRecentSearchesState(updatedSearches);
    },
    [recentSearches]
  );

  return {
    recentSearches,
    addSearch,
    clearRecentSearches,
    removeSearch,
  };
};
