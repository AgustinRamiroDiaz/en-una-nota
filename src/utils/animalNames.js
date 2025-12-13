/**
 * Array of animal names for generating unique player names
 */

export const animalNames = [
  'Perro', 'Gato', 'León', 'Tigre', 'Elefante',
  'Jirafa', 'Cebra', 'Hipopótamo', 'Rinoceronte', 'Cocodrilo',
  'Serpiente', 'Águila', 'Halcón', 'Búho', 'Loro',
  'Pingüino', 'Delfín', 'Ballena', 'Tiburón', 'Pulpo',
  'Medusa', 'Estrella', 'Cangrejo', 'Langosta', 'Tortuga',
  'Rana', 'Sapo', 'Salamandra', 'Camaleón', 'Iguana',
  'Koala', 'Canguro', 'Oso', 'Panda', 'Lobo',
  'Zorro', 'Conejo', 'Liebre', 'Ardilla', 'Castor',
  'Mapache', 'Tejón', 'Nutria', 'Foca', 'Morsa',
  'Mono', 'Gorila', 'Chimpancé', 'Orangután', 'Lémur',
  'Murciélago', 'Rata', 'Ratón', 'Hamster', 'Cobaya',
  'Erizo', 'Topo', 'Comadreja', 'Hurón', 'Marta',
  'Caballo', 'Burro', 'Cebra', 'Bisonte', 'Búfalo',
  'Vaca', 'Toro', 'Cerdo', 'Oveja', 'Cabra',
  'Llama', 'Alpaca', 'Camello', 'Dromedario', 'Ciervo',
  'Alce', 'Reno', 'Antílope', 'Gacela', 'Impala',
  'Pájaro', 'Golondrina', 'Canario', 'Ruiseñor', 'Cuervo',
  'Gaviota', 'Pelícano', 'Flamenco', 'Cisne', 'Pato',
  'Ganso', 'Gallina', 'Gallo', 'Pavo', 'Avestruz',
  'Colibrí', 'Tucán', 'Guacamayo', 'Cacatúa', 'Kiwi',
];

/**
 * Gets a random animal name from the array
 * @returns {string} Random animal name
 */
export function getRandomAnimalName() {
  const randomIndex = Math.floor(Math.random() * animalNames.length);
  return animalNames[randomIndex];
}
