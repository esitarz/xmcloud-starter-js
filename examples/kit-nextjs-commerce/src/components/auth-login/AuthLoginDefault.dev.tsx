'use client';

import { FormEvent, useState } from 'react';
import { Text } from '@sitecore-content-sdk/nextjs';
import { NoDataFallback } from '@/utils/NoDataFallback';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AuthLoginProps } from './auth-login.props';

export const AuthLoginDefault: React.FC<AuthLoginProps & { isPageEditing: boolean }> = (props) => {
  const datasource = props.fields?.data?.datasource;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!datasource) {
    return <NoDataFallback componentName="AuthLogin" />;
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/commerce/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          buyerId: datasource.buyerId?.jsonValue?.value,
        }),
      });

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }

      setSuccess(datasource.successMessage?.jsonValue?.value || 'Logged in successfully.');
      setPassword('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section data-component="AuthLogin" className="my-8">
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>
            <Text field={datasource.title?.jsonValue || { value: 'Login' }} tag="h2" />
          </CardTitle>
          <CardDescription>
            <Text
              field={
                datasource.description?.jsonValue ||
                { value: 'Sign in with your OrderCloud shopper credentials.' }
              }
              tag="p"
            />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block">
                {datasource.usernameLabel?.jsonValue?.value || 'Username'}
              </span>
              <Input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block">
                {datasource.passwordLabel?.jsonValue?.value || 'Password'}
              </span>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {success ? <p className="text-sm text-green-700">{success}</p> : null}
            <Button type="submit" disabled={loading}>
              {loading ? 'Signing in...' : datasource.buttonText?.jsonValue?.value || 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
};
