import { Field } from '@sitecore-content-sdk/nextjs';
import { ComponentProps } from '@/lib/component-props';

interface AuthForgotPasswordParams {
  [key: string]: string;
}

interface AuthForgotPasswordDatasource {
  title?: { jsonValue: Field<string> };
  description?: { jsonValue: Field<string> };
  buyerId?: { jsonValue: Field<string> };
  buttonText?: { jsonValue: Field<string> };
  successMessage?: { jsonValue: Field<string> };
}

interface AuthForgotPasswordFields {
  data?: {
    datasource?: AuthForgotPasswordDatasource;
  };
}

export interface AuthForgotPasswordProps extends ComponentProps {
  params: AuthForgotPasswordParams;
  fields: AuthForgotPasswordFields;
  isPageEditing?: boolean;
}
