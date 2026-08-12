export const siteConfig = {
	name: 'Aeria Trois',
	defaultTitle: 'Aeria Trois - Espectáculos aéreos en Madrid',
	titleTemplate: '%s · Aeria Trois',
	defaultDescription:
		'Contrata espectáculos aéreos profesionales con telas aéreas, aro aéreo y acrobacias de alto impacto. Números personalizados para festivales, galas corporativas y eventos privados en Madrid y España.',
	locale: 'es_ES',
	lang: 'es',
	sameAs: ['https://ig.me/m/aeria.trois'],
	email: 'aeria.trois@gmail.com',
	defaultOgImage: '/og.jpg',
	ogImageWidth: 1200,
	ogImageHeight: 630,
	location: {
		locality: 'Madrid',
		region: 'Comunidad de Madrid',
		country: 'ES',
	},
	services: [
		'Espectáculos de telas aéreas',
		'Espectáculos de aro aéreo',
		'Acrobacias aéreas para eventos',
		'Clases y talleres de circo aéreo',
	],
	offerings: [
		{
			name: 'Pase 5 minutos',
			description:
				'Número aéreo breve ideal para aperturas de gala, inauguraciones o presentaciones de producto.',
		},
		{
			name: 'Pase 10 minutos',
			description:
				'Formato para cenas de gala, eventos corporativos, pasacalles y ferias temáticas.',
		},
		{
			name: 'Pase 20-25 minutos',
			description:
				'Producción completa con estructura narrativa y variedad de disciplinas aéreas.',
		},
	],
} as const;
