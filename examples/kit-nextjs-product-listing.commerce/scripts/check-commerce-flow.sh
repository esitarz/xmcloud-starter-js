#!/usr/bin/env bash

set -euo pipefail

APP_URL="${APP_URL:-http://127.0.0.1:3000}"
PROXY_URL="${PROXY_URL:-http://127.0.0.1:8795}"
CATALOG_ID="${CATALOG_ID:-${LOCAL_ORDERCLOUD_CATALOG_ID:-nike-shoes-demo-catalog}}"
TOKEN_CMD="${TOKEN_CMD:-}"

if [[ -z "$TOKEN_CMD" ]]; then
  if [[ -x "/Users/ersi/Devtop/sitecore.ep.proxy.oc-storefront/get-oc-token.sh" ]]; then
    TOKEN_CMD="/Users/ersi/Devtop/sitecore.ep.proxy.oc-storefront/get-oc-token.sh"
  elif command -v get-oc-token.sh >/dev/null 2>&1; then
    TOKEN_CMD="get-oc-token.sh"
  fi
fi

title() {
  printf '\n== %s ==\n' "$1"
}

status_only() {
  curl -sS -o /dev/null -w '%{http_code}' "$1"
}

title "Inputs"
echo "APP_URL=$APP_URL"
echo "PROXY_URL=$PROXY_URL"
echo "CATALOG_ID=$CATALOG_ID"
if [[ -n "$TOKEN_CMD" ]]; then
  echo "TOKEN_CMD=$TOKEN_CMD"
else
  echo "TOKEN_CMD=<not configured>"
fi

title "Proxy Health"
proxy_health_status="$(status_only "$PROXY_URL/health" || true)"
echo "proxy_health_status=$proxy_health_status"
if [[ "$proxy_health_status" == "200" ]]; then
  curl -sS "$PROXY_URL/health"
else
  echo "Proxy not healthy/reachable."
fi

title "App Endpoint"
app_response="$(curl -sS -i "$APP_URL/api/commerce/products" || true)"
echo "$app_response" | sed -n '1,20p'

if [[ -n "$TOKEN_CMD" ]]; then
  title "Token + Direct/Proxy OC Checks"
  if TOKEN="$($TOKEN_CMD 2>/dev/null)"; then
    echo "token_len=${#TOKEN}"

    direct_status="$(curl -sS -o /dev/null -w '%{http_code}' "https://sandboxapi.ordercloud.io/v1/me/products?catalogID=$CATALOG_ID" -H "Authorization: Bearer $TOKEN")"
    proxy_status="$(curl -sS -o /dev/null -w '%{http_code}' "$PROXY_URL/oc/v1/me/products?catalogID=$CATALOG_ID" -H "Authorization: Bearer $TOKEN")"

    echo "direct_status=$direct_status"
    echo "proxy_status=$proxy_status"

    if command -v node >/dev/null 2>&1; then
      title "Token Claims"
      node -e "const t=process.argv[1]||'';const p=t.split('.')[1]||'';const j=JSON.parse(Buffer.from(p,'base64url').toString('utf8'));console.log(JSON.stringify({iss:j.iss,aud:j.aud,cid:j.cid,usrtype:j.usrtype,buyerid:j.buyerid,exp:j.exp},null,2));" "$TOKEN" || true
    fi
  else
    echo "Token fetch failed. Ensure proxy is running and TOKEN_CMD is valid."
  fi
fi

title "Interpretation"
echo "- app=502 + '401 invalid or expired': auth/proxy mismatch (often stale proxy process or envoy header issue)."
echo "- direct=200 and proxy=401: proxy runtime mismatch; restart clean proxy on $PROXY_URL."
echo "- app=200 but items empty/only default product: OC catalog/category/product assignments incomplete."