import type React from 'react';
import type { AuthForgotPasswordProps } from './auth-forgot-password.props';
import { AuthForgotPasswordDefault } from './AuthForgotPasswordDefault.dev';

export const Default: React.FC<AuthForgotPasswordProps> = (props) => {
  const { page } = props;
  const isPageEditing = page.mode.isEditing;
  return <AuthForgotPasswordDefault {...props} isPageEditing={isPageEditing} />;
};
