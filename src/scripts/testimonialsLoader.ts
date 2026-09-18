import {
	buildTestimonialsCarousel,
	initTestimonialModal,
	initTestimonialsCarousel,
	type TestimonialItem,
} from './testimonialsCarousel';

export async function loadTestimonials() {
	const section = document.querySelector('[data-testimonials-section]');
	const host = document.querySelector<HTMLElement>('[data-testimonials-host]');
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

		const carousel = buildTestimonialsCarousel(reviews);
		host.replaceChildren(carousel);
		host.hidden = false;
		host.removeAttribute('aria-hidden');

		initTestimonialsCarousel(carousel, reviews.length);
		initTestimonialModal(carousel);
	} catch (error) {
		console.error('Failed to load testimonials:', error);
	} finally {
		section.removeAttribute('aria-busy');
	}
}
