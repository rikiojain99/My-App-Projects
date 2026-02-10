MASTER PROJECT PROMPT
(Dashboard + Auth Context + Header + API Protection)

You are helping me build a NEW production-ready web app
based on an existing POS / Billing system that already works well.

STACK (FIXED – DO NOT CHANGE):
- Next.js (App Router, TypeScript)
- Tailwind CSS
- MongoDB (Mongoose)
- Client-side auth (simple passkey model)
- Mobile-first UI (primary users are mobile)
- Desktop support is secondary (tablets / PC allowed)

IMPORTANT RULES:
- DO NOT redesign UI unless explicitly asked
- DO NOT introduce NextAuth, JWT, OAuth, or complex auth
- DO NOT use deprecated middleware for auth
- DO NOT break navigation, header visibility, or hook order
- Prefer simplicity and reliability over abstraction

--------------------------------------------------
🔐 AUTHENTICATION MODEL (VERY IMPORTANT)
--------------------------------------------------

AUTH TYPE:
- Passkey-based authentication
- Cookie-based flag: `auth=true`
- No user accounts, no passwords
- Intended for internal business use (shop / staff)

AUTH RULES:
1. AuthProvider is the SINGLE source of truth for UI auth
2. Header must NOT render if user is not authenticated
3. Pages should gracefully show login or redirect logic
4. APIs must independently verify auth via cookies
5. Client-side auth = UX protection
6. API auth = real security

DO NOT:
- Put auth logic inside Header
- Rely on middleware for auth
- Conditionally call hooks
- Block rendering with auth checks

--------------------------------------------------
🛡️ API PROTECTION RULES (CRITICAL)
--------------------------------------------------

GOAL:
- Prevent anyone from accessing API endpoints directly
- Prevent reading, writing, or deleting data without auth
- Protect data even if someone opens `/api/*` URLs manually

API AUTH MODEL:
- Every **protected API route** must:
  - Read cookies from the request
  - Verify `auth === "true"`
  - Reject unauthenticated access with `401 Unauthorized`

RULES:
1. API protection is REQUIRED for:
   - /api/bills
   - /api/customers
   - /api/items
   - /api/inventory
   - /api/manufacturing
   - /api/reports
2. Public APIs (if any) must be explicitly documented
3. Never trust the frontend — always validate on server
4. Never assume AuthProvider = API auth
5. No middleware-based API protection

IMPLEMENTATION GUIDELINE:
- Use a small reusable helper, e.g.:

  - `requireAuth(req)`
  - or inline cookie check per route

EXAMPLE BEHAVIOR:
- If cookie missing → return 401 JSON
- If cookie invalid → return 401 JSON
- If authenticated → proceed normally

DO NOT:
- Redirect from APIs
- Return HTML pages from APIs
- Leak partial data on failure
- Allow “read-only” access without auth

--------------------------------------------------
🧭 HEADER & NAVIGATION RULES
--------------------------------------------------

HEADER:
- Sticky top header
- Visible ONLY when authenticated
- Contains:
  - Logo / App name
  - Primary navigation buttons
  - Logout action
- Header must NEVER:
  - Fetch critical page data
  - Decide auth rules
  - Cause redirects
  - Block navigation

NAVIGATION:
- Use <Link> whenever possible
- router.push only for programmatic navigation
- Paths must be predictable:
  - /
  - /bills
  - /inventory
  - /manufacturing
  - /reports

--------------------------------------------------
📊 DASHBOARD RULES
--------------------------------------------------

DASHBOARD PURPOSE:
- Fast landing page after login
- One-click access to main actions
- Mobile-friendly layout
- No heavy charts or animations

DASHBOARD FEATURES:
- Summary cards (counts)
- Action buttons (Add Bill, View Bills, etc.)
- Must load even if API calls fail (graceful fallback)
- Must not depend on Header state

--------------------------------------------------
🎨 UI / UX DESIGN RULES
--------------------------------------------------

GLOBAL UX:
- Mobile-first (PRIMARY)
- Desktop/tablet supported
- Touch-friendly buttons
- Large tap targets
- Minimal text, clear labels

ANIMATION:
- On app load, show a splash / image popup
- Duration: ~1.5 seconds
- After splash → login or dashboard
- Animation must NOT block app logic

GLOBAL STYLES:
- Tailwind CSS only
- global.css must include:
  - Base resets
  - Font smoothing
  - Mobile safe-area handling
  - No heavy custom CSS

--------------------------------------------------
📁 PROJECT STRUCTURE (MANDATORY)
--------------------------------------------------

/app
  /layout.tsx
  /page.tsx
  /bills
  /inventory
  /manufacturing
  /reports
  /api

/components
  /auth
    AuthProvider.tsx
    ProtectedRoute.tsx
  /layout
    Header.tsx
  /dashboard
  /billing
  /inventory

/lib
  mongodb.ts

/models
  Bill.ts
  Customer.ts
  Item.ts
  ItemStock.ts
  Manufacturing.ts

/styles
  globals.css

--------------------------------------------------
⚠️ KNOWN PITFALLS (DO NOT REPEAT)
--------------------------------------------------

- ❌ Conditional hooks inside Header or AuthProvider
- ❌ Using middleware for auth redirects
- ❌ Rendering Header before auth is known
- ❌ Mixing UI auth with API auth
- ❌ Overengineering roles or permissions
- ❌ Breaking mobile UX for desktop layout
- ❌ Leaving APIs unprotected

--------------------------------------------------
🎯 PROJECT GOALS
--------------------------------------------------

This app should:
- Be fast on low-end mobile devices
- Be safe against direct API access
- Be stable under real shop usage
- Allow:
  - Billing
  - Inventory
  - Manufacturing
  - Reports
- Reuse UI/UX patterns already proven

--------------------------------------------------
🧠 DEVELOPMENT PHILOSOPHY
--------------------------------------------------

- Stability > Features
- Clarity > Cleverness
- Explicit > Implicit
- Mobile UX first
- APIs are defensive
- UI is forgiving

When suggesting changes:
- Explain WHY
- Mention trade-offs
- Avoid breaking existing behavior

--------------------------------------------------
START BY:
1. Setting up global layout + splash screen
2. Implementing AuthProvider
3. Protecting APIs correctly
4. Building Header with correct visibility
5. Creating Dashboard page
6. Locking navigation flow




\\\\\/////

MASTER PROMPT — BILLING SYSTEM CONTEXT (COPY & PASTE)
You are now working INSIDE an existing POS system
that already has global rules for:

- AuthProvider
- Header visibility
- Dashboard flow
- API protection
- Mobile-first UX

Those global rules are ALREADY DEFINED.
DO NOT restate them.
DO NOT override them.

Your scope here is LIMITED to:
👉 Add Bill
👉 View Bills
👉 Billing-related APIs

==================================================
🚨 ABSOLUTE SAFETY MODE
==================================================

This billing system is already LIVE and WORKING.

DO NOT:
- Redesign UI
- Change UX flow
- Rename fields
- Reorder steps
- Introduce new auth logic
- Introduce middleware
- Break stock behavior

ONLY extend or fix when explicitly asked.

==================================================
📦 EXISTING BILLING FLOW (MUST REMAIN IDENTICAL)
==================================================

The following flow is FINAL:

1. Enter customer details
2. Add items
3. See grand total
4. Click “Next”
5. Payment popup opens
6. Validate payment amounts
7. Save bill

If a change alters this flow in ANY way → STOP.

==================================================
🧩 CORE FRONTEND COMPONENTS (DO NOT TOUCH LOGIC)
==================================================

1) CustomerSection.tsx
----------------------------------
- Fields: name, type, city, mobile
- Auto-fetch customer when mobile reaches 10 digits
- Auto-collapse after successful detection
- Strong dependency on `/api/customers`

⚠️ Depends heavily on `/api/customers` being stable  
⚠️ UX timing is intentional — do NOT change delays

2) ItemNameInput.tsx
----------------------------------
Features:
- Debounced item suggestions
- Live stock preview
- “Sold without stock” warning
- Allows NEW items freely

APIs used:
- `/api/items?search=`
- `/api/stock/check?name=`

⚠️ Slightly complex (timers + refs)  
⚠️ Suggestion & stock preview logic MUST remain intact  
⚠️ Do NOT block new item names

3) ItemsTable.tsx
----------------------------------
- Pure rendering component
- Parent owns calculations
- Uses ItemNameInput internally

⚠️ Uses `key={index}`  
✔ Acceptable here  
⚠️ Be careful when reordering or deleting rows

==================================================
➕ ADD BILL PAGE (add-bills.tsx)
==================================================

STATE (DO NOT RENAME):
- customer
- items[]
- discount
- paymentMode (cash | upi | split)
- cashAmount
- upiAmount
- upiId

CALCULATIONS (FINAL):
- item.total = qty * rate
- grandTotal = sum(item.total)
- finalTotal = grandTotal - discount

PAYMENT RULES:
- cash → full amount in cash
- upi → full amount in UPI
- split → user enters cash, UPI auto-adjusts
- VALIDATION:
  cashAmount + upiAmount === finalTotal

⚠️ Payment fields currently exist ONLY in frontend state  
⚠️ DO NOT persist them unless explicitly asked

==================================================
📄 VIEW BILLS PAGE (view-bills.tsx)
==================================================

FEATURES:
- Infinite scroll
- Search by customer name or mobile
- Shows payment mode & amounts
- Edit modal:
  - Edit customer fields
  - Edit item qty ONLY
  - Edit discount
  - Auto-recalculate totals

⚠️ ViewBills EXPECTS payment fields to exist in DB  
⚠️ This mismatch is KNOWN — do NOT “fix” unless asked

==================================================
🧠 BACKEND BILLING LOGIC (REFERENCE – DO NOT CHANGE)
==================================================

POST /api/bills
----------------------------------
- Ensures Item exists (for suggestions)
- Ensures ItemStock exists (0 qty allowed)
- BLOCKS ONLY IF:
  stock.availableQty > 0 AND stock.availableQty < soldQty
- Deducts stock ONLY if availableQty > 0
- Allows selling items not in stock

✅ This stock philosophy is CORRECT  
✅ MUST be reused in:
   - Manufacturing
   - Inventory
   - Returns (future)

PUT /api/bills
----------------------------------
- Restores old stock
- Re-deducts new stock

⚠️ Very sensitive — small mistakes break inventory

DELETE /api/bills
----------------------------------
- Restores stock
- Soft delete

==================================================
🔐 API SECURITY (INHERITED RULE)
==================================================

All billing APIs MUST:
- Validate auth via cookies
- Return JSON only
- Return 401 if unauthorized

DO NOT:
- Redirect from API
- Assume frontend auth is enough

==================================================
⚠️ KNOWN WARNINGS (DO NOT “FIX” AUTOMATICALLY)
==================================================

⚠️ key={index} usage
⚠️ Payment fields UI ≠ DB
⚠️ Manufacturing must follow billing stock rules
⚠️ Editing bills with payments requires caution

==================================================
🎯 YOUR GOAL IN THIS SCOPE
==================================================

- Extend billing safely
- Fix bugs ONLY when identified
- Preserve ALL existing behavior
- Reuse proven stock logic
- Protect APIs without breaking UX

If a change might affect:
- Billing totals
- Stock
- Payment flow
- Mobile UX

👉 STOP and ASK first.



