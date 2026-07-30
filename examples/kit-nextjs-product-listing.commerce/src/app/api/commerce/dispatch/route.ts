import { NextRequest, NextResponse } from 'next/server';
import { dispatchToLocalProxy, type DispatchPayload } from '@/lib/commerce/dispatcher/service';

export const dynamic = 'force-dynamic';

const isValidPayload = (value: unknown): value is DispatchPayload => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as DispatchPayload;
  return !!candidate.currentRequest?.url && !!candidate.currentRequest?.method;
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const payload = (await request.json().catch(() => null)) as DispatchPayload | null;

    if (!isValidPayload(payload)) {
      return NextResponse.json(
        {
          error: 'Invalid dispatch payload. currentRequest.url and currentRequest.method are required.',
        },
        { status: 400 }
      );
    }

    const upstream = await dispatchToLocalProxy(payload);
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.contentType,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Dispatch failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
