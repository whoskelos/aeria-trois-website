import type { APIRoute } from 'astro';
import { buildReviewClientKey, getClientIp } from '../../lib/reviewClientKey';

export const prerender = false;
import { validateReview } from '../../lib/reviewValidation';
import { createSupabaseServerClient } from '../../lib/supabaseServer';

const RPC_ERROR_MESSAGES: Record<string, string> = {
	invalid_client_key: 'No se pudo verificar el envío. Inténtalo de nuevo.',
	privacy_not_accepted: 'Debes aceptar la política de privacidad y el aviso legal.',
	invalid_rating: 'Elige una valoración de 1 a 5 estrellas.',
	invalid_name: 'Revisa el nombre: debe tener entre 2 y 120 caracteres.',
	invalid_opinion: 'Revisa la opinión: debe tener entre 20 y 2000 caracteres.',
	rate_limit_exceeded: 'Has enviado demasiadas reseñas. Vuelve a intentarlo en una hora.',
	rate_limit_global: 'Estamos recibiendo muchos envíos. Inténtalo de nuevo más tarde.',
	duplicate_review: 'Ya registramos una reseña muy similar recientemente.',
};

function mapRpcError(message: string): string {
	for (const [code, text] of Object.entries(RPC_ERROR_MESSAGES)) {
		if (message.includes(code)) return text;
	}
	return 'No se pudo guardar tu reseña. Inténtalo de nuevo.';
}

export const POST: APIRoute = async ({ request }) => {
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ ok: false, error: 'Solicitud no válida.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	if (!body || typeof body !== 'object') {
		return new Response(JSON.stringify({ ok: false, error: 'Solicitud no válida.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const input = body as Record<string, unknown>;
	const result = validateReview({
		rating: input.rating,
		name: input.name,
		opinion: input.opinion,
		privacyAccepted: input.privacyAccepted,
	});

	if (!result.ok || !result.data) {
		return new Response(JSON.stringify({ ok: false, errors: result.errors }), {
			status: 422,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const salt = import.meta.env.REVIEW_CLIENT_KEY_SALT;
	if (!salt) {
		console.error('Missing REVIEW_CLIENT_KEY_SALT');
		return new Response(
			JSON.stringify({ ok: false, error: 'El envío no está disponible temporalmente.' }),
			{
				status: 503,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}

	const clientKey = buildReviewClientKey(getClientIp(request), salt);

	try {
		const supabase = createSupabaseServerClient();
		const { data, error } = await supabase.rpc('submit_review', {
			p_rating: result.data.rating,
			p_name: result.data.name,
			p_opinion: result.data.opinion,
			p_privacy_accepted: result.data.privacyAccepted,
			p_client_key: clientKey,
		});

		if (error) {
			console.error('Supabase submit_review error:', error);
			return new Response(JSON.stringify({ ok: false, error: mapRpcError(error.message) }), {
				status: error.message.includes('rate_limit') ? 429 : 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		return new Response(JSON.stringify({ ok: true, id: data }), {
			status: 201,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error('Review submission failed:', error);
		return new Response(
			JSON.stringify({ ok: false, error: 'No se pudo guardar tu reseña. Inténtalo de nuevo.' }),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}
};
