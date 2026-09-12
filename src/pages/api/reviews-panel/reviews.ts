import type { APIRoute } from 'astro';
import type { ReviewStatus } from '../../../lib/database.types';
import { assertReviewerSession, unauthorizedResponse } from '../../../lib/reviewPanelAuth';
import { createSupabaseAdminClient } from '../../../lib/supabaseAdmin';
import { createSupabaseAuthClient } from '../../../lib/supabaseAuth';

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
	const supabase = createSupabaseAuthClient(request, cookies);
	const session = await assertReviewerSession(supabase);

	if (!session) {
		return unauthorizedResponse();
	}

	const statusFilter = parseStatusFilter(url.searchParams.get('status'));
	const admin = createSupabaseAdminClient();

	let query = admin
		.from('reviews')
		.select('id, rating, name, opinion, status, created_at, updated_at')
		.order('created_at', { ascending: false });

	if (statusFilter !== 'all') {
		query = query.eq('status', statusFilter);
	}

	const { data, error } = await query;

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
	const supabase = createSupabaseAuthClient(request, cookies);
	const session = await assertReviewerSession(supabase);

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

	const admin = createSupabaseAdminClient();
	const { data, error } = await admin
		.from('reviews')
		.update({ status: status as ReviewStatus })
		.eq('id', id)
		.select('id, rating, name, opinion, status, created_at, updated_at')
		.single();

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
