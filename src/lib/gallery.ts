import type { ImageMetadata } from 'astro';

export type GalleryMedia = {
	id: string;
	src: string;
	type: 'image' | 'video';
	image?: ImageMetadata;
	poster?: string;
	width?: number;
	height?: number;
	alt: string;
};

export type GalleryNote = {
	label: string;
	text: string;
};

export type GalleryEvent = {
	id: string;
	title: string;
	meta: string;
	category: string;
	notes: GalleryNote[];
	media: GalleryMedia[];
};

const eventNotes: Record<string, GalleryNote[]> = {
	'Festival-Centenera-Rock_Festival-Aldeacentenera-Caceres': [
		{
			label: 'Ambiente',
			text: 'Escenario de noche con luces acorde a la intensidad del baile.',
		},
		{
			label: 'Vestuario',
			text: 'Hecho a mano, sacando la versión más rockera de Aeria Trois.',
		},
		{
			label: 'Pieza',
			text: 'Mezcla musical de 20 minutos con las baladas más emblemáticas del mundo del rock.',
		},
	],
	'Festival-Enraizarte_Festival-Peñascosa-Albacete': [
		{ label: 'Ambiente', text: 'Plaza de pueblo, de día, con el público alrededor.' },
		{
			label: 'Vestuario',
			text: 'Piezas hechas a mano recreando las raíces del mundo: agua, tierra y fuego.',
		},
		{
			label: 'Pieza',
			text: 'Mezcla musical de 25 minutos con narración de una historia.',
		},
	],
	'Jowke-Racing_Jowke-Club_Madrid-EventoPrivado': [
		{ label: 'Ambiente', text: 'Evento privado de concentración de coches.' },
		{
			label: 'Vestuario',
			text: 'Moteras con trenza tematizada con bengalas de humo rojas.',
		},
		{
			label: 'Pieza',
			text: 'Dos pases con pieza musical de 15 minutos inspirada en Fast & Furious.',
		},
	],
	'Jowke-Racing_Jowke_Madrid-EventoPrivado': [
		{ label: 'Ambiente', text: 'Evento privado de exposición de coches.' },
		{ label: 'Vestuario', text: 'Body neón ambientado en Anas Racing.' },
		{ label: 'Pieza', text: 'Mezcla musical con una duración de 10 minutos.' },
	],
	'Jornadas-De-Bienestar_Ayto-Arroyomolinos_Arroyomolinos-Madrid': [
		{
			label: 'Ambiente',
			text: 'En mitad de la plaza frente a un monumento emblemático de la ciudad.',
		},
		{ label: 'Vestuario', text: 'Temática celta hecha a mano.' },
		{
			label: 'Pieza',
			text: 'Mezcla musical de 15 minutos buscando los éxitos celtas como El último mohicano.',
		},
	],
	'Navipark_Feria-Navideña_Mostoles-Madrid': [
		{ label: 'Ambiente', text: 'Actuación nocturna en un parque de Navidad.' },
		{ label: 'Vestuario', text: 'Hada mágica de la Navidad y del invierno.' },
		{
			label: 'Pieza',
			text: 'Número musical de 20 minutos con puesta en escena e historia a ver.',
		},
	],
};

const imageModules = import.meta.glob<{ default: ImageMetadata }>('../assets/gallery/**/*.webp', {
	eager: true,
});

const videoModules = import.meta.glob<string>('../assets/gallery/**/*.webm', {
	eager: true,
	import: 'default',
});

function formatWords(segment: string): string {
	return segment
		.split('-')
		.map((word) => {
			const lower = word.toLowerCase();
			if (lower === 'de' || lower === 'del' || lower === 'y' || lower === 'ayto') {
				return lower === 'ayto' ? 'Ayto.' : lower;
			}
			return lower.charAt(0).toUpperCase() + lower.slice(1);
		})
		.join(' ');
}

function parseEventMeta(dirName: string): { title: string; meta: string } {
	const parts = dirName.split('_');
	const title = formatWords(parts[0]);

	if (parts.length === 2) {
		const segments = parts[1].split('-');
		const type = formatWords(segments[0]);
		const location = segments.slice(1).map(formatWords).join(', ');
		return { title, meta: `${location} · ${type}` };
	}

	const venue = formatWords(parts[1]);
	const tail = parts.slice(2).join('-').split('-');

	if (tail.length >= 2 && tail[tail.length - 2] === 'Evento' && tail[tail.length - 1] === 'Privado') {
		const location = tail.slice(0, -2).map(formatWords).join(', ');
		return { title, meta: `${venue}, ${location} · Evento privado` };
	}

	const location = tail.map(formatWords).join(', ');
	return { title, meta: `${venue}, ${location}` };
}

function mediaId(eventId: string, fileName: string) {
	return `${eventId}/${fileName}`;
}

function buildMediaList(): Map<string, GalleryMedia[]> {
	const byEvent = new Map<string, GalleryMedia[]>();
	const postersByEvent = new Map<
		string,
		Map<string, { src: string; width: number; height: number }>
	>();

	for (const [path, module] of Object.entries(imageModules)) {
		const match = path.match(/gallery\/([^/]+)\/([^/]+)\.webp$/);
		if (!match) continue;

		const [, eventId, baseName] = match;

		if (baseName.endsWith('-poster')) {
			const videoBaseName = baseName.slice(0, -'-poster'.length);
			const image = module.default;
			const eventPosters = postersByEvent.get(eventId) ?? new Map();
			eventPosters.set(videoBaseName, {
				src: image.src,
				width: image.width,
				height: image.height,
			});
			postersByEvent.set(eventId, eventPosters);
			continue;
		}

		const image = module.default;
		const items = byEvent.get(eventId) ?? [];
		items.push({
			id: mediaId(eventId, baseName),
			src: image.src,
			type: 'image',
			image,
			width: image.width,
			height: image.height,
			alt: '',
		});
		byEvent.set(eventId, items);
	}

	for (const [path, src] of Object.entries(videoModules)) {
		const match = path.match(/gallery\/([^/]+)\/([^/]+)\.webm$/);
		if (!match) continue;

		const [, eventId, baseName] = match;
		const poster = postersByEvent.get(eventId)?.get(baseName);
		const items = byEvent.get(eventId) ?? [];
		items.push({
			id: mediaId(eventId, baseName),
			src,
			type: 'video',
			poster: poster?.src,
			width: poster?.width,
			height: poster?.height,
			alt: '',
		});
		byEvent.set(eventId, items);
	}

	for (const [eventId, items] of byEvent) {
		const { title } = parseEventMeta(eventId);
		items.sort((a, b) => {
			if (a.type !== b.type) return a.type === 'video' ? -1 : 1;
			return a.id.localeCompare(b.id, 'es');
		});
		items.forEach((item, index) => {
			item.alt =
				item.type === 'video'
					? `${title} — video ${index + 1}`
					: `${title} — imagen ${index + 1}`;
		});
	}

	return byEvent;
}

const mediaByEvent = buildMediaList();

export function getGalleryEvents(): GalleryEvent[] {
	const eventOrder = [
		'Festival-Centenera-Rock_Festival-Aldeacentenera-Caceres',
		'Festival-Enraizarte_Festival-Peñascosa-Albacete',
		'Jowke-Racing_Jowke-Club_Madrid-EventoPrivado',
		'Jowke-Racing_Jowke_Madrid-EventoPrivado',
		'Jornadas-De-Bienestar_Ayto-Arroyomolinos_Arroyomolinos-Madrid',
		'Navipark_Feria-Navideña_Mostoles-Madrid',
	];

	const knownIds = [...mediaByEvent.keys()];
	const orderedIds = [
		...eventOrder.filter((id) => mediaByEvent.has(id)),
		...knownIds.filter((id) => !eventOrder.includes(id)).sort(),
	];

	return orderedIds.map((id) => {
		const { title, meta } = parseEventMeta(id);
		const media = mediaByEvent.get(id) ?? [];

		return {
			id,
			title,
			meta,
			category: 'Telas aéreas',
			notes: eventNotes[id] ?? [
				{
					label: 'Pieza',
					text: `Número aéreo en ${title.toLowerCase()}, adaptado al espacio y al ritmo del evento.`,
				},
			],
			media,
		};
	});
}
