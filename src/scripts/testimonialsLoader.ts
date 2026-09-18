import {
	buildTestimonialsCarousel,
	initTestimonialModal,
	initTestimonialsCarousel,
	type TestimonialItem,
} from './testimonialsCarousel';

let loadPromise: Promise<void> | null = null;

function hideTestimonialsLoading(loading: HTMLElement | null) {
	if (!loading) return;

	loading.hidden = true;
	loading.setAttribute('aria-hidden', 'true');
	loading.removeAttribute('aria-busy');
}

export function loadTestimonials() {
	if (loadPromise) return loadPromise;

	loadPromise = loadTestimonialsOnce().finally(() => {
		loadPromise = null;
	});

	return loadPromise;
}

async function loadTestimonialsOnce() {
	const section = document.querySelector('[data-testimonials-section]');
	const host = document.querySelector<HTMLElement>('[data-testimonials-host]');
	const loading = document.querySelector<HTMLElement>('[data-testimonials-loading]');
	if (!section || !host) return;

	section.setAttribute('aria-busy', 'true');

	try {
		const response = await fetch('/api/reviews/approved');
		if (!response.ok) throw new Error('Failed to load testimonials');

		const payload = (await response.json()) as {
			ok?: boolean;
			reviews?: TestimonialItem[];
		};

		const reviews = payload.reviews ?? [];
		if (reviews.length === 0) return;

		if (!host.isConnected) return;

		const carousel = buildTestimonialsCarousel(reviews);
		host.replaceChildren(carousel);
		host.hidden = false;
		host.removeAttribute('aria-hidden');

		initTestimonialsCarousel(carousel, reviews.length);
		initTestimonialModal(carousel);
	} catch (error) {
		if ((error as Error).name !== 'AbortError') {
			console.error('Failed to load testimonials:', error);
		}
	} finally {
		if (section.isConnected) {
			hideTestimonialsLoading(loading);
			section.removeAttribute('aria-busy');
		}
	}
}
