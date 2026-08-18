import type { GalleryMedia } from './gallery';

export type BentoFormat = 'hero' | 'wide' | 'tall' | 'small';

export type BentoPlacement = {
	col: number;
	row: number;
};

export type BentoAssignment = {
	format: BentoFormat;
	placement?: BentoPlacement;
};

const PACKING_FORMATS: BentoFormat[] = ['wide', 'tall', 'small'];

/** 12-col grid ÷ 4 logical columns; row unit = 3 tracks. All spans tile without holes. */
export const DESKTOP_CELLS: Record<BentoFormat, { cols: number; rows: number }> = {
	hero: { cols: 6, rows: 6 },
	wide: { cols: 6, rows: 3 },
	tall: { cols: 3, rows: 6 },
	small: { cols: 3, rows: 3 },
};

const DESKTOP_COLUMNS = 12;

/**
 * Swirl opener inspired by 4-column bento dashboards:
 * center hero, flanking talls, wide bands, small accents.
 */
const SWIRL_TEMPLATE: Array<{ format: BentoFormat; col: number; row: number }> = [
	{ format: 'hero', col: 3, row: 0 },
	{ format: 'tall', col: 9, row: 0 },
	{ format: 'small', col: 0, row: 0 },
	{ format: 'small', col: 0, row: 3 },
	{ format: 'tall', col: 0, row: 6 },
	{ format: 'wide', col: 3, row: 6 },
	{ format: 'wide', col: 3, row: 9 },
	{ format: 'small', col: 9, row: 6 },
	{ format: 'small', col: 9, row: 9 },
];

/** Homepage showcase — 3 highlights in the same visual language. */
const SHOWCASE_TEMPLATE: Array<{ format: BentoFormat; col: number; row: number }> = [
	{ format: 'hero', col: 3, row: 0 },
	{ format: 'tall', col: 9, row: 0 },
	{ format: 'wide', col: 3, row: 6 },
];

export function getShowcaseAssignment(index: number): BentoAssignment {
	const slot = SHOWCASE_TEMPLATE[index];
	if (!slot) {
		return { format: 'small' };
	}

	return {
		format: slot.format,
		placement: { col: slot.col, row: slot.row },
	};
}

function inferFromDimensions(media: GalleryMedia): BentoFormat | null {
	if (!media.width || !media.height) return null;

	const ratio = media.width / media.height;
	if (ratio >= 1.45) return 'wide';
	if (ratio <= 0.78) return 'tall';
	if (ratio >= 1.05) return 'wide';
	return 'small';
}

function ensureRows(grid: boolean[][], throughRow: number) {
	while (grid.length <= throughRow) {
		grid.push(Array.from({ length: DESKTOP_COLUMNS }, () => false));
	}
}

function canPlace(
	grid: boolean[][],
	col: number,
	row: number,
	cols: number,
	rows: number,
): boolean {
	if (col + cols > DESKTOP_COLUMNS) return false;

	ensureRows(grid, row + rows - 1);

	for (let r = row; r < row + rows; r += 1) {
		for (let c = col; c < col + cols; c += 1) {
			if (grid[r][c]) return false;
		}
	}

	return true;
}

function occupy(grid: boolean[][], col: number, row: number, cols: number, rows: number) {
	ensureRows(grid, row + rows - 1);

	for (let r = row; r < row + rows; r += 1) {
		for (let c = col; c < col + cols; c += 1) {
			grid[r][c] = true;
		}
	}
}

function findFirstFit(
	grid: boolean[][],
	cols: number,
	rows: number,
): BentoPlacement | null {
	const scanRows = Math.max(grid.length, 1) + rows;

	for (let row = 0; row < scanRows; row += 1) {
		for (let col = 0; col <= DESKTOP_COLUMNS - cols; col += 1) {
			if (canPlace(grid, col, row, cols, rows)) {
				return { col, row };
			}
		}
	}

	return null;
}

function aspectFitScore(media: GalleryMedia, format: BentoFormat): number {
	const spec = DESKTOP_CELLS[format];
	const cellRatio = spec.cols / spec.rows;

	if (!media.width || !media.height) {
		const fallbackWeight: Record<BentoFormat, number> = {
			hero: 0.25,
			wide: 0.5,
			small: 0.35,
			tall: 0,
		};
		return fallbackWeight[format];
	}

	const mediaRatio = media.width / media.height;
	return -Math.abs(Math.log(mediaRatio / cellRatio));
}

function scorePackPlacement(
	media: GalleryMedia,
	format: BentoFormat,
	placement: BentoPlacement,
	preferred: BentoFormat | null,
): number {
	return (
		aspectFitScore(media, format) * 4 +
		(preferred === format ? 1.25 : 0) -
		placement.row * 0.06 -
		Math.abs(placement.col - 4.5) * 0.015
	);
}

function pickFormatForSlot(
	media: GalleryMedia,
	requested: BentoFormat,
	available: BentoFormat[],
): BentoFormat {
	if (available.includes(requested)) return requested;

	const preferred = inferFromDimensions(media);
	if (preferred && available.includes(preferred)) return preferred;

	const fallbackOrder: BentoFormat[] = ['wide', 'small', 'tall', 'hero'];
	return fallbackOrder.find((format) => available.includes(format)) ?? available[0];
}

export function assignBentoFormats(media: GalleryMedia[]): BentoAssignment[] {
	if (media.length === 0) return [];

	const grid: boolean[][] = [];
	const assigned: BentoAssignment[] = [];

	for (let index = 0; index < media.length; index += 1) {
		const item = media[index];
		const template = SWIRL_TEMPLATE[index];

		if (template) {
			const spec = DESKTOP_CELLS[template.format];
			if (canPlace(grid, template.col, template.row, spec.cols, spec.rows)) {
				occupy(grid, template.col, template.row, spec.cols, spec.rows);
				assigned.push({
					format: template.format,
					placement: { col: template.col, row: template.row },
				});
				continue;
			}
		}

		const preferred = inferFromDimensions(item);
		let best: {
			format: BentoFormat;
			score: number;
			placement: BentoPlacement;
		} | null = null;

		for (const format of PACKING_FORMATS) {
			const spec = DESKTOP_CELLS[format];
			const placement = findFirstFit(grid, spec.cols, spec.rows);
			if (!placement) continue;

			const score = scorePackPlacement(item, format, placement, preferred);
			if (!best || score > best.score) {
				best = { format, score, placement };
			}
		}

		if (!best) {
			const format = pickFormatForSlot(item, preferred ?? 'small', PACKING_FORMATS);
			const spec = DESKTOP_CELLS[format];
			const placement = findFirstFit(grid, spec.cols, spec.rows);
			if (!placement) {
				assigned.push({ format });
				continue;
			}

			occupy(grid, placement.col, placement.row, spec.cols, spec.rows);
			assigned.push({ format, placement });
			continue;
		}

		const spec = DESKTOP_CELLS[best.format];
		occupy(grid, best.placement.col, best.placement.row, spec.cols, spec.rows);
		assigned.push({ format: best.format, placement: best.placement });
	}

	return assigned;
}

export const bentoSpanClasses: Record<BentoFormat, string> = {
	hero: 'experience-bento__cell--hero',
	wide: 'experience-bento__cell--wide',
	tall: 'experience-bento__cell--tall',
	small: 'experience-bento__cell--small',
};

export function bentoPlacementStyle(assignment: BentoAssignment): string | undefined {
	if (!assignment.placement) return undefined;

	const spec = DESKTOP_CELLS[assignment.format];
	const { col, row } = assignment.placement;

	return `--bento-col:${col + 1};--bento-row:${row + 1};--bento-col-span:${spec.cols};--bento-row-span:${spec.rows}`;
}

export function bentoPlacementClass(assignment: BentoAssignment): string {
	return assignment.placement ? 'bento-cell--placed' : '';
}

/** Responsive `sizes` hint aligned to bento cell widths (12-col grid). */
export function bentoImageSizes(format: BentoFormat): string {
	switch (format) {
		case 'hero':
		case 'wide':
			return '(min-width: 1024px) 50vw, (min-width: 768px) 66vw, 100vw';
		case 'tall':
		case 'small':
			return '(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw';
	}
}
