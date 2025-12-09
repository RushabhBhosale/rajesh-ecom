# Code and Architecture Notes

How the codebase is organized, where domain logic lives, and how data flows through the app.

## Repository layout
- `app/` — Next.js App Router pages and API routes.
  - Marketing/storefront pages live at `/`, `/products`, `/products/[productId]`, `/cart`, `/checkout`, `/about`, `/contact`.
  - `app/(auth)` contains login/register pages.
  - `app/(protected)` groups authenticated areas: `/dashboard` for customers, `/admin` for staff, `/superadmin` for platform owners. Access is enforced by `middleware.ts`.
  - `app/api/*` holds REST handlers (auth, users, products, categories, checkout + verification, orders, transactions, uploads). Handlers return JSON via `NextResponse` and lean on `lib/*` services.
  - `app/globals.css` stores Tailwind base styles; `app/layout.tsx` wires fonts, navbar, and the toaster provider.
- `components/` — UI split by domain: `admin` tables and charts, `auth` forms, `cart`, `checkout`, `dashboard`, `navigation`, `products` (cards, gallery, purchase section), `providers` (toasts), `ui` (shadcn primitives), and `data-table` (TanStack wrappers).
- `lib/` — Server-side utilities and domain services.
  - Data access and mapping: `products.ts`, `orders.ts`, `transactions.ts`, `categories.ts`, `dashboard.ts`, `users.ts`.
  - Cross-cutting helpers: `db.ts` (connection cache), `auth.ts` (JWT cookie helpers), `mailer.ts`, `razorpay.ts`, `sanitize-html.ts`, `currency.ts`, validation schemas (`*-validation.ts`), and constants (`product-constants.ts`, `order-status.ts`).
  - Client state: `stores/cart-store.ts` (Zustand + persistence helpers).
- `models/` — Mongoose schemas for `User`, `Product`, `Category`, `Order`, and `Transaction`.
- `public/` — Static assets; image uploads are written to `public/uploads` by the upload API.
- `tests/` — Vitest suites for API handlers and component rendering.

## Data and request flow highlights
- **Auth:** JWT created with `lib/auth` is set as an HTTP-only cookie. `middleware.ts` inspects the token to guard `/dashboard`, `/admin`, and `/superadmin`, redirecting unauthorized users to `/login`. Roles (`user`, `admin`, `superadmin`) drive access to API endpoints and admin screens; the first registered account can become `superadmin`.
- **Product & category management:** Admin-only APIs validate payloads with Zod (`product-validation`, `category-validation`), sanitize rich text, de-duplicate gallery/colour values, and write via Mongoose models. Image uploads go through `app/api/uploads/images` with size/type checks before persisting locally.
- **Checkout & payments:** `app/api/checkout` validates cart + address + payment method, fetches product details, calculates tax (18%), creates an `Order` and `Transaction`, and, for Razorpay, creates a gateway order and returns the publishable key. `app/api/checkout/verify` performs HMAC signature verification and updates order/transaction status to `paid` or `failed`.
- **Orders & returns:** Order summaries are projected in `lib/orders`. Admins can update status through `app/api/orders/[orderId]/status`; users can request a return through `/dashboard/orders/[orderId]`, which posts to `app/api/orders/[orderId]/return` when status allows.
- **Admin dashboard metrics:** `lib/dashboard` aggregates MongoDB data (totals, monthly trends, payment mix, transaction status, recent orders) for the client-side dashboard charts in `components/admin/dashboard`.
- **Client state & UI:** Cart state is isolated in `lib/stores/cart-store` with hydration guards. Components that need browser APIs are marked with `"use client"`. Forms use React Hook Form + Zod resolvers; toast feedback is centralized via `components/providers/toaster-provider`.

## Coding patterns and conventions
- Keep database access and business logic inside `lib/*` so route handlers stay thin; map Mongoose documents to plain DTOs before returning to React components.
- Always validate external input with Zod schemas from `lib/*-validation.ts` and sanitize any HTML via `sanitizeRichText` to avoid XSS.
- When adding protected routes or APIs, rely on `getCurrentUser` + role checks and add the path prefix to `middleware.ts` if a new guarded section is introduced.
- Client interactivity should stay in clearly marked client components; reuse `components/ui` primitives and `data-table` helpers for consistency.
- Tests live under `tests/`; API handlers use jsdom + Testing Library where applicable. Run `npm test` to verify changes.
