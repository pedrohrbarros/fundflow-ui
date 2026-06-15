# FundFlow UI

The Next.js frontend for FundFlow, a monthly budget tracker. It is a thin **BFF
(backend-for-frontend)**: the browser talks to Next.js route handlers under `app/api/*`,
which attach the user's auth token and proxy to the FundFlow backend at
`NEXT_PUBLIC_API_URL/api/v1/*`.

## Tech stack

- Next.js 16 (App Router) · React · TypeScript
- [Auth.js (NextAuth v5)](https://authjs.dev) — Google sign-in
- TanStack Query · Tailwind CSS · recharts · lucide-react
- Vitest + Testing Library
- Package manager: **bun**

## Authentication

Authentication is **Google-only**, via Auth.js, with the **backend as the token authority**:

1. The user clicks **Sign in with Google**; Auth.js runs the Google OAuth flow.
2. In the NextAuth `jwt` callback, Google's OpenID Connect `id_token` is exchanged at
   `POST /api/v1/auth/google`, and the backend returns its **own** `access_token` (short
   lived) + `refresh_token` (long lived).
3. Those backend tokens are stored only in the encrypted, httpOnly NextAuth session cookie —
   they are never exposed to the browser.
4. Every API call goes through the BFF (`lib/api.ts`), which reads the access token
   server-side and sends `Authorization: Bearer <access_token>` to the backend.
5. When the access token expires, the `jwt` callback transparently refreshes and rotates it
   via `POST /api/v1/auth/refresh`. Logout calls `POST /api/v1/auth/logout` then clears the
   session.

Key files: `auth.ts` (NextAuth config), `lib/auth-tokens.ts` (backend auth calls),
`lib/access-token.ts` (server-side token read), `lib/api.ts` (BFF), `proxy.ts` (route
guard), `app/page.tsx` (sign-in), `components/UserMenu.tsx` (account menu / logout / delete).

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable | Purpose | How to get it |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | FundFlow backend base URL | Your backend (e.g. `http://localhost:8000` in dev) |
| `AUTH_SECRET` | NextAuth session encryption | `npx auth secret` (or `openssl rand -base64 33`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client id | Google Cloud Console (see below) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Google Cloud Console (see below) |

### Creating the Google OAuth client

1. [Google Cloud Console](https://console.cloud.google.com) → create/select a project.
2. **APIs & Services → OAuth consent screen** → External; add yourself as a test user while
   the app is in "testing".
3. **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application**:
   - **Authorized JavaScript origins:** `http://localhost:3000` (add your production origin too)
   - **Authorized redirect URIs:** `http://localhost:3000/api/auth/callback/google`
     (and the production equivalent)
4. Copy the **Client ID** and **Client secret** into `.env.local`.

> The backend must implement the auth contract this app consumes:
> `POST /api/v1/auth/{google,refresh,logout}` and `GET/PATCH/DELETE /api/v1/users/me`.

## Getting started

```bash
bun install
cp .env.example .env.local   # then fill in the values above
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with Google. (The backend
at `NEXT_PUBLIC_API_URL` must be running for sign-in and data to work.)

## Scripts

```bash
bun run dev      # start the dev server
bun run build    # production build
bun run lint     # eslint
bun run test     # vitest (run once)
```

> Run tests with **`bun run test`** (Vitest), not `bun test`. Bun's native test runner
> ignores `vitest.config.ts` (no jsdom env, no `vi.mock`) and will fail the suite with
> `ReferenceError: document is not defined`.
