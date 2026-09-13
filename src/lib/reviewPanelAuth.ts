import {
	REVIEW_PANEL_AUTH_EMAIL,
	REVIEW_PANEL_LOGIN_USERNAME,
} from 'astro:env/server';

export function getReviewPanelAuthEmail(): string {
	return REVIEW_PANEL_AUTH_EMAIL;
}

export function getReviewPanelLoginUsername(): string {
	return REVIEW_PANEL_LOGIN_USERNAME;
}

export function isAllowedReviewPanelUsername(username: string): boolean {
	return username.trim() === getReviewPanelLoginUsername();
}

export function unauthorizedResponse() {
	return new Response(JSON.stringify({ ok: false, error: 'No autorizado.' }), {
		status: 401,
		headers: { 'Content-Type': 'application/json' },
	});
}
