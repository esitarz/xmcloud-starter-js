# OrderCloud Commerce Flow

The storefront uses one browser-side `OrderCloudProvider` for anonymous authentication. The provider obtains a shopper token through the buyer-restricted OrderCloud proxy, stores it in a browser cookie, and prevents storefront components from rendering until authentication is ready. The cookie name defaults to `oc_anonymous_token` and can be changed with `NEXT_PUBLIC_ORDERCLOUD_AUTH_COOKIE_NAME`.

## Runtime data path

1. `OrderCloudProvider` restores a valid token or posts `grant_type=client_credentials` to the proxy.
2. The proxy resolves the OrderCloud API URL and buyer client ID from tenant configuration.
3. Browser product and cart requests go directly to the proxy with `Authorization: Bearer <token>`.
4. The proxy enforces its buyer-route allowlist and forwards the request to OrderCloud.
5. A `401` clears the token, performs anonymous authentication once, and retries once.

The browser never calls OrderCloud directly. Next.js does not forward ordinary product or cart requests. Checkout routes remain server-side and receive the shopper token in their `Authorization` header.

## Local environment

Configure the buyer app:

```bash
NEXT_PUBLIC_ORDERCLOUD_PROXY_URL=http://127.0.0.1:8795/oc
NEXT_PUBLIC_ORDERCLOUD_CATALOG_ID=nike-shoes-demo-catalog
# Optional
NEXT_PUBLIC_ORDERCLOUD_ANONYMOUS_SCOPE=
NEXT_PUBLIC_ORDERCLOUD_AUTH_COOKIE_NAME=oc_anonymous_token
```

Configure the proxy's uncommitted `.dev.vars`:

```bash
LOCAL_DEV_MODE=true
LOCAL_ORDERCLOUD_URL=https://sandboxapi.ordercloud.io
LOCAL_TENANT_ID=<sitecore-tenant-id>
LOCAL_ORDERCLOUD_BUYER_CLIENT_ID=<buyer-client-id>
```

Run the proxy on `localhost:8795` and the buyer app on `localhost:3000`.

## Production dependency

Direct browser requests are intentionally local-only until the proxy has a trusted production contract that resolves a browser request to Sitecore tenant context. Do not accept a caller-supplied tenant ID as trusted input. CORS currently allows any storefront origin; authentication and the buyer-route allowlist remain the security boundary.
