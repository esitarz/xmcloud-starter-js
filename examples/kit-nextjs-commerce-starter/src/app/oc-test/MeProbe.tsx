'use client';
import { useCommerce, useShopper } from '@sitecore-content-sdk/nextjs/commerce';

// Rendered inside src/Providers, which mounts the app-wide CommerceProvider.
export function MeProbe() {
  const { status, session, error: sessionError } = useCommerce();
  const { user, userType, status: meStatus, error, refetch } = useShopper();

  return (
    <pre style={{ padding: 16 }}>
      {JSON.stringify(
        { sessionStatus: status, userType, expiresAt: session?.expiresAt,
          sessionError: sessionError?.message, meStatus, meError: error?.message, user },
        null, 2
      )}
      <br />
      <button onClick={() => refetch()}>Refetch /v1/me</button>
    </pre>
  );
}
