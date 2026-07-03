# Samuel Store — E-Commerce Web Application

A full-stack e-commerce platform built with React (Vite), Node.js (Express), and MySQL.  
Developed as a final project for **EWA408510 – E-Commerce and Web Application** at UNILAK.

**Student:** Samuel Bondo  
**Institution:** UNILAK — Faculty of Computing and Information Sciences  
**Course:** EWA408510 – E-Commerce and Web Application, 2025–2026

---

## Live Deployment

| Service | URL |
|---------|-----|
| Frontend (Vercel) | https://samuel-store.vercel.app |
| Backend API (Render) | https://samuel-store-server.onrender.com |
| GitHub Repository | https://github.com/samuelbondo/ecommerce-web-app |
| Cloud Database | Aiven MySQL 8.4 — Amsterdam (DigitalOcean) |

> Note: The Render free tier spins down after inactivity. The first request after inactivity may take 30–50 seconds to respond. This is normal on the free plan.

---

## Features

- Responsive homepage with featured products
- Product listing with search and category filtering
- Product detail pages
- Shopping cart with quantity controls (+/−)
- Checkout page with saved address picker + manual entry fallback
- Order confirmation page
- Order history with tracking steps, view details, and HTML invoice download
- User registration and login (JWT authentication)
- Google OAuth 2.0 login — sign in / sign up with Google
- Facebook OAuth 2.0 login — sign in / sign up with Facebook (passport-facebook)
- OTP-based forgot password — 6-digit code sent via Nodemailer (Brevo SMTP)
- Dual auth — users can link Google to an email account and use either method
- Bcrypt password hashing
- Role-based access control (admin / customer)
- Customer dashboard:
  - Overview with real order stats and spending summary
  - My Orders — tracking steps, view details, HTML invoice download
  - Profile — avatar upload, personal info, security, activity, linked accounts
  - Addresses — up to 5 saved addresses, default address, used at checkout
  - Reviews — real reviews from DB, edit and delete
  - Notifications — real notifications from DB, mark read, delete
  - Settings — notification preferences saved to DB
- Privacy Policy page (`/privacy`) — GDPR + Meta App Review compliant
- Account data deletion endpoint — permanently removes all user data on request
- Admin dashboard (products, categories, orders, customers, inventory, coupons, reports, settings)
- Fully Dockerized — 3-container setup (MySQL, Express, Nginx)
- CI/CD pipeline via GitHub Actions
- Deployed on Vercel + Render + Aiven

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, React Router 7, Axios |
| Backend | Node.js 24, Express.js 4 |
| Database | MySQL 8.4 (Aiven cloud / XAMPP local) |
| Auth | JWT (jsonwebtoken), bcryptjs, Passport.js, Google OAuth 2.0, Facebook OAuth 2.0 |
| Email | Nodemailer + Brevo SMTP (transactional OTP emails) |
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
│       └── ci.yml              # GitHub Actions CI/CD pipeline
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── api.js              # Axios instance with JWT interceptor
│   │   ├── App.jsx             # Routes and layout
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
│   │       ├── Checkout.jsx         # Saved address picker + payment
│   │       ├── OrderConfirmation.jsx
│   │       ├── Orders.jsx
│   │       ├── Login.jsx
│   │       ├── Register.jsx
│   │       ├── ForgotPassword.jsx   # 3-step OTP password reset
│   │       ├── AuthCallback.jsx     # Google OAuth redirect handler
│   │       ├── PrivacyPolicy.jsx    # Privacy policy page (/privacy)
│   │       ├── admin/          # Admin dashboard pages
│   │       └── dashboard/      # Customer dashboard pages
│   │           ├── Dashboard.jsx        # Sidebar + topbar layout
│   │           ├── Overview.jsx         # Stats, recent orders, recommendations
│   │           ├── DashOrders.jsx       # Order history + tracking + invoice
│   │           ├── DashProfile.jsx      # Profile, avatar, security, activity
│   │           ├── DashAddresses.jsx    # Saved addresses (max 5)
│   │           └── DashExtras.jsx       # Reviews, Notifications, Settings
│   ├── Dockerfile              # Multi-stage build → Nginx
│   ├── nginx.conf              # Nginx SPA config
│   └── vite.config.js
├── server/                     # Express backend
│   ├── config/
│   │   ├── db.js               # MySQL2 connection pool (SSL-aware)
│   │   └── passport.js         # Google OAuth strategy (passport-google-oauth20)
│   ├── controllers/            # Business logic separated from routes
│   │   ├── authController.js
│   │   ├── cartController.js
│   │   ├── categoryController.js
│   │   ├── orderController.js
│   │   ├── productController.js
│   │   └── settingsController.js
│   ├── db/
│   │   ├── schema.sql          # Database table definitions
│   │   └── seed.sql            # Sample data
│   ├── middleware/
│   │   ├── auth.js             # JWT authenticate + requireAdmin
│   │   ├── errorHandler.js     # Centralized error handler
│   │   └── validate.js         # Required fields validation
│   ├── models/                 # Database query abstraction
│   │   ├── cartModel.js
│   │   ├── categoryModel.js
│   │   ├── orderModel.js
│   │   ├── productModel.js
│   │   └── userModel.js
│   ├── routes/
│   │   ├── admin.js            # Admin-only routes (protected)
│   │   ├── auth.js             # Auth + preferences endpoints
│   │   ├── cart.js
│   │   ├── categories.js
│   │   ├── orders.js
│   │   ├── products.js
│   │   ├── settings.js
│   │   ├── addresses.js        # Customer saved addresses (max 5)
│   │   ├── reviews.js          # Customer reviews CRUD
│   │   └── notifications.js    # Customer notifications
│   ├── utils/
│   │   ├── AppError.js         # Custom error class
│   │   └── asyncHandler.js     # Async try/catch wrapper
│   ├── Dockerfile
│   ├── index.js                # Express app entry point
│   ├── migrate.js              # Idempotent DB migration script
│   ├── .env.example            # Environment variable template
│   └── setup-db.js             # Local DB setup utility script
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

JWT_SECRET=samuel_store_secret_key_2024

# Google OAuth (console.cloud.google.com)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Brevo SMTP — for OTP emails (Nodemailer)
# Render free tier blocks cPanel SMTP — use Brevo (free, 300 emails/day)
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_USER=your_brevo_login@smtp-brevo.com
MAIL_PASSWORD=your_brevo_smtp_key
MAIL_FROM=no-reply@yourdomain.com

# Frontend URL (used after Google OAuth redirect)
FRONTEND_URL=http://localhost:5173
```

### client/.env

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Database

### Tables

| Table | Description |
|-------|-------------|
| `categories` | Product categories |
| `products` | Product catalog |
| `users` | Registered users — includes `google_id`, `auth_provider`, `avatar`, `admin_notes`, notification preferences |
| `orders` | Customer orders |
| `order_items` | Items within each order |
| `cart` | Shopping cart items |
| `addresses` | Customer saved addresses (max 5 per user) |
| `reviews` | Product reviews by customers |
| `notifications` | Per-user notifications |
| `otp_codes` | OTP codes for password reset (email, code, expires_at, used) |
| `settings` | Store configuration key-value pairs |

### Migration script

`server/migrate.js` — idempotent, safe to run multiple times.

```cmd
# Run against Aiven (production)
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

### Migration history

| Applied to | What was added |
|---|---|
| `products` | `featured`, `visible` |
| `orders` | `payment_method`, `payment_status`, `payment_id`, `customer_name`, `customer_email`, `customer_phone`, `customer_address`, `total_amount` |
| `order_items` | `variant_id`, `variant_name` |
| `users` | `status`, `phone`, `address`, `city`, `country`, `avatar`, `admin_notes`, `google_id`, `auth_provider`, `last_login`, `password` (nullable), `notif_email_orders`, `notif_email_promos`, `notif_newsletter`, `notif_sms` |
| `cart` | `session_id`, `created_at`, `variant_id` |
| `categories` | `description` |
| `settings` | `updated_at` |
| New tables | `otp_codes`, `reviews`, `notifications`, `addresses`, `banners`, `settings`, `product_images`, `product_options`, `product_variants`, `payments`, `cart_items`, `conversations`, `conversation_messages` |

---

## API Endpoints

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products |
| GET | `/api/products/:id` | Get product by ID |
| GET | `/api/categories` | List all categories |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/google` | Redirect to Google OAuth |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| POST | `/api/auth/forgot-password` | Send 6-digit OTP to email |
| POST | `/api/auth/verify-otp` | Verify OTP — returns reset token |
| POST | `/api/auth/reset-password` | Set new password using reset token |
| GET | `/api/settings` | Get store settings |
| GET | `/privacy` | Privacy policy page (frontend route) |

### Protected (requires JWT)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart/:user_id` | Get user's cart |
| POST | `/api/cart` | Add item to cart |
| DELETE | `/api/cart/:id` | Remove cart item |
| POST | `/api/orders` | Place an order |
| GET | `/api/orders/:user_id` | Get user's orders |
| GET | `/api/auth/preferences` | Get notification preferences |
| PUT | `/api/auth/preferences` | Save notification preferences |
| POST | `/api/auth/set-password` | Google user sets a password |
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
| DELETE | `/api/auth/delete-data` | Permanently delete account + all user data |

### Admin only (requires JWT + admin role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/products` | List all products |
| POST | `/api/admin/products` | Create product |
| PUT | `/api/admin/products/:id` | Update product |
| DELETE | `/api/admin/products/:id` | Delete product |
| GET | `/api/admin/orders` | List all orders |
| PUT | `/api/admin/orders/:id/status` | Update order status |
| GET | `/api/admin/customers` | List all customers |
| GET | `/api/admin/inventory` | Inventory management |
| PUT | `/api/admin/inventory/:id` | Update stock |
| GET | `/api/admin/reviews` | List all reviews |
| PUT | `/api/admin/reviews/:id/status` | Approve/reject review |
| PUT | `/api/admin/reviews/:id/reply` | Admin reply to review |
| DELETE | `/api/admin/reviews/:id` | Delete review |

---

## Email — Brevo SMTP

Render free tier **blocks all outbound SMTP** (cPanel, Gmail, etc.) due to port restrictions.  
Samuel Store uses **Brevo** (formerly Sendinblue) — free tier, 300 emails/day, HTTP-based SMTP relay that works on Render.

### Setup

1. Create account at https://brevo.com
2. Go to **Settings → SMTP & API** → Generate SMTP key
3. Set these env vars in Render:

```
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_USER=your_brevo_login@smtp-brevo.com
MAIL_PASSWORD=your_brevo_smtp_key
MAIL_FROM=no-reply@yourdomain.com
```

---

## Deployment

### Render (Backend)

1. Go to https://render.com → New → Web Service
2. Connect: `samuelbondo/ecommerce-web-app`
3. Root Directory: `server` | Runtime: `Node` | Start: `node index.js`
4. Set all environment variables listed above

### Vercel (Frontend)

1. Go to https://vercel.com → Add New Project
2. Import: `samuelbondo/ecommerce-web-app`
3. Root Directory: `client` | Framework: Vite
4. Set: `VITE_API_URL=https://samuel-store-server.onrender.com/api`

---

## Authentication

| Method | How |
|--------|-----|
| Email + Password | Standard registration, bcrypt hashed |
| Google OAuth | One-click sign in/up via Google account |
| Facebook OAuth | One-click sign in/up via Facebook account |
| Both | User has linked both — can use either |

### OTP Forgot Password flow

```
Step 1 — Enter email
  POST /auth/forgot-password
  → 6-digit OTP generated, stored in otp_codes (expires 10 min)
  → Email sent via Nodemailer (Brevo SMTP)

Step 2 — Enter OTP code
  POST /auth/verify-otp
  → Validates code (expiry + used flag)
  → Returns resetToken (JWT, 5 min, purpose: reset)

Step 3 — Set new password
  POST /auth/reset-password
  → Verifies resetToken → hashes password → updates DB
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
| Address limit | Max 5 addresses per user (enforced server + client) |
| Data deletion | `DELETE /api/auth/delete-data` — full cascade wipe |

---

## Troubleshooting

**OTP email not received**
- Brevo free tier: 300 emails/day limit
- Check spam/junk folder
- Verify `MAIL_HOST`, `MAIL_USER`, `MAIL_PASSWORD` in Render env vars
- OTP expires in 10 minutes — request a new one if expired

**Google login fails**
- Verify `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` in Render
- Callback URL must match exactly: `https://samuel-store-server.onrender.com/api/auth/google/callback`

**Facebook login fails**
- Verify `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `FACEBOOK_CALLBACK_URL` in Render
- Callback URL must match exactly: `https://samuel-store-server.onrender.com/api/auth/facebook/callback`
- App must be in Live mode for non-tester users
- Privacy Policy URL must be set in Meta App Dashboard: `https://samuel-store.vercel.app/privacy`

**Backend returns `{"error":"Internal server error"}`**
- Check Render logs for the actual error
- Verify all environment variables are set in Render dashboard
- Confirm Aiven database is running (free tier powers off after inactivity)

**Frontend shows no products**
- Render free instance may be sleeping — wait 30–50 seconds and refresh
- Check browser console for CORS or network errors

**Docker containers won't start**
- Run `docker-compose down -v` then `docker-compose up --build`
- Make sure ports 80, 5000, and 3307 are not in use

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
Course: EWA408510 – E-Commerce and Web Application, 2025–2026  
Instructor: Eric Maniraguha
