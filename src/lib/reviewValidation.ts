export const REVIEW_LIMITS = {
	nameMin: 2,
	nameMax: 120,
	opinionMin: 20,
	opinionMax: 2000,
} as const;

export type ReviewField = 'rating' | 'name' | 'opinion' | 'privacy';

export type ReviewPayload = {
	rating: 1 | 2 | 3 | 4 | 5;
	name: string;
	opinion: string;
	privacyAccepted: true;
};

export type ReviewInput = {
	rating: unknown;
	name: unknown;
	opinion: unknown;
	privacyAccepted: unknown;
};

const MARKUP_HINT = /<\/?[a-z!?]|javascript\s*:|on\w+\s*=/i;

export function sanitizePlainText(value: string, allowNewlines = false): string {
	let next = value.replace(/\u0000/g, '');
	next = next.replace(/<[^>]*>?/g, '');
	next = next.replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

	if (!allowNewlines) {
		next = next.replace(/[\r\n]+/g, ' ');
	} else {
		next = next.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n');
	}

	return next.replace(/[^\S\n]+/g, ' ').trim();
}

function asString(value: unknown): string {
	return typeof value === 'string' ? value : '';
}

function parseRating(value: unknown): 1 | 2 | 3 | 4 | 5 | null {
	const n = typeof value === 'number' ? value : Number.parseInt(asString(value), 10);
	if (n === 1 || n === 2 || n === 3 || n === 4 || n === 5) return n;
	return null;
}

export function validateReview(input: ReviewInput): {
	ok: boolean;
	errors: Partial<Record<ReviewField, string>>;
	data: ReviewPayload | null;
} {
	const errors: Partial<Record<ReviewField, string>> = {};

	const rating = parseRating(input.rating);
	if (rating == null) {
		errors.rating = 'Elige una valoración de 1 a 5 estrellas.';
	}

	const rawName = asString(input.name);
	if (MARKUP_HINT.test(rawName)) {
		errors.name = 'Escribe el cliente o empresa en texto, sin código ni HTML.';
	} else {
		const name = sanitizePlainText(rawName, false);
		if (!name) {
			errors.name = 'Escribe el nombre del cliente o empresa que contrató el servicio.';
		} else if (name.length < REVIEW_LIMITS.nameMin || name.length > REVIEW_LIMITS.nameMax) {
			errors.name = `El nombre debe tener entre ${REVIEW_LIMITS.nameMin} y ${REVIEW_LIMITS.nameMax} caracteres.`;
		}
	}

	const rawOpinion = asString(input.opinion);
	if (MARKUP_HINT.test(rawOpinion)) {
		errors.opinion = 'Escribe la opinión en texto, sin código ni HTML.';
	} else {
		const opinion = sanitizePlainText(rawOpinion, true);
		if (!opinion) {
			errors.opinion = 'Cuéntanos qué te pareció el espectáculo.';
		} else if (
			opinion.length < REVIEW_LIMITS.opinionMin ||
			opinion.length > REVIEW_LIMITS.opinionMax
		) {
			errors.opinion = `La opinión debe tener entre ${REVIEW_LIMITS.opinionMin} y ${REVIEW_LIMITS.opinionMax} caracteres.`;
		}
	}

	if (input.privacyAccepted !== true) {
		errors.privacy =
			'Debes aceptar la política de privacidad y autorizar la publicación de tu reseña.';
	}

	if (Object.keys(errors).length > 0) {
		return { ok: false, errors, data: null };
	}

	return {
		ok: true,
		errors: {},
		data: {
			rating: rating as 1 | 2 | 3 | 4 | 5,
			name: sanitizePlainText(rawName, false),
			opinion: sanitizePlainText(rawOpinion, true),
			privacyAccepted: true,
		},
	};
}
