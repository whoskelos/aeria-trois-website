import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const REVEAL = {
	duration: 0.55,
	stagger: 0.07,
	y: 16,
	scale: 0.97,
	ease: 'power3.out',
} as const;

const HIDDEN = {
	autoAlpha: 0,
	y: REVEAL.y,
	scale: REVEAL.scale,
} as const;

const VISIBLE = {
	autoAlpha: 1,
	y: 0,
	scale: 1,
} as const;

const SCROLL_START = 'top bottom-=32';

let motionContext: gsap.Context | null = null;

function isHidden(element: HTMLElement) {
	const opacity = Number(gsap.getProperty(element, 'opacity'));
	if (!Number.isNaN(opacity) && opacity < 0.05) return true;

	return Number.parseFloat(getComputedStyle(element).opacity) < 0.05;
}

function revealToVisible(element: HTMLElement, options: gsap.TweenVars = {}) {
	return gsap.to(element, {
		...VISIBLE,
		duration: REVEAL.duration,
		ease: REVEAL.ease,
		...options,
	});
}

function revealIfHidden(elements: HTMLElement[]) {
	elements.forEach((element) => {
		if (!isHidden(element)) return;

		const { top, bottom } = element.getBoundingClientRect();
		const inView = top < window.innerHeight && bottom > 0;
		if (!inView) return;

		revealToVisible(element);
	});
}

export function initScrollReveal() {
	motionContext?.revert();
	motionContext = null;

	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	motionContext = gsap.context(() => {
		const scrollItems = gsap.utils.toArray<HTMLElement>('[data-reveal]');
		const heroItems = gsap.utils.toArray<HTMLElement>('[data-reveal-hero]');
		const allTargets = [...scrollItems, ...heroItems];

		if (reducedMotion) {
			gsap.set(allTargets, { ...VISIBLE, clearProps: 'transform' });
			document.documentElement.classList.remove('motion-pending');
			return;
		}

		gsap.set(allTargets, HIDDEN);
		document.documentElement.classList.remove('motion-pending');

		if (heroItems.length) {
			const heroTimeline = gsap.timeline({ delay: 0.12 });
			heroItems.forEach((element, index) => {
				heroTimeline.add(
					revealToVisible(element),
					index === 0 ? 0 : '<+=0.07',
				);
			});
		}

		scrollItems.forEach((element) => {
			revealToVisible(element, {
				scrollTrigger: {
					trigger: element,
					start: SCROLL_START,
					once: true,
				},
			});
		});

		const syncScrollItems = () => {
			ScrollTrigger.refresh();
			revealIfHidden(scrollItems);
		};

		requestAnimationFrame(syncScrollItems);
		window.addEventListener('load', syncScrollItems, { once: true });
	});

	return motionContext;
}
