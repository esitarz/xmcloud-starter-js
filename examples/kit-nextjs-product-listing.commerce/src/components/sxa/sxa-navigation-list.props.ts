import type { LinkField, TextField } from '@sitecore-content-sdk/nextjs';
import type { JSX } from 'react';
import type { GetLinkField, GetNavigationText, NavigationFields } from './sxa-navigation.props';

export type NavigationListProps = {
  fields: NavigationFields;
  handleClick: (event?: React.MouseEvent<HTMLElement>) => void;
  relativeLevel: number;
  isEditing: boolean;
  getLinkField: GetLinkField;
  getNavigationText: GetNavigationText;
};

export type NavigationListRenderFields = NavigationFields;