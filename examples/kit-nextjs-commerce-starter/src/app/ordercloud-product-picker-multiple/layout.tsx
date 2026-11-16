'use client';

import { StandaloneCommerceProviders } from '@/contexts/StandaloneCommerceProviders';

export default function OrderCloudProductPickerMultipleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StandaloneCommerceProviders authoring>{children}</StandaloneCommerceProviders>;
}
