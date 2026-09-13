import type { APIRoute } from 'astro';
import { getApprovedReviews } from '../../../lib/reviews';

export const prerender = false;

export const GET: APIRoute = async () => {
	const reviews = await getApprovedReviews();

	return new Response(JSON.stringify({ ok: true, reviews }), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
		},
	});
};
