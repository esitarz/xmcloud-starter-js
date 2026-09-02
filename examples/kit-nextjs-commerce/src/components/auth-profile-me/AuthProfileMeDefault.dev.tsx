'use client';

import { useEffect, useState } from 'react';
import { Text } from '@sitecore-content-sdk/nextjs';
import { NoDataFallback } from '@/utils/NoDataFallback';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AuthProfileMeProps } from './auth-profile-me.props';

interface MePayload {
  Username: string;
  FirstName?: string;
  LastName?: string;
  Email?: string;
}

export const AuthProfileMeDefault: React.FC<AuthProfileMeProps & { isPageEditing: boolean }> = (
  props
) => {
  const datasource = props.fields?.data?.datasource;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<MePayload | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadMe = async (): Promise<void> => {
      try {
        const response = await fetch('/api/commerce/auth/me', {
          method: 'GET',
        });

        const result = (await response.json()) as { me?: MePayload; error?: string };

        if (!response.ok) {
          throw new Error(result.error || 'Not authenticated');
        }

        if (!cancelled) {
          setMe(result.me || null);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load profile');
          setMe(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadMe();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!datasource) {
    return <NoDataFallback componentName="AuthProfileMe" />;
  }

  const onLogout = async (): Promise<void> => {
    await fetch('/api/commerce/auth/logout', { method: 'POST' });
    setMe(null);
    setError('Logged out');
  };

  return (
    <section data-component="AuthProfileMe" className="my-8">
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>
            <Text field={datasource.title?.jsonValue || { value: 'My Profile' }} tag="h2" />
          </CardTitle>
          <CardDescription>
            <Text
              field={
                datasource.description?.jsonValue ||
                { value: 'Reads authenticated /me profile from OrderCloud.' }
              }
              tag="p"
            />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? <p>Loading profile...</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {me ? (
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="font-semibold">Username</dt>
                <dd>{me.Username}</dd>
              </div>
              <div>
                <dt className="font-semibold">Email</dt>
                <dd>{me.Email || '-'}</dd>
              </div>
              <div>
                <dt className="font-semibold">Name</dt>
                <dd>{`${me.FirstName || ''} ${me.LastName || ''}`.trim() || '-'}</dd>
              </div>
            </dl>
          ) : null}
          <Button type="button" variant="secondary" onClick={onLogout}>
            {datasource.logoutButtonText?.jsonValue?.value || 'Logout'}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
};
