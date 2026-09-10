import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

function requireEnv(name: string): string {
	const value = import.meta.env[name];
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

export function createSupabaseServerClient() {
	return createClient<Database>(
		requireEnv('PUBLIC_SUPABASE_URL'),
		requireEnv('PUBLIC_SUPABASE_ANON_KEY'),
		{
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		},
	);
}
