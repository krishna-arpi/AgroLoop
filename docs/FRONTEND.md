# AgroLoop Frontend Documentation

## Overview

AgroLoop's frontend presents the project as a circular rural bioeconomy platform:
farmers submit residue offers, hubs process and verify batches, and industrial buyers
purchase quality-identified products. The interface contains public research,
role-specific workflows and operational ledgers.

## Purpose

The frontend is a React 18 and TypeScript single-page application under `apps/web`.
Vite serves it on port `6999`. It provides the public research site, role-based
portals, API-backed data views and responsive earth-tone interface.

## Technology

- React 18 and React Router
- TypeScript
- Vite
- Native CSS in `apps/web/src/styles.css`
- Fetch-based API client
- React state for page and form data
- Recharts and Leaflet dependencies are reserved for analytical and map surfaces

## Application entry

`apps/web/src/main.tsx` contains the application entry and route/component definitions.

- `ReactDOM.createRoot` mounts the app.
- `BrowserRouter` provides client-side navigation.
- `Routes` maps each URL to a public or guarded page.
- `Layout` supplies the header, navigation and dark-mode state.
- `api()` performs credentialed API requests and converts API errors into JavaScript errors.
- `Provenance` renders proposal, literature, modelled or measured badges.

## Routes

| Route | Component | Access | Purpose |
|---|---|---|---|
| `/` | `Login` | PUBLIC | Login-first application entry |
| `/research` | `Research` | PUBLIC | Detailed proposal, methodology and literature |
| `/data` | `DataPage` | PUBLIC | Residue comparison and hub economics calculator |
| `/marketplace` | `Marketplace` | PUBLIC | Filterable published lot inventory |
| `/lot/:code` | `LotLookup` | PUBLIC | Lot traceability lookup |
| `/login` | `Login` | PUBLIC | Email/password sign-in |
| `/register` | `Register` | PUBLIC | Role registration |
| `/farmer` | `Farmer` | FARMER/ADMIN | Profile, listings, hubs and notifications |
| `/hub` | `Hub` | HUB_OPERATOR/ADMIN | Intake, batch, quality and lot operations |
| `/buyer` | `Buyer` | INDUSTRIAL_BUYER/ADMIN | Marketplace RFQ and order flow |
| `/admin` | `Admin` | ADMIN | Analytics, users, references and audit data |
| `/procurement` | `Procurement` | HUB_OPERATOR/ADMIN | Purchase ledger, payments and receipt export |
| `/sales` | `SalesLedger` | HUB_OPERATOR/ADMIN | Customers, sales, delivery and invoice export |
| `/inventory` | `InventoryAndReports` | HUB_OPERATOR/ADMIN | Residue/product stock and movements |
| `/reports` | `InventoryAndReports` | HUB_OPERATOR/ADMIN | Mass balance, margin and receivables |

## Shared UI behavior

### Layout and navigation

`Layout` renders the AgroLoop brand, public navigation and dark-mode toggle. The toggle
updates `document.documentElement.dataset.theme`, allowing CSS theme selectors to
change surfaces without remounting.

### Provenance badges

`Provenance` is used for residue, benchmark, lot and economic values. The supported
UI values are:

- `PROPOSAL_REPORTED`
- `LITERATURE`
- `MODELLED`
- `MEASURED`

Carbon UI uses an additional explicit estimated/not-verified badge.

### Loading, empty and error states

Screens include loading or status text for async work. API failures are converted to
page-level notices, and empty arrays display descriptive text rather than fabricated
success. Form submissions show success or error notices where implemented.

## Component details

### `Home`

The landing page explains the three participating groups and provides links to the
research and residue-data views.

### `Research`

The research page presents:

1. The ecological and economic problem.
2. Three research objectives.
3. Five interactive process stages.
4. Feedstock preparation and operating parameters.
5. Residue analytical table.
6. Energy-density benchmarks.
7. Proposal techno-economic figures.
8. Literature mapping and research gaps.
9. Project references and DOI-verification notice.

The process-stage buttons change the explanatory panel and retain the operating target
for the selected stage.

### `DataPage`

The data page fetches residue types and benchmark fuel values. It allows a residue
selection, renders normalized energy bars and provides a hub economics calculator.

Calculator outputs:

- farmer payout range: processing tonnes/day × ₹1,800–₹2,200
- bio-coal output: tonnes/day × 1,000 kg × residue char yield
- pyroligneous-acid target: tonnes/day × 1,000 kg × 0.021 L/kg

The footnote explains that the proposal's 3,450 kcal/kg average differs from the
dynamic mean of the five seed residue rows.

### `Login` and `Register`

Login posts credentials and relies on httpOnly access/refresh cookies. Registration
accepts email, phone, password and role and directs new users to the login screen.
Mock OTP verification is exposed by the backend authentication API.

### `useMe` and `Guard`

`useMe` calls `/auth/me`. `Guard` waits for the session lookup, redirects unauthenticated
users to login and compares the returned role with the protected route role.

### `Farmer`

The farmer screen contains:

- profile fields for name, village, district, state, land area and FPO
- a residue-listing form
- nearest-hub output
- listing status and pickup action

The UI posts values using the `Farmer` API and reloads the page data after mutations.

### `Hub`

The hub screen contains dashboard totals, intake listings, status transitions, batch
creation, quality-test entry and lot publication. Batch char yield is calculated by
the backend from input/output kilograms.

### `Marketplace`

The marketplace provides three independent filters:

- quality grade
- product type
- maximum price per tonne

Each lot card contains:

- lot code
- product
- grade
- quantity
- offer price
- HHV
- ash percentage
- moisture percentage
- provenance
- traceability link

The page supports clear-filter and no-result states.

### `LotLookup`

The public lookup route requests `/public/lots/:code` and renders hub, batch, farmer
intake, quality and order information when a database lot exists.

### `Buyer`

The buyer screen lists marketplace lots, sends RFQs and displays order status/history.
It includes a quantity-based material request form that calculates an indicative
purchase value from the selected lot's listed rate. Final price and taxes are marked
for hub confirmation. The buyer is shown only own/related order activity.

### `Admin`

The admin screen shows platform analytics, users, reference residue rows, enquiry
messages and audit entries. It exposes verification actions and CSV export.

### `Procurement`

The procurement ledger shows purchase totals, 25 seeded demo records when the database
is unavailable, payment status, a new-purchase form and confirm/pay actions. It links
to formatted PDF purchase receipts and CSV/Excel exports.

### `SalesLedger`

The sales ledger supports customer masters, lot-based draft sales, GST/freight inputs,
mock payments, delivery status and PDF tax-invoice-style documents. Confirmed sales
decrease lot availability in the database-backed flow.

### `InventoryAndReports`

This screen combines residue stock, product-lot stock, mass-balance inputs,
management-estimate margin and receivables ageing.

## Responsive and accessibility behavior

- Minimum content target width: 360 px
- Mobile grids collapse to one column.
- Header navigation trims secondary public links on small screens.
- Tables use horizontal overflow where needed.
- Form controls use visible labels.
- Buttons and links have keyboard focus behavior through native elements.
- Dark mode is available from the header.

## API configuration

The frontend normally uses the browser host and port `4000`, for example
`http://192.168.1.25:4000/api/v1` when the web page is loaded from
`http://192.168.1.25:6999`. This prevents network browsers from sending API calls
to their own `localhost`.

Set `VITE_API_URL` for a reverse proxy or hosted deployment. The value is the API
origin only, not `/api/v1`.

## Frontend testing

Playwright tests cover public research/data rendering, lot lookup and the marketplace
grade/product filters. Test configuration is in `playwright.config.ts`.
