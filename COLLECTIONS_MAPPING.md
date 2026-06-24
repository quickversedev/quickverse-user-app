# Collections Mapping

This document describes how grocery collections are structured and mapped to API categories.

## Data Source

**File:** `src/data/collectionsData.ts`  
**Store ID:** `68246`

## Interfaces

```typescript
CollectionCategory { id: string; name: string }
Collection { id: string; name: string; icon: string; image: string; section: string; categories: CollectionCategory[]; productIds: string[] }
CollectionSection { title: string; collections: Collection[] }
```

## Collection → Category Mapping

| Collection | Categories |
|---|---|
| **Vegetables & Fruits** | Cut & Packed (`cut-packed`), Fresh Fruits (`fresh-fruits`), Fresh Vegetables (`fresh-vegetables`) |
| **Dairy, Bakery & Eggs** | Bread, Bakery & Buns (`bread-bakery-buns`), Eggs (`eggs`), Milk & Dairy (`milk-dairy`) |
| **Crisp & Namkeens** | Chips & Wafers (`chips-wafers`), Healthy Snacks (`healthy-snacks`), Namkeens, Bhujia & Mixtures (`namkeens-bhujia-mixtures`) |
| **Biscuits** | Biscuits & Cookies (`biscuits-cookies`), Glucose & Digestives (`glucose-digestives`) |
| **Cold Drinks & Juices** | Cold Drinks & Soda (`cold-drinks-soda`), Fruit Juices (`fruit-juices`), Milkshakes (`milkshakes`), Water & Flavors (`water-flavors`) |
| **Chocolates & Icecreams** | Chocolates & Bars (`chocolates-bars`), Ice Creams (`ice-creams`) |
| **Atta, Rice & Dal** | Basmati & Non-Basmati Rice (`basmati-non-basmati-rice`), Poha & Suji (`poha-suji`), Pulses & Lentils (`pulses-lentils`), Wheat & Multigrain Atta (`wheat-multigrain-atta`) |
| **Dry Fruits, Masala & Oil** | Cooking Pastes & Chutneys (`cooking-pastes-chutneys`), Ghee & Edible Oils (`ghee-edible-oils`), Spices & Masalas (`spices-masalas`) |
| **Personal Care** | Bath & Body (`bath-body`), Hair Care (`hair-care`), Men's Grooming (`mens-grooming`), Oral Care (`oral-care`), Personal Hygiene (`personal-hygiene`), Skin Care (`skin-care`), Women's Hygiene (`womens-hygiene`) |
| **Instant Mixes** | Noodles, Pasta, & Other (`noodles-pasta-other`) |
| **Sauces & Spreads** | Mayonnaise & Spreads (`mayonnaise-spreads`), Spreads & Jams (`spreads-jams`), Tomato Ketchup & Sauces (`tomato-ketchup-sauces`) |
| **Tea & Coffee** | Tea & Coffee (`tea-coffee`) |
| **Cleaning Essentials** | Bathroom & Surface Cleaners (`bathroom-surface-cleaners`), Cleaning Accessories (`cleaning-accessories`), Dishwashing (`dishwashing`), Laundry Care (`laundry-care`) |
| **Pharma & Wellness** | First Aid & Health (`first-aid-health`), Gym Supplements (`gym-supplements`), Health Supplements (`health-supplements`), Sexual Wellness (`sexual-wellness`) |
| **Stationery** | School Supplies (`school-supplies`) |
| **Home Furnishing Decor** | Air Fresheners (`air-fresheners`), Home Fragrance (`home-fragrance`), Storage & Organization (`storage-organization`) |
| **Electronics** | Mobile Accessories (`mobile-accessories`) |
| **Pan Corner** | Tobacco & Smoking (`tobaco-smoking`) |

## How It Works

1. **`fetchCollectionsFromApi(storeId)`** fetches all categories from the API via `productsService.fetchCategories(storeId)`
2. Iterates `COLLECTION_CATEGORIES_MAPPING` and matches each mapped category to an API category by:
   - Exact ID match
   - Case-insensitive name match
   - Fuzzy substring match (API name contains mapped name)
3. Skips collections with zero matched API categories
4. Uses the first matched category's image as the collection image (with CDN fallback)
5. Generates a kebab-case collection ID from the collection name
6. Returns all collections under a single section: **"Shop by Category"**

## UI Flow

```
HomeScreen (CollectionsContent tab) → CollectionDetailScreen
ExploreScreen (CollectionsGrid)    → CollectionDetailScreen
```

- **CollectionsContent** — 4-column grid on the Home screen "Collections" tab
- **CollectionsGrid** — 4-column grid on the Explore/Category screen (includes store-hours check and age gate for Pan Corner)
- **CollectionDetailScreen** — Products grouped by category with tabs, search, and cart actions

## Notes

- Collections are fetched dynamically from the API but the **grouping** (which categories belong to which collection) is defined statically in `COLLECTION_CATEGORIES_MAPPING`
- Store hours for collections grid: hardcoded 8 AM – 11 PM
- Pan Corner triggers an 18+ age confirmation modal before navigation
