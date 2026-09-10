// Below are built-in components that are available in the app, it's recommended to keep them as is

import { BYOCServerWrapper, NextjsContentSdkComponent, FEaaSServerWrapper } from '@sitecore-content-sdk/nextjs';
import { Form } from '@sitecore-content-sdk/nextjs';

// end of built-in components
import * as ProductListing from 'src/components/product-listing/ProductListing';
import * as PartialDesignDynamicPlaceholder from 'src/components/partial-design-dynamic-placeholder/PartialDesignDynamicPlaceholder';
import * as OrderCloudProductList from 'src/components/commerce/OrderCloudProductList';
import * as OrderCloudProductCard from 'src/components/commerce/OrderCloudProductCard';

export const componentMap = new Map<string, NextjsContentSdkComponent>([
  ['BYOCWrapper', BYOCServerWrapper],
  ['FEaaSWrapper', FEaaSServerWrapper],
  ['Form', { ...Form, componentType: 'client' }],
  ['ProductListing', { ...ProductListing }],
  ['PartialDesignDynamicPlaceholder', { ...PartialDesignDynamicPlaceholder }],
  ['OrderCloudProductList', { ...OrderCloudProductList, componentType: 'client' }],
  ['OrderCloudProductCard', { ...OrderCloudProductCard, componentType: 'client' }],
]);

export default componentMap;
