import { NextResponse } from 'next/server';
import type { AuthResponse } from '@/lib/auth-types';

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3000') + '/v1/api/core/auth/refresh';

export async function POST(request: Request) {
  const refresh_token = request.headers.get('x-refresh-token');
  const session_id = request.headers.get('x-session-id');

  if (!refresh_token || !session_id) {
    return NextResponse.json(
      { statusCode: 400, message: 'Missing refresh token or session id', errors: [] },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token, sessionId: Number(session_id) }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      return NextResponse.json(
        error || { statusCode: response.status, message: 'Refresh failed', errors: [] },
        { status: response.status },
      );
    }

    const data = await response.json();
    const result = data.result as AuthResponse;

    const res = NextResponse.json(data);

    res.cookies.set('access_token', result.access_token, {
      path: '/',
      maxAge: result.expires_in,
      sameSite: 'lax',
    });
    res.cookies.set('session_id', String(result.session_id), {
      path: '/',
      maxAge: 7 * 86400,
      sameSite: 'lax',
    });
    res.cookies.set('refresh_token', result.refresh_token, {
      path: '/',
      maxAge: 7 * 86400,
      sameSite: 'lax',
      httpOnly: true,
    });

    return res;
  } catch {
    return NextResponse.json(
      { statusCode: 500, message: 'Internal server error', errors: [] },
      { status: 500 },
    );
  }
}
