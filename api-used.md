# API Endpoints Used in QuickVerse Client App

This document lists all the API endpoints currently being used in the codebase, categorized by their functionality and service.

## Base URL
The primary backend services are hosted at:
`http://prd.quickverse.in/quickVerse`

---

## Internal API Endpoints

### Authentication (v1)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/requestOtp` | POST | Requests an OTP for a given phone number |
| `/v1/login` | POST | Verifies OTP and returns a session token (JWT) |
| `/v1/register/customer` | POST | Registers a new customer profile |
| `/v1/logout` | DELETE | Invalidates the current session |
| `/v1/customer` | DELETE | Deletes the customer account |

### Configuration & App State (v1, v3)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/initialConfig` | GET | Fetches initial app configuration based on location |
| `/v3/appConfig` | GET | Checks for app updates and store URLs |
| `/v3/pages` | GET | Fetches dynamic page configurations (CMS) for a region |

### Shop & Vendor Management (v3)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v3/shops` | GET | Fetches a list of vendors/shops near a location |
| `/v3/shops/${shopId}` | GET | Fetches detailed information for a specific shop |
| `/v3/${shopId}/category` | GET | Fetches product categories available in a shop |

### Product & Search (v3)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v3/products` | POST | Fetches products for a shop with filtering and pagination |
| `/v3/product/${parentSku}` | GET | Fetches variant details for a specific product |
| `/v3/search` | GET | Global search for products and vendors |

### Cart Management (v2)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v2/addCart` | POST | Adds an item to the shopping cart |
| `/v2/getCart` | GET | Retrieves current cart contents and totals |
| `/v2/deleteCart` | DELETE | Removes an item or decreases quantity in the cart |
| `/v2/clearCart` | DELETE | Empties the entire cart for a shop |

### Offers & Coupons (v3)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v3/${vendorId}/Offers` | GET | Checks if any public/private offers exist for a vendor |
| `/v3/Offers/Customer` | GET | Fetches all eligible and non-eligible offers for a customer |
| `/v3/Offers/Apply` | POST | Applies a specific coupon/offer to the cart |

### Order Management (v2)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v2/order/createOrder` | POST | Places a new order |
| `/v2/order/getSMZBIZOrders` | POST | Fetches order history (paginated) |
| `/v2/order/fetchOrder` | GET | Fetches detailed information for a single order |
| `/v2/order/cancelOrder` | PUT | Cancels an existing order |

### Payment (v3)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v3/payment/eligiblePaymentMethods` | GET | Fetches available payment options for a cart |
| `/v3/payment/create` | POST | Initializes a payment transaction for an order |

### Address Management (v2)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v2/addresses` | GET | Fetches all saved addresses for the customer |
| `/v2/addresses` | POST | Saves a new delivery address |
| `/v2/addressId` | GET | Maps internal address IDs to SmartBiz IDs for a shop |
| `/v2/listAddresses` | GET | Lists available delivery addresses for a specific vendor |

### Support & Devices (v1)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/FAQs` | GET | Fetches Frequently Asked Questions |
| `/v1/updateDevice` | POST | Updates FCM token and device info for notifications |
| `/v1/email` | POST | Sends a support email for an order |

---

## External API Endpoints

### Ola Maps API
Used for location services and geocoding.
| Endpoint | Method | Description |
|----------|--------|-------------|
| `https://api.olamaps.io/places/v1/autocomplete` | GET | Place search suggestions |
| `https://api.olamaps.io/places/v1/reverse-geocode` | GET | Get address from latitude/longitude |

### SmartBiz API
Used for extended catalog searching.
| Endpoint | Method | Description |
|----------|--------|-------------|
| `https://api.smartbiz.in/stores/${storeId}/catalog/items` | GET | Direct catalog search on SmartBiz platform |

### Amazon SmartPOS API
Used for fetching products from specific collections.
| Endpoint | Method | Description |
|----------|--------|-------------|
| `https://smartpos.amazon.in/api-unauthenticated/resources/external/catalog/products` | POST | Fetches products for collections from Amazon SmartPOS |
