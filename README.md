# KOO

A marketplace shopping app for Android, iOS and the web, built with Expo (SDK 58) and React Native 0.88.
Buyers browse a product catalogue, search and filter it, add items to a cart, check out, and follow their
orders — in English or Myanmar ဗမာ, switchable in the app at any time.

Current version: **1.0.1** (Android `versionCode 2`).

## Features

- **Catalogue and discovery** — product cards, category chips, search, sort and price filters, product
  detail pages with option groups (colour/size), stock and shipping state.
- **Cart and checkout** — quantity stepper, persisted cart, address form, payment method choice
  (wallet / card / cash on delivery), totals with shipping and tax.
- **Orders** — order placement plus an order list and receipt screen with status and ETA.
- **Accounts** — email + password sign-up and sign-in backed by Supabase Auth (PKCE, session persisted in
  AsyncStorage, automatic token refresh). Auth errors are mapped to translated reasons instead of raw
  server text.
- **Buyer ↔ seller chat** — real conversations stored in Supabase (conversations + messages), secured by
  row-level security, with new messages delivered live through Supabase Realtime. Opening a chat from a
  product page creates or reuses the conversation for that seller.
- **English + Myanmar** — a typed dictionary pair (`en.ts` / `my.ts` are compile-time checked against each
  other), language persisted per device, and the device language detected on first run. Merchant product
  copy stays in the language it was written in; all app chrome is translated.
- **Settings** — language selector, account state, and a Supabase status readout that explains missing
  configuration in plain, secret-free words.

Everything degrades gracefully: with no `.env` present the app still runs entirely from the bundled
catalogue and local storage, and the Supabase-backed screens report why they are unavailable.

## Project layout

```
src/app/              expo-router screens (tabs, product, chat, checkout, orders, login, settings)
src/components/       reusable UI pieces (Screen, Button, Field, ProductCard, AuthForm, ...)
src/context/         AuthContext and CartContext providers
src/data/catalog.ts   seeded catalogue data and categories
src/i18n/             LanguageProvider, dictionaries (en, my), device-language helpers
src/lib/              supabase client, chat data layer, orders persistence, formatting
src/theme.ts          colours, spacing, typography tokens
assets/               icons, splash art, product photography
supabase/             SQL schema to paste into the Supabase dashboard
scripts/              APK build, Supabase connectivity checks, asset prep
```

There is no `public/` folder: static files for the app live in `assets/`, and Expo serves the web build
straight from the Metro bundler.

## Getting started

```bash
npm install
cp .env.example .env      # then fill in your real project URL and publishable key
npm start                 # Expo dev server; press a / i / w to open a platform
```

### Environment

`.env` is git-ignored and must stay that way.

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project root (`https://<ref>.supabase.co`). A dashboard REST URL is accepted and reduced to its origin. |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable/anon key. **Never** the `service_role` secret. |

`EXPO_PUBLIC_*` values are inlined into the bundle at build time, so treat them as public. Changing them
requires restarting the bundler or rebuilding — a running dev server keeps the old values.

### Database

`supabase/koo-chat-schema.sql` is additive (it only creates `koo_conversations`, `koo_messages`, helper
functions, triggers, RLS policies and the Realtime publication) and idempotent. Paste it into the Supabase
SQL editor and run it there, then enable the **Email** auth provider (turn "Confirm email" off for testing)
and verify:

```bash
npm run check:supabase   # connectivity: auth, rest, storage
npm run check:chat       # the two chat tables exist and answer
```

Both scripts print masked status lines only — they never echo key values.

## npm scripts

| Script | What it does |
| --- | --- |
| `npm start` | Expo dev server |
| `npm run android` / `ios` | Run on a connected device or simulator |
| `npm run web` | Start the web dev server |
| `npm run typecheck` | `tsc --noEmit` (strict mode) |
| `npm run lint` | Expo flat ESLint config over `src` |
| `npm run check:supabase` | Verify Supabase reachability |
| `npm run check:chat` | Same, plus assert the chat tables exist |
| `npm run export:web` | Static web build into `dist/` |
| `npm run serve:web` | Serve `dist/` with an SPA fallback (`--port 5000` to move it) |

`bash scripts/build-apk.sh` produces a release APK with a local Android toolchain (Gradle 9.4.1, JDK 17,
Android SDK) instead of a cloud build. `VARIANT=debug`, `ABIS=…`, `CLEAN=1` and `FORCE_PREBUILD=1` modify
it; the script header documents the repairs it applies and the OneDrive/antivirus caveats on that machine.

## Web build

```bash
npx expo export --platform web   # static site written to dist/
npm run serve:web                # preview it at http://localhost:8081
```

The export is a self-contained static site: one pre-rendered HTML file per route (18 of them, including
`index.html`, `cart.html`, `search.html`, `login.html`, `settings.html` and the chat/order/product screens)
plus hashed JS bundles under `_expo/static/js/web/` and every image and font under `assets/`. Serve `dist/`
from any static host — Netlify, Vercel, Cloudflare Pages, S3, GitHub Pages, or a plain nginx `root`.

`dist/` is committed to this repository on purpose, so the site can be served straight from the checkout
(choose `main` / `dist` as the GitHub Pages source). Regenerate it with `npm run export:web` and commit the
result in the same change as the code it came from.

Two hosting rules:

- The app navigates client-side, so unknown paths must fall back to `index.html`. Without that, refreshing on
  `/product/<id>` returns 404 (the pre-rendered file for a dynamic route only exists for its literal
  `[id]` form). `scripts/serve-web.mjs` does this locally; on Netlify add a `_redirects` file with
  `/* /index.html 200`, on Vercel a `rewrites` rule, on Cloudflare Pages a 404 handler, on S3+CloudFront a
  custom 404 response pointing at `/index.html`.
- `EXPO_PUBLIC_*` values are baked into the bundles at export time, so the web build carries the same
  publishable key as the APK. Re-export after changing `.env`.

## Notes and current limits

- **Signing** — APKs built by `scripts/build-apk.sh` are signed with the project debug keystore. A
  production release needs a real keystore and Play App Signing before distribution.
- **Chat** — requires the SQL schema above plus a configured `.env`; without them the chat screens explain
  the missing step rather than failing.
- **Catalogue** — product data is seeded locally in `src/data/catalog.ts`; it is not (yet) read from the
  database.
- **iOS** — needs a Mac; `android/` and `ios/` are generated by Expo CNG and are git-ignored.

## License

Apache License 2.0 — see [LICENSE](LICENSE).
