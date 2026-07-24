# Dual Coupon Implementation

## What Changed

Previously a user could only apply **one coupon** at checkout — either a discount OR free delivery.

Now a user can apply **two coupons simultaneously**:
- One **discount coupon** (FIXED or PERCENTAGE) in `couponId`
- One **free delivery coupon** (FREE_DELIVERY) in `deliveryCouponId`

Two discount coupons still **cannot** be stacked — only one price discount is allowed at a time.

---

## Flow Diagram

```mermaid
flowchart TD
    USER([User at Checkout]) --> REQ[POST /cart/checkout-summary]

    REQ --> S1{couponId present?}
    REQ --> S2{deliveryCouponId present?}

    S1 -->|No| S1_SKIP[No discount applied]
    S1 -->|Yes| S1_LOOKUP[Look up coupon by ID]

    S1_LOOKUP --> S1_EXISTS{Exists?}
    S1_EXISTS -->|No| S1_ERR1[COUPON_NOT_FOUND]
    S1_EXISTS -->|Yes| S1_ACTIVE{Active & not deleted?}
    S1_ACTIVE -->|No| S1_ERR2[COUPON_INACTIVE]
    S1_ACTIVE -->|Yes| S1_TYPE{Type?}
    S1_TYPE -->|FREE_DELIVERY| S1_ERR3[COUPON_WRONG_SLOT\nUse deliveryCouponId instead]
    S1_TYPE -->|FIXED or PERCENTAGE| S1_MOV{MOV met?}
    S1_MOV -->|No| S1_ERR4[COUPON_MOV_NOT_MET]
    S1_MOV -->|Yes| S1_CALC[Calculate price discount\nFIXED → flat ₹ off\nPERCENTAGE → % off with cap]

    S2 -->|No| S2_SKIP[Delivery fee charged normally]
    S2 -->|Yes| S2_LOOKUP[Look up delivery coupon by ID]

    S2_LOOKUP --> S2_EXISTS{Exists?}
    S2_EXISTS -->|No| S2_ERR1[COUPON_NOT_FOUND]
    S2_EXISTS -->|Yes| S2_ACTIVE{Active & not deleted?}
    S2_ACTIVE -->|No| S2_ERR2[COUPON_INACTIVE]
    S2_ACTIVE -->|Yes| S2_TYPE{Type?}
    S2_TYPE -->|FIXED or PERCENTAGE| S2_ERR3[COUPON_WRONG_SLOT\nOnly FREE_DELIVERY allowed here]
    S2_TYPE -->|FREE_DELIVERY| S2_MOV{MOV met?}
    S2_MOV -->|No| S2_ERR4[COUPON_MOV_NOT_MET]
    S2_MOV -->|Yes| S2_FREE[isFreeDelivery = true\nDelivery fee → ₹0]

    S1_CALC --> FINAL[Build final bill]
    S1_SKIP --> FINAL
    S2_FREE --> FINAL
    S2_SKIP --> FINAL

    FINAL --> RESPONSE[CheckoutSummaryResponse\nwith both coupon results]
    RESPONSE --> USER
```

---

## DB Columns Added

Table: `qv.order_finance` — auto-created by Hibernate on startup, no migration needed.

| Column | Type | Description |
|---|---|---|
| `delivery_coupon_id` | UUID | UUID of the FREE_DELIVERY coupon applied |
| `delivery_coupon_code` | VARCHAR | Code of the FREE_DELIVERY coupon e.g. FREEDEL |

---

## Files Changed

| File | Change |
|---|---|
| `dto/CheckoutSummaryRequest.java` | Added `deliveryCouponId` field |
| `dto/CheckoutSummaryResponse.java` | Added 5 delivery coupon response fields |
| `service/impl/CartServiceImpl.java` | Split coupon engine into two independent slots |
| `schema/OrderFinance.java` | Added `deliveryCouponId` + `deliveryCouponCode` columns |
| `service/impl/OrderFinanceServiceImpl.java` | Maps new delivery coupon fields into DB record |

---

## API

Only one existing API is affected — no new endpoints added.

```
POST /quickVerse/v3/cart/checkout-summary
```

### Request — Before (old)

```json
{
  "shopId": "68246",
  "couponId": "uuid-of-any-coupon",
  "paymentMethod": "COD",
  "cartItems": [
    { "sku": "some-sku", "quantity": 2 }
  ]
}
```

### Request — After (new)

```json
{
  "shopId": "68246",
  "couponId": "aaa-bbb-ccc-discount-coupon-uuid",
  "deliveryCouponId": "xxx-yyy-zzz-delivery-coupon-uuid",
  "paymentMethod": "COD",
  "cartItems": [
    { "sku": "some-sku", "quantity": 2 }
  ]
}
```

Both fields are optional — sending only `couponId` or only `deliveryCouponId` still works exactly as before.

---

## Example — Restaurant offering 10% off + Free Delivery on ₹99+

### Coupons created by admin

| Code | Type | MOV | Discount |
|---|---|---|---|
| `SAVE10` | PERCENTAGE | ₹99 | 10% off, max ₹50 |
| `FREEDEL` | FREE_DELIVERY | ₹99 | Delivery fee waived |

### User cart total: ₹200

### Request

```
POST http://localhost:8080/quickVerse/v3/cart/checkout-summary
Authorization: Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx
Content-Type: application/json

{
  "shopId": "68246",
  "couponId": "11111111-aaaa-bbbb-cccc-discount-uuid",
  "deliveryCouponId": "22222222-xxxx-yyyy-zzzz-delivery-uuid",
  "paymentMethod": "COD",
  "cartItems": [
    { "sku": "product-sku-1", "quantity": 2 }
  ]
}
```

### Response

```json
{
  "response": {
    "status": 200,
    "message": "Checkout summary calculated successfully",
    "data": {
      "itemTotalAmount": 200.00,

      "couponId": "11111111-aaaa-bbbb-cccc-discount-uuid",
      "couponCode": "SAVE10",
      "couponDiscount": 20.00,
      "isCouponApplied": true,
      "couponError": null,
      "couponErrorMessage": null,

      "deliveryCouponId": "22222222-xxxx-yyyy-zzzz-delivery-uuid",
      "deliveryCouponCode": "FREEDEL",
      "isDeliveryCouponApplied": true,
      "deliveryCouponError": null,
      "deliveryCouponErrorMessage": null,

      "isFreeDelivery": true,
      "amountAfterCoupon": 180.00,
      "actualDeliveryFee": 30.00,
      "deliveryFee": 0.00,
      "packagingCharges": 5.00,
      "platformFee": 2.00,
      "payableAmount": 187.00
    }
  }
}
```

**What happened:**
- ₹200 cart → 10% off = ₹20 discount → ₹180
- Delivery fee ₹30 → waived to ₹0
- User pays ₹187 instead of ₹237

---

## Example — Two Discount Coupons Available, User Can Only Pick One

### Scenario

Restaurant has two discount offers:

| Code | Type | MOV | Discount |
|---|---|---|---|
| `DEAL10` | PERCENTAGE | ₹499 | 10% off, max ₹80 |
| `DEAL20` | PERCENTAGE | ₹999 | 20% off, max ₹200 |

User's cart total: ₹600

Frontend shows both coupons to the user. User picks `DEAL10` (since cart is ₹600, `DEAL20` requires ₹999 so MOV not met anyway). There is **only one `couponId` field** — so only one can ever be sent.

### Request — User applies DEAL10

```
POST http://localhost:8080/quickVerse/v3/cart/checkout-summary
Authorization: Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx
Content-Type: application/json

{
  "shopId": "68246",
  "couponId": "aaaa-1111-deal10-uuid",
  "paymentMethod": "COD",
  "cartItems": [
    { "sku": "product-sku-1", "quantity": 3 }
  ]
}
```

### Response

```json
{
  "response": {
    "status": 200,
    "message": "Checkout summary calculated successfully",
    "data": {
      "itemTotalAmount": 600.00,

      "couponId": "aaaa-1111-deal10-uuid",
      "couponCode": "DEAL10",
      "couponDiscount": 60.00,
      "isCouponApplied": true,
      "couponError": null,
      "couponErrorMessage": null,

      "deliveryCouponId": null,
      "deliveryCouponCode": null,
      "isDeliveryCouponApplied": false,

      "isFreeDelivery": false,
      "amountAfterCoupon": 540.00,
      "actualDeliveryFee": 30.00,
      "deliveryFee": 30.00,
      "packagingCharges": 5.00,
      "platformFee": 2.00,
      "payableAmount": 577.00
    }
  }
}
```

**What happened:**
- ₹600 cart → 10% off = ₹60 discount → ₹540
- Delivery fee ₹30 charged normally (no delivery coupon sent)
- User pays ₹577

### What if user tries to send both discount coupons?

```json
{
  "couponId": "aaaa-1111-deal10-uuid",
  "deliveryCouponId": "bbbb-2222-deal20-uuid"
}
```

Response — `DEAL20` is PERCENTAGE type, rejected from the delivery slot:
```json
{
  "isCouponApplied": true,
  "couponCode": "DEAL10",
  "couponDiscount": 60.00,

  "isDeliveryCouponApplied": false,
  "deliveryCouponError": "COUPON_WRONG_SLOT",
  "deliveryCouponErrorMessage": "Only free delivery coupons can be applied in the delivery coupon field."
}
```

**The system enforces it at the slot level** — FIXED/PERCENTAGE coupons are physically blocked from the delivery slot, so two discount coupons can never stack regardless of what the frontend sends.

---

## Error Cases

### Wrong slot — sending FREE_DELIVERY in couponId

```json
{
  "couponId": "uuid-of-FREEDEL-coupon",
  "deliveryCouponId": null
}
```

Response:
```json
{
  "isCouponApplied": false,
  "couponError": "COUPON_WRONG_SLOT",
  "couponErrorMessage": "This is a free delivery coupon. Apply it in the delivery coupon field."
}
```

### MOV not met

```json
{
  "couponId": "uuid-of-SAVE10",
  "cartItems": [{ "sku": "sku-1", "quantity": 1 }]
}
```
Cart total ₹50, MOV is ₹99 → Response:
```json
{
  "isCouponApplied": false,
  "couponError": "COUPON_MOV_NOT_MET",
  "couponErrorMessage": "Minimum order value of ₹99 required to use this coupon."
}
```

### Both fail independently — user still gets partial benefit

```json
{
  "couponId": "valid-discount-uuid",
  "deliveryCouponId": "expired-delivery-uuid"
}
```
Response — discount applies, delivery coupon fails:
```json
{
  "isCouponApplied": true,
  "couponDiscount": 20.00,

  "isDeliveryCouponApplied": false,
  "deliveryCouponError": "COUPON_INACTIVE",
  "deliveryCouponErrorMessage": "This delivery coupon is no longer active or has expired."
}
```
