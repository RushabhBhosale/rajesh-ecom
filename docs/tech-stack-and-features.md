# Tech Stack and Feature Overview

This document captures what the project is built with and the core experiences it ships.

## Tech stack
- **Framework:** Next.js 15 (App Router, React Server Components) with TypeScript and Turbopack for dev/build.
- **Styling & UI:** Tailwind CSS v4, shadcn/ui primitives, Geist font pairing, lucide-react icons, class-variance-authority and tailwind-merge for variants, Yet-Another-React-Lightbox for galleries, and Recharts for admin analytics.
- **Forms & state:** React Hook Form with Zod validation via `@hookform/resolvers`; client state with Zustand (persisted cart), Sonner toasts for feedback.
- **Data & services:** MongoDB with Mongoose models, connection caching in `lib/db`; domain helpers for products, categories, orders, transactions, dashboard metrics, and users under `lib`.
- **Auth & security:** JWT (jose) stored as an HTTP-only cookie, bcryptjs hashing, route guarding in `middleware.ts`, and role-based access (`user`, `admin`, `superadmin`).
- **Payments & comms:** Razorpay SDK with server-side signature verification; Nodemailer for order confirmations; sanitize-html for rich text safety; local image uploads saved to `public/uploads` via the uploads API.
- **Testing & tooling:** Vitest + Testing Library + jsdom, TypeScript config tuned for Next.js; scripts: `npm run dev`, `npm run build`, `npm test`.

## Feature set
- **Storefront & marketing:** Hero/landing content, About, and Contact pages tailored for the “Rajesh Renewed” brand.
- **Catalog browsing:** `/products` search and filter by category, condition, price band, and sort order; product facets are derived from MongoDB.
- **Product detail:** Gallery with lightbox, variant colour support, highlights, rich description rendering (sanitized), “related products” by category, and purchase section with add-to-cart.
- **Cart experience:** Client cart persisted in localStorage with quantity clamping, subtotal/tax preview, and hydration-safe UI states.
- **Checkout flow:** Zod-validated payloads (customer, shipping, payment method), GST calculation (18%), order + transaction creation, confirmation email dispatch when SMTP is configured, and Razorpay gateway order creation for online payments.
- **Payment verification:** `/api/checkout/verify` performs HMAC validation of Razorpay signatures, flips payment status to `paid`/`failed`, and syncs the related transaction record.
- **Order lifecycle & returns:** Order statuses defined in `lib/order-status`; user dashboard at `/dashboard/orders` shows history, per-order view, and a return request action when the status is `delivered` or `dispatched`.
- **Admin consoles:** `/admin` hosts dashboard charts (orders, revenue, payment mix, transaction status), orders table with status updates, transaction log, product CRUD (gallery, highlights, colours, rich description, featured/in-stock flags), category CRUD, and file uploads for images.
- **Superadmin controls:** `/superadmin` allows bootstrapping users of any role and documents how to promote accounts safely.
- **APIs:** RESTful handlers under `/api` for auth (register/login/logout/me), users, products (CRUD), categories, checkout + verification, orders (list, status change, returns), transactions, and image uploads.
- **Notifications:** Email confirmations include order number, payment status, items, and shipping address; disabled gracefully when SMTP env vars are absent.
