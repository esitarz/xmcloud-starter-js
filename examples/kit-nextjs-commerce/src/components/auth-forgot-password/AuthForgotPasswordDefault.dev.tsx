'use client';

import { FormEvent, useState } from 'react';
import { Text } from '@sitecore-content-sdk/nextjs';
import { NoDataFallback } from '@/utils/NoDataFallback';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AuthForgotPasswordProps } from './auth-forgot-password.props';

export const AuthForgotPasswordDefault: React.FC<
  AuthForgotPasswordProps & { isPageEditing: boolean }
> = (props) => {
  const datasource = props.fields?.data?.datasource;
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!datasource) {
    return <NoDataFallback componentName="AuthForgotPassword" />;
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/commerce/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          buyerId: datasource.buyerId?.jsonValue?.value,
          resetUrl: window.location.origin,
        }),
      });

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error || 'Request failed');
      }

      setSuccess(
        datasource.successMessage?.jsonValue?.value || 'If account exists, reset instructions were sent.'
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Forgot password request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section data-component="AuthForgotPassword" className="my-8">
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>
            <Text field={datasource.title?.jsonValue || { value: 'Forgot Password' }} tag="h2" />
          </CardTitle>
          <CardDescription>
            <Text
              field={
                datasource.description?.jsonValue || { value: 'Request password reset instructions.' }
              }
              tag="p"
            />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Username or email"
              required
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {success ? <p className="text-sm text-green-700">{success}</p> : null}
            <Button type="submit" disabled={loading}>
              {loading
                ? 'Submitting...'
                : datasource.buttonText?.jsonValue?.value || 'Send reset instructions'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
};
