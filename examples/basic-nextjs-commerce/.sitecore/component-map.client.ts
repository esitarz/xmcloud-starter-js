// Client-safe component map for App Router

import { BYOCClientWrapper, NextjsContentSdkComponent, FEaaSClientWrapper } from '@sitecore-content-sdk/nextjs';
import { Form } from '@sitecore-content-sdk/nextjs';

import * as OrderCloudProductList from 'src/components/commerce/OrderCloudProductList';
import * as OrderCloudProductCard from 'src/components/commerce/OrderCloudProductCard';

export const componentMap = new Map<string, NextjsContentSdkComponent>([
  ['BYOCWrapper', BYOCClientWrapper],
  ['FEaaSWrapper', FEaaSClientWrapper],
  ['Form', Form],
  ['OrderCloudProductList', { ...OrderCloudProductList }],
  ['OrderCloudProductCard', { ...OrderCloudProductCard }],
]);

export default componentMap;
