import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import useFeaturedProductsStoreHook from '../../../hooks/useFeaturedProductsStore';
import { useTheme } from '../../../theme/ThemeContext';
import { Product } from '../../../types/product';
import { ThemeText } from '../theme/ThemeText';

interface FeaturedProductsDemoProps {
  shopIds: string[];
}

const FeaturedProductsDemo: React.FC<FeaturedProductsDemoProps> = ({ shopIds }) => {
  const { getColor, getTypography, theme } = useTheme();
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
      fontFamily: theme.typography.fontFamily,
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
      fontFamily: theme.typography.fontFamily,
    },
    statusText: {
      fontSize: getTypography('caption'),
      color: getColor('subText'),
      marginVertical: 4,
      fontFamily: theme.typography.fontFamily,
    },
    errorText: {
      fontSize: getTypography('caption'),
      color: getColor('error'),
      marginVertical: 4,
      fontFamily: theme.typography.fontFamily,
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
      fontFamily: theme.typography.fontFamily,
    },
    productItem: {
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
    },
    productName: {
      fontSize: getTypography('body'),
      color: getColor('text'),
      fontFamily: theme.typography.fontFamily,
    },
    productPrice: {
      fontSize: getTypography('caption'),
      color: getColor('subText'),
      fontFamily: theme.typography.fontFamily,
    },
  });

  return (
    <ScrollView style={styles.container}>
      <ThemeText variant="h1" color={getColor('text')} style={styles.title}>
        Featured Products Store Demo
      </ThemeText>

      {/* Controls */}
      <TouchableOpacity style={styles.button} onPress={handleBatchFetch}>
        <ThemeText variant="body" color={getColor('white')} style={styles.buttonText}>
          {batchLoading ? 'Fetching...' : 'Fetch All Featured Products'}
        </ThemeText>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleClearCache}>
        <ThemeText variant="body" color={getColor('white')} style={styles.buttonText}>
          Clear All Cache
        </ThemeText>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={clearExpiredCache}>
        <ThemeText variant="body" color={getColor('white')} style={styles.buttonText}>
          Clear Expired Cache
        </ThemeText>
      </TouchableOpacity>

      {/* Status */}
      {batchLoading && (
        <ThemeText variant="caption" color={getColor('subText')} style={styles.statusText}>
          Batch loading in progress...
        </ThemeText>
      )}
      {batchError && (
        <ThemeText variant="caption" color={getColor('error')} style={styles.errorText}>
          Batch error: {batchError}
        </ThemeText>
      )}

      {/* Cache Status */}
      <View style={{ marginVertical: 16 }}>
        <ThemeText variant="body" color={getColor('text')} style={styles.statusText}>
          Cache Status:
        </ThemeText>
        {shopIds.map(shopId => (
          <ThemeText
            key={shopId}
            variant="caption"
            color={getColor('subText')}
            style={styles.statusText}
          >
            Shop {shopId}: {isCached(shopId) ? 'Cached' : 'Not cached'}
            {isCached(shopId) && isExpired(shopId) ? ' (Expired)' : ''}
            {isLoading(shopId) ? ' (Loading...)' : ''}
            {getError(shopId) ? ` (Error: ${getError(shopId)})` : ''}
          </ThemeText>
        ))}
      </View>

      {/* Results */}
      {Object.keys(results).length > 0 && (
        <View>
          <ThemeText variant="h2" color={getColor('text')} style={styles.title}>
            Results:
          </ThemeText>
          {Object.entries(results).map(([shopId, products]) => (
            <View key={shopId} style={styles.shopContainer}>
              <ThemeText variant="subtitle" color={getColor('text')} style={styles.shopTitle}>
                Shop {shopId} ({products.length} products)
              </ThemeText>
              {products.map((product, index) => (
                <View key={index} style={styles.productItem}>
                  <ThemeText variant="body" color={getColor('text')} style={styles.productName}>
                    {product.name}
                  </ThemeText>
                  <ThemeText
                    variant="caption"
                    color={getColor('subText')}
                    style={styles.productPrice}
                  >
                    ₹{product.price}
                  </ThemeText>
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
