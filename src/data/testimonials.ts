export interface Testimonial {
	comment: string;
	client: string;
	stars: number;
}

/** Mock data — replace with API fetch when available */
export const testimonials: Testimonial[] = [
	{
		comment:
			'Aeria Trois transformó la plaza del festival en un escenario mágico. El público no salía de su asombro ante la tela y el aro aéreo.',
		client: 'Centenera Rock',
		stars: 5,
	},
	{
		comment:
			'Profesionalidad, puntualidad y un espectáculo visual impecable. Fueron el broche de oro de nuestra noche temática.',
		client: 'Jowke Club',
		stars: 5,
	},
	{
		comment:
			'Contratamos un dúo aéreo para la gala y superó todas las expectativas. Recomendamos su trabajo sin dudarlo.',
		client: 'Festival Enraizarte',
		stars: 5,
	},
	{
		comment:
			'La actuación elevó la ceremonia a otro nivel. Puntualidad, comunicación clara y un número que dejó al público sin palabras.',
		client: 'Ayto. Arroyomolinos',
		stars: 5,
	},
	{
		comment:
			'El trío aportó la elegancia y la fuerza que buscábamos para cerrar la velada. Volveríamos a contar con ellas sin dudarlo.',
		client: 'Madrid Festival',
		stars: 5,
	},
];
