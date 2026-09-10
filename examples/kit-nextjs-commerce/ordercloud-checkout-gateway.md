# OrderCloud Checkout Gateway

## Overview

The OrderCloud Checkout Gateway is a multi-tenant API that enables Sitecore AI storefronts to perform hosted checkout through Stripe without requiring custom payment integrations in every implementation.

The gateway acts as middleware between:
- Sitecore AI storefronts
- OrderCloud
- Stripe

It validates OrderCloud JWTs, resolves tenant configuration, initiates checkout sessions, processes payment webhooks, and submits orders.

---

## Goals

- Support hosted checkout for Sitecore AI storefronts.
- Isolate payment configuration per customer.
- Avoid changes to OrderCloud CoreAPI payment flows.
- Support multiple payment providers in the future.
- Deploy alongside existing OrderCloud regional infrastructure.

---

## Responsibilities

### Authentication

- Accept OrderCloud JWTs.
- Resolve originating OrderCloud environment.
- Retrieve appropriate regional public key.
- Validate token signature.
- Use claims to identify tenant configuration.

### Checkout

- Create Stripe Checkout Sessions.
- Return hosted checkout URL to storefront.
- Correlate payment events with OrderCloud orders.

### Payment Processing

- Accept Stripe webhooks.
- Verify webhook signatures.
- Create payment transactions.
- Submit orders.
- Update checkout status.

### Configuration

Store tenant-scoped checkout configuration:
- Stripe API Secret
- Stripe Webhook Secret
- Return URL

Configuration is scoped to an OrderCloud ApiClient.

---

## Checkout Flow

### 1. Checkout Initialization

Storefront calls:

```text
POST /stripe/checkout
```

Gateway:
- Validates OrderCloud JWT
- Resolves tenant configuration
- Creates Stripe Checkout Session
- Returns Stripe checkout URL

### 2. Stripe Checkout

Customer completes payment on Stripe-hosted pages.

### 3. Completion

Stripe performs two independent actions.

Browser Redirect:
- Redirect user back to configured return URL.

Webhook:
- Sends payment event to:

```text
POST /stripe/complete
```

Gateway:
- Validates webhook signature
- Updates tax/shipping totals
- Creates payment transaction
- Submits OrderCloud order
- Updates checkout status

### 4. Confirmation Page

Storefront polls OrderCloud until `order.xp.CheckoutStatus` contains a terminal status.

Render:
- Success
- Failure
- Cancellation

---

## Regional Deployment

Deploy alongside OrderCloud regional infrastructure.

Regions follow existing OrderCloud deployment patterns.

Examples:
- US East
- US West
- Europe West
- Australia East
- Japan East
- Southeast Asia

---

## Secret Storage

Secrets must be stored outside OrderCloud.

Recommended:
- Azure Key Vault
- Regional storage
- Versioned secrets
- Gateway-only access

Secrets are write-only from the configuration API.

---

## Success Criteria

- Hosted checkout works without customer code.
- JWT validation works in every region.
- Stripe payments submit OrderCloud orders.
- Webhook processing is idempotent.
- Checkout status is accurately reflected in OrderCloud.
- Tenant payment credentials remain isolated.
