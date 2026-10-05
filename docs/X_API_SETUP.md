# X API Configuration & MumbaiOnChain ID Generator Setup

This document describes how the public X (Twitter) profile lookup is configured and secured in MumbaiOnChain.

---

## 1. Overview

The MumbaiOnChain ID Generator allows participants to enter their public X username (`@username` or `username`).
The application retrieves the public profile information from the **Official X API v2** to generate personalized digital credentials.

### Retrieved Fields:
- **X User ID**: Stable external identifier used to permanently map the participant's `MOC ID` (even if the username changes later).
- **Display Name**: Displayed on the ID card.
- **Username**: Normalized `@username` handle.
- **Profile Image**: High-resolution avatar (using `_400x400` variant) with procedural canvas fallback.
- **Bio & Location**: Public bio snippet and origin city for the Journey / Postcard templates.

---

## 2. Critical Security Principles

1. **Server-Side Only**: The `X_BEARER_TOKEN` **MUST NEVER** be exposed to the browser.
2. **Never in Frontend Bundles**: Do **NOT** use `VITE_X_BEARER_TOKEN` or `NEXT_PUBLIC_X_BEARER_TOKEN`.
3. **No Git Commits**: Never commit actual tokens to GitHub. Local secrets belong in `.env.local` or `.env` (both listed in `.gitignore`).
4. **Official X API v2 Only**: No HTML scraping, Puppeteer, or third-party scraper services.

---

## 3. Environment Configuration

### Local Development
Add your token to `.env.local` in the project root:
```env
X_BEARER_TOKEN=your_x_bearer_token_here
```

Vite dev server includes custom backend middleware that routes `/api/x/profile` directly to the official X API v2 securely.

### Production Hosting (Vercel)
1. Go to your **Vercel Project Dashboard** -> **Settings** -> **Environment Variables**.
2. Add a new variable:
   - **Key**: `X_BEARER_TOKEN`
   - **Value**: `<Your X Bearer Token>`
   - **Environments**: Production, Preview, Development
3. Redeploy the project. The serverless function in `/api/x/profile.ts` will automatically access `process.env.X_BEARER_TOKEN`.

---

## 4. API Specification

### Endpoint
`GET /api/x/profile?username={username}`

### Parameters
- `username` (string, required): X handle with or without leading `@`. Must be 1–15 alphanumeric characters or underscores (`[A-Za-z0-9_]`).

### Example Response (`200 OK`)
```json
{
  "success": true,
  "profile": {
    "id": "783214",
    "name": "Vitalik Buterin",
    "username": "vitalik",
    "avatar": "https://pbs.twimg.com/profile_images/.../photo_400x400.jpg",
    "bio": "Ethereum builder",
    "location": "Mumbai",
    "url": "https://x.com/vitalik"
  }
}
```

### Error Responses
- `400 Bad Request`: `{"error": "Please enter a valid X username."}`
- `404 Not Found`: `{"error": "X profile not found."}`
- `429 Too Many Requests`: `{"error": "Too many requests. Please try again shortly."}`
- `500 Server Error`: `{"error": "X profile lookup is temporarily unavailable."}`

---

## 5. MOC ID Permanence Rule

- **Stable Mapping**: The public `MOC ID` (e.g., `MOC #0042`) is mapped to the participant's **`x_user_id`**.
- **Username Independence**: If a user changes their username from `@alice_eth` to `@alice_builds`, their `x_user_id` remains constant, ensuring they retain their original `MOC ID`.
