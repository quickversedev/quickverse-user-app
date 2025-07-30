import { Order } from '../../types/order';

export const mockOrderData = {
  ordersMetadata: [
    {
      orderId: '8533182977293224',
      customerId: 2623933671677842,
      customerName: null,
      customerMobileNumber: 918950619693,
      customerDeliveryAddress: {
        name: 'Dummy order',
        addressLine1: 'Dunmy order',
        addressLine2: 'Dummy order',
        addressLine3: null,
        city: 'UDAIPUR',
        state: 'RAJASTHAN',
        pincode: '313001',
        latitude: '24.58702',
        longitude: '73.69845',
        tag: 'Home',
        amazonAddressId: null,
        addressQualityScore: null,
      },
      notificationDetail: {
        addressId: '2644ed29-249c-4b29-a117-ec0f1ca16292',
        mobileNumber: '918950619693',
        emailId: null,
        customerName: null,
      },
      state: 'CANCELLED',
      stateLabel: 'Order Cancelled',
      totalOrderAmount: 145.0,
      totalItemCount: 1,
      totalProductCount: 1,
      totalInvoiceAmount: 145.0,
      fulfillmentOption: 'DELIVERY',
      creationTime: '1749221815387',
      lastUpdateTime: '1749221849108',
      productImageUrls: ['https://m.media-amazon.com/images/X/bxt1/M/5bxt1Bt3C9lbpFd.jpg'],
      orderDescription: 'Chole Bhature With Raita',
      orderLink: 'https://www.smartbiz.in/Gharkazaika/orders/8533182977293224/order-details',
      deliveryDetails: {
        deliveryAgentName: null,
        deliveryAgentMobileNumber: null,
        deliveryPartnerName: null,
        selfDeliveryMode: null,
        deliveryFees: 15.0,
      },
      isNewCustomer: true,
      paymentGatewayUniqueTransactionId: 'PROD-8533182977293224-50894-814',
      skuDetailsGrouped: [
        {
          index: 1,
          id: '50894-1',
          shopId: 50894,
          itemCount: 1,
          productDetails: {
            productName: 'Chole Bhature With Raita',
            productImageUrl: 'https://m.media-amazon.com/images/X/bxt1/M/5bxt1Bt3C9lbpFd.jpg',
          },
          shopPrice: 130.0,
          productMRP: 130.0,
          finalPrice: 130.0,
          billFinalPrice: 130.0,
          count: 1,
          cgst: { rate: 0.0, amount: 0.0 },
          sgst: { rate: 0.0, amount: 0.0 },
          free: false,
        },
      ],
      additionalPaymentCharges: 0.0,
      totalOrderAmountIncludingPaymentCharges: 145.0,
      totalInvoiceAmountIncludingPaymentCharges: 145.0,
      platform: 'QUICKVERSE',
      paymentMethod: 'COD',
    },

    {
      orderId: '8533182977293225',
      customerId: 2623933671677843,
      customerName: 'Ravi Sharma',
      customerMobileNumber: 919999999999,
      customerDeliveryAddress: {
        name: 'Ravi Home',
        addressLine1: '123 Main Road',
        addressLine2: 'Sector 5',
        addressLine3: null,
        city: 'JAIPUR',
        state: 'RAJASTHAN',
        pincode: '302001',
        latitude: '26.9124',
        longitude: '75.7873',
        tag: 'Office',
        amazonAddressId: null,
        addressQualityScore: null,
      },
      notificationDetail: {
        addressId: 'a1b2c3d4',
        mobileNumber: '919999999999',
        emailId: 'ravi@example.com',
        customerName: 'Ravi Sharma',
      },
      state: 'DELIVERED',
      stateLabel: 'Order Delivered',
      totalOrderAmount: 280.0,
      totalItemCount: 2,
      totalProductCount: 2,
      totalInvoiceAmount: 280.0,
      fulfillmentOption: 'DELIVERY',
      creationTime: '1749221890000',
      lastUpdateTime: '1749221940000',
      productImageUrls: ['https://images.unsplash.com/photo-1598514982372-8453c0c13207'],
      orderDescription: 'Paneer Butter Masala + Butter Naan',
      orderLink: 'https://www.smartbiz.in/Gharkazaika/orders/8533182977293225/order-details',
      deliveryDetails: {
        deliveryAgentName: 'Ramesh',
        deliveryAgentMobileNumber: '9876543210',
        deliveryPartnerName: 'Local Delivery',
        selfDeliveryMode: false,
        deliveryFees: 20.0,
      },
      isNewCustomer: false,
      paymentGatewayUniqueTransactionId: 'PROD-8533182977293225-50894-815',
      skuDetailsGrouped: [
        {
          index: 1,
          id: '50894-2',
          shopId: 50894,
          itemCount: 1,
          productDetails: {
            productName: 'Paneer Butter Masala',
            productImageUrl: 'https://images.unsplash.com/photo-1608746533835-92f51c188ba7',
          },
          shopPrice: 150.0,
          productMRP: 150.0,
          finalPrice: 150.0,
          billFinalPrice: 150.0,
          count: 1,
          cgst: { rate: 0.0, amount: 0.0 },
          sgst: { rate: 0.0, amount: 0.0 },
          free: false,
        },
        {
          index: 2,
          id: '50894-3',
          shopId: 50894,
          itemCount: 1,
          productDetails: {
            productName: 'Butter Naan (2 pcs)',
            productImageUrl: 'https://images.unsplash.com/photo-1612198104238-d3747ddcb5c1',
          },
          shopPrice: 110.0,
          productMRP: 110.0,
          finalPrice: 110.0,
          billFinalPrice: 110.0,
          count: 1,
          cgst: { rate: 0.0, amount: 0.0 },
          sgst: { rate: 0.0, amount: 0.0 },
          free: false,
        },
      ],
      additionalPaymentCharges: 10.0,
      totalOrderAmountIncludingPaymentCharges: 290.0,
      totalInvoiceAmountIncludingPaymentCharges: 290.0,
      platform: 'QUICKVERSE',
      paymentMethod: 'ONLINE',
    },

    {
      orderId: '8533182977293226',
      customerId: 2623933671677844,
      customerName: 'Anjali Mehta',
      customerMobileNumber: 918888888888,
      customerDeliveryAddress: {
        name: 'Anjali Mehta',
        addressLine1: 'A-404, Lakeview Residency',
        addressLine2: 'Near Big Bazaar',
        addressLine3: null,
        city: 'AHMEDABAD',
        state: 'GUJARAT',
        pincode: '380015',
        latitude: '23.0225',
        longitude: '72.5714',
        tag: 'Home',
        amazonAddressId: null,
        addressQualityScore: null,
      },
      notificationDetail: {
        addressId: 'd4c3b2a1',
        mobileNumber: '918888888888',
        emailId: 'anjali@example.com',
        customerName: 'Anjali Mehta',
      },
      state: 'PENDING',
      stateLabel: 'Awaiting Confirmation',
      totalOrderAmount: 90.0,
      totalItemCount: 1,
      totalProductCount: 1,
      totalInvoiceAmount: 90.0,
      fulfillmentOption: 'DELIVERY',
      creationTime: '1749221990000',
      lastUpdateTime: '1749221995000',
      productImageUrls: ['https://images.unsplash.com/photo-1571091718767-18b5b1457add'],
      orderDescription: 'Veg Sandwich + Juice',
      orderLink: 'https://www.smartbiz.in/Gharkazaika/orders/8533182977293226/order-details',
      deliveryDetails: {
        deliveryAgentName: null,
        deliveryAgentMobileNumber: null,
        deliveryPartnerName: null,
        selfDeliveryMode: null,
        deliveryFees: 10.0,
      },
      isNewCustomer: true,
      paymentGatewayUniqueTransactionId: 'PROD-8533182977293226-50894-816',
      skuDetailsGrouped: [
        {
          index: 1,
          id: '50894-4',
          shopId: 50894,
          itemCount: 1,
          productDetails: {
            productName: 'Veg Sandwich with Juice',
            productImageUrl: 'https://images.unsplash.com/photo-1604908554161-3477bdb5be11',
          },
          shopPrice: 90.0,
          productMRP: 90.0,
          finalPrice: 90.0,
          billFinalPrice: 90.0,
          count: 1,
          cgst: { rate: 0.0, amount: 0.0 },
          sgst: { rate: 0.0, amount: 0.0 },
          free: false,
        },
      ],
      additionalPaymentCharges: 0.0,
      totalOrderAmountIncludingPaymentCharges: 90.0,
      totalInvoiceAmountIncludingPaymentCharges: 90.0,
      platform: 'QUICKVERSE',
      paymentMethod: 'COD',
    },
  ],
  cursor: null,
};

// Helper function to convert mock data to our Order type
export const convertMockOrderToOrder = (mockOrder: any): Order => {
  const getPaymentStatus = (paymentMethod: string): 'pending' | 'paid' | 'failed' => {
    if (paymentMethod === 'COD') return 'pending';
    if (paymentMethod === 'ONLINE') return 'paid';
    return 'pending';
  };

  const getOrderStatus = (state: string): Order['status'] => {
    switch (state) {
      case 'DELIVERED':
        return 'delivered';
      case 'CANCELLED':
        return 'cancelled';
      case 'PENDING':
        return 'pending';
      case 'CONFIRMED':
        return 'confirmed';
      case 'PREPARING':
        return 'preparing';
      case 'READY':
        return 'ready';
      default:
        return 'pending';
    }
  };

  return {
    orderId: mockOrder.orderId,
    shopId: mockOrder.skuDetailsGrouped[0]?.shopId?.toString() || 'unknown',
    shopName: 'Gharkazaika', // Default shop name
    items: mockOrder.skuDetailsGrouped.map((sku: any) => ({
      id: sku.id,
      name: sku.productDetails.productName,
      quantity: sku.count,
      price: sku.shopPrice,
      totalPrice: sku.finalPrice,
      description: sku.productDetails.productName,
      image: sku.productDetails.productImageUrl,
    })),
    totalAmount: mockOrder.totalOrderAmount,
    status: getOrderStatus(mockOrder.state),
    orderDate: new Date(parseInt(mockOrder.creationTime)).toISOString(),
    estimatedDeliveryTime: mockOrder.deliveryDetails?.deliveryAgentName
      ? new Date(parseInt(mockOrder.creationTime) + 30 * 60 * 1000).toISOString()
      : undefined,
    actualDeliveryTime:
      mockOrder.state === 'DELIVERED'
        ? new Date(parseInt(mockOrder.lastUpdateTime)).toISOString()
        : undefined,
    deliveryAddress: {
      address: `${mockOrder.customerDeliveryAddress.addressLine1}, ${mockOrder.customerDeliveryAddress.addressLine2}`,
      city: mockOrder.customerDeliveryAddress.city,
      state: mockOrder.customerDeliveryAddress.state,
      postalCode: mockOrder.customerDeliveryAddress.pincode,
      coordinates: {
        latitude: parseFloat(mockOrder.customerDeliveryAddress.latitude),
        longitude: parseFloat(mockOrder.customerDeliveryAddress.longitude),
      },
    },
    paymentMethod: mockOrder.paymentMethod.toLowerCase() as 'cash' | 'card' | 'upi',
    paymentStatus: getPaymentStatus(mockOrder.paymentMethod),
    specialInstructions: '',
    customerName: mockOrder.customerName || 'Customer',
    customerPhone: mockOrder.customerMobileNumber.toString(),
  };
};

// Convert all mock orders
export const mockOrders: Order[] = mockOrderData.ordersMetadata.map(convertMockOrderToOrder);
