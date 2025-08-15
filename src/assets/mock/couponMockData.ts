import { Coupon } from '../../store/cart/couponStore';

export const mockCoupons: Coupon[] = [
  {
    id: '1',
    code: 'WELCOME50',
    description: 'Get 50% off on your first order',
    discount: '50% OFF',
    minOrder: 200,
    expiryDate: 'Valid till 30 Apr 2024',
    offerType: 'PERCENTAGE_OFF',
    discountLimit: 100,
    totalBenefit: 50,
    offerClass: 'CART',
    applicableEntities: [],
    minProductCount: 0,
  },
  {
    id: '2',
    code: 'SAVE20',
    description: 'Get 20% off on orders above ₹500',
    discount: '20% OFF',
    minOrder: 500,
    expiryDate: 'Valid till 15 Apr 2024',
    offerType: 'PERCENTAGE_OFF',
    discountLimit: 200,
    totalBenefit: 100,
    offerClass: 'CART',
    applicableEntities: [],
    minProductCount: 0,
  },
  {
    id: '3',
    code: 'SPECIAL30',
    description: 'Get 30% off on selected items',
    discount: '30% OFF',
    minOrder: 300,
    expiryDate: 'Valid till 20 Apr 2024',
    offerType: 'ENTITY_PERCENTAGE_OFF',
    discountLimit: 150,
    totalBenefit: 75,
    offerClass: 'PRODUCT',
    applicableEntities: [
      {
        entityId: 'product-1',
        entityType: 'PRODUCT',
        quantityLimit: 2,
      },
    ],
    minProductCount: 2,
  },
  {
    id: '4',
    code: 'FLAT100',
    description: 'Get flat ₹100 off on orders above ₹800',
    discount: '₹100 OFF',
    minOrder: 800,
    expiryDate: 'Valid till 25 Apr 2024',
    offerType: 'FLAT_OFF',
    discountLimit: 100,
    totalBenefit: 100,
    offerClass: 'CART',
    applicableEntities: [],
    minProductCount: 0,
  },
  {
    id: '5',
    code: 'FIRSTORDER',
    description: 'Get 25% off on your first order',
    discount: '25% OFF',
    minOrder: 150,
    expiryDate: 'Valid till 10 May 2024',
    offerType: 'PERCENTAGE_OFF',
    discountLimit: 75,
    totalBenefit: 50,
    offerClass: 'CART',
    applicableEntities: [],
    minProductCount: 0,
  },
];

// Vendor-specific mock data (can be customized per vendor)
export const getVendorMockCoupons = (vendorId: string): Coupon[] => {
  // You can customize coupons based on vendor

  switch (vendorId) {
    case '4514':
      return mockCoupons.slice(0, 3); // First 3 coupons
    case '7890':
      return mockCoupons.slice(1, 4); // Middle 3 coupons
    case 'vendor3':
      return mockCoupons.slice(2, 5); // Last 3 coupons
    default:
      return mockCoupons; // All coupons for unknown vendors
  }
};

// Simulate API delay
export const simulateApiDelay = (delay: number = 1000): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, delay));
};
