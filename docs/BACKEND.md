# AgroLoop Backend Documentation

## Overview

The backend supports the project workflow by exposing APIs for public research data,
role-owned farmer/hub/buyer records, procurement and sales accounting, inventory
movements, PDF documents, traceability and management reports.

## Purpose

The backend is an Express 5 and TypeScript API under `apps/api`. It uses Prisma for
PostgreSQL access, Zod for input validation and JWT cookies for session authentication.
The local API base URL is `/api/v1`, with health at `/health` and Swagger at `/api/docs`.

## Technology

- Node.js and Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Zod
- bcrypt
- JWT access and refresh cookies
- Helmet
- CORS
- Multer
- Express rate limiting
- Pino request/structured logging
- Supertest and Vitest

## Runtime entry

`apps/api/src/index.ts` initializes Express, security middleware, cookies, JSON parsing,
routes, Swagger and the global error response.

The API listens on `API_PORT`, default `4000`, except in Vitest test mode.

## Security middleware

- `helmet()` sets HTTP security headers.
- CORS allows the configured frontend origin and credentials.
- JSON payload size is limited to 1 MB.
- Cookie parser enables httpOnly JWT cookies.
- Auth endpoints use a 15-minute in-memory rate-limit window.
- Multer limits uploads to 5 MB and accepts JPEG, PNG and PDF MIME types.
- Passwords use bcrypt hashing.

## Authentication

### Access and refresh sessions

Login creates:

- a 15-minute access token stored in the `accessToken` httpOnly cookie
- a 7-day refresh token stored in the `refreshToken` httpOnly cookie

The refresh token is also persisted in the user's Prisma record. `/auth/logout`
clears both cookies and removes the persisted refresh token.

### Identity middleware

`auth` verifies `accessToken` and attaches `{ id, role }` to the request.

### Role middleware

`roles(...allowed)` rejects any authenticated request whose role is not in the allowed
role list. Admin access is also applied in several cross-role routes where explicit.

### Current demo roles

- `FARMER`
- `HUB_OPERATOR`
- `INDUSTRIAL_BUYER`
- `ADMIN`

`PUBLIC` is represented in shared contracts but is not a signed-in session role.

## Consistent response format

Successful responses use normal JSON or a route-specific status code.

Errors use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": null
  }
}
```

Every response is expected to include a request ID in the `x-request-id` header.

## Authentication endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/auth/register` | Register role account |
| POST | `/api/v1/auth/login` | Issue access and refresh cookies |
| POST | `/api/v1/auth/refresh` | Refresh access cookie |
| POST | `/api/v1/auth/logout` | Revoke and clear session |
| POST | `/api/v1/auth/verify-otp` | Apply mock OTP verification |
| GET | `/api/v1/auth/me` | Read current session and profiles |

Registration roles are limited to farmer, hub operator and industrial buyer. Admin
accounts are created by seed or administrative tooling.

## Public endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/public/residue-types` | Residue reference rows |
| GET | `/api/v1/public/fuel-benchmarks` | Energy benchmarks |
| POST | `/api/v1/public/contact` | Store public contact message |
| GET | `/api/v1/public/lots/:code` | Public lot and traceability lookup |
| GET | `/api/v1/marketplace/lots` | Filtered published lot inventory |

Public residue and benchmark routes contain demonstration fallback records if Prisma
cannot reach PostgreSQL. This keeps public reference views usable while the database
environment is unavailable; live database rows take precedence.

## Farmer endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/farmer/profile` | Read farmer profile |
| PUT | `/api/v1/farmer/profile` | Create or update profile |
| GET | `/api/v1/farmer/listings` | List owned listings |
| POST | `/api/v1/farmer/listings` | Create residue listing |
| POST | `/api/v1/farmer/listings/:id/pickup` | Request collection |
| GET | `/api/v1/farmer/hubs` | Return approved hubs with haversine distance |
| GET | `/api/v1/farmer/notifications` | Read owned notifications |

Listings require an existing farmer profile and are constrained to the authenticated
farmer's records.

## Hub endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/hub/listings` | View residue listings |
| POST | `/api/v1/hub/listings/:id/status` | Transition listing status |
| POST | `/api/v1/hub/intakes` | Record weighed intake |
| GET | `/api/v1/hub/dashboard` | Hub throughput and inventory totals |
| GET | `/api/v1/batches` | List owned or all batches |
| POST | `/api/v1/batches` | Create batch and calculate char yield |
| POST | `/api/v1/batches/:id/quality` | Add quality test and grade |
| POST | `/api/v1/batches/:id/lot` | Publish product lot |

Listing transitions are checked before updates:

```text
LISTED -> HUB_ACCEPTED -> PICKUP_SCHEDULED -> COLLECTED -> WEIGHED -> PAID
```

Rejected listings are terminal and illegal status jumps return `409 INVALID_TRANSITION`.

## Buyer and order endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| PUT | `/api/v1/buyer/profile` | Create or update buyer profile |
| POST | `/api/v1/buyer/enquiries` | Create RFQ/order from a lot |
| GET | `/api/v1/buyer/orders` | Read owned orders |
| POST | `/api/v1/orders/:id/status` | Transition an order status |

Order state follows:

```text
RFQ -> QUOTED -> ORDERED -> DISPATCHED -> DELIVERED -> ACCEPTED
```

Every accepted status mutation creates an `OrderEvent` and audit entry.

## Admin endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/admin/analytics` | Platform totals |
| GET | `/api/v1/admin/users` | List accounts and profiles |
| POST | `/api/v1/admin/users/:id/verify` | Verify or reject account |
| GET | `/api/v1/admin/audit` | Read recent audit records |
| GET | `/api/v1/admin/enquiries` | Read contact inbox |
| GET | `/api/v1/admin/export` | Export listing CSV or JSON |
| PUT | `/api/v1/admin/residue-types/:id` | Edit residue reference data |

## Carbon estimation

`POST /api/v1/carbon/batch/:batchId/estimate` creates an estimated MRV record using:

- avoided open-burning factor
- displaced fossil-coal quantity by HHV energy equivalence
- process emission
- transport emission

Formula:

```text
net estimated abatement =
avoided open-burning emissions
+ fossil-coal energy displacement
- process emissions
- transport emissions
```

The API stores the formula and assumptions. UI and exports must retain the text
“Estimated, not verified” and must not call the result a carbon credit.

## Upload handling

Uploads are stored under `apps/api/uploads` in local development. Supported MIME types
are JPEG, PNG and PDF; individual file size is limited to 5 MB. The Prisma model
stores original name, MIME type, size and storage key.

## Logging and request identity

Pino emits structured logs. Middleware creates or reads `x-request-id` and places the
same value in the response header. Status changes and admin actions create `AuditLog`
records where implemented.

## Procurement and sales API

| Endpoint group | Responsibility |
|---|---|
| `/api/v1/procurement/purchases` | Filter/list and create farmer purchases |
| `/api/v1/procurement/purchases/:id/confirm` | Confirm a draft and create residue stock movement |
| `/api/v1/procurement/purchases/:id/payments` | Record one or more mock purchase payments |
| `/api/v1/procurement/purchases/:id/receipt` | Generate a formatted purchase PDF voucher |
| `/api/v1/sales/customers` | Customer organization master |
| `/api/v1/sales` | Create/list lot-based sales |
| `/api/v1/sales/:id/confirm` | Transactionally reserve lot stock and confirm sale |
| `/api/v1/sales/:id/delivery` | Record dispatch/delivery/acceptance/dispute |
| `/api/v1/sales/:id/payments` | Record mock receivable payments |
| `/api/v1/sales/:id/invoice` | Generate a sales invoice |
| `/api/v1/inventory` | Report stock and stock movements |
| `/api/v1/reports/*` | Mass balance, profit estimate and ageing |

Purchase totals use server-side paise calculations. Confirmed sales are blocked when
item quantities exceed remaining `ProductLot.quantityKg`. Demo ledger fallbacks keep
public/demonstration access usable while PostgreSQL is unavailable.

## Role-first access

The application entry is login. Public endpoints remain available for research,
benchmarks and marketplace discovery. Procurement, sales and inventory routes require
hub/admin session roles. Farmer and buyer routes use profile ownership checks.

## Testing

- Vitest: `apps/api/src/index.test.ts`
- Supertest: health and API behavior
- Playwright: public browser flows
- Build: TypeScript compile for API and frontend workspaces
