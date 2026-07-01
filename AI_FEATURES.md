# Samuel Store — AI Features Documentation

## Overview

Samuel Store integrates Google Gemini 2.5 Flash as its AI backbone.
All AI calls are made server-side only. The API key is never exposed to the frontend.

---

## Architecture

```
Browser (React)
    │  HTTP POST /api/ai/*
    ▼
Express Server (Node.js)
    │  HTTPS → generativelanguage.googleapis.com
    ▼
Google Gemini 2.5 Flash API
```

---

## Environment Variable

```
GEMINI_API_KEY=your_key_here   # server/.env
```

Get a free key at: https://aistudio.google.com/app/apikey

---

## Model

**gemini-2.5-flash** — chosen for:
- Highest free-tier limits on this account (10 RPM, 250K TPM, 500 RPD)
- Fast response time (~1–2 seconds)
- Excellent multilingual support (critical for international e-commerce)
- Low cost when upgrading to paid tier

---

## Features Implemented

### 1. AI Shopping Assistant
- **File:** `client/src/components/AIChat.jsx`
- **Endpoint:** `POST /api/ai/chat`
- **Where:** Floating chat button on all public pages (bottom-right)
- **What it does:** Conversational assistant that knows the full product catalog.
  Customers can ask in any language: find products, check prices, get recommendations.
- **Fallback:** If AI is unavailable, shows a friendly error message. Store continues working.

### 2. AI Semantic Search
- **File:** `client/src/pages/Products.jsx`
- **Endpoint:** `POST /api/ai/search`
- **Where:** Products page — "🤖 AI Search" button next to the search bar
- **What it does:** Understands natural language queries ("something warm for winter under $50")
  and returns products ranked by semantic relevance, not just keyword matching.
- **Fallback:** Standard keyword search still works independently.

### 3. AI Review Sentiment Summary
- **File:** `client/src/pages/ProductDetail.jsx`
- **Endpoint:** `POST /api/ai/review-summary`
- **Where:** Product detail page → Reviews tab (auto-loads when ≥2 reviews exist)
- **What it does:** Reads up to 20 approved reviews and generates a 2–3 sentence
  neutral summary of customer sentiment — what they love and any concerns.
- **Fallback:** If AI fails, the summary block simply doesn't appear. Reviews still show.

### 4. AI Product Description Generator
- **File:** `client/src/pages/admin/AdminProducts.jsx`
- **Endpoint:** `POST /api/ai/describe`
- **Where:** Admin → Products → Add/Edit modal → "🤖 Generate with AI" button
- **What it does:** Admin enters product name, selects category and price,
  clicks the button — Gemini writes a professional SEO-optimised description instantly.
- **Auth:** Admin JWT required (authenticate + requireAdmin middleware).
- **Fallback:** Admin can still type description manually.

### 5. Text Translation
- **File:** `server/routes/ai.js`
- **Endpoint:** `POST /api/ai/translate`
- **Where:** Available as an API endpoint for any future frontend use
- **What it does:** Translates any text to a target language (French, Swahili, Arabic,
  Kinyarwanda, etc.) — foundation for full multilingual store support.
- **Usage:**
  ```json
  POST /api/ai/translate
  { "text": "Add to cart", "language": "French" }
  → { "translated": "Ajouter au panier" }
  ```

---

## Backend Service

**File:** `server/services/gemini.js`

All Gemini calls go through this single module. It uses Node's built-in `https`
module — no extra npm package needed.

Functions exported:
```js
generateDescription(name, category, price)  → { ok, text }
semanticSearch(query, products)             → { ok, ids }
reviewSummary(reviews)                      → { ok, text }
chatAssistant(messages, products)           → { ok, text }
translateText(text, targetLang)             → { ok, text }
```

Every function returns `{ ok: true, ... }` or `{ ok: false, error }`.
Routes handle the `ok: false` case and return HTTP 503 so the store
never crashes when AI is unavailable.

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/ai/chat` | Public | Shopping assistant |
| POST | `/api/ai/search` | Public | Semantic product search |
| POST | `/api/ai/review-summary` | Public | Review sentiment summary |
| POST | `/api/ai/describe` | Admin JWT | Product description generator |
| POST | `/api/ai/translate` | Public | Text translation |

---

## Rate Limits (Free Tier — gemini-2.5-flash)

| Limit | Value |
|-------|-------|
| Requests per minute (RPM) | 10 |
| Tokens per minute (TPM) | 250,000 |
| Requests per day (RPD) | 500 |

For production at scale, upgrade to the Gemini paid tier at:
https://ai.google.dev/pricing
Cost: ~$0.075 per 1M tokens (extremely cheap).

---

## Replacing the API Key

1. Go to https://aistudio.google.com/app/apikey
2. Delete the current key and create a new one
3. Update `server/.env`:
   ```
   GEMINI_API_KEY=your_new_key_here
   ```
4. If deployed on Render, update the environment variable in the Render dashboard
5. No code changes needed — the key is only read from the environment variable

---

## Adding More AI Features

To add a new AI feature:

1. Add a function to `server/services/gemini.js`
2. Add a route to `server/routes/ai.js`
3. Call `API.post('/ai/your-endpoint', data)` from the frontend

The service module handles all Gemini API communication, error handling,
and timeouts centrally.
