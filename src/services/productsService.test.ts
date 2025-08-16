// Simple test to verify productsService functionality
import productsService from './productsService';

// Test the service
async function testProductsService() {
  try {
    console.log('Testing productsService...');

    // Test fetching products
    const productsResponse = await productsService.fetchProducts({
      shopId: '4512',
      offset: 0,
      limit: 10,
    });
    console.log('Products fetched:', productsResponse.products.length);

    // Test fetching categories
    const categories = await productsService.fetchCategories('4512');
    console.log('Categories fetched:', categories.length);

    // Test search
    const searchResponse = await productsService.searchProducts({
      shopId: '4512',
      searchTerm: 'milk',
      limit: 5,
    });
    console.log('Search results:', searchResponse.products.length);

    // Test best sellers
    const bestSellersResponse = await productsService.getBestSellers({
      shopId: '4512',
      limit: 5,
    });
    console.log('Best sellers:', bestSellersResponse.products.length);

    console.log('All tests passed!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Uncomment to run test
// testProductsService();
