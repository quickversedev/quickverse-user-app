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

export const COLLECTIONS_DATA: Collection[] = [
  // Grocery & Kitchen
  {
    id: 'vegetables-fruits',
    name: 'Vegetables & Fruits',
    icon: 'food-apple',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Slice-3_9.png',
    section: 'Grocery & Kitchen',
    categories: [
      { id: 'fresh-vegetables', name: 'Fresh Vegetables' },
      { id: 'fresh-fruits', name: 'Fresh Fruits' },
      { id: 'exotic-vegetables', name: 'Exotic Vegetables' },
      { id: 'exotic-fruits', name: 'Exotic Fruits' },
      { id: 'cut-packed', name: 'Cut & Packed' },
    ],
  },
  {
    id: 'atta-rice-dal',
    name: 'Atta, Rice & Dal',
    icon: 'grain',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Slice-4_9.png',
    section: 'Grocery & Kitchen',
    categories: [
      { id: 'wheat-multigrain-atta', name: 'Wheat & Multigrain Atta' },
      { id: 'basmati-non-basmati-rice', name: 'Basmati & Non-Basmati Rice' },
      { id: 'pulses-lentils', name: 'Pulses & Lentils' },
      { id: 'poha-suji', name: 'Poha & Suji' },
    ],
  },
  {
    id: 'dry-fruits-masala-oil',
    name: 'Oil, Ghee & Masala',
    icon: 'peanut',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Slice-5_4.png',
    section: 'Grocery & Kitchen',
    categories: [
      { id: 'edible-oils', name: 'Edible Oils' },
      { id: 'ghee-vanaspati', name: 'Ghee & Vanaspati' },
      { id: 'whole-spices', name: 'Whole Spices' },
      { id: 'ground-spices', name: 'Ground Spices' },
      { id: 'dry-fruits-nuts', name: 'Dry Fruits & Nuts' },
      { id: 'masala-mixes', name: 'Masala Mixes' },
    ],
  },
  {
    id: 'dairy-bakery-eggs',
    name: 'Dairy, Bread & Eggs',
    icon: 'egg',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Slice-6_5.png',
    section: 'Grocery & Kitchen',
    categories: [
      { id: 'milk', name: 'Milk' },
      { id: 'curd-butter-cheese', name: 'Curd, Butter & Cheese' },
      { id: 'paneer-tofu', name: 'Paneer & Tofu' },
      { id: 'eggs', name: 'Eggs' },
      { id: 'bread-buns', name: 'Bread & Buns' },
      { id: 'bakery-snacks', name: 'Bakery Snacks' },
    ],
  },
  {
    id: 'biscuits',
    name: 'Bakery & Biscuits',
    icon: 'cookie',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-12/Slice-1_10.png',
    section: 'Grocery & Kitchen',
    categories: [
      { id: 'cream-biscuits', name: 'Cream Biscuits' },
      { id: 'cookies', name: 'Cookies' },
      { id: 'glucose-marie', name: 'Glucose & Marie' },
      { id: 'digestive-health', name: 'Digestive & Health' },
      { id: 'salted-crackers', name: 'Salted Crackers' },
    ],
  },
  {
    id: 'dry-fruits-cereals',
    name: 'Dry Fruits & Cereals',
    icon: 'grain',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-12/Slice-2_5.png',
    section: 'Grocery & Kitchen',
    categories: [
      { id: 'dry-fruits-nuts', name: 'Dry Fruits & Nuts' },
      { id: 'breakfast-cereals', name: 'Breakfast Cereals' },
      { id: 'oats-muesli', name: 'Oats & Muesli' },
    ],
  },
  {
    id: 'chicken-meat-fish',
    name: 'Chicken, Meat & Fish',
    icon: 'food-drumstick',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-12/Slice-3_5.png',
    section: 'Grocery & Kitchen',
    categories: [
      { id: 'chicken', name: 'Chicken' },
      { id: 'mutton', name: 'Mutton' },
      { id: 'fish-seafood', name: 'Fish & Seafood' },
    ],
  },
  {
    id: 'kitchen-appliances',
    name: 'Kitchenware & Appliances',
    icon: 'silverware-fork-knife',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-12/Slice-4_5.png',
    section: 'Grocery & Kitchen',
    categories: [
      { id: 'cookware', name: 'Cookware' },
      { id: 'serveware', name: 'Serveware' },
      { id: 'storage-containers', name: 'Storage Containers' },
      { id: 'tableware', name: 'Tableware' },
      { id: 'cleaning-accessories', name: 'Cleaning Accessories' },
    ],
  },

  // Snacks & Drinks
  {
    id: 'crisp-namkeens',
    name: 'Chips & Namkeen',
    icon: 'food-croissant',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Slice-7_3.png',
    section: 'Snacks & Drinks',
    categories: [
      { id: 'chips-wafers', name: 'Chips & Wafers' },
      { id: 'namkeens-mixtures', name: 'Namkeens & Mixtures' },
      { id: 'healthy-snacks', name: 'Healthy Snacks' },
      { id: 'bhujia-sev', name: 'Bhujia & Sev' },
    ],
  },
  {
    id: 'chocolates-sweets',
    name: 'Sweets & Chocolates',
    icon: 'candy',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-12/Slice-5_3.png',
    section: 'Snacks & Drinks',
    categories: [
      { id: 'chocolates-bars', name: 'Chocolates & Bars' },
      { id: 'indian-sweets', name: 'Indian Sweets' },
      { id: 'candies', name: 'Candies' },
    ],
  },
  {
    id: 'cold-drinks-juices',
    name: 'Drinks & Juices',
    icon: 'cup',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-12/Slice-6_3.png',
    section: 'Snacks & Drinks',
    categories: [
      { id: 'aerated-drinks', name: 'Aerated Drinks' },
      { id: 'cold-drinks-soda', name: 'Cold Drinks & Soda' },
      { id: 'fruit-juices', name: 'Fruit Juices' },
      { id: 'energy-drinks', name: 'Energy Drinks' },
      { id: 'flavored-water', name: 'Flavored Water' },
    ],
  },
  {
    id: 'tea-coffee-milk',
    name: 'Tea, Coffee & Milk Drinks',
    icon: 'coffee',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-12/Slice-7_3.png',
    section: 'Snacks & Drinks',
    categories: [
      { id: 'tea-coffee', name: 'Tea & Coffee' },
      { id: 'milkshakes', name: 'Milkshakes' },
      { id: 'health-drinks', name: 'Health Drinks' },
    ],
  },
  {
    id: 'instant-mixes',
    name: 'Instant Food',
    icon: 'noodles',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-12/Slice-8_3.png',
    section: 'Snacks & Drinks',
    categories: [
      { id: 'noodles', name: 'Noodles' },
      { id: 'pasta-ramen-other', name: 'Pasta Ramen & Other' },
      { id: 'soups', name: 'Soups' },
    ],
  },
  {
    id: 'sauces-spreads',
    name: 'Sauces & Spreads',
    icon: 'bottle-soda-classic',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-12/Slice-9_4.png',
    section: 'Snacks & Drinks',
    categories: [
      { id: 'tomato-ketchup-sauces', name: 'Tomato Ketchup & Sauces' },
      { id: 'mayonnaise-dressings', name: 'Mayonnaise & Dressings' },
      { id: 'spreads-jams', name: 'Spreads & Jams' },
      { id: 'dips-chutneys', name: 'Dips & Chutneys' },
      { id: 'cooking-pastes', name: 'Cooking Pastes' },
    ],
  },
  {
    id: 'pan-corner',
    name: 'Paan Corner',
    icon: 'leaf',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-12/Slice-10_2.png',
    section: 'Snacks & Drinks',
    categories: [
      { id: 'ready-to-eat-paan', name: 'Ready-to-Eat Paan' },
      { id: 'mouth-fresheners', name: 'Mouth Fresheners' },
      { id: 'supari', name: 'Supari' },
    ],
  },
  {
    id: 'ice-creams',
    name: 'Ice Creams & More',
    icon: 'ice-cream',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-12/Slice-11.png',
    section: 'Snacks & Drinks',
    categories: [
      { id: 'ice-cream-cups', name: 'Ice Cream Cups' },
      { id: 'frozen-desserts', name: 'Frozen Desserts' },
      { id: 'ice-cream-tubs', name: 'Ice Cream Tubs' },
    ],
  },

  // Beauty & Personal Care
  {
    id: 'personal-care',
    name: 'Bath & Body',
    icon: 'face-man-shimmer',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-12/Slice-12.png',
    section: 'Beauty & Personal Care',
    categories: [
      { id: 'bath-body', name: 'Bath & Body' },
      { id: 'skin-care', name: 'Skin Care' },
    ],
  },
  {
    id: 'hair-care',
    name: 'Hair Care',
    icon: 'hair-dryer',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-12/Slice-13.png',
    section: 'Beauty & Personal Care',
    categories: [
      { id: 'hair-care', name: 'Hair Care' },
      { id: 'hair-oil', name: 'Hair Oil' },
      { id: 'shampoo-conditioner', name: 'Shampoo & Conditioner' },
    ],
  },
  {
    id: 'oral-care',
    name: 'Oral Care',
    icon: 'toothbrush',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-12/Slice-14.png',
    section: 'Beauty & Personal Care',
    categories: [
      { id: 'oral-care', name: 'Oral Care' },
      { id: 'toothpaste', name: 'Toothpaste' },
      { id: 'mouthwash', name: 'Mouthwash' },
    ],
  },
  {
    id: 'mens-grooming',
    name: "Men's Grooming",
    icon: 'face-man',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-12/Slice-15.png',
    section: 'Beauty & Personal Care',
    categories: [
      { id: 'mens-grooming', name: "Men's Grooming" },
      { id: 'shaving', name: 'Shaving' },
      { id: 'deodorants', name: 'Deodorants' },
    ],
  },

  // Home & Cleaning
  {
    id: 'cleaning-essentials',
    name: 'Cleaning Essentials',
    icon: 'spray-bottle',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-12/Slice-16.png',
    section: 'Home & Cleaning',
    categories: [
      { id: 'laundry-care', name: 'Laundry Care' },
      { id: 'dishwashing', name: 'Dishwashing' },
      { id: 'floor-surface-cleaners', name: 'Floor & Surface Cleaners' },
      { id: 'bathroom-toilet-cleaners', name: 'Bathroom & Toilet Cleaners' },
      { id: 'air-fresheners', name: 'Air Fresheners' },
    ],
  },
  {
    id: 'home-furnishing-decor',
    name: 'Home & Office',
    icon: 'sofa',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-12/Slice-17.png',
    section: 'Home & Cleaning',
    categories: [
      { id: 'bed-bath', name: 'Bed & Bath' },
      { id: 'storage-organization', name: 'Storage & Organization' },
      { id: 'decor-lighting', name: 'Decor & Lighting' },
      { id: 'curtains-mats', name: 'Curtains & Mats' },
      { id: 'home-fragrance', name: 'Home Fragrance' },
    ],
  },
  {
    id: 'pharma-wellness',
    name: 'Pharma & Wellness',
    icon: 'pill',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-12/Slice-18.png',
    section: 'Home & Cleaning',
    categories: [
      { id: 'otc-medicines', name: 'OTC Medicines' },
      { id: 'health-supplements', name: 'Health Supplements' },
      { id: 'first-aid-medical-devices', name: 'First Aid & Medical Devices' },
      { id: 'personal-hygiene', name: 'Personal Hygiene' },
      { id: 'immunity-boosters', name: 'Immunity Boosters' },
    ],
  },
  {
    id: 'electronics',
    name: 'Electronics',
    icon: 'cellphone-charging',
    image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-12/Slice-19.png',
    section: 'Home & Cleaning',
    categories: [
      { id: 'charging-cables', name: 'Charging Cables' },
      { id: 'power-banks', name: 'Power Banks' },
      { id: 'earphones', name: 'Earphones' },
    ],
  },
];

// Get collections grouped by section
export const getCollectionsBySection = (): CollectionSection[] => {
  const sectionOrder = ['Grocery & Kitchen', 'Snacks & Drinks', 'Beauty & Personal Care', 'Home & Cleaning'];
  const sectionMap = new Map<string, Collection[]>();

  COLLECTIONS_DATA.forEach(collection => {
    const existing = sectionMap.get(collection.section) || [];
    existing.push(collection);
    sectionMap.set(collection.section, existing);
  });

  return sectionOrder
    .filter(title => sectionMap.has(title))
    .map(title => ({
      title,
      collections: sectionMap.get(title) || [],
    }));
};

// Helper function to get collection by ID
export const getCollectionById = (id: string): Collection | undefined => {
  return COLLECTIONS_DATA.find(collection => collection.id === id);
};

// Helper function to get all collection categories
export const getAllCollectionCategories = (): CollectionCategory[] => {
  return COLLECTIONS_DATA.flatMap(collection => collection.categories);
};
