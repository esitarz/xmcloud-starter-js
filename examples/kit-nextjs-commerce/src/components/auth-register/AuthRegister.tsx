import type React from 'react';
import type { AuthRegisterProps } from './auth-register.props';
import { AuthRegisterDefault } from './AuthRegisterDefault.dev';

export const Default: React.FC<AuthRegisterProps> = (props) => {
  const { page } = props;
  const isPageEditing = page.mode.isEditing;
  return <AuthRegisterDefault {...props} isPageEditing={isPageEditing} />;
};
