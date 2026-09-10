# Checkout Gateway MVP

## Scope

The MVP focuses exclusively on proving hosted checkout with Stripe.

Out of scope:
- Multiple payment providers
- Advanced merchant onboarding
- Automated provisioning
- Commerce Admin UI
- Checkout component personalization

---

## Required Endpoints

### Set Stripe API Key

```text
POST /config/{client_id}/stripe/api_key
```

Stores Stripe secret key.

Requirements:
- Valid admin JWT
- ApiClientAdmin role
- Marketplace ownership validation

### Set Webhook Secret

```text
POST /config/{client_id}/stripe/webhook_signing_secret
```

Stores Stripe webhook signing secret.

Requirements:
- Valid admin JWT
- ApiClientAdmin role
- Marketplace ownership validation

### Set Return URL

```text
POST /config/{client_id}/stripe/return_url
```

Stores checkout return URL.

Requirements:
- Valid admin JWT
- ApiClientAdmin role
- Marketplace ownership validation

### Create Checkout Session

```text
POST /stripe/checkout
```

Requirements:
- Shopping-user OrderCloud JWT

Behavior:
- Validate JWT
- Resolve Stripe configuration
- Create Checkout Session
- Return hosted checkout URL

### Process Stripe Webhook

```text
POST /stripe/complete
```

Requirements:
- Valid webhook signature

Behavior (Success):
- Calculate final totals
- Create accepted payment
- Create payment transaction
- Submit order
- Set success status

Behavior (Failure):
- Create unsuccessful transaction
- Set failure status

Must be idempotent.

---

## Configuration Model

Per ApiClient:
- Stripe Secret Key
- Stripe Webhook Secret
- Return URL

---

## Authentication Model

### Admin Configuration APIs

Require:
- Signature-valid JWT
- ApiClientAdmin role
- Marketplace ownership verification

Role possession alone is not sufficient.

### Checkout API

Require:
- Signature-valid shopping JWT

---

## Order Status Tracking

Gateway updates `order.xp.CheckoutStatus`.

Possible values:
- Pending
- Success
- Failed
- Cancelled

Storefront is responsible for polling and rendering state.

---

## MVP Deliverables

### Gateway Service

- Stripe integration
- JWT validation
- Order submission flow
- Checkout status updates

### Secret Storage

- Azure Key Vault
- Per-client configuration

### Regional Deployment

- Follow OrderCloud regional deployment model

### Reference Storefront

- Hosted checkout
- Redirect handling
- Order confirmation page

---

## Done Criteria

- Customer can place order.
- Hosted checkout launches.
- Payment processes successfully.
- Order submits automatically.
- Confirmation page reflects final order state.
- Duplicate webhooks do not create duplicate payments.
