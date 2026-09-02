import type React from 'react';
import type { AuthProfileMeProps } from './auth-profile-me.props';
import { AuthProfileMeDefault } from './AuthProfileMeDefault.dev';

export const Default: React.FC<AuthProfileMeProps> = (props) => {
  const { page } = props;
  const isPageEditing = page.mode.isEditing;
  return <AuthProfileMeDefault {...props} isPageEditing={isPageEditing} />;
};
