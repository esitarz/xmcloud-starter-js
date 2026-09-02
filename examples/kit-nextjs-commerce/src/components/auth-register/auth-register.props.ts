import { Field } from '@sitecore-content-sdk/nextjs';
import { ComponentProps } from '@/lib/component-props';

interface AuthRegisterParams {
  [key: string]: string;
}

interface AuthRegisterDatasource {
  title?: { jsonValue: Field<string> };
  description?: { jsonValue: Field<string> };
  buyerId?: { jsonValue: Field<string> };
  buttonText?: { jsonValue: Field<string> };
  successMessage?: { jsonValue: Field<string> };
}

interface AuthRegisterFields {
  data?: {
    datasource?: AuthRegisterDatasource;
  };
}

export interface AuthRegisterProps extends ComponentProps {
  params: AuthRegisterParams;
  fields: AuthRegisterFields;
  isPageEditing?: boolean;
}
