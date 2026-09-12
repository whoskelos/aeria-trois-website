import { defineMiddleware } from 'astro:middleware';
import { getReviewerSession } from './lib/reviewPanelAuth';
import { createSupabaseAuthClient } from './lib/supabaseAuth';

const LOGIN_PATH = '/reviews-panel/login';
const LOGIN_API_PATH = '/api/reviews-panel/login';
const LOGOUT_API_PATH = '/api/reviews-panel/logout';

export const onRequest = defineMiddleware(async (context, next) => {
	const { pathname } = context.url;
	const isPanelPage = pathname.startsWith('/reviews-panel');
	const isPanelApi = pathname.startsWith('/api/reviews-panel');

	if (!isPanelPage && !isPanelApi) {
		return next();
	}

	if (pathname === LOGIN_PATH || pathname === LOGIN_API_PATH || pathname === LOGOUT_API_PATH) {
		return next();
	}

	const supabase = createSupabaseAuthClient(context.request, context.cookies);
	const session = await getReviewerSession(supabase);

	if (!session) {
		if (isPanelApi) {
			return new Response(JSON.stringify({ ok: false, error: 'No autorizado.' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		return context.redirect(LOGIN_PATH);
	}

	return next();
});
