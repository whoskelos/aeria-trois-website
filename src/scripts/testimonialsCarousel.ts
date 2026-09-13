export type TestimonialItem = {
	comment: string;
	client: string;
	stars: number;
};

const QUOTE_ICON_PATH =
	'M0 24V14.4C0 9.6 1.067 5.733 3.2 2.8 5.333-.133 8.267-1.6 12-1.6v4.8c-2.4 0-4.267.8-5.6 2.4-1.333 1.6-2 3.733-2 6.4h7.6V24H0Zm18 0V14.4c0-4.8 1.067-8.667 3.2-11.6C23.333-.133 26.267-1.6 30-1.6v4.8c-2.4 0-4.267.8-5.6 2.4-1.333 1.6-2 3.733-2 6.4H28V24H18Z';
const STAR_ICON_PATH =
	'M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.35 5.06 16.7l.94-5.5-4-3.9 5.53-.8L10 1.5z';

function createSvg(path: string, className: string, viewBox = '0 0 20 20') {
	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('class', className);
	svg.setAttribute('viewBox', viewBox);
	svg.setAttribute('fill', 'currentColor');
	svg.setAttribute('aria-hidden', 'true');

	const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	pathEl.setAttribute('d', path);
	svg.append(pathEl);

	return svg;
}

function createArrowButton(label: string, direction: 'prev' | 'next') {
	const button = document.createElement('button');
	button.type = 'button';
	button.className = 'testimonials-carousel__arrow';

	if (direction === 'prev') {
		button.dataset.carouselPrev = '';
		button.innerHTML =
			'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M15 18l-6-6 6-6"></path></svg>';
	} else {
		button.dataset.carouselNext = '';
		button.innerHTML =
			'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M9 18l6-6-6-6"></path></svg>';
	}

	button.setAttribute('aria-label', label);
	return button;
}

function createSlide(item: TestimonialItem, index: number) {
	const article = document.createElement('article');
	article.className = 'testimonials-carousel__slide';
	article.dataset.carouselSlide = '';
	article.dataset.index = String(index);
	article.id = `testimonial-slide-${index}`;
	article.setAttribute('aria-roledescription', 'slide');
	article.setAttribute('aria-label', `Opinión de ${item.client}`);
	article.setAttribute('aria-current', index === 0 ? 'true' : 'false');

	const card = document.createElement('div');
	card.className = 'testimonials-card';

	const quoteIcon = createSvg(QUOTE_ICON_PATH, 'testimonials-card__quote-icon', '0 0 32 24');

	const blockquote = document.createElement('blockquote');
	blockquote.className = 'testimonials-card__comment';
	blockquote.textContent = `\u201C${item.comment}\u201D`;

	const footer = document.createElement('footer');
	footer.className = 'testimonials-card__footer';

	const cite = document.createElement('cite');
	cite.className = 'testimonials-card__client';
	cite.textContent = item.client;

	const stars = document.createElement('div');
	stars.className = 'testimonials-card__stars';
	stars.setAttribute('role', 'img');
	stars.setAttribute('aria-label', `${item.stars} de 5 estrellas`);

	for (let starIndex = 0; starIndex < 5; starIndex += 1) {
		const star = createSvg(
			STAR_ICON_PATH,
			`testimonials-card__star${starIndex < item.stars ? ' testimonials-card__star--filled' : ''}`,
		);
		stars.append(star);
	}

	footer.append(cite, stars);
	card.append(quoteIcon, blockquote, footer);
	article.append(card);

	return article;
}

export function buildTestimonialsCarousel(testimonials: TestimonialItem[]) {
	const carousel = document.createElement('div');
	carousel.className = 'testimonials-carousel';
	carousel.dataset.testimonialsCarousel = '';
	carousel.dataset.active = '0';
	carousel.tabIndex = 0;
	carousel.setAttribute('aria-roledescription', 'carrusel');
	carousel.setAttribute('aria-label', 'Opiniones de clientes');
	carousel.dataset.reveal = '';

	const viewport = document.createElement('div');
	viewport.className = 'testimonials-carousel__viewport';
	viewport.dataset.carouselViewport = '';

	const track = document.createElement('div');
	track.className = 'testimonials-carousel__track';
	track.dataset.carouselTrack = '';

	testimonials.forEach((item, index) => {
		track.append(createSlide(item, index));
	});

	viewport.append(track);

	const controls = document.createElement('div');
	controls.className = 'testimonials-carousel__controls';

	const prevBtn = createArrowButton('Opinión anterior', 'prev');

	const indicators = document.createElement('div');
	indicators.className = 'testimonials-carousel__indicators';
	indicators.setAttribute('role', 'tablist');
	indicators.setAttribute('aria-label', 'Seleccionar opinión');

	testimonials.forEach((item, index) => {
		const indicator = document.createElement('button');
		indicator.type = 'button';
		indicator.className = 'testimonials-carousel__indicator';
		indicator.dataset.carouselIndicator = '';
		indicator.dataset.index = String(index);
		indicator.setAttribute('role', 'tab');
		indicator.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
		indicator.setAttribute('aria-label', item.client);
		indicators.append(indicator);
	});

	const nextBtn = createArrowButton('Opinión siguiente', 'next');

	controls.append(prevBtn, indicators, nextBtn);
	carousel.append(viewport, controls);

	return carousel;
}

export function initTestimonialsCarousel(carousel: HTMLElement, total: number) {
	const slides = carousel.querySelectorAll<HTMLElement>('[data-carousel-slide]');
	const indicators = carousel.querySelectorAll<HTMLButtonElement>('[data-carousel-indicator]');
	const prevBtn = carousel.querySelector<HTMLButtonElement>('[data-carousel-prev]');
	const nextBtn = carousel.querySelector<HTMLButtonElement>('[data-carousel-next]');
	const viewport = carousel.querySelector<HTMLElement>('[data-carousel-viewport]');
	const AUTOPLAY_MS = 3000;
	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	let active = 0;
	let touchStartX = 0;
	let autoplayTimer: ReturnType<typeof setInterval> | null = null;
	let isPaused = false;

	const wrap = (index: number) => ((index % total) + total) % total;

	const getOffset = (index: number) => {
		let diff = index - active;
		if (diff > total / 2) diff -= total;
		if (diff < -total / 2) diff += total;
		return diff;
	};

	const updateSlides = () => {
		carousel.dataset.active = String(active);

		slides.forEach((slide, index) => {
			const offset = getOffset(index);
			slide.dataset.offset = String(offset);
			slide.setAttribute('aria-current', offset === 0 ? 'true' : 'false');
			slide.tabIndex = offset === 0 ? 0 : -1;
		});

		indicators.forEach((indicator, index) => {
			indicator.setAttribute('aria-selected', index === active ? 'true' : 'false');
			indicator.dataset.active = index === active ? 'true' : 'false';
		});
	};

	const stopAutoplay = () => {
		if (autoplayTimer) {
			clearInterval(autoplayTimer);
			autoplayTimer = null;
		}
	};

	const startAutoplay = () => {
		if (prefersReducedMotion || isPaused) return;
		stopAutoplay();
		autoplayTimer = setInterval(() => goTo(active + 1, { fromAutoplay: true }), AUTOPLAY_MS);
	};

	const goTo = (index: number, { fromAutoplay = false } = {}) => {
		active = wrap(index);
		updateSlides();
		if (!fromAutoplay) startAutoplay();
	};

	prevBtn?.addEventListener('click', () => goTo(active - 1));
	nextBtn?.addEventListener('click', () => goTo(active + 1));

	indicators.forEach((indicator) => {
		indicator.addEventListener('click', () => {
			const index = Number(indicator.dataset.index);
			if (!Number.isNaN(index)) goTo(index);
		});
	});

	slides.forEach((slide) => {
		slide.addEventListener('click', () => {
			const index = Number(slide.dataset.index);
			if (!Number.isNaN(index) && index !== active) goTo(index);
		});
	});

	carousel.addEventListener('keydown', (event: KeyboardEvent) => {
		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			goTo(active - 1);
		}
		if (event.key === 'ArrowRight') {
			event.preventDefault();
			goTo(active + 1);
		}
	});

	carousel.addEventListener('mouseenter', () => {
		isPaused = true;
		stopAutoplay();
	});

	carousel.addEventListener('mouseleave', () => {
		isPaused = false;
		startAutoplay();
	});

	carousel.addEventListener('focusin', () => {
		isPaused = true;
		stopAutoplay();
	});

	carousel.addEventListener('focusout', (event: FocusEvent) => {
		if (carousel.contains(event.relatedTarget as Node | null)) return;
		isPaused = false;
		startAutoplay();
	});

	document.addEventListener('visibilitychange', () => {
		if (document.hidden) stopAutoplay();
		else startAutoplay();
	});

	viewport?.addEventListener(
		'touchstart',
		(event: TouchEvent) => {
			touchStartX = event.changedTouches[0]?.clientX ?? 0;
		},
		{ passive: true },
	);

	viewport?.addEventListener(
		'touchend',
		(event: TouchEvent) => {
			const touchEndX = event.changedTouches[0]?.clientX ?? 0;
			const delta = touchEndX - touchStartX;
			if (Math.abs(delta) < 40) return;
			if (delta > 0) goTo(active - 1);
			else goTo(active + 1);
		},
		{ passive: true },
	);

	updateSlides();
	startAutoplay();
}
