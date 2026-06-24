# Tickets — 22 Jun 2026

---

## Ticket 1: Fix order status derivation to always use orderMasterStatus

**Type:** Bug Fix
**Branch:** `qa`
**Commits:** `8122a78`, `5824b3f`

### Problem

Order statuses were incorrect in multiple places:
1. Delivered orders showed as "Shipping" because `shipped` was in the `earlyStates` list, which caused `orderMasterStatus` (e.g., `DELIVERED`) to be silently ignored
2. When the backend skipped state transitions (e.g., pending → ORDER_PICKED_UP without going through shipped), the order showed as "Order Placed" instead of "Shipping"
3. `orderMasterStatus` sub-text (e.g., "ORDER PICKED UP") appeared under the wrong step in the vertical timeline

### Changes

| File | Change |
|------|--------|
| `src/store/cart/orderStore.ts` | Replaced `earlyStates` array with simple cancelled/rejected check — `orderMasterStatus` now always wins when set. Added `order_picked_up`, `partner_assigned`, `reached_location`, `out_for_delivery` to `normalizeStatus`. Removed duplicate local `normalizeStatus` inside `fetchOrders`. Added merge logic to preserve corrected statuses across list API refreshes. Removed debug `console.warn`/`console.log`. |
| `src/components/common/OrderDetails/OrderProgress.tsx` | Restricted `orderMasterStatus` sub-text to only show on the Shipping step (`step.key === 'shipping'`) |
| `src/types/order.ts` | Added `refreshInProgressStatuses` to `OrderStore` interface |

### Status derivation (before → after)

```
BEFORE: if state in [open, pending, accepted, shipped, cancelled, rejected] → use state
        else → use orderMasterStatus || state

AFTER:  if state is cancelled/rejected → use state
        else → use orderMasterStatus || state
```

---

## Ticket 2: Fix OrderProgressBar stale status flash and add polling

**Type:** Bug Fix + Enhancement
**Branch:** `qa`
**Commits:** `695733c`, `131ef76`

### Problem

1. The home screen bottom bar (OrderProgressBar) showed delivered/completed orders with wrong status ("Confirmed", "On the way") for 1-2 seconds before disappearing
2. The bar had no auto-refresh — status only updated when the user navigated away and back
3. Root cause: the bar used the list API (`/v2/order/getSMZBIZOrders`) which lacks `orderMasterStatus`, then corrected via the detail API — but stale data was visible during the gap

### Changes

| File | Change |
|------|--------|
| `src/store/cart/orderStore.ts` | Added `refreshInProgressStatuses` method — fetches detail API for each in-progress order and updates `orders[]` with accurate `status` + `orderMasterStatus`. Also: `fetchOrderById` now syncs corrected status back to `orders[]` array. |
| `src/components/common/order/OrderProgressBar.tsx` | Switched from list API to detail API (`refreshInProgressStatuses`) as primary data source. Added `statusesVerified` gate — bar stays hidden until detail API confirms true statuses. Reset gate on each tab focus to prevent stale flash on re-entry. Added 30s polling while home tab is focused (stops on blur). |
| `src/types/order.ts` | Added `refreshInProgressStatuses` to store interface |

### Data flow (before → after)

```
BEFORE: useFocusEffect → fetchOrders (list API) → refreshInProgressStatuses (detail API)
        Bar visible immediately with stale list data → flash for 1-2s

AFTER:  useFocusEffect → refreshInProgressStatuses (detail API) only
        Bar hidden until detail API confirms → no flash
        Polls every 30s while focused
        Falls back to fetchOrders only if orders[] is empty
```
