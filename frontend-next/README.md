# Neon Slots - Next.js Frontend

A Next.js 15 conversion of the Neon Slots mobile casino game with **server-side API routing**.

## Key Features

- **Server-Side API Routes**: All API calls are proxied through Next.js API routes (`/app/api/*`), keeping your backend URL and auth tokens secure
- **HTTP-Only Cookies**: Auth tokens are stored in HTTP-only cookies for security (not accessible via JavaScript)
- **App Router**: Uses Next.js 15 App Router with React 19
- **Client Components**: Game UI components use `'use client'` directive for interactivity

## Architecture

```
frontend-next/
├── app/
│   ├── api/                    # Server-side API route handlers
│   │   ├── auth/
│   │   │   ├── send-otp/route.ts
│   │   │   ├── verify-otp/route.ts
│   │   │   └── logout/route.ts
│   │   ├── wallet/
│   │   │   ├── balance/route.ts
│   │   │   ├── deposit/route.ts
│   │   │   └── withdraw/route.ts
│   │   ├── game/
│   │   │   └── spin/route.ts
│   │   └── admin/
│   │       └── config/route.ts
│   ├── globals.css
│   ├── layout.tsx              # Root layout (Server Component)
│   └── page.tsx                # Home page (Server Component)
├── components/                  # Client Components ('use client')
│   ├── SlotGame.tsx            # Main game component
│   ├── AuthScreen.tsx
│   ├── Controls.tsx
│   ├── Reel.tsx
│   ├── WalletModal.tsx
│   ├── TermsModal.tsx
│   └── ResponsibleGaming.tsx
├── lib/
│   ├── constants.ts
│   ├── types.ts
│   └── services/               # Client-side API services
│       ├── authApi.ts
│       ├── walletApi.ts
│       ├── gameApi.ts
│       └── adminApi.ts
└── package.json
```

## How Server-Side API Routing Works

1. **Client components** call Next.js API routes (e.g., `fetch('/api/auth/send-otp')`)
2. **API routes** (in `app/api/`) run on the server and make requests to your Laravel backend
3. **Auth tokens** are stored in HTTP-only cookies, not accessible from client JavaScript
4. **Backend URL** (`BACKEND_URL`) is only available server-side, never exposed to the browser

## Setup

1. Install dependencies:
```bash
cd frontend-next
npm install
```

2. Create `.env.local` file:
```bash
# Backend API URL (server-side only - not exposed to browser)
BACKEND_URL=http://localhost:8000
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Production Build

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Description | Where Used |
|----------|-------------|------------|
| `BACKEND_URL` | Your Laravel backend URL | Server-side only (API routes) |

## Security Benefits

1. **Hidden Backend URL**: The actual backend URL is never exposed to the client
2. **HTTP-Only Auth Cookies**: Prevents XSS attacks from stealing tokens
3. **Server-Side Validation**: API routes can add additional validation before forwarding to backend
4. **No CORS Issues**: Next.js handles the CORS between frontend and its own API routes

