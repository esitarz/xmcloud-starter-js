export interface OrderCloudTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface CommerceAuthUser {
  Username: string;
  FirstName?: string;
  LastName?: string;
  Email?: string;
  Phone?: string;
  Active?: boolean;
}

export interface CommerceLoginInput {
  username: string;
  password: string;
  buyerId?: string;
}

export interface CommerceRegisterInput {
  username: string;
  password: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  buyerId?: string;
}

export interface CommerceForgotPasswordInput {
  username: string;
  resetUrl?: string;
  buyerId?: string;
}

export interface OrderCloudApiError {
  Message?: string;
  ErrorCode?: string;
  Errors?: Array<{ ErrorCode?: string; Message?: string }>;
}
