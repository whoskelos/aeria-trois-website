import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export type Testimonial = {
	comment: string;
	client: string;
	stars: number;
};

export async function getApprovedReviews(): Promise<Testimonial[]> {
	const url = import.meta.env.PUBLIC_SUPABASE_URL;
	const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

	if (!url || !key) {
		return [];
	}

	const supabase = createClient<Database>(url, key, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});

	const { data, error } = await supabase
		.from('reviews')
		.select('name, opinion, rating')
		.eq('status', 'approved')
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Failed to fetch approved reviews:', error.message);
		return [];
	}

	return (data ?? []).map((row) => ({
		client: row.name,
		comment: row.opinion,
		stars: row.rating,
	}));
}
