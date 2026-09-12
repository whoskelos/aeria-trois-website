export type Testimonial = {
	comment: string;
	client: string;
	stars: number;
};

type ReviewRow = {
	name: string;
	opinion: string;
	rating: number;
};

export async function getApprovedReviews(): Promise<Testimonial[]> {
	const url = import.meta.env.PUBLIC_SUPABASE_URL;
	const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

	if (!url || !key) {
		return [];
	}

	const params = new URLSearchParams({
		select: 'name,opinion,rating',
		status: 'eq.approved',
		order: 'created_at.desc',
	});

	try {
		const response = await fetch(`${url}/rest/v1/reviews?${params}`, {
			headers: {
				apikey: key,
				Authorization: `Bearer ${key}`,
			},
		});

		if (!response.ok) {
			console.error('Failed to fetch approved reviews:', response.statusText);
			return [];
		}

		const data = (await response.json()) as ReviewRow[];

		return data.map((row) => ({
			client: row.name,
			comment: row.opinion,
			stars: row.rating,
		}));
	} catch (error) {
		console.error('Failed to fetch approved reviews:', error);
		return [];
	}
}
