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
- Checkout page with customer info form and validation
- Order confirmation page
- Order history per user
- User registration and login (JWT authentication)
- Google OAuth 2.0 login — sign in / sign up with Google
- OTP-based forgot password — 6-digit code sent via Nodemailer (cPanel SMTP)
- Dual auth — users can link Google to an email account and use either method
- Bcrypt password hashing
- Role-based access control (admin / customer)
- Customer dashboard (orders, profile, addresses, reviews, notifications, settings)
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
| Auth | JWT (jsonwebtoken), bcryptjs, Passport.js, Google OAuth 2.0 |
| Email | Nodemailer + cPanel SMTP (transactional OTP emails) |
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
│   │       ├── Checkout.jsx
│   │       ├── OrderConfirmation.jsx
│   │       ├── Orders.jsx
│   │       ├── Login.jsx
│   │       ├── Register.jsx
│   │       ├── ForgotPassword.jsx   # 3-step OTP password reset
│   │       ├── AuthCallback.jsx     # Google OAuth redirect handler
│   │       ├── admin/          # Admin dashboard pages
│   │       └── dashboard/      # Customer dashboard pages
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
│   │   ├── schema.sql          # Database table definitions (incl. otp_codes)
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
│   │   ├── auth.js
│   │   ├── cart.js
│   │   ├── categories.js
│   │   ├── orders.js
│   │   ├── products.js
│   │   └── settings.js
│   ├── utils/
│   │   ├── AppError.js         # Custom error class
│   │   └── asyncHandler.js     # Async try/catch wrapper
│   ├── Dockerfile
│   ├── index.js                # Express app entry point
│   ├── .env.example            # Environment variable template
│   └── setup-db.js             # Local DB setup utility script
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Prerequisites

Before running this project, make sure you have:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 22+ | https://nodejs.org |
| npm | 8+ | Comes with Node.js |
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop |
| Git | 2.x | https://git-scm.com |
| XAMPP (optional) | Latest | https://www.apachefriends.org (for local MySQL) |

---

## Option 1 — Run with Docker (Recommended)

This runs all 3 services (MySQL, backend, frontend) in containers automatically.

```bash
# 1. Clone the repository
git clone https://github.com/samuelbondo/ecommerce-web-app.git
cd ecommerce-web-app

# 2. Start all containers
docker-compose up --build
```

Wait about 2–3 minutes for MySQL to initialize. Then open:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:80 |
| Backend API | http://localhost:5000/api/products |
| MySQL | localhost:3307 (user: root, password: root) |

To stop:
```bash
docker-compose down
```

To stop and delete all data (fresh start):
```bash
docker-compose down -v
```

To rebuild after code changes:
```bash
docker-compose up --build
```

---

## Option 2 — Run Locally without Docker

### Step 1 — Clone the repository

```bash
git clone https://github.com/samuelbondo/ecommerce-web-app.git
cd ecommerce-web-app
```

### Step 2 — Set up the database

Start XAMPP and make sure MySQL is running, then:

```bash
# Create database and tables
mysql -u root -p < server/db/schema.sql

# Seed sample data
mysql -u root -p samuel_store < server/db/seed.sql
```

### Step 3 — Configure backend environment

```bash
cd server
copy .env.example .env
```

Edit `server/.env`:

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=samuel_store
JWT_SECRET=samuel_store_secret_key_2024
```

### Step 4 — Start the backend

```bash
cd server
npm install
npm start
```

Backend runs at: http://localhost:5000  
Test it: http://localhost:5000/api/products

### Step 5 — Configure frontend environment

Open a new terminal:

```bash
cd client
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### Step 6 — Start the frontend

```bash
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

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

# cPanel SMTP — for OTP emails (Nodemailer)
MAIL_HOST=your-cpanel-domain.com
MAIL_PORT=587
MAIL_USER=no-reply@your-cpanel-domain.com
MAIL_PASSWORD=your_mail_password

# Frontend URL (used after Google OAuth redirect)
FRONTEND_URL=http://localhost:5173
```

### client/.env (local development)

```env
VITE_API_URL=http://localhost:5000/api
```

### client/.env (pointing to production backend)

```env
VITE_API_URL=https://samuel-store-server.onrender.com/api
```

---

## Database

### Tables

| Table | Description |
|-------|-------------|
| `categories` | Product categories |
| `products` | Product catalog |
| `users` | Registered users — includes `google_id`, `auth_provider`, `avatar`, `admin_notes` |
| `orders` | Customer orders |
| `order_items` | Items within each order |
| `cart` | Shopping cart items |
| `otp_codes` | OTP codes for password reset (email, code, expires_at, used) |
| `settings` | Store configuration key-value pairs |

### Schema file
`server/db/schema.sql` — creates all tables with foreign key relationships.

### Seed file
`server/db/seed.sql` — inserts 4 categories and 8 sample products.

### Cloud Database (Aiven)

The production database is hosted on Aiven MySQL 8.4 (DigitalOcean Amsterdam).

- Host: `mysql-2701278c-ecommerce-web-app.h.aivencloud.com`
- Port: `17137`
- Database: `defaultdb`
- SSL: Required

To run setup script against Aiven (from `server/` folder):

```bash
# Set environment variables first
set DB_HOST=mysql-2701278c-ecommerce-web-app.h.aivencloud.com
set DB_PORT=17137
set DB_USER=avnadmin
set DB_PASSWORD=<password>
set DB_NAME=defaultdb
set DB_SSL=true

node setup-db.js
```

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
| GET | `/api/auth/google` | Redirect to Google OAuth consent screen |
| GET | `/api/auth/google/callback` | Google OAuth callback — issues JWT, redirects to frontend |
| POST | `/api/auth/forgot-password` | Send 6-digit OTP to email |
| POST | `/api/auth/verify-otp` | Verify OTP — returns short-lived reset token |
| POST | `/api/auth/reset-password` | Set new password using reset token |
| GET | `/api/settings` | Get store settings |

### Protected (requires JWT token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart/:user_id` | Get user's cart |
| POST | `/api/cart` | Add item to cart |
| DELETE | `/api/cart/:id` | Remove cart item |
| POST | `/api/orders` | Place an order |
| GET | `/api/orders/:user_id` | Get user's orders |
| POST | `/api/auth/set-password` | Google user sets a password (enables both login methods) |
| POST | `/api/auth/link-google` | Link Google to existing email account |

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

### Sending authenticated requests

Include this header with every protected request:

```
Authorization: Bearer <your_jwt_token>
```

---

## Docker

### How it works

`docker-compose.yml` defines 3 services:

| Container | Image | Port | Purpose |
|-----------|-------|------|---------|
| `samuel_store_db` | mysql:8.0 | 3307→3306 | MySQL database |
| `samuel_store_server` | node:22-alpine | 5000→5000 | Express API |
| `samuel_store_client` | nginx:alpine | 80→80 | React frontend |

The `db` container automatically runs `schema.sql` and `seed.sql` on first start.  
The `server` container waits for the `db` health check to pass before starting.

### Common Docker commands

```bash
# Start all containers (build images first)
docker-compose up --build

# Start in background (detached)
docker-compose up --build -d

# Stop all containers
docker-compose down

# Stop and remove all data volumes (complete reset)
docker-compose down -v

# View running containers
docker ps

# View logs for a specific container
docker logs samuel_store_server
docker logs samuel_store_db
docker logs samuel_store_client

# Rebuild only one service
docker-compose up --build server

# Access MySQL inside container
docker exec -it samuel_store_db mysql -u root -proot samuel_store
```

---

## GitHub

### Repository
https://github.com/samuelbondo/ecommerce-web-app

### Key Git commands used in this project

```bash
# Clone the repo
git clone https://github.com/samuelbondo/ecommerce-web-app.git

# Check current status
git status

# Stage all changes
git add .

# Commit with a message
git commit -m "feat: description of change"

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main

# View commit history
git log --oneline
```

### Commit message convention used

```
feat:     new feature
fix:      bug fix
docs:     documentation only
refactor: code restructure without feature change
```

---

## CI/CD Pipeline

File: `.github/workflows/ci.yml`

Runs automatically on every push or pull request to `main`.

### Pipeline jobs

```
push to main
    │
    ├── test-server
    │     Install server dependencies
    │     Run npm test (if present)
    │     Smoke test: node starts without crash
    │
    ├── test-client
    │     Install client dependencies
    │     Build Vite app (npm run build)
    │
    └── docker-build (runs after both above pass)
          Build server Docker image
          Build client Docker image
```

To see workflow results:
1. Go to https://github.com/samuelbondo/ecommerce-web-app
2. Click **Actions** tab
3. Click any workflow run to see logs

---

## Deployment

### Architecture

```
User Browser
     │
     ▼
Vercel (React + Nginx)
     │  HTTPS API calls
     ▼
Render (Node.js + Express)
     │  SSL MySQL connection
     ▼
Aiven (MySQL 8.4 — Amsterdam)
```

### Deploy Backend to Render

1. Go to https://render.com → New → Web Service
2. Connect GitHub repo: `samuelbondo/ecommerce-web-app`
3. Settings:
   - Root Directory: `server`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `node index.js`
4. Environment variables to set:

```
PORT=5000
NODE_ENV=production
DB_HOST=mysql-2701278c-ecommerce-web-app.h.aivencloud.com
DB_PORT=17137
DB_USER=avnadmin
DB_PASSWORD=<aiven_password>
DB_NAME=defaultdb
JWT_SECRET=samuel_store_secret_key_2024
GOOGLE_CLIENT_ID=955707634714-99jiohu664ovbioknt6t5nnda59iakhm.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your_google_client_secret>
GOOGLE_CALLBACK_URL=https://samuel-store-server.onrender.com/api/auth/google/callback
MAIL_HOST=your-cpanel-domain.com
MAIL_PORT=587
MAIL_USER=no-reply@your-cpanel-domain.com
MAIL_PASSWORD=<your_mail_password>
FRONTEND_URL=https://samuel-store.vercel.app
```

### Deploy Frontend to Vercel

1. Go to https://vercel.com → Add New Project
2. Import: `samuelbondo/ecommerce-web-app`
3. Settings:
   - Root Directory: `client`
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Environment variable to set:

```
VITE_API_URL=https://samuel-store-server.onrender.com/api
```

### Redeploy after code changes

```bash
# Push to GitHub — Render and Vercel auto-deploy on push to main
git add .
git commit -m "feat: your change description"
git push origin main
```

Both Render and Vercel are connected to GitHub and will automatically redeploy within 1–2 minutes of every push to `main`.

---

## User Accounts

### Create a customer account
Register at: https://samuel-store.vercel.app/register

### Create an admin account
Register normally, then update the role in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

Run this on Aiven via the setup script or any MySQL client connected to the production database.

---

## Authentication

### Login methods

Samuel Store supports three auth methods. Users can switch between them freely.

| Method | How |
|--------|-----|
| Email + Password | Standard registration, bcrypt hashed |
| Google OAuth | One-click sign in/up via Google account |
| Both | User has linked both — can use either |

### auth_provider field

Every user row has an `auth_provider` value:

| Value | Meaning |
|-------|---------|
| `local` | Email + password only |
| `google` | Google only (no password set yet) |
| `both` | Both methods linked — user can use either |

### Google OAuth flow

```
User clicks "Continue with Google"
        ↓
GET /api/auth/google  (backend)
        ↓
Google consent screen
        ↓
GET /api/auth/google/callback
        ↓
Backend: find or create user
  • google_id exists → log in
  • email exists (local) → link Google, auth_provider = both
  • new user → create with auth_provider = google
        ↓
JWT issued → redirect to:
https://samuel-store.vercel.app/auth/callback?token=...&user=...
        ↓
AuthCallback.jsx reads token → localStorage → dashboard
```

### OTP Forgot Password flow

3-step process at `/forgot-password`:

```
Step 1 — Enter email
  POST /auth/forgot-password
  → 6-digit OTP generated, stored in otp_codes (expires 10 min)
  → Email sent via Nodemailer (cPanel SMTP) with styled OTP card

Step 2 — Enter OTP code
  POST /auth/verify-otp
  → Validates code (expiry + used flag)
  → Marks OTP as used
  → Returns resetToken (JWT, 5 min expiry, purpose: reset)

Step 3 — Set new password
  POST /auth/reset-password
  → Verifies resetToken
  → Hashes new password with bcrypt
  → If Google user: auth_provider set to both
  → Redirects to /login
```

### Switching between login methods

In **Dashboard → Profile → Security tab**:

- Google-only user → "Set a Password" form → after saving, `auth_provider = both`
- Email-only user → "Link Google" button → Google OAuth flow → `auth_provider = both`
- Both linked → can use either method at any time

### External services

| Service | Purpose | Free tier |
|---------|---------|----------|
| Google Cloud Console | OAuth 2.0 credentials | Free |
| cPanel SMTP (Nodemailer) | Transactional OTP emails | Included with hosting |

---

## Security

| Feature | Implementation |
|---------|---------------|
| Password hashing | bcryptjs (salt rounds: 10) |
| Authentication | JWT tokens (7-day expiry) |
| Google OAuth | passport-google-oauth20, validated by Passport |
| OTP codes | 6-digit, 10-min expiry, single-use, invalidated after verify |
| Reset tokens | Short-lived JWT (5 min), purpose-scoped (`purpose: reset`) |
| Authorization | Middleware: `authenticate`, `requireAdmin` |
| SQL injection | Parameterized queries via mysql2 |
| Input validation | `validate` middleware on all POST routes |
| Secrets | Environment variables only — never committed |
| Admin routes | Protected by `router.use(authenticate, requireAdmin)` |

---

## Troubleshooting

**Google login fails or redirects to `/login?error=google_failed`**
- Verify `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` in Render env vars
- Callback URL in Google Console must match exactly: `https://samuel-store-server.onrender.com/api/auth/google/callback`
- If app is in testing mode on Google Console, add your Gmail as a test user

**OTP email not received**
- Check spam/junk folder
- Verify `MAIL_HOST`, `MAIL_USER`, `MAIL_PASSWORD` are set in Render environment variables
- OTP expires in 10 minutes — request a new one if expired
- Confirm your cPanel SMTP credentials are correct and the mailbox exists

**Backend returns `{"error":"Internal server error"}`**
- Check Render logs for the actual error
- Verify all environment variables are set correctly in Render dashboard
- Confirm Aiven database is running (Aiven free tier powers off after inactivity)

**Frontend shows no products**
- The Render free instance may be sleeping — wait 30–50 seconds and refresh
- Check browser console for CORS or network errors
- Verify `VITE_API_URL` in Vercel environment variables

**Docker containers won't start**
- Run `docker-compose down -v` then `docker-compose up --build`
- Make sure ports 80, 5000, and 3307 are not in use by another process
- Check logs: `docker logs samuel_store_db`

**`git push` rejected**
- Run `git pull origin main` first to sync, then push again
- If push is blocked due to secrets: remove the secret from the file, commit the fix, then push

---

## Author

**Samuel Bondo**  
UNILAK — Faculty of Computing and Information Sciences  
Course: EWA408510 – E-Commerce and Web Application, 2025–2026  
Instructor: Eric Maniraguha
