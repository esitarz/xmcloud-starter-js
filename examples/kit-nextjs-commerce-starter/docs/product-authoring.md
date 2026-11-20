# Product authoring comparison

The starter currently supports two editor experiences against the same Sitecore fields:

1. The existing SitecoreAI Marketplace custom-field app at `/ordercloud-product-picker` and `/ordercloud-product-picker-multiple`.
2. The in-component product selector rendered directly in Pages for `ProductContainer` and `FeaturedProducts`.

Both experiences store only stable OrderCloud IDs. Product names, images, prices, and other details are loaded from OrderCloud at runtime.

## Field values

- Product page `Use Route Path`: whether the live product ID comes from the URL.
- Product page `Product ID`: one plain OrderCloud product ID when route-path use is disabled.
- Product page `Product Preview ID`: one plain OrderCloud product ID for wildcard-page authoring.
- Legacy ProductContainer datasource `Product ID` and `Preview Product ID`: supported when the page has no product configuration fields.
- `FeaturedProducts.Products`: one OrderCloud product ID per line, in display order.

Structured JSON values are intentionally unsupported. Existing values must be changed to the formats above.

## Editable product detail composition

The product page owns product configuration. ProductContainer provides shared product state and exposes a Sitecore placeholder; it does not inject a product detail template when the placeholder is empty.

1. In Pages, open the wildcard Product page and select ProductContainer.
2. Add ProductImageGallery, ProductInfo, SpecForm, and AddToCart inside its placeholder. These must be nested Sitecore renderings, not React-only children.
3. If Pages does not offer these renderings, verify the Placeholder Settings entry for `product-container-{*}` and its Allowed Controls list. Allow all four renderings and associate the settings with ProductContainer as required by the site's rendering configuration.
4. Save and verify that Layout Service returns these children under ProductContainer's `placeholders["product-container-2"]` when `DynamicPlaceholderId` is `"2"`. Publish the relevant content and presentation configuration for the live site.

Without authored children, the product detail area remains empty. A missing-placeholder warning indicates incomplete presentation content or configuration; it is not repaired by a runtime fallback. Live Pages acceptance and Layout Service output must be verified against CM.

## SitecoreAI changes for the comparison

Keep the existing Plugin field types and Marketplace app registration while comparing the two experiences. The in-component editor can update the same raw field values through the Authoring and Management API.

After the comparison, if the Marketplace app is removed:

- Change `Product ID` and `Preview Product ID` to Single-Line Text.
- Change `Products` to Multi-Line Text.
- Keep the field names and existing ID-only values unchanged.

No serialized `authoring/items/commerce` changes are included in this implementation.

## Authoring API configuration

Create an environment automation client with access to the Sitecore Authoring and Management GraphQL API, then configure these server-only variables on the editing host:

```text
SITECORE_AUTHORING_HOST=https://your-cm-host
SITECORE_AUTHORING_CLIENT_ID=...
SITECORE_AUTHORING_CLIENT_SECRET=...
```

`SITECORE_AUTHORING_AUTHORITY` and `SITECORE_AUTHORING_AUDIENCE` are optional and default to the SitecoreAI cloud authority and audience.

The automation credential and access token are never sent to the browser. The field API validates the existing `SITECORE_EDITING_SECRET` that Pages supplies when it renders the editing canvas, requires a same-origin browser request, and accepts only the explicitly registered product field names. Add any future reusable authoring field to that server-side allowlist deliberately.

Configure the `SITECORE_AUTHORING_*` variables only on the editing-host deployment. Leave them unset on the public rendering host so that deployment cannot obtain an Authoring API token or perform content writes.

The Authoring API write uses the automation client's service identity. It does not inherit the individual Pages user's Sitecore permissions, so the automation client should be limited to the required environment and content scope.
