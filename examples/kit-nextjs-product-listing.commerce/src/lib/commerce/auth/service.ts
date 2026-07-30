import 'server-only';
import { commerceAuthConfig, resolveBuyerClientId } from './config';
import { orderCloudRequest, orderCloudTokenRequest } from './client';
import {
  CommerceForgotPasswordInput,
  CommerceLoginInput,
  CommerceRegisterInput,
  CommerceAuthUser,
  OrderCloudTokenResponse,
} from './types';

const buildClientId = (buyerId?: string): string => resolveBuyerClientId(buyerId);

const buildTokenParams = (
  grantType: 'password' | 'client_credentials',
  clientId: string,
  username?: string,
  password?: string
): URLSearchParams => {
  const params = new URLSearchParams();
  params.set('grant_type', grantType);
  params.set('client_id', clientId);

  if (grantType === 'password') {
    params.set('username', username || '');
    params.set('password', password || '');
    return params;
  }

  if (commerceAuthConfig.anonymousScope) {
    params.set('scope', commerceAuthConfig.anonymousScope);
  }

  return params;
};

export const createAnonymousToken = async (buyerId?: string): Promise<OrderCloudTokenResponse> => {
  const clientId = buildClientId(buyerId);
  return orderCloudTokenRequest<OrderCloudTokenResponse>(
    buildTokenParams('client_credentials', clientId)
  );
};

export const loginWithPassword = async (
  input: CommerceLoginInput
): Promise<OrderCloudTokenResponse> => {
  const clientId = buildClientId(input.buyerId);
  return orderCloudTokenRequest<OrderCloudTokenResponse>(
    buildTokenParams('password', clientId, input.username, input.password)
  );
};

export const getMe = async (token: string): Promise<CommerceAuthUser> => {
  return orderCloudRequest<CommerceAuthUser>('/v1/me', { method: 'GET' }, token);
};

export const registerAccount = async (input: CommerceRegisterInput): Promise<void> => {
  const anonymous = await createAnonymousToken(input.buyerId);
  const clientId = buildClientId(input.buyerId);

  await orderCloudRequest<void>(
    '/v1/me/register',
    {
      method: 'POST',
      body: JSON.stringify({
        ClientID: clientId,
        Username: input.username,
        Password: input.password,
        Email: input.email,
        FirstName: input.firstName,
        LastName: input.lastName,
        Phone: input.phone,
      }),
    },
    anonymous.access_token
  );
};

export const forgotPassword = async (input: CommerceForgotPasswordInput): Promise<void> => {
  const clientId = buildClientId(input.buyerId);

  await orderCloudRequest<void>('/v1/password/reset', {
    method: 'POST',
    body: JSON.stringify({
      ClientID: clientId,
      Username: input.username,
      URL: input.resetUrl,
    }),
  });
};
