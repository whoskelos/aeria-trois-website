import { siteConfig } from '../config/site';

type JsonLd = Record<string, unknown>;

interface PageJsonLdOptions {
	siteUrl: string;
	title: string;
	description: string;
	canonicalUrl: string;
}

function normalizeSiteUrl(siteUrl: string): string {
	return siteUrl.replace(/\/$/, '');
}

export function absoluteUrl(path: string, siteUrl: string | URL): string {
	return new URL(path, siteUrl).href;
}

export function resolveTitle(title: string, isHome = false): string {
	if (isHome) return siteConfig.defaultTitle;
	if (title === siteConfig.defaultTitle) return title;
	return siteConfig.titleTemplate.replace('%s', title);
}

export function buildPageJsonLd({
	siteUrl,
	title,
	description,
	canonicalUrl,
}: PageJsonLdOptions): JsonLd {
	const baseUrl = normalizeSiteUrl(siteUrl);
	const organizationId = `${baseUrl}/#organization`;
	const websiteId = `${baseUrl}/#website`;
	const webpageId = `${canonicalUrl}#webpage`;

	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebSite',
				'@id': websiteId,
				url: `${baseUrl}/`,
				name: siteConfig.name,
				description: siteConfig.defaultDescription,
				inLanguage: siteConfig.lang,
				publisher: { '@id': organizationId },
			},
			{
				'@type': ['PerformingGroup', 'Organization'],
				'@id': organizationId,
				name: siteConfig.name,
				description: siteConfig.defaultDescription,
				url: `${baseUrl}/`,
				logo: {
					'@type': 'ImageObject',
					url: absoluteUrl('/favicon.svg', siteUrl),
				},
				image: absoluteUrl(siteConfig.defaultOgImage, siteUrl),
				sameAs: [...siteConfig.sameAs],
				areaServed: [
					{
						'@type': 'City',
						name: siteConfig.location.locality,
					},
					{
						'@type': 'AdministrativeArea',
						name: siteConfig.location.region,
					},
					{
						'@type': 'Country',
						name: 'España',
					},
				],
				knowsAbout: [...siteConfig.services],
				numberOfEmployees: {
					'@type': 'QuantitativeValue',
					value: 3,
				},
				member: [
					{ '@type': 'Person', name: 'Paloma' },
					{ '@type': 'Person', name: 'Andrea' },
					{ '@type': 'Person', name: 'Lydia' },
				],
				hasOfferCatalog: {
					'@type': 'OfferCatalog',
					name: 'Espectáculos aéreos',
					itemListElement: siteConfig.offerings.map((offering, index) => ({
						'@type': 'Offer',
						position: index + 1,
						itemOffered: {
							'@type': 'Service',
							name: offering.name,
							description: offering.description,
							provider: { '@id': organizationId },
							areaServed: siteConfig.location.locality,
						},
					})),
				},
			},
			{
				'@type': 'WebPage',
				'@id': webpageId,
				url: canonicalUrl,
				name: title,
				description,
				isPartOf: { '@id': websiteId },
				about: { '@id': organizationId },
				inLanguage: siteConfig.lang,
			},
		],
	};
}
