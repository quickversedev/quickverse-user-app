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
    { id: 'cut-packed', name: 'Cut & Packed' },
    { id: 'fresh-fruits', name: 'Fresh Fruits' },
    { id: 'fresh-vegetables', name: 'Fresh Vegetables' },
  ],
  'Dairy, Bakery & Eggs': [
    { id: 'bread-bakery-buns', name: 'Bread, Bakery & Buns' },
    { id: 'eggs', name: 'Eggs' },
    { id: 'milk-dairy', name: 'Milk & Dairy' },
  ],
  'Crisp & Namkeens': [
    { id: 'chips-wafers', name: 'Chips & Wafers' },
    { id: 'healthy-snacks', name: 'Healthy Snacks' },
    { id: 'namkeens-bhujia-mixtures', name: 'Namkeens, Bhujia & Mixtures' },
  ],
  Biscuits: [
    { id: 'biscuits-cookies', name: 'Biscuits & Cookies' },
    { id: 'glucose-digestives', name: 'Glucose & Digestives' },
  ],
  'Cold Drinks & Juices': [
    { id: 'cold-drinks-soda', name: 'Cold Drinks & Soda' },
    { id: 'fruit-juices', name: 'Fruit Juices' },
    { id: 'milkshakes', name: 'Milkshakes' },
    { id: 'water-flavors', name: 'Water & Flavors' },
  ],
  'Chocolates & Icecreams': [
    { id: 'chocolates-bars', name: 'Chocolates & Bars' },
    { id: 'ice-creams', name: 'Ice Creams' },
  ],
  'Atta, Rice & Dal': [
    { id: 'basmati-non-basmati-rice', name: 'Basmati & Non-Basmati Rice' },
    { id: 'poha-suji', name: 'Poha & Suji' },
    { id: 'pulses-lentils', name: 'Pulses & Lentils' },
    { id: 'wheat-multigrain-atta', name: 'Wheat & Multigrain Atta' },
  ],
  'Dry Fruits, Masala & Oil': [
    { id: 'cooking-pastes-chutneys', name: 'Cooking Pastes & Chutneys' },
    { id: 'ghee-edible-oils', name: 'Ghee & Edible Oils' },
    { id: 'spices-masalas', name: 'Spices & Masalas' },
  ],
  'Personal Care': [
    { id: 'bath-body', name: 'Bath & Body' },
    { id: 'hair-care', name: 'Hair Care' },
    { id: 'mens-grooming', name: 'Men’s Grooming' },
    { id: 'oral-care', name: 'Oral Care' },
    { id: 'personal-hygiene', name: 'Personal Hygiene' },
    { id: 'skin-care', name: 'Skin Care' },
    { id: 'womens-hygiene', name: 'Women’s Hygiene' },
  ],
  'Instant Mixes': [{ id: 'noodles-pasta-other', name: 'Noodles, Pasta, & Other' }],
  'Sauces & Spreads': [
    { id: 'mayonnaise-spreads', name: 'Mayonnaise & Spreads' },
    { id: 'spreads-jams', name: 'Spreads & Jams' },
    { id: 'tomato-ketchup-sauces', name: 'Tomato Ketchup & Sauces' },
  ],
  'Tea & Coffee': [{ id: 'tea-coffee', name: 'Tea & Coffee' }],
  'Cleaning Essentials': [
    { id: 'bathroom-surface-cleaners', name: 'Bathroom & Surface Cleaners' },
    { id: 'cleaning-accessories', name: 'Cleaning Accessories' },
    { id: 'dishwashing', name: 'Dishwashing' },
    { id: 'laundry-care', name: 'Laundry Care' },
  ],
  'Pharma & Wellness': [
    { id: 'first-aid-health', name: 'First Aid & Health' },
    { id: 'gym-supplements', name: 'Gym Sumplements' },
    { id: 'health-supplements', name: 'Health Supplements' },
    { id: 'sexual-wellness', name: 'Sexual Wellness' },
  ],
  Stationery: [{ id: 'school-supplies', name: 'School Supplies' }],
  'Home Furnishing Décor': [
    { id: 'air-fresheners', name: 'Air Fresheners' },
    { id: 'home-fragrance', name: 'Home Fragrance' },
    { id: 'storage-organization', name: 'Storage & Organization' },
  ],
  Electronics: [{ id: 'mobile-accessories', name: 'Mobile Accessories' }],
  'Pan Corner': [{ id: 'tobaco-smoking', name: 'Tobaco & Smoking' }],
};

// API Integration
export const API_STORE_ID = '68246';

import productsService from '../services/productsService';

export const fetchCollectionsFromApi = async (
  storeId: string = API_STORE_ID
): Promise<CollectionSection[]> => {
  try {
    // Fetch all categories from the API
    const apiCategories = await productsService.fetchCategories(storeId);

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
        const apiCat = apiCategories.find(
          c =>
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
        let collectionImage =
          'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Slice-3_9.png'; // Fallback
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

    return [
      {
        title: 'Shop by Category',
        collections: collections,
      },
    ];
  } catch (error) {
    console.warn('[CollectionsGrid] fetch failed:', error);
    return [];
  }
};

// Keep existing exports for compatibility if needed elsewhere, but they are effectively replaced by dynamic fetching
// We can return empty or the static data as fallback
export const getCollectionsBySection = (): CollectionSection[] => {
  // This function is still syncing, but the UI should prefer the async fetch
  // For now return empty or static data as fallback
  const sectionOrder = [
    'Grocery & Kitchen',
    'Snacks & Drinks',
    'Beauty & Personal Care',
    'Home & Cleaning',
  ];
  const sectionMap = new Map<string, Collection[]>();

  // ... (Original static logic could remain as offline fallback if desired)
  return [];
};
