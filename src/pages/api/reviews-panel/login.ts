import type { APIRoute } from 'astro';
import {
	getReviewPanelAuthEmail,
	isAllowedReviewPanelUsername,
} from '../../../lib/reviewPanelAuth';
import { setReviewPanelAccessToken } from '../../../lib/reviewPanelSession';
import { fetchAuthUser, signInWithPassword } from '../../../lib/supabaseRest';

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

	const signIn = await signInWithPassword(getReviewPanelAuthEmail(), password);

	if (signIn.error || !signIn.accessToken) {
		return new Response(JSON.stringify({ ok: false, error: 'Credenciales incorrectas.' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const { email, error: userError } = await fetchAuthUser(signIn.accessToken);

	if (userError || email !== getReviewPanelAuthEmail()) {
		return new Response(JSON.stringify({ ok: false, error: 'Credenciales incorrectas.' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	setReviewPanelAccessToken(cookies, signIn.accessToken, signIn.expiresIn ?? 3600);

	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};
