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
  attributes: {
    color: string | null;
    id: string | null;
    name: string | null;
    description: string | null;
    price: number | null;
    product: string | null;
  };
  additionalImages: Array<{
    url: string | null;
    id: string | null;
  }>;
  variantAttributes: Array<{
    name: string;
  }>;
  tags: Array<{
    tagName: string;
  }>;
};

export const mockProducts: Product[] = Array.from({ length: 50 }, (_, i) => {
  const sku = `SKU_${1000 + i}`;
  const brand = brands[i % brands.length];
  const category = categories[i % categories.length];
  const division = divisions[i % divisions.length];
  const subDivision = subDivisions[i % subDivisions.length];
  const tag = tags[i % tags.length];
  const name = `${brand} ${subDivision} ${i + 1}`;

  const mrp = +(20 + Math.random() * 80).toFixed(2);
  const discount = +(Math.random() * 30).toFixed(2);
  const sellingPrice = +(mrp - (mrp * discount) / 100).toFixed(2);
  const gst = +(5 + Math.random() * 10).toFixed(2);
  const stock = Math.floor(Math.random() * 10);
  const variants = Math.floor(Math.random() * 4) + 1;

  return {
    sku,
    shopId: '4512',
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
    numberOfVariants: variants,
    currentStock: stock,
    inStock: stock > 0,
    primarySKU: sku,
    attributes: {
      color: null,
      id: null,
      name: null,
      description: null,
      price: null,
      product: null,
    },
    additionalImages: [
      {
        url: null,
        id: null,
      },
    ],
    variantAttributes: [
      {
        name: `${subDivision} Variant ${i + 1}`,
      },
    ],
    tags: [
      {
        tagName: tag,
      },
    ],
  };
});
