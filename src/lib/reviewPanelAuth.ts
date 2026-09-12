import {
	REVIEW_PANEL_AUTH_EMAIL,
	REVIEW_PANEL_LOGIN_USERNAME,
} from 'astro:env/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export function getReviewPanelAuthEmail(): string {
	return REVIEW_PANEL_AUTH_EMAIL;
}

export function getReviewPanelLoginUsername(): string {
	return REVIEW_PANEL_LOGIN_USERNAME;
}

export function isAllowedReviewPanelUsername(username: string): boolean {
	return username.trim() === getReviewPanelLoginUsername();
}

export async function getReviewerSession(supabase: SupabaseClient<Database>) {
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error || !user?.email) {
		return null;
	}

	if (user.email !== getReviewPanelAuthEmail()) {
		return null;
	}

	return { user };
}

export async function assertReviewerSession(supabase: SupabaseClient<Database>) {
	const session = await getReviewerSession(supabase);
	if (!session) {
		return null;
	}
	return session;
}

export function unauthorizedResponse() {
	return new Response(JSON.stringify({ ok: false, error: 'No autorizado.' }), {
		status: 401,
		headers: { 'Content-Type': 'application/json' },
	});
}
