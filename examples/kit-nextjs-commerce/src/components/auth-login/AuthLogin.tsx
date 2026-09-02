import type React from 'react';
import type { AuthLoginProps } from './auth-login.props';
import { AuthLoginDefault } from './AuthLoginDefault.dev';

export const Default: React.FC<AuthLoginProps> = (props) => {
  const { page } = props;
  const isPageEditing = page.mode.isEditing;
  return <AuthLoginDefault {...props} isPageEditing={isPageEditing} />;
};
