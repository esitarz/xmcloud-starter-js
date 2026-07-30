import { Field } from '@sitecore-content-sdk/nextjs';
import { ComponentProps } from '@/lib/component-props';

interface AuthProfileMeParams {
  [key: string]: string;
}

interface AuthProfileMeDatasource {
  title?: { jsonValue: Field<string> };
  description?: { jsonValue: Field<string> };
  logoutButtonText?: { jsonValue: Field<string> };
}

interface AuthProfileMeFields {
  data?: {
    datasource?: AuthProfileMeDatasource;
  };
}

export interface AuthProfileMeProps extends ComponentProps {
  params: AuthProfileMeParams;
  fields: AuthProfileMeFields;
  isPageEditing?: boolean;
}
