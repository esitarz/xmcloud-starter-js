import Link from 'next/link';
import OrderCloudProductList from '@/components/commerce/OrderCloudProductList';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-5xl flex-col justify-center gap-6 px-6 py-16">
      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.16em]">
        Local Commerce Diagnostics
      </p>
      <h1 className="text-4xl font-semibold">Basic Next.js Commerce</h1>
      <p className="text-muted-foreground text-sm">
        Debug-first view for verifying auth, product retrieval, cart, and Stripe connect wiring.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link className="rounded-lg border px-4 py-3 text-sm font-medium hover:bg-muted/60" href="/test">
          Open full diagnostics panel
        </Link>
        <Link className="rounded-lg border px-4 py-3 text-sm font-medium hover:bg-muted/60" href="/oc-test">
          Open /oc-test alias
        </Link>
      </div>

      <OrderCloudProductList title="Live OrderCloud product list" />
    </main>
  );
}
