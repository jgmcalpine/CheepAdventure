import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = [
	'/',
	'/stories',
	'/story/[id]',
	'/auth/login',
	'/auth/signup',
];

export async function middleware(request: NextRequest) {
	const res = NextResponse.next();
	const supabase = createMiddlewareClient({ req: request, res });

	// Check auth status
	const {
		data: { session },
	} = await supabase.auth.getSession();

	// Get the pathname
	const { pathname } = request.nextUrl;

	// Allow public routes
	if (PUBLIC_ROUTES.some((route) => pathname.match(new RegExp(`^${route.replace(/\[.*?\]/, '[^/]+')}$`)))) {
		return res;
	}

	// Check if it's an API route
	if (pathname.startsWith('/api/')) {
		// API routes are protected by their own auth checks
		return res;
	}

	// Redirect unauthenticated users to login
	if (!session) {
		const redirectUrl = new URL('/auth/login', request.url);
		redirectUrl.searchParams.set('redirect', pathname);
		return NextResponse.redirect(redirectUrl);
	}

	return res;
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		'/((?!_next/static|_next/image|favicon.ico).*)',
	],
}; 