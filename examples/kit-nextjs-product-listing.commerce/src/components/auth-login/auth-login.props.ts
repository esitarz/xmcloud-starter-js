import { Field } from '@sitecore-content-sdk/nextjs';
import { ComponentProps } from '@/lib/component-props';

interface AuthLoginParams {
  [key: string]: string;
}

interface AuthLoginDatasource {
  title?: { jsonValue: Field<string> };
  description?: { jsonValue: Field<string> };
  usernameLabel?: { jsonValue: Field<string> };
  passwordLabel?: { jsonValue: Field<string> };
  buyerId?: { jsonValue: Field<string> };
  buttonText?: { jsonValue: Field<string> };
  successMessage?: { jsonValue: Field<string> };
}

interface AuthLoginFields {
  data?: {
    datasource?: AuthLoginDatasource;
  };
}

export interface AuthLoginProps extends ComponentProps {
  params: AuthLoginParams;
  fields: AuthLoginFields;
  isPageEditing?: boolean;
}
