import { useCallback, useState } from 'react';
import { Vendor } from '../types/vendor';

interface Product {
  id: string;
  name: string;
  image: string;
}

interface SearchResults {
  vendors: Vendor[];
  products: Product[];
}

interface UseSearchReturn {
  searchQuery: string;
  isLoading: boolean;
  searchResults: SearchResults;
  hasSearched: boolean;
  setSearchQuery: (query: string) => void;
  performSearch: (query: string) => Promise<void>;
  clearSearch: () => void;
}

export const useSearch = (): UseSearchReturn => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults>({
    vendors: [],
    products: [],
  });
  const [hasSearched, setHasSearched] = useState(false);

  // Dummy API call for search
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults({ vendors: [], products: [] });
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Dummy search results
    const dummyVendors: Vendor[] = [
      {
        shopId: 'search1',
        name: `${query} Restaurant`,
        rating: 4.5,
        preparationTime: '25 mins',
        logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
        banner: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
        owner: 'Owner 1',
        phone: '1234567890',
        openingTime: '09:00',
        closingTime: '22:00',
        description: `Best ${query} in town`,
        category: 'restaurant',
        storeEnabled: true,
        storeActive: true,
      },
      {
        shopId: 'search2',
        name: `${query} Express`,
        rating: 4.2,
        preparationTime: '15 mins',
        logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
        banner: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
        owner: 'Owner 2',
        phone: '1234567890',
        openingTime: '10:00',
        closingTime: '23:00',
        description: `Quick ${query} delivery`,
        category: 'restaurant',
        storeEnabled: true,
        storeActive: true,
      },
    ];

    const dummyProducts: Product[] = [
      {
        id: 'prod1',
        name: `${query} Special`,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=200&h=200&fit=crop',
      },
      {
        id: 'prod2',
        name: `${query} Deluxe`,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=200&h=200&fit=crop',
      },
      {
        id: 'prod3',
        name: `${query} Classic`,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=200&h=200&fit=crop',
      },
      {
        id: 'prod4',
        name: `${query} Premium`,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=200&h=200&fit=crop',
      },
      {
        id: 'prod5',
        name: `${query} Supreme`,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=200&h=200&fit=crop',
      },
      {
        id: 'prod6',
        name: `${query} Ultimate`,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=200&h=200&fit=crop',
      },
    ];

    setSearchResults({ vendors: dummyVendors, products: dummyProducts });
    setIsLoading(false);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults({ vendors: [], products: [] });
    setHasSearched(false);
  }, []);

  return {
    searchQuery,
    isLoading,
    searchResults,
    hasSearched,
    setSearchQuery,
    performSearch,
    clearSearch,
  };
};
