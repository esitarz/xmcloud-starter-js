import Link from 'next/link';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

type EnvCheck = {
  key: string;
  required: boolean;
  scope: 'client' | 'server';
  value: string;
  present: boolean;
  placeholder: boolean;
};

type EndpointReport = {
  label: string;
  path: string;
  method: 'GET' | 'POST';
  status: number;
  ok: boolean;
  bodyPreview: string;
};

const ENV_CHECKS: Array<Omit<EnvCheck, 'value' | 'present' | 'placeholder'>> = [
  { key: 'SITECORE_EDGE_CONTEXT_ID', required: true, scope: 'server' },
  { key: 'NEXT_PUBLIC_SITECORE_EDGE_CONTEXT_ID', required: true, scope: 'client' },
  { key: 'NEXT_PUBLIC_DEFAULT_SITE_NAME', required: true, scope: 'client' },
  { key: 'NEXT_PUBLIC_ORDERCLOUD_BASE_API_URL', required: true, scope: 'client' },
  { key: 'NEXT_PUBLIC_ORDERCLOUD_CLIENT_ID', required: true, scope: 'client' },
  { key: 'ORDERCLOUD_DEFAULT_BUYER_ID', required: true, scope: 'server' },
  { key: 'ORDERCLOUD_BUYER_CLIENT_ID', required: true, scope: 'server' },
  { key: 'ORDERCLOUD_MIDDLEWARE_CLIENT_ID', required: false, scope: 'server' },
  { key: 'ORDERCLOUD_MIDDLEWARE_CLIENT_SECRET', required: false, scope: 'server' },
  { key: 'NEXT_PUBLIC_SITE_URL', required: true, scope: 'client' },
  { key: 'STRIPE_CONNECTED_ACCOUNT_ID', required: true, scope: 'server' },
  { key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', required: true, scope: 'client' },
  { key: 'STRIPE_SECRET_KEY', required: true, scope: 'server' },
  { key: 'STRIPE_WEBHOOK_SECRET', required: true, scope: 'server' },
];

const maskValue = (raw: string): string => {
  if (!raw) {
    return '(empty)';
  }

  if (raw.length <= 8) {
    return `${raw[0] || ''}***${raw[raw.length - 1] || ''}`;
  }

  return `${raw.slice(0, 4)}...${raw.slice(-4)}`;
};

const buildEnvChecks = (): EnvCheck[] => {
  return ENV_CHECKS.map((item) => {
    const value = process.env[item.key]?.trim() || '';
    const placeholder = value.includes('<') || value.includes('>') || value.toLowerCase().includes('your-');

    return {
      ...item,
      value: maskValue(value),
      present: value.length > 0,
      placeholder,
    };
  });
};

const getOrigin = async (): Promise<string> => {
  const requestHeaders = await headers();
  const host = requestHeaders.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  return `${protocol}://${host}`;
};

const probeEndpoint = async (
  origin: string,
  label: string,
  path: string,
  method: 'GET' | 'POST' = 'GET'
): Promise<EndpointReport> => {
  try {
    const response = await fetch(`${origin}${path}`, {
      method,
      cache: 'no-store',
      headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
      body: method === 'POST' ? '{}' : undefined,
    });
    const text = await response.text();
    const bodyPreview = text.length > 380 ? `${text.slice(0, 380)}...` : text;

    return {
      label,
      path,
      method,
      status: response.status,
      ok: response.ok,
      bodyPreview,
    };
  } catch (error) {
    return {
      label,
      path,
      method,
      status: 0,
      ok: false,
      bodyPreview: error instanceof Error ? error.message : 'Request failed',
    };
  }
};

export default async function CommerceLauncherPage() {
  const envChecks = buildEnvChecks();
  const missingRequired = envChecks.filter((item) => item.required && (!item.present || item.placeholder));
  const origin = await getOrigin();

  const endpointReports = await Promise.all([
    probeEndpoint(origin, 'Products API', '/api/commerce/products', 'GET'),
    probeEndpoint(origin, 'Anonymous Auth API', '/api/commerce/auth/anonymous', 'POST'),
    probeEndpoint(origin, 'Cart API', '/api/commerce/cart', 'GET'),
    probeEndpoint(
      origin,
      'Stripe Connect Readiness API',
      '/api/commerce/checkout/connect/readiness',
      'GET'
    ),
  ]);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.16em]">
        Local Commerce Runtime Dashboard
      </p>
      <h1 className="text-4xl font-semibold">Stripe Connect + OrderCloud diagnostics</h1>

      <div className="rounded-lg border p-4 text-sm">
        <p className="font-semibold">Source of env values in local dev</p>
        <p className="text-muted-foreground mt-1">
          sitecore.ai deploy variables are used by deployed rendering hosts. localhost uses this process
          environment (.env.local / shell env) at startup. Restart dev server after env changes.
        </p>
      </div>

      <div className="rounded-lg border p-4 text-sm">
        <p className="font-semibold">Runtime summary</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <p>Origin: {origin}</p>
          <p>Node env: {process.env.NODE_ENV || '(unset)'}</p>
          <p>Required env failures: {missingRequired.length}</p>
          <p>Timestamp: {new Date().toISOString()}</p>
        </div>
      </div>

      <section className="rounded-lg border p-4 text-sm">
        <p className="font-semibold">Environment checks (masked)</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-2">Variable</th>
                <th className="py-2 pr-2">Scope</th>
                <th className="py-2 pr-2">Required</th>
                <th className="py-2 pr-2">Present</th>
                <th className="py-2 pr-2">Placeholder</th>
                <th className="py-2 pr-2">Masked Value</th>
              </tr>
            </thead>
            <tbody>
              {envChecks.map((item) => (
                <tr key={item.key} className="border-b align-top">
                  <td className="py-2 pr-2 font-mono text-xs">{item.key}</td>
                  <td className="py-2 pr-2">{item.scope}</td>
                  <td className="py-2 pr-2">{item.required ? 'yes' : 'optional'}</td>
                  <td className="py-2 pr-2">{item.present ? 'yes' : 'no'}</td>
                  <td className="py-2 pr-2">{item.placeholder ? 'yes' : 'no'}</td>
                  <td className="py-2 pr-2 font-mono text-xs">{item.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border p-4 text-sm">
        <p className="font-semibold">Live endpoint probes</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {endpointReports.map((report) => (
            <div key={report.path} className="rounded-md border p-3">
              <p className="font-medium">{report.label}</p>
              <p className="text-muted-foreground text-xs">
                {report.method} {report.path}
              </p>
              <p className={report.ok ? 'mt-2 text-emerald-700' : 'mt-2 text-red-700'}>
                HTTP {report.status || 'request failed'}
              </p>
              <pre className="bg-muted mt-2 max-h-52 overflow-auto rounded p-2 text-xs whitespace-pre-wrap break-words">
                {report.bodyPreview || '(empty response body)'}
              </pre>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link className="rounded-lg border px-4 py-3 text-sm font-medium hover:bg-muted/60" href="/test">
          Open /test diagnostics
        </Link>
        <Link className="rounded-lg border px-4 py-3 text-sm font-medium hover:bg-muted/60" href="/oc-test">
          Open /oc-test diagnostics
        </Link>
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
