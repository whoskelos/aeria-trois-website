const REVEAL_ROOT_MARGIN = '0px 0px -32px 0px';

function revealElement(element: HTMLElement) {
	element.classList.add('is-revealed');
}

function isInViewport(element: HTMLElement) {
	const { top, bottom } = element.getBoundingClientRect();
	return top < window.innerHeight && bottom > 0;
}

export function initScrollReveal() {
	const elements = document.querySelectorAll<HTMLElement>('[data-reveal]');
	if (elements.length === 0) return;

	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	if (reducedMotion) {
		elements.forEach((element) => revealElement(element));
		return;
	}

	const pending = Array.from(elements).filter((element) => {
		if (isInViewport(element)) {
			revealElement(element);
			return false;
		}
		return true;
	});

	if (pending.length === 0) return;

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				revealElement(entry.target as HTMLElement);
				observer.unobserve(entry.target);
			}
		},
		{ rootMargin: REVEAL_ROOT_MARGIN, threshold: 0 },
	);

	pending.forEach((element) => observer.observe(element));
}
