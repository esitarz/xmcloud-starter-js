import { NextRequest, NextResponse } from 'next/server';
import { createAuthTokenStore } from '@/lib/commerce/auth/session';
import { loginWithPassword, registerAccount } from '@/lib/commerce/auth/service';

export const dynamic = 'force-dynamic';

interface RegisterBody {
  username?: string;
  password?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  buyerId?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as RegisterBody;

    if (!body.username || !body.password || !body.email) {
      return NextResponse.json(
        { error: 'username, password, and email are required' },
        { status: 400 }
      );
    }

    await registerAccount({
      username: body.username,
      password: body.password,
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      buyerId: body.buyerId,
    });

    const token = await loginWithPassword({
      username: body.username,
      password: body.password,
      buyerId: body.buyerId,
    });

    const store = createAuthTokenStore();
    await store.write(token.access_token, token.expires_in);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
