# AgroLoop Database Documentation

## Overview

The database represents the complete operational chain of the project: residue
origin, purchase, intake, retort processing, quality verification, product lots,
buyer sales, carbon estimates and audit evidence.

## Purpose

The database is PostgreSQL, accessed through Prisma in `apps/api/prisma/schema.prisma`.
It stores all identities, profiles, residue listings, hub operations, quality evidence,
orders, carbon estimates and audit records.

## Technology

- PostgreSQL 16
- Prisma ORM
- Prisma migrations or `db push` for local development
- CUID primary keys
- PostgreSQL enums
- soft-delete fields on selected models

## Core relationship groups

### Identity

`User` is the central authenticated identity. It has optional profile relationships
for:

- `FarmerProfile`
- `HubProfile`
- `BuyerProfile`

Only one role profile is expected for a role-specific user.

### Supply origin

`FarmerProfile -> ResidueListing -> ResidueType`

A residue listing stores quantity, moisture, bale condition, location, available
collection window and listing status.

### Hub intake

`ResidueListing -> PickupRequest`

`ResidueListing -> IntakeRecord -> HubProfile`

The intake stores actual weighed quantity, moisture, shredding size and rejection
or moisture flag. Moisture above 15% is flagged for review.

### Batch and quality

`HubProfile -> Batch`

`Batch -> BatchInput -> IntakeRecord`

`Batch -> QualityTest`

`Batch -> ProductLot`

Batch char yield is output bio-coal divided by input kilograms × 100.

### Buyer and fulfilment

`BuyerProfile -> Order -> ProductLot`

`Order -> OrderEvent`

`Order -> Payment`

Order events preserve status history. Payments are mock record-keeping and must never
be represented as a real payment gateway transaction.

### Carbon and traceability

`Batch -> CarbonEstimate`

Traceability links farmer listing/intake → batch → product lot → order.
The public lot lookup exposes this chain when database records exist.

## Main enums

### `UserRole`

- `FARMER`
- `HUB_OPERATOR`
- `INDUSTRIAL_BUYER`
- `ADMIN`
- `PUBLIC`

### `VerificationStatus`

- `PENDING`
- `VERIFIED`
- `REJECTED`

### `ListingStatus`

- `LISTED`
- `HUB_ACCEPTED`
- `PICKUP_SCHEDULED`
- `COLLECTED`
- `WEIGHED`
- `PAID`
- `REJECTED`

### `BatchStatus`

- `PLANNED`
- `PROCESSING`
- `COMPLETE`
- `TEST_PENDING`
- `VERIFIED`
- `CANCELLED`

### `OrderStatus`

- `RFQ`
- `QUOTED`
- `ORDERED`
- `DISPATCHED`
- `DELIVERED`
- `ACCEPTED`
- `CANCELLED`

### `Provenance`

- `PROPOSAL_REPORTED`
- `LITERATURE`
- `MODELLED`
- `MEASURED`

## Model summary

| Model | Responsibility |
|---|---|
| `User` | Authentication identity, role and verification |
| `FarmerProfile` | Farmer/FPO location and land details |
| `HubProfile` | Capacity, location, retorts and approval |
| `BuyerProfile` | Industry and fuel requirements |
| `ResidueType` | Reference residue HHV, yield and provenance |
| `ResidueListing` | Farmer supply listing |
| `PickupRequest` | Collection or self-delivery request |
| `IntakeRecord` | Weighted and moisture-checked receipt |
| `Batch` | Retort process record |
| `BatchInput` | Input intake contribution |
| `QualityTest` | Laboratory fuel-quality results |
| `ProductLot` | Published bio-coal or acid inventory |
| `Enquiry` | Public or buyer enquiry |
| `Order` | Buyer order and delivery state |
| `OrderEvent` | Status-history entry |
| `Payment` | Explicit mock payment record |
| `EmissionFactor` | Admin-editable carbon factor |
| `CarbonEstimate` | Batch estimate, formula and assumptions |
| `FuelBenchmark` | Pellet, fossil-coal and bio-coal benchmarks |
| `Notification` | User notification |
| `AuditLog` | Actor, action, entity and before/after state |
| `FileUpload` | Upload metadata |
| `ContactMessage` | Public contact form record |
| `ContentBlock` | Localized editable page content |
| `Purchase` | Confirmed farmer purchase snapshot |
| `PurchasePayment` | Multiple mock purchase instalments |
| `Customer` | Buyer organization master |
| `Sale` | Lot-based customer dispatch and receivable |
| `SaleItem` | Lot quantity, unit, grade and HHV/ash snapshot |
| `SalePayment` | Multiple mock sales payments |
| `InventoryMovement` | Append-only stock ledger |
| `LedgerSetting` | Configurable ledger thresholds and prefixes |

## Seed data

The seed creates:

- 1 admin
- 3 farmers
- 2 hubs
- 2 buyers
- six residue rows
- three fuel benchmarks
- sample listing, intake, batch, quality test and lot

The residue seed includes:

| Residue | Raw kcal/kg | Bio-coal HHV | Char yield |
|---|---:|---:|---:|
| Paddy straw | 3,150 | 5,820 | 31.5% |
| Rice husk | 3,380 | 5,650 | 34.0% |
| Sugarcane bagasse | 3,850 | 6,180 | 29.0% |
| Arhar/gram stalks | 3,920 | 6,350 | 33.2% |
| Corn cobs | 4,050 | 6,480 | 30.8% |
| Wheat straw | null | null | null |

Wheat straw is seeded with `dataPending: true`.

Benchmarks:

- densified pellets: 3,800 kcal/kg
- fossil coal G12: 4,200 kcal/kg
- AgroLoop bio-coal: 6,100 kcal/kg

Every reference seed field uses `PROPOSAL_REPORTED` unless a more specific provenance
is introduced after experimental or literature validation.

## Demo credentials

All seed passwords are `AgroLoop123!`.

| Email | Role |
|---|---|
| `admin@agroloop.local` | ADMIN |
| `farmer1@agroloop.local` | FARMER |
| `hub1@agroloop.local` | HUB_OPERATOR |
| `buyer1@agroloop.local` | INDUSTRIAL_BUYER |

Additional seed users include `farmer2`, `farmer3`, `hub2` and `buyer2`.

## Database setup

### Docker

```powershell
docker compose up postgres -d
```

### Prisma

```powershell
npm run prisma -- generate
npm run prisma -- db push
npm run prisma -- db seed
```

For a migration-driven workflow:

```powershell
npm run prisma -- migrate dev --name agroloop_init
npm run prisma -- db seed
```

## Environment

Set `DATABASE_URL` in `.env`, for example:

```text
postgresql://agroloop:agroloop@localhost:5432/agroloop?schema=public
```

## Procurement and sales ledgers

`Purchase` stores immutable confirmed purchase snapshots with foreign links to a hub,
farmer, residue type and optional listing/intake record. `PurchasePayment` holds
multiple mock payment records; confirmed purchases add `PURCHASE_IN` inventory
movements.

`Customer` is the organization master and can optionally link to `BuyerProfile`.
`Sale` stores a dispatch/acceptance/payment transaction and links to hub, customer,
marketplace order and carbon estimate. `SaleItem` snapshots lot code, grade, HHV and
ash, while `SalePayment` stores mock receipts.

`InventoryMovement` is append-only stock evidence for purchases, batch consumption,
batch output, sales and adjustments. Overselling is blocked transactionally by
checking each `ProductLot.quantityKg` before confirmation.

`LedgerSetting` stores configurable moisture threshold, GST default, number prefixes
and price-band settings.

The procurement and sales chain is:

```text
FarmerProfile + ResidueListing + IntakeRecord
  -> Purchase -> PurchasePayment -> InventoryMovement(PURCHASE_IN)

ProductLot + Customer
  -> Sale -> SaleItem -> SalePayment -> InventoryMovement(SALE_OUT)
```

## Integrity and operations

- Add indexes to status and foreign-key query fields.
- Use transactions for listing and order status changes.
- Preserve soft-delete fields on users and key profiles where data history matters.
- Preserve provenance values on all reference/economic data.
- Never label carbon estimates as credits or verified reductions.
- Keep mock-payment status explicit.
- Record status and administrative mutations in `AuditLog`.
