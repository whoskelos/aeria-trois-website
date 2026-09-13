import { SUPABASE_SERVICE_ROLE_KEY } from 'astro:env/server';
import type { ReviewStatus } from './database.types';

function getPublicSupabaseEnv() {
	const url = import.meta.env.PUBLIC_SUPABASE_URL;
	const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

	if (!url || !key) {
		throw new Error('Missing required environment variable: PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY');
	}

	return { url, key };
}

function getServiceRoleEnv() {
	const { url } = getPublicSupabaseEnv();

	if (!SUPABASE_SERVICE_ROLE_KEY) {
		throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY');
	}

	return { url, key: SUPABASE_SERVICE_ROLE_KEY };
}

export async function callSupabaseRpc<T>(
	functionName: string,
	args: Record<string, unknown>,
): Promise<{ data: T | null; error: { message: string; status: number } | null }> {
	const { url, key } = getPublicSupabaseEnv();

	const response = await fetch(`${url}/rest/v1/rpc/${functionName}`, {
		method: 'POST',
		headers: {
			apikey: key,
			Authorization: `Bearer ${key}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(args),
	});

	if (!response.ok) {
		let message = response.statusText;

		try {
			const payload = (await response.json()) as { message?: string };
			if (payload.message) message = payload.message;
		} catch {
			// Ignore malformed error bodies.
		}

		return { data: null, error: { message, status: response.status } };
	}

	const data = (await response.json()) as T;
	return { data, error: null };
}

export type PanelReview = {
	id: string;
	rating: number;
	name: string;
	opinion: string;
	status: ReviewStatus;
	created_at: string;
	updated_at: string;
};

export async function fetchPanelReviews(
	statusFilter: ReviewStatus | 'all',
): Promise<{ data: PanelReview[] | null; error: string | null }> {
	const { url, key } = getServiceRoleEnv();
	const params = new URLSearchParams({
		select: 'id,rating,name,opinion,status,created_at,updated_at',
		order: 'created_at.desc',
	});

	if (statusFilter !== 'all') {
		params.set('status', `eq.${statusFilter}`);
	}

	const response = await fetch(`${url}/rest/v1/reviews?${params}`, {
		headers: {
			apikey: key,
			Authorization: `Bearer ${key}`,
		},
	});

	if (!response.ok) {
		return { data: null, error: response.statusText };
	}

	const data = (await response.json()) as PanelReview[];
	return { data, error: null };
}

export async function updatePanelReviewStatus(
	id: string,
	status: ReviewStatus,
): Promise<{ data: PanelReview | null; error: string | null }> {
	const { url, key } = getServiceRoleEnv();

	const response = await fetch(`${url}/rest/v1/reviews?id=eq.${encodeURIComponent(id)}`, {
		method: 'PATCH',
		headers: {
			apikey: key,
			Authorization: `Bearer ${key}`,
			'Content-Type': 'application/json',
			Prefer: 'return=representation',
		},
		body: JSON.stringify({ status }),
	});

	if (!response.ok) {
		return { data: null, error: response.statusText };
	}

	const rows = (await response.json()) as PanelReview[];
	return { data: rows[0] ?? null, error: null };
}

export async function signInWithPassword(
	email: string,
	password: string,
): Promise<{ accessToken: string | null; expiresIn: number | null; error: boolean }> {
	const { url, key } = getPublicSupabaseEnv();

	const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
		method: 'POST',
		headers: {
			apikey: key,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ email, password }),
	});

	if (!response.ok) {
		return { accessToken: null, expiresIn: null, error: true };
	}

	const payload = (await response.json()) as {
		access_token?: string;
		expires_in?: number;
	};

	if (!payload.access_token) {
		return { accessToken: null, expiresIn: null, error: true };
	}

	return {
		accessToken: payload.access_token,
		expiresIn: payload.expires_in ?? 3600,
		error: false,
	};
}

export async function fetchAuthUser(
	accessToken: string,
): Promise<{ email: string | null; error: boolean }> {
	const { url, key } = getPublicSupabaseEnv();

	const response = await fetch(`${url}/auth/v1/user`, {
		headers: {
			apikey: key,
			Authorization: `Bearer ${accessToken}`,
		},
	});

	if (!response.ok) {
		return { email: null, error: true };
	}

	const user = (await response.json()) as { email?: string };
	return { email: user.email ?? null, error: false };
}
