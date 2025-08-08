import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import useFeaturedProductsStoreHook from '../../hooks/useFeaturedProductsStore';
import { useTheme } from '../../theme/ThemeContext';
import { Product } from '../../types/product';

interface FeaturedProductsDemoProps {
  shopIds: string[];
}

const FeaturedProductsDemo: React.FC<FeaturedProductsDemoProps> = ({ shopIds }) => {
  const { getColor, getTypography } = useTheme();
  const [results, setResults] = useState<Record<string, Product[]>>({});

  const {
    getFeaturedProductsBatch,
    isLoading,
    getError,
    clearCache,
    clearExpiredCache,
    isCached,
    isExpired,
    batchLoading,
    batchError,
  } = useFeaturedProductsStoreHook();

  const handleBatchFetch = async () => {
    try {
      const batchResults = await getFeaturedProductsBatch(shopIds);
      setResults(batchResults);
    } catch (error) {
      console.error('Batch fetch failed:', error);
    }
  };

  const handleClearCache = () => {
    clearCache();
    setResults({});
  };

  const styles = StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: getColor('background'),
    },
    title: {
      fontSize: getTypography('h1'),
      fontWeight: 'bold',
      color: getColor('text'),
      marginBottom: 16,
      fontFamily: 'BricolageGrotesque-Regular',
    },
    button: {
      backgroundColor: getColor('primary'),
      padding: 12,
      borderRadius: 8,
      marginVertical: 8,
      alignItems: 'center',
    },
    buttonText: {
      color: getColor('white'),
      fontSize: getTypography('body'),
      fontWeight: 'bold',
      fontFamily: 'BricolageGrotesque-Regular',
    },
    statusText: {
      fontSize: getTypography('body'),
      color: getColor('text'),
      marginVertical: 4,
      fontFamily: 'BricolageGrotesque-Regular',
    },
    errorText: {
      fontSize: getTypography('body'),
      color: getColor('error'),
      marginVertical: 4,
      fontFamily: 'BricolageGrotesque-Regular',
    },
    cacheStatusContainer: {
      marginVertical: 16,
      padding: 12,
      backgroundColor: getColor('card'),
      borderRadius: 8,
    },
    cacheStatusTitle: {
      fontSize: getTypography('subtitle'),
      fontWeight: 'bold',
      color: getColor('text'),
      marginBottom: 8,
      fontFamily: 'BricolageGrotesque-Regular',
    },
    shopContainer: {
      marginVertical: 8,
      padding: 8,
      backgroundColor: getColor('background'),
      borderRadius: 4,
    },
    shopTitle: {
      fontSize: getTypography('body'),
      fontWeight: 'bold',
      color: getColor('text'),
      marginBottom: 4,
      fontFamily: 'BricolageGrotesque-Regular',
    },
    productItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 2,
    },
    productName: {
      fontSize: getTypography('caption'),
      color: getColor('text'),
      fontFamily: 'BricolageGrotesque-Regular',
    },
    productPrice: {
      fontSize: getTypography('caption'),
      color: getColor('primary'),
      fontFamily: 'BricolageGrotesque-Regular',
    },
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Featured Products Store Demo</Text>

      <TouchableOpacity style={styles.button} onPress={handleBatchFetch}>
        <Text style={styles.buttonText}>
          {batchLoading ? 'Fetching...' : 'Fetch All Featured Products'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleClearCache}>
        <Text style={styles.buttonText}>Clear All Cache</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={clearExpiredCache}>
        <Text style={styles.buttonText}>Clear Expired Cache</Text>
      </TouchableOpacity>

      {batchLoading && <Text style={styles.statusText}>Batch loading in progress...</Text>}
      {batchError && <Text style={styles.errorText}>Batch error: {batchError}</Text>}

      <View style={styles.cacheStatusContainer}>
        <Text style={styles.cacheStatusTitle}>Cache Status:</Text>
        {shopIds.map(shopId => (
          <View key={shopId} style={styles.shopContainer}>
            <Text style={styles.shopTitle}>Shop {shopId}:</Text>
            <Text style={styles.statusText}>Cached: {isCached(shopId) ? 'Yes' : 'No'}</Text>
            <Text style={styles.statusText}>
              Expired: {isCached(shopId) && isExpired(shopId) ? 'Yes' : 'No'}
            </Text>
            <Text style={styles.statusText}>Loading: {isLoading(shopId) ? 'Yes' : 'No'}</Text>
            {getError(shopId) && <Text style={styles.errorText}>Error: {getError(shopId)}</Text>}
          </View>
        ))}
      </View>

      {Object.keys(results).length > 0 && (
        <View>
          <Text style={styles.title}>Results:</Text>
          {Object.entries(results).map(([shopId, products]) => (
            <View key={shopId} style={styles.shopContainer}>
              <Text style={styles.shopTitle}>
                Shop {shopId} ({products.length} products)
              </Text>
              {products.map((product, index) => (
                <View key={index} style={styles.productItem}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productPrice}>₹{product.price}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

export default FeaturedProductsDemo;
