'use client';

import { FormEvent, useMemo, useState } from 'react';

type TokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string | null;
  [key: string]: unknown;
};

const DEFAULT_TENANT_ID = '63f53581-026c-4660-28db-08db9261b75f';

const createPayload = (tenantId: string) => ({
  currentRequest: {
    url: 'https://local.test/storefront/oauth/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    contentType: 'application/x-www-form-urlencoded',
  },
  originalRequestData: {
    url: 'https://local.test/storefront/oauth/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    contentType: 'application/x-www-form-urlencoded',
  },
  context: {
    ordercloudResource: {
      tenant_id: tenantId,
    },
  },
  traceType: 'none',
  currentStep: 'xmc-ui-manual-test',
});

export function XmcTokenLab() {
  const [tenantId, setTenantId] = useState(DEFAULT_TENANT_ID);
  const [status, setStatus] = useState<string>('Idle');
  const [token, setToken] = useState<string>('');
  const [rawResponse, setRawResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const canCopyToken = useMemo(() => token.length > 0, [token]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setStatus('Requesting token...');
    setToken('');

    try {
      const response = await fetch('/api/commerce/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createPayload(tenantId.trim() || DEFAULT_TENANT_ID)),
      });

      const text = await response.text();
      setRawResponse(text);

      let parsed: TokenResponse | null = null;
      try {
        parsed = JSON.parse(text) as TokenResponse;
      } catch {
        parsed = null;
      }

      if (!response.ok) {
        setStatus(`Failed (${response.status})`);
        return;
      }

      setToken(parsed?.access_token || '');
      setStatus('Token received');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setStatus(`Failed (${message})`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToken = async () => {
    if (!canCopyToken) {
      return;
    }

    try {
      await navigator.clipboard.writeText(token);
      setStatus('Token copied to clipboard');
    } catch {
      setStatus('Copy failed. Select manually.');
    }
  };

  return (
    <section className="mx-auto max-w-4xl rounded-3xl border border-black/10 bg-gradient-to-br from-amber-50 via-white to-cyan-50 p-6 shadow-sm">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">XMC Commerce Token Lab</h1>
      <p className="mt-2 text-sm text-slate-700">
        Dispatch through local Next API to local proxy, then inspect returned OrderCloud token.
      </p>

      <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
        <label className="grid gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-700">Tenant ID</span>
          <input
            value={tenantId}
            onChange={(event) => setTenantId(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-400 transition focus:ring-2"
            placeholder="OrderCloud tenant id"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? 'Requesting...' : 'Request Token'}
          </button>
          <button
            type="button"
            onClick={copyToken}
            disabled={!canCopyToken}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Copy Token
          </button>
          <p className="self-center text-sm text-slate-700">Status: {status}</p>
        </div>
      </form>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-700">Access Token</span>
          <textarea
            value={token}
            readOnly
            rows={8}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-800"
            placeholder="Token will appear here"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-700">Raw Response</span>
          <textarea
            value={rawResponse}
            readOnly
            rows={10}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-800"
            placeholder="Raw JSON response from /api/commerce/dispatch"
          />
        </label>
      </div>
    </section>
  );
}
