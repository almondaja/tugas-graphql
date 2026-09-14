import { NextResponse } from 'next/server';

export function middleware(request) {
  const origin = request.headers.get('origin');

  const response = NextResponse.next();

  // Izinkan Apollo Studio Sandbox
  response.headers.set(
    'Access-Control-Allow-Origin',
    origin || '*'
  );

  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS'
  );

  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Apollo-Require-Preflight'
  );

  // Tangani request OPTIONS / CORS preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers':
          'Content-Type, Apollo-Require-Preflight',
      },
    });
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
