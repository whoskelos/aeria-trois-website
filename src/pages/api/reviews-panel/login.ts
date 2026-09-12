import type { APIRoute } from 'astro';
import {
	getReviewPanelAuthEmail,
	isAllowedReviewPanelUsername,
} from '../../../lib/reviewPanelAuth';
import { createSupabaseAuthClient } from '../../../lib/supabaseAuth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ ok: false, error: 'Credenciales incorrectas.' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const username =
		typeof body === 'object' && body !== null && 'username' in body
			? String(body.username)
			: '';
	const password =
		typeof body === 'object' && body !== null && 'password' in body
			? String(body.password)
			: '';

	if (!username || !password || !isAllowedReviewPanelUsername(username.trim())) {
		return new Response(JSON.stringify({ ok: false, error: 'Credenciales incorrectas.' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const supabase = createSupabaseAuthClient(request, cookies);
	const { error } = await supabase.auth.signInWithPassword({
		email: getReviewPanelAuthEmail(),
		password,
	});

	if (error) {
		return new Response(JSON.stringify({ ok: false, error: 'Credenciales incorrectas.' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};
