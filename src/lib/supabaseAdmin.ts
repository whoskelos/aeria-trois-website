import { SUPABASE_SERVICE_ROLE_KEY } from 'astro:env/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

function requireEnv(name: string): string {
	const value = import.meta.env[name];
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

export function createSupabaseAdminClient() {
	if (!SUPABASE_SERVICE_ROLE_KEY) {
		throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY');
	}

	return createClient<Database>(
		requireEnv('PUBLIC_SUPABASE_URL'),
		SUPABASE_SERVICE_ROLE_KEY,
		{
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		},
	);
}
