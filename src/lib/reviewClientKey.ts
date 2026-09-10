import { createHash } from 'node:crypto';

export function getClientIp(request: Request): string {
	const forwarded = request.headers.get('x-forwarded-for');
	if (forwarded) {
		const first = forwarded.split(',')[0]?.trim();
		if (first) return first;
	}

	const realIp = request.headers.get('x-real-ip')?.trim();
	if (realIp) return realIp;

	return 'unknown';
}

export function buildReviewClientKey(ip: string, salt: string, date = new Date()): string {
	const day = date.toISOString().slice(0, 10);
	return createHash('sha256').update(`${ip}:${salt}:${day}`).digest('hex');
}
