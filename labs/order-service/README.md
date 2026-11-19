# order-service

Reference project for the Spring Boot interview labs (week 4 onwards). The same project is
extended lab after lab: REST + validation + ProblemDetail (lab 4), transaction bugs (lab 5),
then N+1/locking/index (lab 6) and security/cache/testing (lab 7).

Stack: Spring Boot 3.5.16, Java 21, Spring Data JPA (Hibernate 6.6), PostgreSQL 16,
Spring Security (OAuth2 resource server, HS256 JWT), Redis 7 cache, Maven wrapper.
Tests use JUnit 5, MockMvc, spring-security-test, H2 and Testcontainers.

## Run the app

```bash
docker compose up -d       # PostgreSQL 16 on localhost:5432, Redis 7 on localhost:6379
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

- Port 8080 busy? Add `-Dspring-boot.run.arguments=--server.port=8088`.
- Condition Evaluation Report: `-Dspring-boot.run.arguments=--debug`.
- Stop and wipe the database: `docker compose down -v`.

- JWT secret: `JWT_SECRET` env var (at least 32 bytes). The value in `application.yml` is a
  dev-only fallback.

### Get a token

Demo users (in-memory, BCrypt): `admin` / `admin123` (roles ADMIN, USER) and
`user` / `user123` (role USER).

```bash
TOKEN=$(curl -s -X POST localhost:8080/auth/login -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' | sed 's/.*"accessToken":"\([^"]*\)".*/\1/')
AUTH="Authorization: Bearer $TOKEN"
```

Response: `{"accessToken":"eyJ...","tokenType":"Bearer","expiresIn":900}`. Claims: `iss`,
`sub`, `iat`, `exp` (15 min), `roles` (e.g. `["ADMIN","USER"]`).

Quick check:

```bash
curl -s -X POST localhost:8080/customers -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"name":"An","email":"an@example.com"}'
curl -s -X POST localhost:8080/products -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"name":"Keyboard","price":100.00,"stock":10}'
curl -s -X POST localhost:8080/orders -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"customerId":1,"items":[{"productId":1,"quantity":2}]}'
curl -s "localhost:8080/orders?fetch=NAIVE" -H "$AUTH"   # compare SQL in the log
curl -s localhost:8080/products/1                       # public, cached in Redis
curl -s localhost:8080/actuator/health
```

### Security rules

| Request | Rule |
|---|---|
| `POST /auth/login`, `/actuator/health/**`, `/actuator/info`, `GET /products/**` | public |
| `POST/PUT/DELETE /products/**`, `/customers/**` | role `ADMIN` |
| everything else (`/orders/**`) | any valid token |

No/invalid token: 401 with `WWW-Authenticate: Bearer ...`. Valid token, wrong role: 403.
Wrong password on login: 401 ProblemDetail.

## Profiles

| Profile | Database | Used by |
|---|---|---|
| `dev` | PostgreSQL + Redis from `docker-compose.yml`, `ddl-auto: update`, SQL logged, Hibernate statistics ("Session Metrics" per request) | local run |
| `test` | embedded H2 (`create-drop`), or PostgreSQL when a test imports `PostgresTestcontainersConfig`; cache off (`spring.cache.type: none`), Redis health off | tests |
| `lab5` | adds the lab 5 demo beans (`com.shop.orderservice.lab5`) | lab 5 tests only |

Labs 6 and 7 add no profile-only beans: their demo code lives in the tests
(`src/test/java/.../lab6`, `.../lab7`), and the features themselves (fetch strategies,
`@Version`, atomic stock update, index, JWT, cache) are real application code.

## Run the tests

```bash
./mvnw -q test                              # all tests (Docker must be running)
./mvnw test -Dtest='ApiErrorWebMvcTest'     # one class
```

Lab 5, 6 and 7 tests start `postgres:16-alpine` (and `redis:7-alpine` for the cache test)
through Testcontainers; containers are removed automatically when the JVM exits.

## API

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/login` | `{username,password}` to `{accessToken,tokenType,expiresIn}`; 401 if wrong |
| POST | `/customers` | 201 + Location |
| GET | `/customers/{id}` | 404 ProblemDetail if missing |
| POST/GET | `/products` | create / list (list is `@Timed`) |
| GET/PUT/DELETE | `/products/{id}` | GET cached in Redis (`product::{id}`, TTL 10 min); PUT/DELETE evict |
| POST | `/orders` | creates order + items, takes stock; 422 `INSUFFICIENT_STOCK` |
| GET | `/orders?fetch=` | `ENTITY_GRAPH` (default), `JOIN_FETCH`, or `NAIVE` (N+1 kept for lab 6) |
| GET | `/orders/{id}` | |
| GET | `/actuator/health` (+ `/liveness`, `/readiness`) | only `health` and `info` exposed |

## Package map

| Package | Content |
|---|---|
| `common` | `GlobalExceptionHandler` (ProblemDetail 400/401/404/422/500), `Timed` + `TimingAspect`, base exceptions, `CacheConfig` (Redis JSON, TTL, transaction-aware) |
| `security` | `SecurityConfig` (filter chain, JWT encoder/decoder, demo users), `AuthController`, `JwtProperties` |
| `customer`, `product`, `order` | entities, repositories, services, controllers, DTO records |
| `audit` | `AuditService.record()` with `REQUIRES_NEW` |
| `notification` | `OrderPlacedEvent`, `OrderEmailListener` (`AFTER_COMMIT`), `EmailSender`, `NotificationLogService` (`REQUIRES_NEW`) |
| `lab5` | buggy vs fixed services for lab 5, active only with profile `lab5` |

## Lab map

| Lab | Main code | Tests |
|---|---|---|
| Lab 4: setup, REST, validation, ProblemDetail, AOP, Actuator | `common`, `customer`, `product`, `order` | `order/ApiErrorWebMvcTest` (400/404/422 bodies), `OrderFlowIntegrationTest` (happy path over HTTP, H2) |
| Lab 5 (1) self-invocation | `lab5/SelfInvocationOrderService` | `lab5/SelfInvocationTest` |
| Lab 5 (2) checked exception commits | `lab5/CheckoutService` | `lab5/CheckedExceptionRollbackTest` |
| Lab 5 (3) audit with `REQUIRES_NEW` | `audit/AuditService`, `lab5/AuditedOrderService` | `lab5/AuditRequiresNewTest` |
| Lab 5 (4) `UnexpectedRollbackException` | `lab5/LoyaltyCheckoutService`, `lab5/LoyaltyService` | `lab5/UnexpectedRollbackTest` |
| Lab 5 (5) `AFTER_COMMIT` email + write caveat | `notification/OrderEmailListener`, `lab5/EagerEmailListener`, `lab5/LostWriteListener` | `lab5/TransactionalEventTest` |

| Lab 6 (1) N+1 and 3 fixes | `order/OrderRepository` (JOIN FETCH, `@EntityGraph`), `OrderService.findAll(FetchStrategy)` | `lab6/NPlusOneTest`, `lab6/BatchFetchSizeTest` (`default_batch_fetch_size=50`) |
| Lab 6 (2) `@Version` vs atomic UPDATE | `product/Product` (`@Version`), `ProductRepository.decreaseStockAtomically` | `lab6/OptimisticLockTest` |
| Lab 6 (3) 100k orders + EXPLAIN ANALYZE | `order/Order` (`@Table(indexes = ...)`) | `lab6/OrderIndexExplainTest` |
| Lab 7 (1) JWT, roles, 401 vs 403 | `security/*` | `lab7/SecurityRulesWebMvcTest`, `lab7/DefaultSliceSecurityWebMvcTest`, `lab7/SecuredOrderFlowIntegrationTest` |
| Lab 7 (2) Redis `@Cacheable` + TTL + evict | `common/CacheConfig`, `ProductService`, `OrderService` (evicts stock) | `lab7/ProductCacheTest` |
| Lab 7 (3) test slices | | `@WebMvcTest`: `lab7/SecurityRulesWebMvcTest`; `@DataJpaTest`: `lab7/ProductRepositoryDataJpaTest`; Testcontainers `@ServiceConnection`: `lab7/SecuredOrderFlowIntegrationTest` |

Notes:
- `@WebMvcTest` does not load our `SecurityConfig` on its own (Boot's default security then
  protects every URL, see `DefaultSliceSecurityWebMvcTest`), so web-slice tests
  `@Import(SecurityConfig.class)` and use `@WithMockUser` or `jwt()`.
- Kafka (`OrderCreated` event) from the week 7 roadmap is an optional bonus and is not
  implemented.

Lab 5 tests are intentionally not `@Transactional`: a test transaction would hide
commit-time behaviour. Each test reseeds the database in `Lab5TestBase`.
