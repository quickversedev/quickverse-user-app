# Tasks

## ✅ Completed: Onboard shopId 94728 (Shree Samarth Foods) to QuickVerse backend

**Closed: 2026-04-21** — verified via `GET /v3/shops?...` on prd.quickverse.in for Beed coordinates. Response now contains:

```json
{
  "shopId": "94728",
  "name": "Shree Samarth Foods",
  "owner": "Store Manager",
  "phone": "9028628300",
  "openingTime": "09:30:00",
  "closingTime": "22:00:00",
  "preparationTime": "20 mins",
  "category": "Grocery",
  "storeActive": true
}
```

### Resolution
Backend onboarded the shop to `qv.shop`. Both previously broken flows now work without client-side workarounds:
- `GET /v2/listAddresses?shopId=94728` — accepts saves and returns addresses scoped to 94728.
- `POST /v2/order/createOrder` with `shopId: 94728` — no longer 404s.

### Client cleanup performed
`src/screens/Category/CategoryScreen.tsx` — removed the synthetic-vendor workaround:
- Dropped the `useEffect` that injected a fake `Vendor` record into `useVendorStore` via `setVendors`.
- Dropped the synthetic fallback inside `showcaseVendors`. Now simply prefers `94728` from `categoryVendors`; if missing, falls back to the first grocery vendor.

### Original context (kept for history)
The Category screen (Grocery) renders a `CollectionShowcaseWidget` for **Shree Samarth Foods (shopId: 94728)** instead of the prior **Daily Essentials (shopId: 68246)**. The catalog for 94728 is served by SmartBiz through QuickVerse's passthrough endpoint (`/v3/{shopId}/category`), which validates nothing — that's why the widget always rendered, even pre-onboarding.

What DID require real onboarding was anything keyed against QV's own `qv.shop` table:
1. **Address fetching** — `GET /v2/listAddresses?shopId=94728` returned empty.
2. **Order placement** — `POST /v2/order/createOrder` returned **404**.

Both endpoints now succeed post-onboarding.

The collections grid (below the widget) remains statically pinned to `API_STORE_ID = '68246'` via `fetchCollectionsFromApi(API_STORE_ID)` and `<CollectionsGrid shopId={API_STORE_ID} />` — unchanged.
