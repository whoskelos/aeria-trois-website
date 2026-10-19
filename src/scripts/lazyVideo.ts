const canHover = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export function ensureVideoSrc(video: HTMLVideoElement): boolean {
	const src = video.dataset.src;
	if (!src) return false;
	if (video.getAttribute('src') === src) return true;
	video.src = src;
	video.load();
	return true;
}

const boundVideos = new WeakSet<HTMLVideoElement>();

let previewObserver: IntersectionObserver | null = null;

function getPreviewObserver() {
	if (previewObserver) return previewObserver;

	previewObserver = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				ensureVideoSrc(entry.target as HTMLVideoElement);
				previewObserver?.unobserve(entry.target as HTMLVideoElement);
			}
		},
		{ rootMargin: '300px' },
	);

	return previewObserver;
}

export function observeLazyVideos(root: ParentNode = document) {
	const videos = root.querySelectorAll<HTMLVideoElement>('video[data-lazy-video]');
	if (!videos.length) return;

	const observer = getPreviewObserver();

	videos.forEach((video) => {
		if (boundVideos.has(video)) return;
		boundVideos.add(video);
		observer.observe(video);

		const trigger = video.closest('button');
		if (!trigger) return;

		const playPreview = () => {
			if (!canHover()) return;
			if (!ensureVideoSrc(video)) return;
			void video.play().catch(() => undefined);
		};

		const pausePreview = () => {
			if (!canHover()) return;
			video.pause();
			video.currentTime = 0;
		};

		trigger.addEventListener('mouseenter', playPreview);
		trigger.addEventListener('mouseleave', pausePreview);
		trigger.addEventListener('focus', playPreview);
		trigger.addEventListener('blur', pausePreview);
	});
}

export function initLazyVideoPreviews() {
	observeLazyVideos(document);
}

export function pauseLazyPreviewVideos(exclude?: HTMLVideoElement) {
	document.querySelectorAll<HTMLVideoElement>('video[data-lazy-video]').forEach((video) => {
		if (video === exclude) return;
		video.pause();
		video.currentTime = 0;
	});
}
