import 'server-only';
import { commerceDispatcherConfig } from './config';

type DispatchRequestData = {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
  contentType?: string;
};

type DispatchPayload = {
  currentRequest: DispatchRequestData;
  originalRequestData?: DispatchRequestData;
  context?: {
    ordercloudResource?: {
      tenant_id?: string;
    };
    [key: string]: unknown;
  };
  traceType?: string;
  currentStep?: string;
  [key: string]: unknown;
};

type DispatchResponse = {
  status: number;
  contentType: string;
  body: string;
};

const withDefaults = (payload: DispatchPayload): DispatchPayload => {
  const currentRequest = payload.currentRequest;

  return {
    ...payload,
    originalRequestData: payload.originalRequestData || currentRequest,
    context: {
      ...payload.context,
      ordercloudResource: {
        ...payload.context?.ordercloudResource,
        tenant_id:
          payload.context?.ordercloudResource?.tenant_id || commerceDispatcherConfig.tenantId,
      },
    },
    traceType: payload.traceType || 'none',
    currentStep: payload.currentStep || 'xmc-dispatch',
  };
};

export const dispatchToLocalProxy = async (payload: DispatchPayload): Promise<DispatchResponse> => {
  const requestBody = withDefaults(payload);
  const response = await fetch(`${commerceDispatcherConfig.proxyBaseUrl}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
    cache: 'no-store',
  });

  const body = await response.text();

  return {
    status: response.status,
    contentType: response.headers.get('content-type') || 'application/json; charset=utf-8',
    body,
  };
};

export type { DispatchPayload };
