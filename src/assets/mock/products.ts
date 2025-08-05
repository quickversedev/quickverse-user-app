// mock/products.ts

const categories = ['scoops', 'sundaes', 'cone', 'family'];
const divisions = ['Cold', 'Hot', 'Ambient'];
const subDivisions = ['Coffee', 'Tea', 'Juice', 'Biscuits', 'Ice Cream', 'Milk'];
const brands = ['Nescafe', 'Amul', 'Parle', 'Nestle', 'Britannia', 'Haldiram'];
const tags = ['BestSeller', 'New', 'Trending', 'Limited Offer', 'Popular'];

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
    const name = `${brand} ${subDivision} ${index + 1}`;

    const mrp = +(20 + Math.random() * 80).toFixed(2);
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

// Create 50 products for each shop
export const mockProducts: Product[] = [
  ...generateProducts('4512', 50),
  ...generateProducts('7890', 50, 50), // startIndex 50 to keep names unique
];
