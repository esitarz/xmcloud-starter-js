import { NextRequest, NextResponse } from 'next/server';
import { createAuthTokenStore } from '@/lib/commerce/auth/session';
import { getMe, loginWithPassword } from '@/lib/commerce/auth/service';

export const dynamic = 'force-dynamic';

interface LoginBody {
  username?: string;
  password?: string;
  buyerId?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as LoginBody;

    if (!body.username || !body.password) {
      return NextResponse.json({ error: 'username and password are required' }, { status: 400 });
    }

    const token = await loginWithPassword({
      username: body.username,
      password: body.password,
      buyerId: body.buyerId,
    });

    const store = createAuthTokenStore();
    await store.write(token.access_token, token.expires_in);

    const me = await getMe(token.access_token);
    return NextResponse.json({ ok: true, me });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
