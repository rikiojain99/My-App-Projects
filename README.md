# SJ Light House - Business Management App

Internal business app for billing, inventory, manufacturing, vendor ledger, expenses, and reports.

Built with Next.js App Router, TypeScript, Tailwind CSS, and MongoDB (Mongoose).

## Features

- Passkey-based login (`admin` and `employee`)
- Bills:
  - Fast bill
  - Add bill
  - View bill history
  - Daily sale close flow
- Inventory:
  - Add stock
  - View stock
  - Stock holdings
  - Low stock
  - Opening stock Excel upload
- Manufacturing:
  - Create manufactured items
  - View manufacturing history
- Vendors:
  - Vendor sale entry
  - Vendor ledger
  - Vendor payment tracking
- Reports:
  - Stock report
  - Profit report
  - Dashboard and payment summary APIs

## Tech Stack

- Next.js `16.x` (App Router)
- React `18.x`
- TypeScript
- Tailwind CSS `4.x`
- MongoDB + Mongoose
- Recharts
- XLSX

## Project Structure

```txt
app/
  api/                      # Backend API routes
  bills/                    # Billing screens
  inventory/                # Inventory screens
  manufacturing/            # Manufacturing screens
  vendors/                  # Vendor screens
  reports/, profit-report/  # Report screens
components/                 # Reusable UI and feature components
lib/                        # DB, auth, helpers, services
models/                     # Mongoose models
public/                     # Static assets
proxy.ts                    # API auth guard
```

## Requirements

- Node.js `18+` (recommended `20+`)
- npm
- MongoDB connection string

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` in project root:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>
AUTH_SECRET=replace-with-long-random-secret
ADMIN_PASSKEY=your-admin-passkey
EMPLOYEE_PASSKEY_1=employee-passkey-1
EMPLOYEE_PASSKEY_2=employee-passkey-2
EMPLOYEE_PASSKEY_3=employee-passkey-3
EMPLOYEE_PASSKEY_4=employee-passkey-4
```

3. Run development server:

```bash
npm run dev
```

4. Open:

`http://localhost:3000`

## Scripts

- `npm run dev` - start dev server (Turbopack)
- `npm run build` - production build
- `npm run start` - start production server
- `npm run lint` - run lint checks

## Authentication and Session Flow

- Login route: `POST /api/auth/verify`
- Logout route: `POST /api/auth/logout`
- Session check route: `GET /api/auth/verify-session`
- Non-auth API routes are guarded by `proxy.ts` using signed cookie token validation.

Important:
- `ADMIN_PASSKEY` is required.
- Set `AUTH_SECRET` in production (do not rely on defaults).

## Main App Routes

- `/` - Dashboard + login
- `/bills/add-bill`
- `/bills/fast-bill`
- `/bills/view-bills`
- `/inventory/add-stock` (alias)
- `/inventory/add-stoock` (legacy)
- `/inventory/stockView`
- `/inventory/stock-holdings`
- `/inventory/low-stock`
- `/inventory/opening-stock`
- `/inventory/add-inventory` (alias)
- `/inventory/add-inventry` (legacy)
- `/inventory/view-inventory` (alias)
- `/inventory/view-inventry` (legacy)
- `/manufacturing/create`
- `/manufacturing/history`
- `/vendors/sale`
- `/vendors/ledger`
- `/businessManagement/layout`
- `/reports/stockReport`
- `/profit-report`

## API Routes (High Level)

Auth:
- `POST /api/auth/verify`
- `POST /api/auth/logout`
- `GET /api/auth/verify-session`

Billing and sales:
- `/api/bills`
- `/api/bills/by-customer`
- `/api/daily-sale`
- `/api/daily-sale/close`
- `/api/customers`

Inventory and items:
- `/api/stock`
- `/api/stock/check`
- `/api/stock-holdings`
- `/api/inventory/opening-stock`
- `/api/inventory` (alias)
- `/api/inventry` (legacy)
- `/api/items`
- `/api/items/lookup`
- `/api/items/products`
- `/api/item-stock`

Manufacturing:
- `/api/manufacturing`
- `/api/manufacturing/products`

Vendors:
- `/api/vendors`
- `/api/vendor-sale`
- `/api/vendor-ledger`
- `/api/vendor-payment`

Reports:
- `/api/reports/dashboard`
- `/api/reports/low-stock`
- `/api/reports/stock`
- `/api/reports/profit`
- `/api/reports/payment-summary`
- `/api/reports/available-stock`

Other:
- `/api/expenses`
- `/api/users`

## Opening Stock Upload (Excel)

Screen: `/inventory/opening-stock`

Accepted column names (flexible parser):
- Item name: `Item Name`, `Name`, `name`, `item`
- Quantity: `Quantity`, `qty`, `quantity`
- Rate: `Rate`, `rate`, `Price`

Rules:
- Empty file is rejected
- Max `5000` rows
- Invalid rows are ignored
- Duplicate item names are de-duplicated (case-insensitive)
- Save overwrites opening stock quantities/rates

## Troubleshooting

1. Type errors referencing deleted pages in `.next/types/validator.ts`
- Regenerate route types:

```bash
npx next typegen
```

- Then run:

```bash
npx tsc --noEmit
```

2. `Please define the MONGODB_URI...`
- Ensure `MONGODB_URI` exists in `.env.local`.

3. `Server misconfigured: ADMIN_PASSKEY missing`
- Add `ADMIN_PASSKEY` in `.env.local`.

4. Unauthorized API responses
- Ensure login succeeded and `auth` cookie is present.

## Notes

- Some legacy misspelled routes remain for backward compatibility:
  - `add-stoock`, `add-inventry`, `view-inventry`, `api/inventry`
- Clean alias routes were added and should be used going forward.
