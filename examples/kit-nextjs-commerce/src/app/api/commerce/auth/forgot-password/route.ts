import { NextRequest, NextResponse } from 'next/server';
import { forgotPassword } from '@/lib/commerce/auth/service';

export const dynamic = 'force-dynamic';

interface ForgotBody {
  username?: string;
  resetUrl?: string;
  buyerId?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as ForgotBody;

    if (!body.username) {
      return NextResponse.json({ error: 'username is required' }, { status: 400 });
    }

    await forgotPassword({
      username: body.username,
      resetUrl: body.resetUrl,
      buyerId: body.buyerId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forgot password request failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
