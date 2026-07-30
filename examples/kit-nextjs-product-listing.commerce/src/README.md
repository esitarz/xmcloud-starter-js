# Product Listing Commerce Flow (Local Dev)

This document explains how this starter gets OrderCloud (OC) product data into the `ProductListing` component in local development.

## What We Implemented

- Added a server API route at `src/app/api/commerce/products/route.ts`.
- Route gets an anonymous OC token through the local storefront proxy.
- Route requests products from OC using:
  - `/v1/me/products?catalogID=<catalogId>` when catalog is configured.
  - `/v1/me/products` when catalog is not configured.
- Route normalizes OC payload into UI model (`id`, `name`, `description`, `imageUrl`, `brand`, `category`, `price`, `currency`).
- `ProductListingDefault` fetches `/api/commerce/products` and renders OC data.

## Runtime Data Path

1. Page renders `ProductListing`.
2. Browser calls `GET /api/commerce/products`.
3. Next route dispatches OAuth and product requests to local proxy (`LOCAL_COMMERCE_PROXY_URL`, default `http://127.0.0.1:8795`).
4. Proxy calls OC sandbox and returns response.
5. Next route normalizes data and returns `{ items: [...] }`.

## Local Environment (App)

In `.env.local` (this starter), set:

```bash
ORDERCLOUD_DEFAULT_BUYER_ID=xmc-ordercloud-nike
ORDERCLOUD_BUYER_CLIENT_ID=<buyer client id>
LOCAL_ORDERCLOUD_CATALOG_ID=nike-shoes-demo-catalog
# Optional: default is http://127.0.0.1:8795
LOCAL_COMMERCE_PROXY_URL=http://127.0.0.1:8795
```

## Local Environment (Proxy)

In `sitecore.ep.proxy.oc-storefront/wrangler.local.toml` ensure:

```toml
LOCAL_DEV_MODE = "true"
LOCAL_ORDERCLOUD_URL = "https://sandboxapi.ordercloud.io"
LOCAL_SEND_ENVOY_HEADER = "false"
LOCAL_SITECOREAI_CLIENT_ID = "<client id mapped to your buyer>"
```

Important: if `LOCAL_SEND_ENVOY_HEADER` is `true` with stale marketplace context, OC can return `401 Access token is invalid or expired`.

## One-Time OC Portal Setup (No Admin Token at Runtime)

Runtime browsing can be shopper-only. You still need one-time catalog setup done by an admin user in the OC portal UI.

Required portal state:

1. Catalog exists: `nike-shoes-demo-catalog`.
2. Category exists: `nike-shoes-demo-category`.
3. Demo products exist and are active.
4. Buyer assignment exists:
   - `BuyerID = xmc-ordercloud-nike`
   - `CatalogID = nike-shoes-demo-catalog`
   - `ViewAllProducts = true`
   - `ViewAllCategories = true`
5. Catalog assignments exist:
   - Category assigned to catalog.
   - Products assigned to that category in that catalog.

Without step 5 you typically get `200` with only default/old items, or empty results.

## Proxy Process Notes

If you see inconsistent behavior, stale proxy process on `8795` is common.

- Ensure only one process is bound to `127.0.0.1:8795`.
- Restart proxy after changing `wrangler.local.toml`.

## Troubleshooting Matrix

- `502` + `401 invalid or expired` from app route:
  - Proxy likely injecting wrong header/context or stale runtime.
  - Verify `LOCAL_SEND_ENVOY_HEADER=false`, restart proxy.
- `200` but only one product (`product_0001`):
  - Catalog assignments missing in OC portal.
- `403` on catalog endpoints:
  - Shopper token path should use `me/products` with `catalogID` query, not admin-style catalog endpoints.

## Dev Helper Script

Run local diagnostics:

```bash
npm run commerce:check
```

This checks proxy health, app endpoint, and (if token script is available) direct-vs-proxy OC status.

## One-Command Bring-Up

To start both local processes (proxy + app), wait for readiness, then run diagnostics:

```bash
npm run commerce:up
```

Logs are written to:

- `.logs/proxy.log`
- `.logs/app.log`

If a port is already in use, the script reuses the running process and continues.