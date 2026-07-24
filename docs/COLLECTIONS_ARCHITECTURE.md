# Collections: Backend-Driven Architecture

## Overview

The collections feature was migrated from a client-side implementation (hardcoded mappings + direct SmartPOS/SmartBiz API calls from the mobile app) to a fully backend-driven architecture. The user app is now a thin client — it fetches collection lists and paginated products from the QuickVerse backend, with no external API dependencies.

---

## What Changed

### Before (Client-Side)

- **18 hardcoded collection-to-category mappings** in `collectionsData.ts` (`COLLECTION_CATEGORIES_MAPPING`)
- App fetched **ALL ~1500 products** from SmartPOS API, then filtered client-side by `product.division`
- Direct calls to `smartpos.amazon.in` and `api.smartbiz.in` from the mobile app
- Client-side search, brand filtering, category tab switching — all on the full product set
- Fuzzy 3-tier category matching (exact ID → name → substring) to map collections to SmartBiz categories
- Collections could not be managed without an app release

### After (Backend-Driven)

- Collections list, products, and brands all served by QuickVerse backend endpoints
- Server-side pagination, search, and brand filtering
- No SmartBiz/SmartPOS dependency in the collections flow
- Collections toggleable per shop via `collections_enabled` flag on the `shop` table
- Collection definitions managed in `qv.collection` and `qv.collection_category` tables

---

## Architecture

```
┌─────────────────┐         ┌──────────────────────┐         ┌──────────────┐
│   User App      │  HTTP   │  QuickVerse Backend   │  JDBC   │  PostgreSQL  │
│                 │ ──────> │                       │ ──────> │  (AWS RDS)   │
│  - Collections  │         │  - CollectionController│         │              │
│    Grid         │         │  - CollectionService   │         │  qv.shop     │
│  - Detail       │         │  - ProductRepository   │         │  qv.collection│
│    Screen       │         │                       │         │  qv.collection│
│                 │         │                       │         │    _category  │
│                 │         │                       │         │  qv.product   │
└─────────────────┘         └──────────────────────┘         └──────────────┘
```

---

## API Endpoints

### 1. List Collections

```
GET /quickVerse/v3/{shopId}/collections
```

Returns all active collections for a shop with product counts and category breakdowns. Collections with zero products are excluded. Returns empty array if `collections_enabled = false` on the shop.

**Response:**
```json
[
  {
    "id": "vegetables-fruits",
    "name": "Vegetables & Fruits",
    "image": "https://...",
    "icon": null,
    "displayOrder": 1,
    "categories": [
      { "id": "f6c4d71f-...", "name": "Cut & Packed", "displayOrder": 1, "productCount": 3 },
      { "id": "3433ac4d-...", "name": "Fresh Fruits", "displayOrder": 2, "productCount": 27 },
      { "id": "dae7d101-...", "name": "Fresh Vegetables", "displayOrder": 3, "productCount": 50 }
    ],
    "productCount": 80
  }
]
```

### 2. Get Collection Products

```
GET /quickVerse/v3/{shopId}/collections/{collectionId}/products
    ?limit=20&offset=0&search=milk&brand=Amul
```

Paginated products for a collection, with optional server-side search and brand filtering.

**Response:**
```json
{
  "collectionId": "dairy-bakery-eggs",
  "collectionName": "Dairy, Bakery & Eggs",
  "categories": [...],
  "products": [...],
  "total": 59,
  "limit": 20,
  "offset": 0
}
```

### 3. Get Collection Brands

```
GET /quickVerse/v3/{shopId}/collections/{collectionId}/brands
```

Returns distinct brand names for a collection's products. Used for the brand filter dropdown.

**Response:**
```json
["Amul", "Mother Dairy", "Britannia", ...]
```

---

## Database Schema

### `qv.collection`

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | Slug identifier, e.g. `vegetables-fruits` |
| name | varchar | Display name |
| icon | varchar | Material icon name (nullable) |
| display_order | integer | Sort order |
| shop_id | varchar (nullable) | NULL = global (applies to all shops) |
| active | boolean | Soft delete flag |

### `qv.collection_category`

| Column | Type | Description |
|--------|------|-------------|
| id | bigint (PK) | Auto-increment |
| collection_id | varchar (FK) | References `collection.id` |
| category_id | varchar | **SmartBiz division UUID** matching `product.division` |
| category_name | varchar | Human-readable name |
| display_order | integer | Sort order within the collection |

### `qv.shop` (new column)

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| collections_enabled | boolean | false | Server-side toggle for collections |

---

## Server-Side Toggle

Collections can be turned on/off per shop without an app release:

```sql
-- Enable collections for a shop
UPDATE qv.shop SET collections_enabled = true WHERE shop_id = '68246';

-- Disable collections for a shop
UPDATE qv.shop SET collections_enabled = false WHERE shop_id = '68246';

-- Check status
SELECT shop_id, name, collections_enabled FROM qv.shop WHERE collections_enabled = true;
```

When disabled, `GET /v3/{shopId}/collections` returns `[]` and the app hides the collections grid automatically.

**Currently enabled:** shop 68246 (Daily Essentials) only.

---

## Data Model: How Collections Map to Products

```
collection (e.g. "Dairy, Bakery & Eggs")
  └── collection_category (e.g. "Milk & Dairy")
        └── category_id = SmartBiz division UUID (e.g. "1b4d6609-...")
              └── product.division matches this UUID
                    └── Products with division = "1b4d6609-..." belong to this category
```

The `collection_category.category_id` values are **SmartBiz division UUIDs** — the same UUIDs stored in the `product.division` column. The backend queries products with `WHERE division IN (:divisionIds)` to find products for a collection.

---

## Backend Files

### New Files

| File | Purpose |
|------|---------|
| `dto/CollectionCategoryDTO.java` | Typed DTO for categories (replaces raw `Map<String, Object>`) |
| `dto/CollectionProductsResponseDTO.java` | Response wrapper for paginated collection products |

### Modified Files

| File | Changes |
|------|---------|
| `schema/Shop.java` | Added `collectionsEnabled` field |
| `schema/CollectionEntity.java` | JPA entity for `qv.collection` (existed) |
| `schema/CollectionCategoryEntity.java` | JPA entity for `qv.collection_category` (existed) |
| `repository/CollectionRepository.java` | `findActiveCollectionsForShop()` query |
| `repository/ProductRepository.java` | Added 5 native queries: `findProductsByDivisions`, `countProductsByDivisions`, `findDistinctBrandsByDivisions`, `countProductsGroupedByDivision`, `findFirstImageByDivisions` |
| `dto/CollectionDTO.java` | Changed categories to typed `List<CollectionCategoryDTO>`, added `productCount` |
| `service/CollectionService.java` | Added `getCollectionProducts()`, `getCollectionBrands()` |
| `service/impl/CollectionServiceImpl.java` | Complete rewrite — eliminated SmartBiz, uses local product DB, checks `collectionsEnabled` |
| `controller/CollectionController.java` | Added products and brands endpoints |
| `util/QVErrorEnum.java` | Added `QV_COLLECTION_NOT_FOUND` error code |

---

## Frontend Files

### New Files

| File | Purpose |
|------|---------|
| `services/collectionsService.ts` | API service wrapping 3 backend endpoints |

### Modified Files

| File | Changes |
|------|---------|
| `data/collectionsData.ts` | Removed 18 hardcoded mappings, `COLLECTIONS_VENDOR_ID`, old `fetchCollectionsFromApi()`. New version calls backend via `collectionsService` |
| `screens/Category/CategoryScreen.tsx` | Removed `isCollectionAvailable` guard (vendor 68246 presence check). Collections grid renders whenever backend returns data |
| `screens/Home/components/tabs/CollectionsContent.tsx` | Simplified `collectionsShopId` to always use `API_STORE_ID` |
| `screens/collections/CollectionDetailScreen.tsx` | Reduced ~1130 → ~700 lines. Removed client-side filtering, cross-vendor search, fuzzy category matching. Uses backend pagination/search/filtering |

### Kept (used by other features)

| File | Reason |
|------|--------|
| `data/collectionsData.ts: API_STORE_ID` | Used by `useSearch.ts`, `VendorProduct.tsx`, `CategoryScreen.tsx` |
| `services/productsService.ts: fetchProductsForCollection()` | Used by `CollectionShowcaseWidget.tsx` |
| `store/productsStore.ts: fetchCollectionProducts` | Used by `VendorProduct.tsx` |

---

## Data Migration

The `collection_category.category_id` values were originally SmartBiz category slugs (e.g. `fresh-fruits`, `chips-wafers`). These did not match the `product.division` field which stores SmartBiz division UUIDs (e.g. `3433ac4d-c690-44ed-80c7-ef12b2313ffe`).

A one-time data migration updated all 48 `category_id` values from slugs to their corresponding UUIDs by matching `collection_category.category_name` to SmartBiz API category names. Two categories (Mobile Accessories, Tomato Ketchup & Sauces) had no matching products and were left as-is — they are excluded from the API response since their product count is 0.

---

## Adding a New Collection

1. Insert into `qv.collection`:
```sql
INSERT INTO qv.collection (id, name, icon, display_order, active)
VALUES ('new-collection', 'New Collection', 'star', 19, true);
```

2. Map categories (use SmartBiz division UUIDs from `product.division`):
```sql
INSERT INTO qv.collection_category (collection_id, category_id, category_name, display_order)
VALUES ('new-collection', '<division-uuid>', 'Category Name', 1);
```

3. The collection appears automatically on the next API call — no app release needed.

---

## Removing / Reordering Collections

```sql
-- Deactivate a collection (soft delete)
UPDATE qv.collection SET active = false WHERE id = 'pan-corner';

-- Reorder collections
UPDATE qv.collection SET display_order = 5 WHERE id = 'cold-drinks-juices';

-- Remove a category from a collection
DELETE FROM qv.collection_category WHERE collection_id = 'biscuits' AND category_name = 'Glucose & Digestives';
```

All changes take effect immediately — no deployment or app update required.
