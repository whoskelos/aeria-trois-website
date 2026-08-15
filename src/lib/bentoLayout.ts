import type { GalleryMedia } from './gallery';

export type BentoFormat = 'panoramic' | 'tall' | 'square';

const FALLBACK_PATTERN: BentoFormat[] = ['tall', 'panoramic', 'square', 'panoramic', 'square', 'tall'];

function inferFromDimensions(media: GalleryMedia): BentoFormat | null {
	if (!media.width || !media.height) return null;

	const ratio = media.width / media.height;
	if (ratio >= 1.35) return 'panoramic';
	if (ratio <= 0.82) return 'tall';
	return 'square';
}

function breakRun(formats: BentoFormat[], format: BentoFormat): BentoFormat {
	const alternatives: Record<BentoFormat, BentoFormat[]> = {
		panoramic: ['square', 'tall'],
		tall: ['panoramic', 'square'],
		square: ['tall', 'panoramic'],
	};

	const last = formats.at(-1);
	const prev = formats.at(-2);
	if (last !== format || prev !== format) return format;

	return alternatives[format][formats.length % 2];
}

export function assignBentoFormats(media: GalleryMedia[]): BentoFormat[] {
	const formats: BentoFormat[] = [];

	for (let index = 0; index < media.length; index += 1) {
		const inferred = inferFromDimensions(media[index]);
		const fallback = FALLBACK_PATTERN[index % FALLBACK_PATTERN.length];
		const format = breakRun(formats, inferred ?? fallback);
		formats.push(format);
	}

	return formats;
}

export const bentoSpanClasses: Record<BentoFormat, string> = {
	panoramic: 'experience-bento__cell--panoramic',
	tall: 'experience-bento__cell--tall',
	square: 'experience-bento__cell--square',
};
