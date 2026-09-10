'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type ProductsPayload = {
  items?: Array<{ id?: string; name?: string }>;
  error?: string;
};

type AnonymousPayload = {
  ok?: boolean;
  error?: string;
};

type ConnectReadinessPayload = {
  ready: boolean;
  checks: {
    stripeSecretKey: boolean;
    stripeWebhookSecret: boolean;
    stripeConnectedAccountId: boolean;
    appUrl: boolean;
    middlewareClientId: boolean;
    middlewareClientSecret: boolean;
    orderCloudBuyerClientId: boolean;
    orderCloudBuyerId: boolean;
  };
  notes: string[];
};

export default function CommerceTestPage() {
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [sessionResult, setSessionResult] = useState<string | null>(null);
  const [connectReadiness, setConnectReadiness] = useState<ConnectReadinessPayload | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadProducts = async () => {
      try {
        const response = await fetch('/api/commerce/products', {
          signal: controller.signal,
          cache: 'no-store',
        });
        const payload = (await response.json()) as ProductsPayload;

        if (!response.ok) {
          throw new Error(payload.error || 'Product API request failed');
        }

        setProductCount(Array.isArray(payload.items) ? payload.items.length : 0);
        setProductsError(null);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        setProductsError(error instanceof Error ? error.message : 'Product API request failed');
      } finally {
        setLoadingProducts(false);
      }
    };

    const loadReadiness = async () => {
      try {
        const response = await fetch('/api/commerce/checkout/connect/readiness', {
          signal: controller.signal,
          cache: 'no-store',
        });
        const payload = (await response.json()) as ConnectReadinessPayload;
        setConnectReadiness(payload);
      } catch {
        setConnectReadiness(null);
      }
    };

    void loadProducts();
    void loadReadiness();
    return () => controller.abort();
  }, []);

  const createAnonymousSession = async () => {
    setCreatingSession(true);
    setSessionResult(null);

    try {
      const response = await fetch('/api/commerce/auth/anonymous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const payload = (await response.json()) as AnonymousPayload;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Anonymous session request failed');
      }

      setSessionResult('Anonymous shopper session created.');
    } catch (error) {
      setSessionResult(error instanceof Error ? error.message : 'Anonymous session request failed');
    } finally {
      setCreatingSession(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.16em]">
        Local Commerce Diagnostics
      </p>
      <h1 className="text-4xl font-semibold">Commerce test route</h1>
      <div className="space-y-2 rounded-lg border p-4 text-sm">
        <p className="font-medium">Product API</p>
        {loadingProducts && <p className="text-muted-foreground">Loading products...</p>}
        {!loadingProducts && productsError && <p className="text-red-600">{productsError}</p>}
        {!loadingProducts && !productsError && (
          <p className="text-emerald-700">Products loaded: {productCount}</p>
        )}
      </div>

      <div className="space-y-2 rounded-lg border p-4 text-sm">
        <p className="font-medium">Anonymous shopper session</p>
        <button
          type="button"
          onClick={createAnonymousSession}
          disabled={creatingSession}
          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-md border px-3 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {creatingSession ? 'Creating session...' : 'Create anonymous session'}
        </button>
        {sessionResult && <p className="text-muted-foreground">{sessionResult}</p>}
      </div>

      <div className="space-y-2 rounded-lg border p-4 text-sm">
        <p className="font-medium">Stripe Connect readiness</p>
        {!connectReadiness && <p className="text-muted-foreground">Unable to load readiness.</p>}
        {connectReadiness && (
          <>
            <p className={connectReadiness.ready ? 'text-emerald-700' : 'text-amber-700'}>
              {connectReadiness.ready
                ? 'Ready: checkout + webhook fulfillment can be proved.'
                : 'Not ready yet: one or more required checks failed.'}
            </p>
            {connectReadiness.notes.map((note, index) => (
              <p key={`readiness-note-${index}`} className="text-muted-foreground">
                {note}
              </p>
            ))}
          </>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link className="rounded-lg border px-4 py-3 text-sm font-medium hover:bg-muted/60" href="/checkout/success">
          Open checkout success page
        </Link>
        <Link className="rounded-lg border px-4 py-3 text-sm font-medium hover:bg-muted/60" href="/checkout/cancel">
          Open checkout cancel page
        </Link>
      </div>
    </main>
  );
}
