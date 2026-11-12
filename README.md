# Countdown Timer + Analytics — Shopify App

A Shopify app that lets merchants create countdown timers for promotions and show them on product pages.

- **Fixed timers**: same start and end time for every visitor
- **Evergreen timers**: start on a visitor's first view and reset after expiry
- **Targeting**: all products, specific products, or specific collections
- **Customization**: colors, headline, position, urgency threshold
- **Analytics**: impression count per timer

## Explanation Videos

1. **Intro and application overview**: https://www.loom.com/share/0e6037e026564228a4faa2499d6cbdf0
2. **Architecture and code walkthrough**: https://www.loom.com/share/c18a65087d7742a099f952d985f83d10
3. **Test cases, trade-offs and improvements**: https://www.loom.com/share/c2d60c5d79fe44f7b2e56399472b978b

## Tech Stack

| Area          | Technology                                              |
| ------------- | ------------------------------------------------------- |
| Scaffold      | Shopify CLI 3, node-express template                    |
| Backend       | Node.js, Express, Mongoose, MongoDB Atlas               |
| Shopify auth  | `@shopify/shopify-app-express`, MongoDB session storage |
| Validation    | Zod + HTML stripping                                    |
| Rate limiting | `express-rate-limit`                                    |
| Admin UI      | React, Vite, Polaris, App Bridge, React Query           |
| Storefront    | Theme App Extension (Liquid) + Preact widget (esbuild)  |
| Testing       | Vitest                                                  |
| Lint / format | ESLint, Prettier                                        |

## Setup

1. Install Node.js 20+ and the Shopify CLI (`npm install -g @shopify/cli@latest`).
2. Create a `.env` file in the project root:

   ```env
   MONGODB_URI=your-mongodb-atlas-connection-string
   ```

3. Install and run:

   ```shell
   npm install
   npm run build:widget
   npm run dev
   ```

4. Install the app on your development store, then add the **Countdown** block to the product template in **Online Store → Themes → Customize**.

Other scripts: `npm test`, `npm run lint`, `npm run format`.

## API

| Method | Path                                       | Purpose                          |
| ------ | ------------------------------------------ | -------------------------------- |
| GET    | `/api/timers`                              | List timers with status          |
| GET    | `/api/timers/:id`                          | Get one timer                    |
| POST   | `/api/timers`                              | Create a timer                   |
| PUT    | `/api/timers/:id`                          | Update a timer                   |
| DELETE | `/api/timers/:id`                          | Delete a timer                   |
| GET    | `/proxy/timer?product_id=&collection_ids=` | Best matching active timer       |
| POST   | `/proxy/impression/:id`                    | Increment the impression count   |

Admin routes use the Shopify session and are scoped to the shop. Proxy routes are called through the Shopify App Proxy (`/apps/countdown/...`), HMAC-verified and rate-limited.

## Trade-offs

- **60-second storefront cache.** The proxy controller caches responses for 60 seconds. That keeps it fast and protects the database, but after a merchant edits a timer it can take about a minute to show.
- **In-memory cache and rate limiting.** Both live in the Node process. That's simple and right for one server, but with several instances each would have its own cache and limits.
- **Per-browser tracking.** Impressions are counted per browser session, not unique visitors, and evergreen timers are per browser. Clearing storage or switching devices restarts them.

## Improvements

- **Image support in the widget.** Let merchants add a background or banner image to the timer, for a richer promotional look (for example, a sale banner with product images around the countdown).
