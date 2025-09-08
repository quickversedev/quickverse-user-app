// Simple test to verify featuredProductsStore functionality
import useFeaturedProductsStore from './featuredProductsStore';

// Test the store
async function testFeaturedProductsStore() {
  try {
    //console.log('Testing featuredProductsStore...');

    const store = useFeaturedProductsStore.getState();

    // Test fetching featured products for a single shop
    const featuredProducts = await store.getFeaturedProducts('4512', 5);
    //console.log('Featured products fetched:', featuredProducts.length);

    // Test batch fetching
    const batchResults = await store.getFeaturedProductsBatch(['4512', '4513'], 3);
    //console.log('Batch results:', Object.keys(batchResults).length);

    // Test cache functionality
    const isCached = store.isCached('4512');
    //console.log('Is cached:', isCached);

    // Test cached products retrieval
    const cachedProducts = store.getCachedProducts('4512');
    //console.log('Cached products:', cachedProducts?.length || 0);

    //console.log('All tests passed!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Uncomment to run test
// testFeaturedProductsStore();
