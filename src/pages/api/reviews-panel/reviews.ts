import type { APIRoute } from 'astro';
import type { ReviewStatus } from '../../../lib/database.types';
import { unauthorizedResponse } from '../../../lib/reviewPanelAuth';
import { getReviewerSessionFromRequest } from '../../../lib/reviewPanelSession';
import { fetchPanelReviews, updatePanelReviewStatus } from '../../../lib/supabaseRest';

export const prerender = false;

const VALID_STATUSES = new Set<ReviewStatus>(['pending', 'approved', 'rejected']);
const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseStatusFilter(value: string | null): ReviewStatus | 'all' {
	if (!value || value === 'all') return 'all';
	if (VALID_STATUSES.has(value as ReviewStatus)) return value as ReviewStatus;
	return 'pending';
}

export const GET: APIRoute = async ({ request, cookies, url }) => {
	const session = await getReviewerSessionFromRequest(request, cookies);

	if (!session) {
		return unauthorizedResponse();
	}

	const statusFilter = parseStatusFilter(url.searchParams.get('status'));
	const { data, error } = await fetchPanelReviews(statusFilter);

	if (error) {
		return new Response(JSON.stringify({ ok: false, error: 'No se pudieron cargar las reseñas.' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	return new Response(JSON.stringify({ ok: true, reviews: data ?? [] }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};

export const PATCH: APIRoute = async ({ request, cookies }) => {
	const session = await getReviewerSessionFromRequest(request, cookies);

	if (!session) {
		return unauthorizedResponse();
	}

	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ ok: false, error: 'Solicitud inválida.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const id =
		typeof body === 'object' && body !== null && 'id' in body ? String(body.id) : '';
	const status =
		typeof body === 'object' && body !== null && 'status' in body
			? String(body.status)
			: '';

	if (!UUID_RE.test(id) || !VALID_STATUSES.has(status as ReviewStatus)) {
		return new Response(JSON.stringify({ ok: false, error: 'Solicitud inválida.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const { data, error } = await updatePanelReviewStatus(id, status as ReviewStatus);

	if (error || !data) {
		return new Response(JSON.stringify({ ok: false, error: 'No se pudo actualizar la reseña.' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	return new Response(JSON.stringify({ ok: true, review: data }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};
