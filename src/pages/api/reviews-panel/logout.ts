import type { APIRoute } from 'astro';
import { clearReviewPanelAccessToken } from '../../../lib/reviewPanelSession';

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
	clearReviewPanelAccessToken(cookies);

	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};
