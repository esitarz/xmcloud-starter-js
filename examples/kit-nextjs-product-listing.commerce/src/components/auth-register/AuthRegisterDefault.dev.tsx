'use client';

import { FormEvent, useState } from 'react';
import { Text } from '@sitecore-content-sdk/nextjs';
import { NoDataFallback } from '@/utils/NoDataFallback';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AuthRegisterProps } from './auth-register.props';

export const AuthRegisterDefault: React.FC<AuthRegisterProps & { isPageEditing: boolean }> = (
  props
) => {
  const datasource = props.fields?.data?.datasource;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!datasource) {
    return <NoDataFallback componentName="AuthRegister" />;
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/commerce/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          email,
          firstName,
          lastName,
          buyerId: datasource.buyerId?.jsonValue?.value,
        }),
      });

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      setSuccess(datasource.successMessage?.jsonValue?.value || 'Account created and signed in.');
      setPassword('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section data-component="AuthRegister" className="my-8">
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>
            <Text field={datasource.title?.jsonValue || { value: 'Create Account' }} tag="h2" />
          </CardTitle>
          <CardDescription>
            <Text
              field={
                datasource.description?.jsonValue || { value: 'Register a new shopper account.' }
              }
              tag="p"
            />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="First name"
            />
            <Input
              type="text"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              placeholder="Last name"
            />
            <Input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Username"
              required
            />
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              required
            />
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              required
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {success ? <p className="text-sm text-green-700">{success}</p> : null}
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating account...' : datasource.buttonText?.jsonValue?.value || 'Register'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
};
