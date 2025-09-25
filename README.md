# Rajesh Renewed Storefront

Next.js storefront and management console for Rajesh Renewed, featuring catalogue management, protected admin tools, and integrated checkout with Razorpay support.

## Environment variables

Create a `.env.local` file with the following keys before running the app:

```
MONGODB_URI=...
JWT_SECRET=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
SMTP_HOST=...
SMTP_PORT=...
SMTP_FROM="Rajesh Renewed <noreply@example.com>"
# Optional when your SMTP server requires authentication
SMTP_USER=...
SMTP_PASS=...
```

The Razorpay credentials are required for online payments. Without them the checkout API will reject Razorpay payments; cash-on-delivery will continue to work. SMTP settings enable order confirmation emails—if omitted the checkout will succeed but email is skipped and a warning is logged.

## Getting started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the storefront. Admin routes such as `/admin/orders` require an authenticated admin user.

## Checkout flow overview

- Customers review their cart and proceed to `/checkout` to submit contact, shipping, and payment details.
- Cash on delivery orders are recorded immediately and surface in the admin “Orders” table.
- Razorpay payments create a gateway order, open the hosted checkout, and verify the signature server-side before confirming the order and logging a transaction.
- Every order creates a matching transaction entry (pending for COD, paid for successful Razorpay payments) that appears under `/admin/transactions`.

## Admin views

- **Orders** (`/admin/orders`): Search and review order totals, customer information, payment states, and update order statuses (Placed → Processing → Dispatched → Delivered, etc.).
- **Transactions** (`/admin/transactions`): Monitor Razorpay captures and COD commitments linked to their order references.

## Customer dashboard

Authenticated buyers can visit `/dashboard/orders` to review every order with live status, Razorpay metadata, and initiate return requests when eligible.

## Testing

Run the existing Vitest suite with:

```bash
npm test
```

Additional end-to-end payment tests will require mocking the Razorpay API; the current suite focuses on unit coverage.
