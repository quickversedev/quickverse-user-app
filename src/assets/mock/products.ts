// mock/products.ts
import { Category } from '../../types/product';
const categories = [
  'scoops',
  'sundaes',
  'cones',
  'family',
  'milkshakes',
  'smoothies',
  'icecream_cakes',
  'frozen_yogurt',
  'ice_pops',
  'gelato',
];
const divisions = ['Cold', 'Hot', 'Ambient'];
const subDivisions = [
  'Coffee',
  'Tea',
  'Juice',
  'Biscuits',
  'Ice Cream',
  'Milk',
  'Chocolate',
  'Vanilla',
  'Strawberry',
  'Mint',
];
const brands = [
  'Nescafe',
  'Amul',
  'Parle',
  'Nestle',
  'Britannia',
  'Haldiram',
  'Meridian',
  'Kwality',
  'Vadilal',
  'Mother Dairy',
];
const tags = [
  'BestSeller',
  'New',
  'Trending',
  'Limited Offer',
  'Popular',
  'Premium',
  'Organic',
  'Sugar Free',
];

export type Product = {
  sku: string;
  shopId: string;
  name: string;
  mrp: number;
  sellingPrice: number;
  gst: number;
  category: string;
  division: string;
  subDivision: string;
  brand: string;
  description: string;
  imageUrl: string;
  discount: number;
  numberOfVariants: number;
  currentStock: number;
  inStock: boolean;
  primarySKU: string;
  tags: Array<{
    tagName: string;
  }>;
};

const generateProducts = (shopId: string, count: number, startIndex: number = 0): Product[] => {
  return Array.from({ length: count }, (_, i) => {
    const index = startIndex + i;
    const sku = `SKU_${shopId}_${index}`;
    const brand = brands[index % brands.length];
    const category = categories[index % categories.length];
    const division = divisions[index % divisions.length];
    const subDivision = subDivisions[index % subDivisions.length];
    const tag = tags[index % tags.length];

    // Generate category-specific product names
    let name = '';
    switch (category) {
      case 'scoops':
        name = `${subDivision} Ice Cream Scoop`;
        break;
      case 'sundaes':
        name = `${subDivision} Sundae Delight`;
        break;
      case 'cones':
        name = `${subDivision} Cone`;
        break;
      case 'family':
        name = `${subDivision} Family Pack`;
        break;
      case 'milkshakes':
        name = `${subDivision} Milkshake`;
        break;
      case 'smoothies':
        name = `${subDivision} Smoothie`;
        break;
      case 'icecream_cakes':
        name = `${subDivision} Ice Cream Cake`;
        break;
      case 'frozen_yogurt':
        name = `${subDivision} Frozen Yogurt`;
        break;
      case 'ice_pops':
        name = `${subDivision} Ice Pop`;
        break;
      case 'gelato':
        name = `${subDivision} Gelato`;
        break;
      default:
        name = `${brand} ${subDivision} ${index + 1}`;
    }

    // Category-specific pricing
    let basePrice = 20;
    switch (category) {
      case 'scoops':
        basePrice = 30;
        break;
      case 'sundaes':
        basePrice = 80;
        break;
      case 'cones':
        basePrice = 40;
        break;
      case 'family':
        basePrice = 150;
        break;
      case 'milkshakes':
        basePrice = 60;
        break;
      case 'smoothies':
        basePrice = 70;
        break;
      case 'icecream_cakes':
        basePrice = 200;
        break;
      case 'frozen_yogurt':
        basePrice = 50;
        break;
      case 'ice_pops':
        basePrice = 25;
        break;
      case 'gelato':
        basePrice = 45;
        break;
    }

    const mrp = +(basePrice + Math.random() * 50).toFixed(2);
    const discount = +(Math.random() * 30).toFixed(2);
    const sellingPrice = +(mrp - (mrp * discount) / 100).toFixed(2);
    const gst = +(5 + Math.random() * 10).toFixed(2);
    const stock = Math.floor(Math.random() * 10);
    const numberOfVariants = Math.floor(Math.random() * 4) + 1;

    return {
      sku,
      shopId,
      name,
      mrp,
      sellingPrice,
      gst,
      category,
      division,
      subDivision,
      brand,
      description: `${division} ${subDivision} from ${brand}`,
      imageUrl: `https://via.placeholder.com/150?text=${encodeURIComponent(name)}`,
      discount,
      numberOfVariants: numberOfVariants,
      currentStock: stock,
      inStock: stock > 0,
      primarySKU: sku,

      tags: [
        {
          tagName: tag,
        },
      ],
    };
  });
};

// Create 100 products for each shop to ensure good distribution across 10 categories
export const mockProducts: Product[] = [
  ...generateProducts('4512', 100), // BCRoy-713206 (Food)
  ...generateProducts('7890', 100, 100), // Daily Mart (Grocery)
  ...generateProducts('4514', 100, 200), // MediCare Pharmacy (Pharmacy)
  ...generateProducts('4519', 100, 300), // Medi Pharma (Pharmacy)
  ...generateProducts('4520', 100, 400), // Spice Garden (Food)
  ...generateProducts('4521', 100, 500), // Fresh Basket (Grocery)
  ...generateProducts('4522', 100, 600), // Health First (Pharmacy)
  ...generateProducts('4523', 100, 700), // Taste of Punjab (Food)
  ...generateProducts('4524', 100, 800), // Super Mart (Grocery)
  ...generateProducts('4525', 100, 900), // Quick Meds (Pharmacy)
  ...generateProducts('4526', 100, 1000), // South Indian Delights (Food)
  ...generateProducts('4527', 100, 1100), // Organic Corner (Grocery)
  ...generateProducts('49351', 100, 1100),
  ...generateProducts('49464', 100, 1100),
];

// Build mock categories by division (id maps to product.division)
const CATEGORY_ICON_URLS: Record<string, string[]> = {
  Cold: ['https://via.placeholder.com/64?text=Cold'],
  Hot: ['https://via.placeholder.com/64?text=Hot'],
  Ambient: ['https://via.placeholder.com/64?text=Ambient'],
};

export const getMockCategoriesForShop = (shopId: string): Category[] => {
  const shopProducts = mockProducts.filter(p => p.shopId === shopId);
  const counts = shopProducts.reduce<Record<string, number>>((acc, p) => {
    acc[p.division] = (acc[p.division] || 0) + 1;
    return acc;
  }, {});
  const divisionsUnique = Array.from(new Set(shopProducts.map(p => p.division)));
  return divisionsUnique.map(div => ({
    id: div, // maps to product.division
    name: div,
    description: null,
    imageURLs: CATEGORY_ICON_URLS[div] || null,
    type: div === 'Cold' || div === 'Hot' ? 'MANAGED' : 'CUSTOM',
    parentCategory: null,
    countOfSkus: counts[div] || 0,
  }));
};
