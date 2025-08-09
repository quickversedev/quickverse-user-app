import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import useFeaturedProductsStoreHook from '../../../hooks/useFeaturedProductsStore';
import { useTheme } from '../../../theme/ThemeContext';
import { Product } from '../../../types/product';

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
      fontSize: getTypography('caption'),
      color: getColor('subText'),
      marginVertical: 4,
      fontFamily: 'BricolageGrotesque-Regular',
    },
    errorText: {
      fontSize: getTypography('caption'),
      color: getColor('error'),
      marginVertical: 4,
      fontFamily: 'BricolageGrotesque-Regular',
    },
    shopContainer: {
      marginVertical: 8,
      padding: 12,
      backgroundColor: getColor('card'),
      borderRadius: 8,
    },
    shopTitle: {
      fontSize: getTypography('subtitle'),
      fontWeight: 'bold',
      color: getColor('text'),
      marginBottom: 8,
      fontFamily: 'BricolageGrotesque-Regular',
    },
    productItem: {
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
    },
    productName: {
      fontSize: getTypography('body'),
      color: getColor('text'),
      fontFamily: 'BricolageGrotesque-Regular',
    },
    productPrice: {
      fontSize: getTypography('caption'),
      color: getColor('subText'),
      fontFamily: 'BricolageGrotesque-Regular',
    },
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Featured Products Store Demo</Text>

      {/* Controls */}
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

      {/* Status */}
      {batchLoading && <Text style={styles.statusText}>Batch loading in progress...</Text>}
      {batchError && <Text style={styles.errorText}>Batch error: {batchError}</Text>}

      {/* Cache Status */}
      <View style={{ marginVertical: 16 }}>
        <Text style={styles.statusText}>Cache Status:</Text>
        {shopIds.map(shopId => (
          <Text key={shopId} style={styles.statusText}>
            Shop {shopId}: {isCached(shopId) ? 'Cached' : 'Not cached'}
            {isCached(shopId) && isExpired(shopId) ? ' (Expired)' : ''}
            {isLoading(shopId) ? ' (Loading...)' : ''}
            {getError(shopId) ? ` (Error: ${getError(shopId)})` : ''}
          </Text>
        ))}
      </View>

      {/* Results */}
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
