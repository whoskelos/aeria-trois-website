import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import type { AstroCookies } from 'astro';
import type { Database } from './database.types';

function requireEnv(name: string): string {
	const value = import.meta.env[name];
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

export function createSupabaseAuthClient(
	request: Request,
	cookies: AstroCookies,
): ReturnType<typeof createServerClient<Database>> {
	return createServerClient<Database>(
		requireEnv('PUBLIC_SUPABASE_URL'),
		requireEnv('PUBLIC_SUPABASE_ANON_KEY'),
		{
			cookies: {
				getAll() {
					return parseCookieHeader(request.headers.get('Cookie') ?? '');
				},
				setAll(cookiesToSet) {
					for (const { name, value, options } of cookiesToSet) {
						cookies.set(name, value, options as Parameters<AstroCookies['set']>[2]);
					}
				},
			},
		},
	);
}

export function createSupabaseAuthClientFromHeaders(
	request: Request,
	responseHeaders: Headers,
): ReturnType<typeof createServerClient<Database>> {
	return createServerClient<Database>(
		requireEnv('PUBLIC_SUPABASE_URL'),
		requireEnv('PUBLIC_SUPABASE_ANON_KEY'),
		{
			cookies: {
				getAll() {
					return parseCookieHeader(request.headers.get('Cookie') ?? '');
				},
				setAll(cookiesToSet) {
					for (const { name, value, options } of cookiesToSet) {
						responseHeaders.append(
							'Set-Cookie',
							serializeCookieHeader(name, value, options),
						);
					}
				},
			},
		},
	);
}
