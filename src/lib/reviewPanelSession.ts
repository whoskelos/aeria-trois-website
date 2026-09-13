import type { AstroCookies } from 'astro';
import { getReviewPanelAuthEmail } from './reviewPanelAuth';
import { fetchAuthUser } from './supabaseRest';

export const REVIEW_PANEL_SESSION_COOKIE = 'review-panel-access-token';

export function getReviewPanelAccessToken(
	request: Request,
	cookies?: AstroCookies,
): string | null {
	const fromCookies = cookies?.get(REVIEW_PANEL_SESSION_COOKIE)?.value;
	if (fromCookies) return fromCookies;

	const cookieHeader = request.headers.get('Cookie') ?? '';

	for (const part of cookieHeader.split(';')) {
		const trimmed = part.trim();
		if (!trimmed.startsWith(`${REVIEW_PANEL_SESSION_COOKIE}=`)) continue;
		return decodeURIComponent(trimmed.slice(REVIEW_PANEL_SESSION_COOKIE.length + 1));
	}

	return null;
}

export function setReviewPanelAccessToken(
	cookies: AstroCookies,
	accessToken: string,
	maxAge: number,
) {
	cookies.set(REVIEW_PANEL_SESSION_COOKIE, accessToken, {
		httpOnly: true,
		secure: import.meta.env.PROD,
		sameSite: 'lax',
		path: '/',
		maxAge,
	});
}

export function clearReviewPanelAccessToken(cookies: AstroCookies) {
	cookies.delete(REVIEW_PANEL_SESSION_COOKIE, { path: '/' });
}

export async function getReviewerSessionFromRequest(
	request: Request,
	cookies?: AstroCookies,
) {
	const accessToken = getReviewPanelAccessToken(request, cookies);
	if (!accessToken) return null;

	const { email, error } = await fetchAuthUser(accessToken);
	if (error || !email || email !== getReviewPanelAuthEmail()) {
		return null;
	}

	return { user: { email } };
}
