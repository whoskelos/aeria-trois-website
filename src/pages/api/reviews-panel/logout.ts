import type { APIRoute } from 'astro';
import { createSupabaseAuthClient } from '../../../lib/supabaseAuth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
	const supabase = createSupabaseAuthClient(request, cookies);
	await supabase.auth.signOut();

	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};
