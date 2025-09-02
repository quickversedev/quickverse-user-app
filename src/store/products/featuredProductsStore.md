# Featured Products Store

A robust Zustand store for caching and managing featured products across multiple vendors with intelligent cache management, time-based expiration, and batch fetching capabilities.

## Features

- **Intelligent Caching**: Caches featured products by `shopId` with configurable expiration
- **Batch Fetching**: Fetch featured products for multiple vendors in parallel
- **Cache Management**: Automatic cleanup of expired cache entries
- **Error Handling**: Comprehensive error handling with retry mechanisms
- **Loading States**: Individual loading states per shop
- **Type Safety**: Full TypeScript support
- **Mock Data Integration**: Uses realistic mock data from `assets/mock/products.ts`

## Store Initialization

The store is **lazy-initialized** - it's created when first accessed but doesn't automatically fetch data. Data is fetched on-demand when `getFeaturedProducts()` is called.

## Mock Data

The service currently uses mock data from `src/assets/mock/products.ts` which includes:

- **1200 products** (100 for each of the 12 shops)
- **12 shop IDs**: `4512`, `7890`, `4514`, `4519`, `4520`, `4521`, `4522`, `4523`, `4524`, `4525`, `4526`, `4527`
- **Shop Categories**: Food, Grocery, Pharmacy
- **10 product categories**: scoops, sundaes, cones, family, milkshakes, smoothies, icecream_cakes, frozen_yogurt, ice_pops, gelato
- **Featured products** are identified by the `BestSeller` tag
- **Realistic pricing** with MRP, selling price, and discounts
- **Product details** including brand, category, stock levels, and ratings

### Available Shops:

- `4512` - BCRoy-713206 (Food)
- `7890` - Daily Mart (Grocery)
- `4514` - MediCare Pharmacy (Pharmacy)
- `4519` - **Medi Pharma** (Pharmacy)
- `4520` - **Spice Garden** (Food)
- `4521` - Fresh Basket (Grocery)
- `4522` - Health First (Pharmacy)
- `4523` - Taste of Punjab (Food)
- `4524` - Super Mart (Grocery)
- `4525` - Quick Meds (Pharmacy)
- `4526` - South Indian Delights (Food)
- `4527` - Organic Corner (Grocery)

## Usage

### Basic Usage with Hook

```typescript
import { useFeaturedProducts } from '../hooks';

const MyComponent = () => {
  const { featuredProducts, loading, error, refetch } = useFeaturedProducts({
    shopId: '4512', // Use one of the mock shop IDs
    limit: 5,
    autoFetch: true,
  });

  // The hook automatically handles caching and fetching
  return (
    <View>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage error={error} onRetry={refetch} />}
      {featuredProducts.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </View>
  );
};
```

### Advanced Usage with Store Hook

```typescript
import { useFeaturedProductsStoreHook } from '../hooks';

const VendorList = ({ vendors }) => {
  const { getFeaturedProductsBatch, prefetchForVendors, batchLoading, clearCache } =
    useFeaturedProductsStoreHook();

  // Prefetch all featured products when component mounts
  useEffect(() => {
    prefetchForVendors(vendors);
  }, [vendors, prefetchForVendors]);

  const handleRefresh = async () => {
    const shopIds = vendors.map(v => v.shopId);
    const results = await getFeaturedProductsBatch(shopIds);
    // results: { shopId1: [products], shopId2: [products], ... }
  };

  return (
    <View>
      {batchLoading && <LoadingSpinner />}
      <TouchableOpacity onPress={handleRefresh}>
        <Text>Refresh All</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### Direct Store Usage

```typescript
import useFeaturedProductsStore from '../store/featuredProductsStore';

const MyComponent = () => {
  const store = useFeaturedProductsStore();

  const fetchProducts = async () => {
    try {
      // Single shop fetch
      const products = await store.getFeaturedProducts('4512', 5);

      // Batch fetch
      const batchResults = await store.getFeaturedProductsBatch(['4512', '7890']);

      // Check cache status
      const isCached = store.isCached('4512');
      const isExpired = store.isExpired('4512');

      // Get cached data
      const cachedProducts = store.getCachedProducts('4512');
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  return (
    <TouchableOpacity onPress={fetchProducts}>
      <Text>Fetch Products</Text>
    </TouchableOpacity>
  );
};
```

## API Reference

### Store Methods

#### `getFeaturedProducts(shopId: string, limit?: number): Promise<Product[]>`

Fetches featured products for a single shop. Returns cached data if available and not expired.

#### `getFeaturedProductsBatch(shopIds: string[], limit?: number): Promise<Record<string, Product[]>>`

Fetches featured products for multiple shops in parallel. Only fetches for uncached or expired shops.

#### `getCachedProducts(shopId: string): Product[] | null`

Returns cached products for a shop, or null if not cached or expired.

#### `isCached(shopId: string): boolean`

Checks if a shop's products are cached.

#### `isExpired(shopId: string): boolean`

Checks if a shop's cached products have expired.

#### `getLoadingState(shopId: string): boolean`

Returns loading state for a specific shop.

#### `getErrorState(shopId: string): string | null`

Returns error state for a specific shop.

#### `clearCache(shopId?: string): void`

Clears cache for a specific shop or all shops if no shopId provided.

#### `clearExpiredCache(): void`

Removes all expired cache entries.

### Hook Methods

#### `useFeaturedProducts(params)`

- `shopId`: Required shop ID (use `4512` or `7890` for mock data)
- `limit`: Number of products to fetch (default: 5)
- `autoFetch`: Whether to fetch automatically (default: true)

Returns: `{ featuredProducts, loading, error, refetch, hasMore }`

#### `useFeaturedProductsStoreHook(params)`

- `autoClearExpired`: Auto-clear expired cache (default: true)
- `clearExpiredInterval`: Interval for clearing expired cache (default: 5 minutes)

Returns: All store methods plus `prefetchForVendors` utility method.

## Cache Configuration

### Default Settings

- **Cache Expiry**: 5 minutes
- **Default Limit**: 5 products per shop
- **Auto-cleanup**: Every 5 minutes

### Custom Configuration

```typescript
// In your store initialization
const useFeaturedProductsStore = create<FeaturedProductsStore>((set, get) => ({
  // ... other config
  cacheExpiryMs: 10 * 60 * 1000, // 10 minutes
}));
```

## Performance Benefits

1. **Reduced API Calls**: Products are cached and reused across components
2. **Parallel Fetching**: Batch operations fetch multiple shops simultaneously
3. **Smart Caching**: Only fetches uncached or expired data
4. **Memory Management**: Automatic cleanup of expired entries
5. **Network Optimization**: Prevents duplicate requests for the same data

## Best Practices

### 1. Prefetch Data

```typescript
// Prefetch when you know which vendors will be displayed
useEffect(() => {
  prefetchForVendors(vendors);
}, [vendors]);
```

### 2. Handle Loading States

```typescript
const { isLoading, getError } = useFeaturedProductsStoreHook();

// Show loading for specific shop
if (isLoading(shopId)) {
  return <LoadingSpinner />;
}

// Handle errors
const error = getError(shopId);
if (error) {
  return <ErrorMessage error={error} />;
}
```

### 3. Clear Cache When Needed

```typescript
// Clear specific shop cache after updates
const { clearCache } = useFeaturedProductsStoreHook();

const handleProductUpdate = () => {
  // Update product logic...
  clearCache(shopId); // Clear cache for this shop
};
```

### 4. Monitor Cache Status

```typescript
const { isCached, isExpired } = useFeaturedProductsStoreHook();

// Check cache status before operations
if (!isCached(shopId) || isExpired(shopId)) {
  // Fetch fresh data
  await getFeaturedProducts(shopId);
}
```

## Migration from Old Implementation

The new store is backward compatible. Your existing `useFeaturedProducts` hook will continue to work but now benefits from caching:

```typescript
// Old implementation (still works)
const { featuredProducts, loading, error } = useFeaturedProducts({
  shopId: '4512',
  limit: 5,
  autoFetch: true,
});

// New implementation (recommended for new code)
const { getFeaturedProducts, getCachedProducts } = useFeaturedProductsStoreHook();
```

## Testing

Use the `FeaturedProductsTest` component to test the store functionality:

```typescript
import FeaturedProductsTest from '../components/common/FeaturedProductsTest';

// In your test screen
<FeaturedProductsTest shopIds={['4512', '7890']} />;
```

## Troubleshooting

### Common Issues

1. **Cache not working**: Check if `cacheExpiryMs` is set correctly
2. **Memory leaks**: Ensure `clearExpiredCache` is called periodically
3. **Stale data**: Use `clearCache()` to force fresh data
4. **Batch fetch failures**: Check network connectivity and API responses
5. **No products returned**: Verify shop ID matches mock data (`4512` or `7890`)

### Debug Mode

Enable debug logging by adding console logs in the store:

```typescript
getFeaturedProducts: async (shopId: string, limit: number = DEFAULT_LIMIT) => {
  //console.log(`Fetching featured products for shop: ${shopId}`);
  // ... rest of implementation
};
```
