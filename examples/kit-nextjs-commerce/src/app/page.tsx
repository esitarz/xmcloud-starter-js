import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.16em]">
        Commerce Starter Baseline
      </p>
      <h1 className="text-4xl font-semibold">Kit Next.js Commerce</h1>
      <p className="text-muted-foreground text-sm">
        Foundation reset completed from basic-nextjs. Use the links below to validate commerce flows.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link className="rounded-lg border px-4 py-3 text-sm font-medium hover:bg-muted/60" href="/test">
          Open /test diagnostics
        </Link>
        <Link className="rounded-lg border px-4 py-3 text-sm font-medium hover:bg-muted/60" href="/oc-test">
          Open /oc-test diagnostics
        </Link>
        <Link
          className="rounded-lg border px-4 py-3 text-sm font-medium hover:bg-muted/60"
          href="/checkout/success"
        >
          Open checkout success page
        </Link>
        <Link className="rounded-lg border px-4 py-3 text-sm font-medium hover:bg-muted/60" href="/checkout/cancel">
          Open checkout cancel page
        </Link>
      </div>
    </main>
  );
}
