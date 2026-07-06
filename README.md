# Samuel Store — E-Commerce Web Application

A full-stack e-commerce platform built with React (Vite), Node.js (Express), and MySQL.
Developed as a final project for **EWA408510 – E-Commerce and Web Application** at UNILAK.

**Student:** Samuel Bondo ---
**Institution:** UNILAK — Faculty of Computing and Information Sciences ---
**Course:** EWA408510 – E-Commerce and Web Application, 2025–2026

---

## Live Deployment

| Service | URL |
|---------|-----|
| Frontend (Vercel) | https://samuel-store.vercel.app |
| Backend API (Render) | https://samuel-store-server.onrender.com |
| GitHub Repository | https://github.com/samuelbondo/ecommerce-web-app |
| Cloud Database | Aiven MySQL 8.4 — Amsterdam (DigitalOcean) |

> Note: The Render free tier spins down after inactivity. The first request may take 30–50 seconds. This is normal on the free plan.

---

## Features

### 🛍️ Shopping & Products
- Responsive homepage with hero banner and featured products
- Product listing page with search bar and category filter
- Product detail page with image gallery, variants (size/color), and stock status
- Product variants — each variant has its own price, stock, SKU, and image
- Shopping cart with quantity controls (+/−), item removal, and live total
- Checkout page — saved address picker + manual address entry fallback
- PayPal / Debit & Credit Card payment — live PayPal SDK integration
- Cash on Delivery (COD) payment option
- Order confirmation page — shows order ID, items, address, payment method, total
- Order history page — all past orders with status badge and item details

---

### 🔐 Authentication
- Email + password registration and login (JWT, 7-day expiry)
- Bcrypt password hashing (salt rounds: 10)
- Google OAuth 2.0 — one-click sign in / sign up with Google account
- Facebook OAuth 2.0 — one-click sign in / sign up with Facebook account
- Dual auth — users can link Google to an email account and use either method
- OTP-based forgot password — 3-step flow (email → 6-digit code → new password)
- OTP codes expire in 10 minutes and are single-use
- Reset tokens are short-lived JWTs (5 min, purpose-scoped)
- Role-based access control — `admin` and `customer` roles
- JWT middleware (`authenticate`) protects all private routes
- `requireAdmin` middleware protects all admin routes

---

### 👤 Customer Dashboard
- **Overview** — real order stats (total orders, total spent, pending, delivered), recent orders, product recommendations
- **My Orders** — full order history, order tracking steps, view order details, download HTML invoice
- **Profile** — avatar upload (base64, max 1.5MB), personal info edit, password change, login activity, linked accounts (Google/Facebook)
- **Addresses** — up to 5 saved addresses, set default address, used automatically at checkout
- **Reviews** — view all submitted reviews, edit rating/comment, delete review
  - Review button appears per item in Order History for any non-cancelled order
  - One review per product per user — enforced server-side
  - Once reviewed, button is replaced with ✓ Reviewed label
- **Messages** — full chat with AI assistant or live support agent
  - Edit own messages within 15-minute window; soft-delete own messages
  - Closed conversation shows resolved banner + 1–5 star rating prompt with optional comment
  - Rating submitted once per conversation; existing rating shown on reload
- **Settings** — notification preferences (email orders, email promos, newsletter, SMS) saved to DB

---

### ⚡ Admin Dashboard
- **Overview** — revenue, orders, customers, products, today's sales, monthly sales, low stock alerts, out-of-stock count
- **Orders** — list all orders, search by name/ID, filter by status, bulk status update, export CSV
  - View order modal — customer info, items, shipping address, update delivery status
  - 💵 Mark as Paid — updates `payment_status = paid` for COD orders (hidden once paid)
  - 📧 Resend Receipt — resends branded HTML receipt email to customer
  - 🖨️ Print Invoice — opens print-ready HTML invoice in new tab
  - 🗑 Delete Order — with confirmation dialog
- **Customers** — list all customers, search, view profile, edit info, change role, suspend/activate, reset password, send OTP reset link, admin notes, delete
- **Products** — list all products, create, edit, delete, duplicate, toggle visibility, toggle featured
  - Multi-image gallery per product (add, reorder, delete images)
  - Product options (e.g. Size, Color) and variants (combination, price, stock, SKU, image)
- **Categories** — create, edit, delete categories
- **Inventory** — view all products sorted by stock, update stock levels, low stock and out-of-stock indicators
- **Reviews** — list all reviews, approve/reject, admin reply, delete
- **Banners** — manage homepage hero banners (title, subtitle, image, link, active toggle, sort order)
- **Live Chat** — view all customer conversations, take over from AI, reply as admin, release back to AI, close conversation (ticket closure), reopen closed conversation, delete conversation
  - Closed conversations are locked — no replies, edits, or deletes until reopened
  - Per-message edit and hard-delete (admin moderation, open conversations only)
  - Support rating KPI bar (average score + total count)
  - Ratings management modal — toggle each rating Public or Private
  - Public ratings feed the homepage testimonials section
- **Reports** — monthly revenue chart (last 6 months), top 5 selling products
- **Settings** — store name, currency, logo, contact info, social links — saved to DB
- **My Profile** — admin can update their own avatar, name, email, password

---

### 📧 Emails & Notifications
- **Order confirmation email** — sent automatically when customer places an order (COD or PayPal)
- **Payment confirmed email** — sent when admin marks a COD order as paid
- **Order cancelled email** — sent when admin cancels an order (includes red cancellation notice)
- **Admin resend** — admin can manually resend receipt email at any time from the order modal
- **OTP password reset email** — 6-digit code sent via Resend (branded HTML template)
- **Admin-initiated OTP** — admin can send a password reset OTP to any customer from the Customers panel
- All receipt emails include: order ID, date, customer info, itemized table, grand total, payment method + status badge, COD cash reminder (if applicable)
- Email provider: **Resend** (HTTP-based, works on Render free tier — no SMTP port restrictions)

---

### 🤖 AI Live Chat
- Customer-facing live chat powered by Google Gemini AI
- AI responds automatically to customer questions about products, orders, and the store
- Logged-in customers get personalised responses based on their real order history
- Admin can take over any conversation and reply manually
- Admin can release conversation back to AI
- Admin can close a resolved conversation (ticket closure)
- Closed conversations are fully locked — no new messages, no edits, no deletes from either side
- Customer sending a new message on a closed conversation auto-reopens it
- Admin can manually reopen a closed conversation from the Live Chat panel
- Messages can be edited (15-min window) and soft-deleted by sender; admin can edit or hard-delete any message (open conversations only)
- All messages stored in DB (`conversations`, `conversation_messages` tables)

#### AI Model Split
| Feature | Model | Free Tier Limits |
|---------|-------|------------------|
| Live chat (customer messages) | `gemini-3.1-flash-lite-preview` | 500 RPD · 15 RPM · 250K TPM |
| Admin features (product descriptions, semantic search, review summaries) | `gemini-2.5-flash-preview-05-20` | 20 RPD · 5 RPM · 250K TPM |

> **RPD** = Requests Per Day · **RPM** = Requests Per Minute · **TPM** = Tokens Per Minute
>
> Chat and admin AI features use separate models so each has its own independent quota. Hitting the limit on one does not affect the other.
>
> To remove RPD limits entirely, add a billing account at https://aistudio.google.com — cost is fractions of a cent per message.

### ⭐ Support Ratings _(distinct from product reviews)_
- After admin closes a conversation, the customer receives a notification to rate their support experience
- Customer submits a 1–5 star rating + optional comment from the Messages page
- One rating per conversation, only allowed on closed conversations (enforced server-side)
- Admin sees aggregate KPI (average score + total count) at the top of the Live Chat panel
- Admin can manage all ratings — toggle each one **Public** or **Private**
- Public ratings (with comments) appear as a **"What Customers Say"** testimonials section on the homepage
- Customer names are masked server-side for privacy (e.g. `S*** B.`) — raw names never exposed publicly

> **Product Reviews vs Support Ratings — not the same thing:**
> - **Product Reviews** — a customer rates a *product* (stars + comment on the product page, admin can approve/reject/reply)
> - **Support Ratings** — a customer rates a *support conversation* after it is resolved (how was the service?)

### 🔒 Privacy & Compliance
- Privacy Policy page (`/privacy`) — GDPR + Meta App Review compliant
- Account data deletion endpoint — permanently removes all user data on request
- Facebook OAuth compliant — app in Live mode, privacy policy URL set in Meta dashboard

### 🚀 DevOps & Deployment
- Fully Dockerized — 3-container setup (MySQL, Express backend, Nginx + React frontend)
- CI/CD pipeline via GitHub Actions (`.github/workflows/ci.yml`)
- Frontend deployed on Vercel (auto-deploy on push to `main`)
- Backend deployed on Render (auto-deploy on push to `main`)
- Database hosted on Aiven MySQL 8.4 — Amsterdam region (DigitalOcean infrastructure)
- Idempotent DB migration script (`server/migrate.js`) — safe to run multiple times

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, React Router 7, Axios |
| Backend | Node.js 24, Express.js 4 |
| Database | MySQL 8.4 (Aiven cloud / XAMPP local) |
| Auth | JWT (jsonwebtoken), bcryptjs, Passport.js, Google OAuth 2.0, Facebook OAuth 2.0 |
| Payments | PayPal SDK (client-side), Cash on Delivery |
| Email | Resend (order receipts, OTP, cancellations) |
| AI | Google Gemini 3.1 Flash Lite (chat) + Gemini 2.5 Flash (admin features) |
| File Upload | Cloudinary (product images, avatars) |
| DevOps | Docker, Docker Compose, GitHub Actions |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Database Hosting | Aiven.io (free tier) |

---

## Project Structure

```
samuel_store/
├── .github/
│   └── workflows/
│       └── ci.yml                   # GitHub Actions CI/CD pipeline
├── client/                          # React frontend (Vite)
│   ├── src/
│   │   ├── api.js                   # Axios instance with JWT interceptor
│   │   ├── App.jsx                  # Routes and layout
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── Toast.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── CartContext.jsx
│   │   │   └── SettingsContext.jsx
│   │   └── pages/
│   │       ├── Home.jsx
│   │       ├── Products.jsx
│   │       ├── ProductDetail.jsx
│   │       ├── Cart.jsx
│   │       ├── Checkout.jsx         # Saved address picker + PayPal + COD
│   │       ├── OrderConfirmation.jsx
│   │       ├── Orders.jsx
│   │       ├── Login.jsx
│   │       ├── Register.jsx
│   │       ├── ForgotPassword.jsx   # 3-step OTP password reset
│   │       ├── AuthCallback.jsx     # Google/Facebook OAuth redirect handler
│   │       ├── PrivacyPolicy.jsx    # Privacy policy page (/privacy)
│   │       ├── admin/               # Admin dashboard pages
│   │       │   ├── AdminLayout.jsx
│   │       │   ├── AdminOverview.jsx
│   │       │   ├── AdminOrders.jsx
│   │       │   ├── AdminCustomers.jsx
│   │       │   ├── AdminProducts.jsx
│   │       │   ├── AdminCategories.jsx
│   │       │   ├── AdminInventory.jsx
│   │       │   ├── AdminReviews.jsx
│   │       │   ├── AdminBanners.jsx
│   │       │   ├── AdminLiveChat.jsx
│   │       │   ├── AdminReports.jsx
│   │       │   ├── AdminSettings.jsx
│   │       │   ├── AdminCoupons.jsx
│   │       │   └── AdminProfile.jsx
│   │       └── dashboard/           # Customer dashboard pages
│   │           ├── Dashboard.jsx    # Sidebar + topbar layout
│   │           ├── Overview.jsx     # Stats, recent orders, recommendations
│   │           ├── DashOrders.jsx   # Order history + tracking + invoice
│   │           ├── DashProfile.jsx  # Profile, avatar, security, activity
│   │           ├── DashAddresses.jsx# Saved addresses (max 5)
│   │           └── DashExtras.jsx   # Reviews, Notifications, Settings
│   ├── Dockerfile                   # Multi-stage build → Nginx
│   ├── nginx.conf                   # Nginx SPA config
│   └── vite.config.js
├── server/                          # Express backend
│   ├── config/
│   │   ├── db.js                    # MySQL2 connection pool (SSL-aware)
│   │   └── passport.js              # Google + Facebook OAuth strategies
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── cartController.js
│   │   ├── categoryController.js
│   │   ├── orderController.js       # placeOrder + resendReceipt
│   │   ├── productController.js
│   │   └── settingsController.js
│   ├── db/
│   │   ├── schema.sql               # Database table definitions
│   │   └── seed.sql                 # Sample data
│   ├── middleware/
│   │   ├── auth.js                  # JWT authenticate + requireAdmin
│   │   ├── errorHandler.js          # Centralized error handler
│   │   └── validate.js              # Required fields validation
│   ├── models/
│   │   ├── cartModel.js
│   │   ├── categoryModel.js
│   │   ├── orderModel.js
│   │   ├── productModel.js
│   │   └── userModel.js
│   ├── routes/
│   │   ├── admin.js                 # All admin-only routes
│   │   ├── auth.js                  # Auth + OAuth + preferences
│   │   ├── cart.js
│   │   ├── categories.js
│   │   ├── orders.js
│   │   ├── products.js
│   │   ├── settings.js
│   │   ├── addresses.js             # Saved addresses (max 5)
│   │   ├── reviews.js               # Customer reviews CRUD
│   │   ├── notifications.js         # Customer notifications
│   │   ├── banners.js               # Homepage banners
│   │   ├── upload.js                # Cloudinary image upload
│   │   └── ai.js                    # Gemini AI live chat
│   ├── utils/
│   │   ├── AppError.js              # Custom error class
│   │   ├── asyncHandler.js          # Async try/catch wrapper
│   │   └── emailTemplates.js        # buildReceiptHTML() branded email
│   ├── Dockerfile
│   ├── index.js                     # Express app entry point
│   ├── migrate.js                   # Idempotent DB migration script
│   ├── .env.example                 # Environment variable template
│   └── setup-db.js                  # Local DB setup utility
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 22+ | https://nodejs.org |
| npm | 8+ | Comes with Node.js |
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop |
| Git | 2.x | https://git-scm.com |
| XAMPP (optional) | Latest | https://www.apachefriends.org (for local MySQL) |

---

## Option 1 — Run with Docker (Recommended)

```bash
git clone https://github.com/samuelbondo/ecommerce-web-app.git
cd ecommerce-web-app
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:80 |
| Backend API | http://localhost:5000/api/products |
| MySQL | localhost:3307 (user: root, password: root) |

```bash
docker-compose down        # stop
docker-compose down -v     # stop + delete data
docker-compose up --build  # rebuild after changes
```

---

## Option 2 — Run Locally without Docker

```bash
git clone https://github.com/samuelbondo/ecommerce-web-app.git
cd ecommerce-web-app

# Setup database
mysql -u root -p < server/db/schema.sql
mysql -u root -p samuel_store < server/db/seed.sql

# Backend
cd server
copy .env.example .env   # edit .env with your values
npm install
npm start

# Frontend (new terminal)
cd client
# create client/.env with VITE_API_URL=http://localhost:5000/api
npm install
npm run dev
```

---

## Environment Variables Reference

### server/.env

```env
PORT=5000
NODE_ENV=development

# Local MySQL (XAMPP)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=samuel_store

# Production MySQL (Aiven)
# DB_HOST=mysql-2701278c-ecommerce-web-app.h.aivencloud.com
# DB_PORT=17137
# DB_USER=avnadmin
# DB_PASSWORD=<your_aiven_password>
# DB_NAME=defaultdb

JWT_SECRET=your_jwt_secret_key

# Google OAuth (console.cloud.google.com)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Facebook OAuth (developers.facebook.com)
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_CALLBACK_URL=http://localhost:5000/api/auth/facebook/callback

# Resend — transactional emails (resend.com)
RESEND_API_KEY=your_resend_api_key
MAIL_FROM=no-reply@yourdomain.com

# Cloudinary — image uploads (cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Gemini AI — live chat (aistudio.google.com)
GEMINI_API_KEY=your_gemini_api_key

# Frontend URL (used after OAuth redirect)
FRONTEND_URL=http://localhost:5173
```

### client/.env

```env
VITE_API_URL=http://localhost:5000/api
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
```

---

## Database

### Tables

| Table | Description |
|-------|-------------|
| `categories` | Product categories |
| `products` | Product catalog — includes `featured`, `visible` |
| `product_images` | Multiple images per product with sort order |
| `product_options` | Product option types (e.g. Size, Color) |
| `product_variants` | Variant combinations with price, stock, SKU, image |
| `users` | Registered users — includes OAuth IDs, avatar, notification prefs, status |
| `orders` | Customer orders — includes payment method, status, customer snapshot |
| `order_items` | Items within each order — includes variant info |
| `cart` | Shopping cart items |
| `addresses` | Customer saved addresses (max 5 per user) |
| `reviews` | Product reviews — rating, comment, admin reply, status |
| `notifications` | Per-user notifications with read status |
| `otp_codes` | OTP codes for password reset (email, code, expires_at, used) |
| `settings` | Store configuration key-value pairs |
| `banners` | Homepage hero banners |
| `payments` | Payment records linked to orders |
| `cart_items` | Cart items (alternative cart structure) |
| `conversations` | Live chat conversations (AI + admin takeover + close) |
| `conversation_messages` | Individual messages — includes `edited_at`, `deleted_at` |
| `conversation_ratings` | Post-resolution support ratings — includes `is_public` flag |

### Migration script

`server/migrate.js` — idempotent, safe to run multiple times.

```cmd
# Run against Aiven (production) — Windows cmd
cd server
set DB_HOST=mysql-2701278c-ecommerce-web-app.h.aivencloud.com
set DB_PORT=17137
set DB_USER=avnadmin
set DB_PASSWORD=your_aiven_password
set DB_NAME=defaultdb
set DB_SSL=true
node migrate.js

# Run against local XAMPP
cd server
node migrate.js
```

---

## API Endpoints

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all visible products |
| GET | `/api/products/:id` | Get product by ID (with images + variants) |
| GET | `/api/categories` | List all categories |
| GET | `/api/banners` | List active homepage banners |
| GET | `/api/settings` | Get store settings (name, currency, logo, etc.) |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login — returns JWT token |
| GET | `/api/auth/google` | Redirect to Google OAuth |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| GET | `/api/auth/facebook` | Redirect to Facebook OAuth |
| GET | `/api/auth/facebook/callback` | Facebook OAuth callback |
| POST | `/api/auth/forgot-password` | Send 6-digit OTP to email |
| POST | `/api/auth/verify-otp` | Verify OTP — returns reset token |
| POST | `/api/auth/reset-password` | Set new password using reset token |
| GET | `/privacy` | Privacy policy page (frontend route) |

### Protected (requires JWT)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart/:user_id` | Get user's cart |
| POST | `/api/cart` | Add item to cart |
| PUT | `/api/cart/:id` | Update cart item quantity |
| DELETE | `/api/cart/:id` | Remove cart item |
| POST | `/api/orders` | Place an order (triggers receipt email) |
| GET | `/api/orders/:user_id` | Get user's orders |
| GET | `/api/auth/preferences` | Get notification preferences |
| PUT | `/api/auth/preferences` | Save notification preferences |
| POST | `/api/auth/set-password` | OAuth user sets a password |
| POST | `/api/auth/link-google` | Link Google to email account |
| GET | `/api/addresses` | Get saved addresses |
| POST | `/api/addresses` | Add address (max 5) |
| PUT | `/api/addresses/:id` | Update address |
| PUT | `/api/addresses/:id/default` | Set default address |
| DELETE | `/api/addresses/:id` | Delete address |
| GET | `/api/reviews/my` | Get own reviews |
| POST | `/api/reviews` | Submit a review |
| PUT | `/api/reviews/:id` | Edit own review |
| DELETE | `/api/reviews/:id` | Delete own review |
| GET | `/api/notifications` | Get notifications |
| PUT | `/api/notifications/:id/read` | Mark one as read |
| PUT | `/api/notifications/read-all` | Mark all as read |
| DELETE | `/api/notifications/:id` | Delete notification |
| POST | `/api/ai/chat` | Send message to Gemini AI live chat |
| GET | `/api/ai/chat/poll` | Poll for new admin messages (4s interval) |
| GET | `/api/ai/chat/history` | Load conversation history |
| PATCH | `/api/ai/chat/messages/:id` | Edit own message (15-min window) |
| DELETE | `/api/ai/chat/messages/:id` | Soft-delete own message |
| POST | `/api/ai/chat/rate` | Submit support rating (closed conversations only) |
| GET | `/api/ai/chat/rate` | Get own rating for a conversation |
| GET | `/api/ai/chat/ratings/public` | Public support ratings for homepage testimonials |
| DELETE | `/api/auth/delete-data` | Permanently delete account + all user data |

---

### Admin Only (requires JWT + admin role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/monthly-revenue` | Monthly revenue chart data (last 6 months) |
| GET | `/api/admin/top-products` | Top 5 best-selling products |
| GET | `/api/admin/products` | List all products |
| POST | `/api/admin/products` | Create product |
| PUT | `/api/admin/products/:id` | Update product |
| DELETE | `/api/admin/products/:id` | Delete product |
| POST | `/api/admin/products/:id/duplicate` | Duplicate product |
| PUT | `/api/admin/products/:id/featured` | Toggle featured |
| PUT | `/api/admin/products/:id/visible` | Toggle visibility |
| GET | `/api/admin/products/:id/images` | Get product images |
| POST | `/api/admin/products/:id/images` | Add product image |
| PUT | `/api/admin/products/:id/images/reorder` | Reorder images |
| DELETE | `/api/admin/products/:id/images/:imageId` | Delete image |
| GET | `/api/admin/products/:id/variants` | Get variants |
| POST | `/api/admin/products/:id/variants` | Add variant |
| PUT | `/api/admin/products/:id/variants/:variantId` | Update variant |
| DELETE | `/api/admin/products/:id/variants/:variantId` | Delete variant |
| GET | `/api/admin/categories` | List categories with product count |
| POST | `/api/admin/categories` | Create category |
| PUT | `/api/admin/categories/:id` | Update category |
| DELETE | `/api/admin/categories/:id` | Delete category |
| GET | `/api/admin/orders` | List all orders with items |
| PUT | `/api/admin/orders/:id/status` | Update delivery status (sends email on cancel) |
| PUT | `/api/admin/orders/:id/payment-status` | Update payment status (sends email on paid) |
| POST | `/api/admin/orders/:id/resend-receipt` | Resend receipt email to customer |
| PUT | `/api/admin/orders/bulk-status` | Bulk update order status |
| DELETE | `/api/admin/orders/:id` | Delete order |
| GET | `/api/admin/customers` | List all customers with order stats |
| GET | `/api/admin/customers/:id` | Get customer detail + order history |
| PUT | `/api/admin/customers/:id` | Update customer info |
| PUT | `/api/admin/customers/:id/role` | Change customer role |
| PUT | `/api/admin/customers/:id/status` | Suspend / activate customer |
| PUT | `/api/admin/customers/:id/notes` | Save admin notes |
| PUT | `/api/admin/customers/:id/avatar` | Update customer avatar |
| PUT | `/api/admin/customers/:id/reset-password` | Reset customer password |
| POST | `/api/admin/customers/:id/send-reset-link` | Send OTP reset email to customer |
| DELETE | `/api/admin/customers/:id` | Delete customer |
| GET | `/api/admin/inventory` | List all products sorted by stock |
| PUT | `/api/admin/inventory/:id` | Update product stock |
| GET | `/api/admin/reviews` | List all reviews |
| PUT | `/api/admin/reviews/:id/status` | Approve / reject review |
| PUT | `/api/admin/reviews/:id/reply` | Admin reply to review |
| DELETE | `/api/admin/reviews/:id` | Delete review |
| GET | `/api/admin/settings` | Get store settings |
| POST | `/api/admin/settings` | Save store settings |
| GET | `/api/admin/conversations` | List all live chat conversations |
| GET | `/api/admin/conversations/:id/messages` | Get messages for a conversation |
| POST | `/api/admin/conversations/:id/takeover` | Admin takes over from AI |
| POST | `/api/admin/conversations/:id/release` | Release back to AI |
| POST | `/api/admin/conversations/:id/close` | Close conversation + notify customer to rate |
| POST | `/api/admin/conversations/:id/reopen` | Reopen a closed conversation |
| POST | `/api/admin/conversations/:id/reply` | Admin sends a reply |
| PATCH | `/api/admin/conversations/:convId/messages/:id` | Admin edits any message |
| DELETE | `/api/admin/conversations/:convId/messages/:id` | Admin hard-deletes any message |
| DELETE | `/api/admin/conversations/:id` | Delete conversation |
| GET | `/api/admin/conversations/ratings` | Support rating KPI (avg + total) |
| GET | `/api/admin/conversations/ratings/all` | List all ratings with customer info |
| PATCH | `/api/admin/conversations/ratings/:id/public` | Toggle rating public / private |

---

## Email — Resend

Samuel Store uses **Resend** for all transactional emails — works on Render free tier (no SMTP port restrictions).

### Emails sent automatically
| Trigger | Subject |
|---------|---------|
| Customer places order | ✅ Order Confirmed — #ID \| Samuel Store |
| Admin marks COD as paid | ✅ Payment Confirmed — Order #ID \| Samuel Store |
| Admin cancels order | ❌ Order #ID Cancelled \| Samuel Store |
| Admin resends manually | 🧾 Your Receipt — Order #ID \| Samuel Store |
| OTP password reset | Your Samuel Store password reset code |

### Setup
1. Create account at https://resend.com
2. Add and verify your sending domain
3. Go to **API Keys** → Create API key
4. Set in Render env vars: `RESEND_API_KEY` and `MAIL_FROM`

---

## Live Chat — Conversation States

| Status | Who is handling | Customer can send? | Admin can reply? |
|--------|----------------|-------------------|------------------|
| `open` | AI | Yes | No — must take over first |
| `taken_over` | Admin | Yes | Yes |
| `closed` | Nobody — resolved | Sending auto-reopens | No — must reopen first |

---

## Reviews — Eligibility Rules

- Customer must have at least one non-cancelled order containing the product
- One review per product per user (enforced server-side — returns 409 on duplicate)
- Review button appears per item in Order History for eligible orders
- Once reviewed, button is replaced with ✓ Reviewed label
- Admin can approve, reject, or reply to any review from the Admin Reviews panel

---

## Authentication Flow

### OTP Forgot Password
```
Step 1 — Enter email
  POST /auth/forgot-password
  → 6-digit OTP generated, stored in otp_codes (expires 10 min)
  → Branded email sent via Resend

Step 2 — Enter OTP code
  POST /auth/verify-otp
  → Validates code (expiry + used flag)
  → Returns resetToken (JWT, 5 min, purpose: reset)

Step 3 — Set new password
  POST /auth/reset-password
  → Verifies resetToken → bcrypt hashes password → updates DB
```

---

## Security

| Feature | Implementation |
|---------|---------------|
| Password hashing | bcryptjs (salt rounds: 10) |
| Authentication | JWT tokens (7-day expiry) |
| Google OAuth | passport-google-oauth20 |
| Facebook OAuth | passport-facebook (Meta App Review compliant) |
| OTP codes | 6-digit, 10-min expiry, single-use |
| Reset tokens | Short-lived JWT (5 min), purpose-scoped |
| Authorization | `authenticate`, `requireAdmin` middleware |
| SQL injection | Parameterized queries via mysql2 |
| Input validation | `validate` middleware on all POST routes |
| Secrets | Environment variables only — never committed |
| Chat message edit | 15-minute window, sender only, enforced server-side; blocked on closed conversations |
| Chat message delete | Soft-delete (audit trail preserved); admin hard-delete for moderation; blocked on closed conversations |
| Closed conversations | Fully locked — no new messages, edits, or deletes until reopened |
| Support ratings | One per conversation, only on closed conversations, JWT required |
| Rating privacy | `is_public` defaults to `0` — admin must explicitly publish; names masked server-side |
| Data deletion | `DELETE /api/auth/delete-data` — full cascade wipe |

---

## Deployment

### Render (Backend)
1. Go to https://render.com → New → Web Service
2. Connect: `samuelbondo/ecommerce-web-app`
3. Root Directory: `server` | Runtime: `Node` | Start: `node index.js`
4. Set all environment variables from the reference above

### Vercel (Frontend)
1. Go to https://vercel.com → Add New Project
2. Import: `samuelbondo/ecommerce-web-app`
3. Root Directory: `client` | Framework: Vite
4. Set: `VITE_API_URL=https://samuel-store-server.onrender.com/api`
5. Set: `VITE_PAYPAL_CLIENT_ID=your_paypal_client_id`

---

## Troubleshooting

**Order confirmation email not received**
- Check Resend dashboard logs for delivery status
- Verify `RESEND_API_KEY` and `MAIL_FROM` are set in Render env vars
- `MAIL_FROM` domain must be verified in Resend dashboard
- Check spam/junk folder

**OTP email not received**
- Same as above — Resend handles OTP emails too
- OTP expires in 10 minutes — request a new one if expired

**Google login fails**
- Verify `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` in Render
- Callback URL must match exactly: `https://samuel-store-server.onrender.com/api/auth/google/callback`

**Facebook login fails**
- Verify `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `FACEBOOK_CALLBACK_URL` in Render
- App must be in Live mode for non-tester users
- Privacy Policy URL must be set in Meta App Dashboard: `https://samuel-store.vercel.app/privacy`

**AI chat returns an error message**
- The free tier has daily request limits (RPD). `gemini-3.1-flash-lite-preview` allows 500 requests/day for chat; `gemini-2.5-flash-preview-05-20` allows 20/day for admin features
- If the limit is hit, the actual error appears in the chat bubble (not a generic message)
- Check Render logs for `Gemini chatAssistant error:` to see the exact cause
- To remove all RPD limits: add billing at https://aistudio.google.com

**Customer cannot submit a review**
- Reviews require at least one non-cancelled order containing that product
- Cancelled orders do not qualify
- One review per product per user — if already reviewed, the button shows ✓ Reviewed
- The Review button only appears in Order History, not on the product page directly

**Backend returns `{"error":"Internal server error"}`**
- Check Render logs for the actual error
- Verify all environment variables are set in Render dashboard
- Confirm Aiven database is running (free tier may power off after inactivity)

**Frontend shows no products / orders stuck loading**
- Render free instance may be sleeping — wait 30–50 seconds and refresh
- Check browser DevTools → Network tab for the failing request and status code

**Docker containers won't start**
- Run `docker-compose down -v` then `docker-compose up --build`
- Make sure ports 80, 5000, and 3307 are not already in use

---

## Privacy & Data Deletion

Samuel Store is compliant with Meta's App Review requirements and GDPR basics.

| Resource | URL |
|----------|-----|
| Privacy Policy | https://samuel-store.vercel.app/privacy |
| Data Deletion Endpoint | `DELETE https://samuel-store-server.onrender.com/api/auth/delete-data` |

The deletion endpoint requires a valid JWT (`Authorization: Bearer <token>`) and permanently removes:
- User account row
- All orders and order items
- Cart items
- Saved addresses
- Reviews
- Notifications
- OTP codes

---

## Author

**Samuel Bondo**
UNILAK — Faculty of Computing and Information Sciences
