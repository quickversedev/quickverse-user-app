# Backend Overview (qv/backend)

Reference notes for the Spring Boot backend that the React Native client talks to. Source lives at `~/Desktop/qv/backend` and is **read-only** for client work.

## Stack
- **Java 21**, **Spring Boot 3.5.3**, Maven (`./mvnw`)
- **PostgreSQL** via Hibernate (schema `qv`); Hibernate Spatial for `geometry(Point, 4326)` shop locations
- **Caffeine** cache (1000 items, 10-min TTL), `@EnableCaching`
- **Spring Retry**, `@EnableAsync` with multiple thread-pool executors
- **No Spring Security** — auth handled by a custom `RequestInterceptor`
- **WebClient** (reactive) for outbound HTTP to SmartBiz; `RestTemplate` only inside `LoginServiceImpl`

## Layout
```
org.quickverse.qvapp/
├── controller/      # REST endpoints (versioned: /v1, /v2, /v3)
├── service/ + impl/ # Interface + impl pairs
├── repository/      # Spring Data JPA + custom @Query
├── entity/          # 5 JPA entities in package; most live under schema/
├── schema/          # JPA entities (Shop, Order, Customer, etc.) + DTO-style classes
├── dto/             # Request/response DTOs
├── mapper/          # MapStruct mappers
├── interceptor/     # RequestInterceptor (JWT + ThreadLocal session)
├── util/            # CommonUtil, ApplicationEndPoints, QVErrorEnum, UserSession
├── event/, configuration/
```

## Auth model

- Custom JWT (jjwt). No Spring Security filter chain.
- `RequestInterceptor.preHandle` validates 3 headers per request:
  - `SessionKey: <jwt>`
  - `Request-Origin: CUSTOMER | TRANSPORTER | CAPTAIN | SUPER`
  - `Authorization: Basic ...` (basic-auth wrapping clientId/secret)
- Each role uses a different signing key (`quickverse.secret.key`, `quickverse.internal.key`, `quickverse.super.key`).
- On success, populates `UserSession` (ThreadLocal/MDC) with `userId` (mobile), `customerId`, `campusId`, `role`, etc. Services read from `UserSession.getUserId()`.
- Session-expiry error codes the client must handle:
  - `1042 QV_INVALID_JWT_TOKEN`
  - `1047 QV_INVALID_SESSION_EXCEPTION`

## SmartBiz proxy — the load-bearing fact

QuickVerse is **partly a proxy** in front of SmartBiz (Amazon StoreFront). `application.properties` configures:
- `store.front.URL=https://smartpos.amazon.in/`  ← used as `storeFrontURL`
- `smt.biz.url=https://api.smartbiz.in/`         ← used by `ProductServiceImpl`

Outbound endpoint constants live in `util/ApplicationEndPoints.java`:

| Constant | Path |
|---|---|
| `SMT_BIZ_CART` | `api-sp/resources/v3/cart?shopId={shopId}` |
| `SMT_BIZ_ADD_CART` | `api-sp/resources/v3/cart/items` |
| `SMT_BIZ_DELETE_CART` | `api-sp/resources/v3/cart/items/{productSku}?shopId=...&removeCompletely=...` |
| `SMT_BIZ_CLEAR_CART` | `api-sp/resources/v3/cart/items?shopId={shopId}` |
| `SMT_BIZ_PRODUCTS` | `api-unauthenticated/resources/external/catalog/products` |
| `SMT_BIZ_CATEGORY` | `stores/{shopId}/categories` |
| `SMT_BIZ_PRODUCT` | `stores/{vendorId}/v2/catalog/{productId}` |
| `SMT_BIZ_REGISTER_USER` | `api-customer/resources/v2/customer` |
| `SMT_BIZ_ADDRESS` | `api-customer/resources/v2/customer/address` |
| `SMT_BIZ_SHOP_ACTIVE_OFFER` | `stores/{shopId}/offers/availability/ACTIVE` |
| `SMT_BIZ_CUSTOMER_ACTIVE_OFFER` | `/stores/{shopId}/offers/customer?...` |
| `SMT_BIZ_VALIDATE_OFFER` | `stores/{shopId}/offers/code/{offerCode}` |
| `SMT_BIZ_APPLY_OFFER` | `api-sp/resources/v3/cart/offers?...` |
| `SMT_BIZ_ELIGIBLE_PAYMENT_METHOD` | `api-sp/resources/v3/payment/eligiblePaymentMethods?...` |
| `SMT_BIZ_CREATE_ORDER` | `api-orders/resources/v3/orders` |
| `SMT_BIZ_CREATE_PAYMENT` | `api-sp/resources/v3/payment/new` |
| `SMT_BIZ_FETCH_ORDER` | `api-orders/resources/v3/order/{orderId}?...` |
| `SMT_BIZ_CANCEL_ORDER` | `api-orders/resources/orders/{orderId}/cancel` |

**Outbound headers** (`CommonUtil.getAMZCARTHeaders(shopId)`):
- `X-Amz-Jwt: <generated SmartBiz JWT>` — short-lived, mobile claim, signed with `store.front.secret`
- `Request-Origin: QUICKVERSE`
- `X-Amz-ShopId: <shopId>` (only when shopId is provided)

So when you see `/v3/{shopId}/category` succeed for a shop that isn't in QV's vendor table — that's because `ProductController.getCategories` calls `ProductServiceImpl.getCategories` which forwards directly to `SMT_BIZ_CATEGORY`. **The QV side does no shop-existence check; SmartBiz answers if it knows the shop.**

## Onboarding gate — what *does* require a real shop in QV's DB

These flows hit QV's own PostgreSQL `qv.shop` table (entity `schema/Shop.java`, repo `ShopRepository`):
- **Order creation:** `OrderController POST /v2/order/createOrder` → `OrderServiceImpl.createOrder(CreateOrderDTO)` does call out to SmartBiz (`SMT_BIZ_CREATE_ORDER`), but `getAMZCARTHeaders` requires `shopId`, and downstream order persistence/joins assume the shop exists in `qv.shop`. A shop SmartBiz knows but QV doesn't will 404 here.
- **Address listing:** `AddressController GET /v2/listAddresses?shopId=X` → `AddressServiceImpl.listSMTBIZAddresses(shopId)` — the address record is keyed against the shop in QV's storage.
- **Vendor list / shop list:** `ShopController GET /v3/shops?lon=&lat=&radius=` returns only shops registered in `qv.shop` (uses a Hibernate Spatial radius query).
- **Region-based vendor list, offers, pricing config, ratings** — all keyed by `shopId` in QV DB.

To onboard a shop:
- `POST /v3/shops` with a `ShopRequest` (shopId, regionId, name, address, lat/lon, openingTime, closingTime, category, etc.). Service is `ShopServiceImpl.addShop`. There's also `enableShop(shopId)` to flip `storeEnabled`.

## Controller surface (versioned)

All paths are prefixed with `/quickVerse/{v1|v2|v3}`. Headers required: `SessionKey`, `Request-Origin`, `Authorization`.

### `/quickVerse/v1`
| Method | Path | Controller |
|---|---|---|
| POST | `/login` | LoginController |
| POST | `/requestOtp` | LoginController |
| POST | `/verifyOtp` | LoginController |
| POST | `/register/customer` | LoginController |
| GET / DELETE | `/customer` | LoginController |
| GET | `/customers/filter` | LoginController |
| POST | `/updateDevice`, `/updateCaptainDevice` | LoginController |
| POST | `/authorization`, `/clientAuthorization` | SessionController |
| DELETE | `/logout` | LogoutController |
| GET / POST | `/campus`, `/addCampus`, `/campus/{campusId}/vendors` | HomePageController |
| POST / PUT | `/vendor`, `/updateVendor` | HomePageController |
| POST / GET | `/featuredItem`, `/campus/{campusId}/featuredItem` | HomePageController |
| GET / POST | `/campus/{campusId}/laundryItems`, `/laundryItems` | MiscServiceController |
| GET | `/initialConfig`, `/FAQs` | MiscServiceController |
| POST | `/configuration` | MiscServiceController |

### `/quickVerse/v2`
| Method | Path | Controller |
|---|---|---|
| GET | `/getCart` | CartController |
| POST | `/addCart` | CartController |
| DELETE | `/deleteCart`, `/clearCart` | CartController |
| GET / POST / PUT / DELETE | `/addresses`, `/addresses/{id}` | AddressController |
| GET | `/listAddresses?shopId=` | AddressController |
| GET | `/addressId` | AddressController |
| POST | `/order/createOrder`, `/order/createQVOrder` | OrderController |
| GET | `/order/getOrders`, `/order/{orderId}`, `/order/OrderStatus`, `/order/fetchOrder`, `/order/region-orders` | OrderController |
| POST | `/order/getSMZBIZOrders`, `/orderAlert` | OrderController |
| PUT | `/order/cancelOrder` | OrderController |
| POST/etc. | `/notification/...` (send, send-multicast, send-topic, broadcast, etc.) | NotificationController |

### `/quickVerse/v3`
| Method | Path | Controller |
|---|---|---|
| GET | `/{shopId}/category` | ProductController (proxies SmartBiz) |
| GET / POST | `/products` | ProductController |
| GET | `/product/{productSKU}`, `/subproducts` | ProductController |
| POST / DELETE | `/addProducts`, `/campus/products/delete` | ProductController |
| GET / POST | `/shops` | ShopController |
| GET | `/search` | SearchController |
| GET / POST | `/regions`, `/regions/shops` | RegionController |
| GET / POST | `/pages`, `/page`, `/page/{pageId}` (DELETE) | PageController |
| POST / DELETE | `/promotion`, `/promotion/{promoId}` | PromotionController |
| POST | `/ratings` | RatingController |
| GET / POST | `/theme` | ThemeController |
| GET / POST | `/{shopId}/Offers`, `/Offers/Customer`, `/Offers/Validate`, `/Offers/Apply` | OffersController |
| GET / POST | `/payment/eligiblePaymentMethods`, `/payment/create` | PaymentController |
| GET / POST / PUT / DELETE | `/pricing-configurations`, `/pricing-configurations/{id}`, `/pricing-configurations/summary` | PricingConfigurationController |

## Error envelope

Centralised in `GenericExceptionHandler` + `QuickVerseServiceException`. Errors come back as the `Mdx` schema:
```json
{ "error": { "code": "1025", "message": "Error Occurred while retrieving the Cart Item from Amazon" } }
```

`QVErrorEnum` (selected — see `util/QVErrorEnum.java` for full list):

| Code | Meaning |
|---|---|
| 1001 | JWT token retrieval error |
| 1002 | Login error |
| 1004 | Unauthorised |
| 1005 / 1039 | Customer registration error |
| 1006 | User doesn't exist |
| 1007 | Customer already exists |
| 1010 | Server error |
| 1020 | Create order error |
| 1022 / 1023 | OTP send / verify error |
| 1025 / 1026 / 1027 / 1028 | Cart fetch / delete / add / item-not-found (SmartBiz cart) |
| 1029 / 1033 | SmartBiz orders / products fetch error |
| 1034 | SmartBiz category fetch error |
| 1036 | Vendor not found |
| 1038 | Empty cart |
| 1040 / 1041 | Address save / list (SmartBiz) |
| **1042** | **Invalid JWT — client triggers logout** |
| 1043 | Shop retrieval error |
| 1044 | Invalid OTP |
| 1046 | Missing authentication |
| **1047** | **Invalid session key — client triggers logout** |
| 1048 / 1049 | Device exists / update |
| 1050 | Page retrieval error |

## Key entities (PostgreSQL `qv` schema)

Located under `schema/`:
- `Shop` — `shop_id` (PK string), name, address (1:1 `ShopAddress`), `Point location` (SRID 4326), opening/closing time, category, `storeActive`, `storeEnabled`, `isFeatured`. Hibernate Spatial for `findAllByLocationAndRadius`.
- `Customer`, `User`, `UserAddress`, `Address` — customer + addresses
- `Order`, `OrderItem`, `Orders` — order persistence (parallel to SmartBiz)
- `Product`, `ProductTag`, `ProductImages`, `ProductAttributes`, `VariantAttributes`
- `Vendor`, `Region`, `Campus`, `Promotion`, `FeaturedItem`, `CampusBuzz`, `LaundryItem`
- `PricingConfiguration` — drives platform/delivery/GST/commission/packaging fees the client reads via `/v3/pricing-configurations`
- `Theme`, `Pages`, `Faqs`, `Configuration`, `DeliveryPartner`, `DeviceInfo`, `Rating`, `Session`

## External integrations (configured in `application.properties`)

- **Twilio** — SMS/OTP
- **Message Central (U2OPia)** — secondary OTP gateway
- **Firebase Admin** — FCM push notifications (project `quickverse-app`); credentials at `firebase/service-account-file.json`
- **SmartBiz / Amazon StoreFront** — primary commerce backend (cart, orders, payment, catalog, addresses, offers)
- **AWS S3** — delivery-partner document storage (`delivery-partner-qv-documents`)
- **AWS RDS** PostgreSQL (prod), `localhost:5432/quickverse_local` for `local` profile
- **JavaMail** via Gmail SMTP for transactional email

## Deployment

- GitHub Actions (`.github/workflows/cicd.yml`) builds Docker image (multi-stage), pushes to AWS ECR
- JVM tuned with `-XX:+UseG1GC -XX:MaxGCPauseMillis=200`
- Local profile: `./mvnw spring-boot:run -Dspring-boot.run.profiles=local` (sets `vendorUrl=https://beta.smartbiz.in/`, enables `otp.mock.enabled=true`)

## Practical notes for client-side work

1. **Adding a new vendor to the user-facing vendor list** requires backend onboarding via `POST /v3/shops` (vendor must exist in `qv.shop`). SmartBiz alone is not enough — addresses and orders both fail without a QV record.
2. **`/v3/{shopId}/category` is a passthrough**, so the catalog will appear for any SmartBiz-known shop even if it's not onboarded — useful for previewing but misleading. Don't infer "shop is onboarded" from category fetch success.
3. **Per-shop address book** (`/v2/listAddresses?shopId=`) is keyed against the QV shop record; addresses do not cross-pollinate between shops.
4. **`/v2/addresses`** (no shopId) is the user's global address book — read by the Profile screen, not by the cart flow.
5. **Auto-logout codes**: 1042 / 1047 — client should clear MMKV and reset all Zustand stores.
6. **Service-pair pattern**: every service has `service/Foo.java` (interface) + `service/impl/FooImpl.java`. Logic lives in the impl.
