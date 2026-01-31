export interface CollectionCategory {
  id: string;
  name: string;
}

export interface Collection {
  id: string;
  name: string;
  icon: string;
  image: string;
  section: string;
  categories: CollectionCategory[];
  productIds: string[];
}

export interface CollectionSection {
  title: string;
  collections: Collection[];
}

// Vendor ID for collections (single vendor) - Replace with actual vendor ID
export const COLLECTIONS_VENDOR_ID = 'PLACEHOLDER_VENDOR_ID';

// Check if vendor ID is configured (not a placeholder)
export const isCollectionsVendorConfigured = (): boolean => {
  const vendorId: string = COLLECTIONS_VENDOR_ID;
  return vendorId !== 'PLACEHOLDER_VENDOR_ID' && vendorId.length > 0;
};
export const COLLECTION_CATEGORIES_MAPPING: { [key: string]: CollectionCategory[] } = {
  'Vegetables & Fruits': [
    { id: 'fresh-vegetables', name: 'Fresh Vegetables' },
    { id: 'fresh-fruits', name: 'Fresh Fruits' },
    { id: 'exotic-vegetables', name: 'Exotic Vegetables' },
    { id: 'exotic-fruits', name: 'Exotic Fruits' },
    { id: 'cut-packed', name: 'Cut & Packed' },
  ],
  'Dairy, Bakery & Eggs': [
    { id: 'milk', name: 'Milk' },
    { id: 'curd-butter-cheese', name: 'Curd, Butter & Cheese' },
    { id: 'paneer-tofu', name: 'Paneer & Tofu' },
    { id: 'eggs', name: 'Eggs' },
    { id: 'bread-buns', name: 'Bread & Buns' },
    { id: 'bakery-snacks', name: 'Bakery Snacks' },
  ],
  'Crisp & Namkeens': [
    { id: 'chips-wafers', name: 'Chips & Wafers' },
    { id: 'namkeens-mixtures', name: 'Namkeens & Mixtures' },
    { id: 'healthy-snacks', name: 'Healthy Snacks' },
    { id: 'bhujia-sev', name: 'Bhujia & Sev' },
  ],
  'Cold Drinks & Juices': [
    { id: 'aerated-drinks', name: 'Aerated Drinks' },
    { id: 'cold-drinks-soda', name: 'Cold Drinks & Soda' },
    { id: 'fruit-juices', name: 'Fruit Juices' },
    { id: 'energy-drinks', name: 'Energy Drinks' },
    { id: 'flavored-water', name: 'Flavored Water' },
    { id: 'tea-coffee', name: 'Tea & Coffee' },
    { id: 'milkshakes', name: 'Milkshakes' },
  ],
  'Instant Mixes': [
    { id: 'noodles', name: 'Noodles' },
    { id: 'pasta-ramen-other', name: 'Pasta, Ramen & Other' },
    { id: 'soups', name: 'Soups' },
  ],
  'Biscuits': [
    { id: 'cream-biscuits', name: 'Cream Biscuits' },
    { id: 'cookies', name: 'Cookies' },
    { id: 'glucose-marie', name: 'Glucose & Marie' },
    { id: 'digestive-health', name: 'Digestive & Health' },
    { id: 'salted-crackers', name: 'Salted Crackers' },
  ],
  'Chocolates & Icecreams': [
    { id: 'chocolates-bars', name: 'Chocolates & Bars' },
    { id: 'ice-cream-cups', name: 'Ice Cream Cups' },
    { id: 'frozen-desserts', name: 'Frozen Desserts' },
  ],
  'Atta, Rice & Dal': [
    { id: 'wheat-multigrain-atta', name: 'Wheat & Multigrain Atta' },
    { id: 'basmati-non-basmati-rice', name: 'Basmati & Non-Basmati Rice' },
    { id: 'pulses-lentils', name: 'Pulses & Lentils' },
    { id: 'poha-suji', name: 'Poha & Suji' },
  ],
  'Dry Fruits, Masala & Oil': [
    { id: 'edible-oils', name: 'Edible Oils' },
    { id: 'ghee-vanaspati', name: 'Ghee & Vanaspati' },
    { id: 'whole-spices', name: 'Whole Spices' },
    { id: 'ground-spices', name: 'Ground Spices' },
    { id: 'dry-fruits-nuts', name: 'Dry Fruits & Nuts' },
    { id: 'masala-mixes', name: 'Masala Mixes' },
  ],
  'Sauces & Spreads': [
    { id: 'tomato-ketchup-sauces', name: 'Tomato Ketchup & Sauces' },
    { id: 'mayonnaise-dressings', name: 'Mayonnaise & Dressings' },
    { id: 'spreads-jams', name: 'Spreads & Jams' },
    { id: 'dips-chutneys', name: 'Dips & Chutneys' },
    { id: 'cooking-pastes', name: 'Cooking Pastes' },
  ],
  'Pharma & Wellness': [
    { id: 'otc-medicines', name: 'OTC Medicines' },
    { id: 'health-supplements', name: 'Health Supplements' },
    { id: 'first-aid-medical-devices', name: 'First Aid & Medical Devices' },
    { id: 'personal-hygiene', name: 'Personal Hygiene' },
    { id: 'immunity-boosters', name: 'Immunity Boosters' },
  ],
  'Cleaning Essentials': [
    { id: 'laundry-care', name: 'Laundry Care' },
    { id: 'dishwashing', name: 'Dishwashing' },
    { id: 'floor-surface-cleaners', name: 'Floor & Surface Cleaners' },
    { id: 'bathroom-toilet-cleaners', name: 'Bathroom & Toilet Cleaners' },
    { id: 'air-fresheners', name: 'Air Fresheners' },
  ],
  'Home Furnishing Décor': [
    { id: 'bed-bath', name: 'Bed & Bath' },
    { id: 'storage-organization', name: 'Storage & Organization' },
    { id: 'decor-lighting', name: 'Décor & Lighting' },
    { id: 'curtains-mats', name: 'Curtains & Mats' },
    { id: 'home-fragrance', name: 'Home Fragrance' },
  ],
  'Personal Care': [
    { id: 'hair-care', name: 'Hair Care' },
    { id: 'skin-care', name: 'Skin Care' },
    { id: 'oral-care', name: 'Oral Care' },
    { id: 'bath-body', name: 'Bath & Body' },
    { id: 'mens-grooming', name: "Men's Grooming" },
    { id: 'womens-hygiene', name: "Women's Hygiene" },
  ],
  'Kitchen & Dining': [
    { id: 'cookware', name: 'Cookware' },
    { id: 'serveware', name: 'Serveware' },
    { id: 'storage-containers', name: 'Storage Containers' },
    { id: 'tableware', name: 'Tableware' },
    { id: 'cleaning-accessories', name: 'Cleaning Accessories' },
  ],
  'Pan Corner': [
    { id: 'ready-to-eat-paan', name: 'Ready-to-Eat Paan' },
    { id: 'cigarettes-bidi', name: 'Cigarettes & Bidi' },
    { id: 'zarda-tobacco', name: 'Zarda & Chewing Tobacco' },
    { id: 'rolling-paper', name: 'Rolling Paper & Filters' },
    { id: 'e-cigarettes', name: 'E-Cigarettes & Vapes' },
    { id: 'mouth-fresheners', name: 'Mouth Fresheners' },
    { id: 'lighters', name: 'Lighters & More' },
    { id: 'matchboxes', name: 'Matchboxes' },
    { id: 'ashtrays', name: 'Ashtrays' },
  ],
  'Electronics': [
    { id: 'charging-cables', name: 'Charging Cables' },
    { id: 'power-banks', name: 'Power Banks' },
    { id: 'earphones', name: 'Earphones' },
  ],
};

// API Integration
export const API_STORE_ID = '68246';
const API_BASE_URL = `https://api.smartbiz.in/stores/${API_STORE_ID}`;

import productsService from '../services/productsService';

export const fetchCollectionsFromApi = async (storeId: string = API_STORE_ID): Promise<CollectionSection[]> => {
  try {
    const baseUrl = `https://api.smartbiz.in/stores/${storeId}`;
    console.log(`[CollectionsData] Fetching categories from: ${baseUrl}/category`);
    // Fetch all categories from the API
    const apiCategories = await productsService.fetchCategories(storeId);
    console.log(`[CollectionsData] Fetched ${apiCategories.length} categories`);
    console.log('[CollectionsData] API Response Categories (Sample):', JSON.stringify(apiCategories.slice(0, 5), null, 2));

    const collections: Collection[] = [];

    // Iterate through our manual mapping to construct collections
    Object.entries(COLLECTION_CATEGORIES_MAPPING).forEach(([collectionName, mappedCategories]) => {
      // Find matching API categories for this collection
      const collectionCategories: CollectionCategory[] = [];
      const categoryIds = new Set(mappedCategories.map(mc => mc.id));

      // 1. Add categories from the map that exist in the API (to get images/counts)
      // We also fallback to the map's name if API name differs slightly, but prefer API data
      mappedCategories.forEach(mappedCat => {
        // Find by ID match OR Name match (case-insensitive) OR fuzzy match
        const apiCat = apiCategories.find(c =>
          c.id === mappedCat.id ||
          c.name.toLowerCase() === mappedCat.name.toLowerCase() ||
          c.id.toLowerCase() === mappedCat.id.toLowerCase() ||
          // Fuzzy match: if mapped name is contained in api name or vice versa (be careful with this)
          c.name.toLowerCase().includes(mappedCat.name.toLowerCase())
        );

        if (apiCat) {
          // Check if we already added this category to avoid duplicates
          if (!collectionCategories.some(existing => existing.id === apiCat.id)) {
            collectionCategories.push({
              id: apiCat.id, // Use the REAL API ID
              name: apiCat.name,
            });
          }
        } else {
          // For debugging: Log which ones we couldn't match
          // console.log(`[CollectionsData] Could not map '${mappedCat.name}' to a real API category.`);
        }
      });

      // If no categories found for this collection, skip it (or add empty if desired, but better to skip)
      if (collectionCategories.length > 0) {
        // 2. Determine an image for the collection (use first category's image from API if available)
        let collectionImage = 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Slice-3_9.png'; // Fallback
        const firstCatWithImage = collectionCategories.find(cat => {
          const apiCat = apiCategories.find(c => c.id === cat.id);
          return apiCat && apiCat.imageURLs && apiCat.imageURLs.length > 0;
        });

        if (firstCatWithImage) {
          const apiCat = apiCategories.find(c => c.id === firstCatWithImage.id);
          if (apiCat && apiCat.imageURLs) {
            collectionImage = apiCat.imageURLs[0];
          }
        }

        // 3. Create the Collection object
        const collectionId = collectionName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        collections.push({
          id: collectionId,
          name: collectionName,
          icon: 'shape',
          image: collectionImage,
          section: 'Shop by Category',
          categories: collectionCategories,
          productIds: [],
        });
      }
    });

    // Sort collections by name or keep mapped order? Mapped order is better.

    console.log(`[CollectionsData] Generated ${collections.length} synthetic collections with real IDs`);

    return [{
      title: 'Shop by Category',
      collections: collections,
    }];
  } catch (error) {
    console.error('Error fetching/mapping collections:', error);
    return [];
  }
};

// Keep existing exports for compatibility if needed elsewhere, but they are effectively replaced by dynamic fetching
// We can return empty or the static data as fallback
export const getCollectionsBySection = (): CollectionSection[] => {
  // This function is still syncing, but the UI should prefer the async fetch
  // For now return empty or static data as fallback
  const sectionOrder = ['Grocery & Kitchen', 'Snacks & Drinks', 'Beauty & Personal Care', 'Home & Cleaning'];
  const sectionMap = new Map<string, Collection[]>();

  // ... (Original static logic could remain as offline fallback if desired)
  return [];
};

