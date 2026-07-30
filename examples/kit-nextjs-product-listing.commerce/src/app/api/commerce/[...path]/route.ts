import { NextResponse } from 'next/server';

const blockedResponse = (): NextResponse =>
  NextResponse.json(
    {
      error:
        'Commerce route is blocked by allowlist while auth slice stabilizes. Allowed: /api/commerce/auth/*',
    },
    { status: 403 }
  );

export async function GET(): Promise<NextResponse> {
  return blockedResponse();
}

export async function POST(): Promise<NextResponse> {
  return blockedResponse();
}

export async function PUT(): Promise<NextResponse> {
  return blockedResponse();
}

export async function PATCH(): Promise<NextResponse> {
  return blockedResponse();
}

export async function DELETE(): Promise<NextResponse> {
  return blockedResponse();
}
