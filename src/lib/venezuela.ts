// Static, low-bandwidth lookup of Venezuela's federal entities with approximate
// centroids. Used to render a coarse, dependency-free damage map and to power
// the Estado picker. No per-user coordinates are ever stored or displayed.

export type Estado = {
  name: string;
  /** short label used on the bubble map */
  abbr: string;
  lat: number;
  lng: number;
};

export const ESTADOS: Estado[] = [
  { name: "Amazonas", abbr: "AMA", lat: 3.9, lng: -66.0 },
  { name: "Anzoátegui", abbr: "ANZ", lat: 9.3, lng: -64.4 },
  { name: "Apure", abbr: "APU", lat: 7.0, lng: -68.5 },
  { name: "Aragua", abbr: "ARA", lat: 10.2, lng: -67.3 },
  { name: "Barinas", abbr: "BAR", lat: 8.4, lng: -70.2 },
  { name: "Bolívar", abbr: "BOL", lat: 6.0, lng: -63.0 },
  { name: "Carabobo", abbr: "CAR", lat: 10.2, lng: -68.0 },
  { name: "Cojedes", abbr: "COJ", lat: 9.4, lng: -68.4 },
  { name: "Delta Amacuro", abbr: "DEL", lat: 9.0, lng: -61.4 },
  { name: "Distrito Capital", abbr: "DC", lat: 10.49, lng: -66.9 },
  { name: "Falcón", abbr: "FAL", lat: 11.2, lng: -69.9 },
  { name: "Guárico", abbr: "GUA", lat: 8.7, lng: -66.4 },
  { name: "La Guaira", abbr: "LAG", lat: 10.6, lng: -66.7 },
  { name: "Lara", abbr: "LAR", lat: 10.1, lng: -69.8 },
  { name: "Mérida", abbr: "MER", lat: 8.5, lng: -71.1 },
  { name: "Miranda", abbr: "MIR", lat: 10.3, lng: -66.4 },
  { name: "Monagas", abbr: "MON", lat: 9.6, lng: -63.2 },
  { name: "Nueva Esparta", abbr: "NES", lat: 11.0, lng: -63.9 },
  { name: "Portuguesa", abbr: "POR", lat: 9.0, lng: -69.5 },
  { name: "Sucre", abbr: "SUC", lat: 10.5, lng: -63.5 },
  { name: "Táchira", abbr: "TAC", lat: 7.9, lng: -72.2 },
  { name: "Trujillo", abbr: "TRU", lat: 9.4, lng: -70.5 },
  { name: "Yaracuy", abbr: "YAR", lat: 10.3, lng: -68.8 },
  { name: "Zulia", abbr: "ZUL", lat: 9.8, lng: -71.8 },
];

export const ESTADO_NAMES: string[] = ESTADOS.map((e) => e.name);

const ESTADO_BY_NAME = new Map(ESTADOS.map((e) => [e.name, e]));

export function getEstado(name: string | null | undefined): Estado | undefined {
  if (!name) return undefined;
  return ESTADO_BY_NAME.get(name.trim());
}

/**
 * URL-safe slug for an estado name (accent-stripped, lowercase, hyphenated).
 * e.g. "Distrito Capital" -> "distrito-capital", "Anzoátegui" -> "anzoategui".
 */
export function estadoSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const ESTADO_BY_SLUG = new Map(ESTADOS.map((e) => [estadoSlug(e.name), e]));

/** Resolve a slug back to its estado, or undefined for unknown slugs. */
export function getEstadoBySlug(slug: string | null | undefined): Estado | undefined {
  if (!slug) return undefined;
  return ESTADO_BY_SLUG.get(slug.trim().toLowerCase());
}

/**
 * Snap a coordinate to the closest estado centroid. Pure math against the
 * static list — no external geocoding service, works fully offline.
 */
export function nearestEstado(lat: number, lng: number): Estado | undefined {
  let best: Estado | undefined;
  let bestDist = Infinity;
  for (const e of ESTADOS) {
    const dLat = e.lat - lat;
    const dLng = e.lng - lng;
    const dist = dLat * dLat + dLng * dLng;
    if (dist < bestDist) {
      bestDist = dist;
      best = e;
    }
  }
  // Guard against coordinates far outside Venezuela (e.g. VPN / wrong fix).
  return bestDist <= 9 ? best : undefined;
}

// Bounding box for projecting lat/lng into an SVG viewBox.
export const VE_BOUNDS = {
  minLat: 0.5,
  maxLat: 12.5,
  minLng: -73.5,
  maxLng: -59.5,
};

/** Project a coordinate into a [0..width] x [0..height] SVG space. */
export function projectToSvg(
  lat: number,
  lng: number,
  width: number,
  height: number,
): { x: number; y: number } {
  const { minLat, maxLat, minLng, maxLng } = VE_BOUNDS;
  const x = ((lng - minLng) / (maxLng - minLng)) * width;
  const y = ((maxLat - lat) / (maxLat - minLat)) * height;
  return { x, y };
}

// National border of Venezuela as [lat, lng] pairs (simplified from public
// GeoJSON, ~91 points). Hard-coded so the map stays fully offline and tiny
// while the silhouette is clearly recognizable as the country.
export const VE_OUTLINE: [number, number][] = [
  [11.78, -71.33], [11.54, -71.36], [11.42, -71.95], [10.97, -71.62],
  [10.45, -71.63], [9.87, -72.07], [9.07, -71.7], [9.14, -71.26],
  [9.86, -71.04], [10.21, -71.35], [10.97, -71.4], [11.38, -70.16],
  [11.85, -70.29], [12.16, -69.94], [11.46, -69.58], [11.44, -68.88],
  [10.89, -68.23], [10.55, -68.19], [10.55, -67.3], [10.65, -66.23],
  [10.2, -65.66], [10.08, -64.89], [10.39, -64.33], [10.64, -64.32],
  [10.7, -63.08], [10.72, -61.88], [10.42, -62.73], [9.95, -62.39],
  [9.87, -61.59], [9.38, -60.83], [8.58, -60.67], [8.6, -60.15],
  [8.37, -59.76], [7.78, -60.55], [7.42, -60.64], [7.04, -60.3],
  [6.86, -60.54], [6.7, -61.16], [6.23, -61.14], [5.96, -61.41],
  [5.2, -60.73], [4.92, -60.6], [4.54, -60.97], [4.16, -62.09],
  [4.01, -62.8], [3.77, -63.09], [4.02, -63.89], [4.15, -64.63],
  [4.06, -64.82], [3.8, -64.37], [3.13, -64.41], [2.5, -64.27],
  [2.41, -63.42], [2.2, -63.37], [1.92, -64.08], [1.49, -64.2],
  [1.33, -64.61], [1.1, -65.35], [0.79, -65.55], [0.72, -66.33],
  [1.25, -66.88], [2.25, -67.18], [2.6, -67.45], [2.82, -67.81],
  [3.32, -67.3], [3.54, -67.34], [3.84, -67.62], [4.5, -67.82],
  [5.22, -67.74], [5.56, -67.52], [6.1, -67.34], [6.27, -67.7],
  [6.15, -68.27], [6.21, -68.99], [6.1, -69.39], [6.96, -70.09],
  [7.09, -70.67], [6.99, -71.96], [7.34, -72.2], [7.42, -72.44],
  [7.63, -72.48], [8.0, -72.36], [8.41, -72.44], [8.63, -72.66],
  [9.09, -72.79], [9.15, -73.3], [9.74, -73.03], [10.45, -72.91],
  [10.82, -72.61], [11.11, -72.23], [11.61, -71.97],
];

/** Build an SVG path `d` string for the country outline in the given space. */
export function outlinePath(width: number, height: number): string {
  return (
    VE_OUTLINE.map(([lat, lng], i) => {
      const { x, y } = projectToSvg(lat, lng, width, height);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ") + " Z"
  );
}

// ---------------------------------------------------------------------------
// Municipality centroids (curated, approximate).
//
// Only a subset of Venezuela's 335 municipios is listed — the ones that show up
// most in the data, prioritizing the Caracas metro cluster plus the larger
// cities. Anything not listed rolls up to its state centroid via
// resolveMunicipio(). No per-user coordinates are ever used; these are static
// city/municipio centers so the public map can show finer geography.

export type Municipio = {
  /** estado the municipio belongs to */
  state: string;
  /** canonical display name */
  name: string;
  lat: number;
  lng: number;
};

export const MUNICIPIOS: Municipio[] = [
  // --- Caracas metropolitan area ---
  { state: "Distrito Capital", name: "Libertador", lat: 10.5, lng: -66.92 },
  { state: "Miranda", name: "Sucre", lat: 10.49, lng: -66.81 }, // Petare
  { state: "Miranda", name: "Chacao", lat: 10.5, lng: -66.85 },
  { state: "Miranda", name: "Baruta", lat: 10.43, lng: -66.87 },
  { state: "Miranda", name: "El Hatillo", lat: 10.42, lng: -66.82 },
  { state: "Miranda", name: "Plaza", lat: 10.32, lng: -66.61 }, // Guarenas
  { state: "Miranda", name: "Cristóbal Rojas", lat: 10.3, lng: -66.78 }, // Charallave
  // NOTE: Distrito Capital officially has only one municipio, "Libertador".
  // "Sucre" (and Catia, El Paraíso, etc.) in Caracas are *parroquias* of
  // Libertador, not municipios — so they have no separate centroid here and
  // are folded into Libertador via MUNICIPIO_ALIASES_BY_STATE below.
  { state: "La Guaira", name: "Vargas", lat: 10.6, lng: -66.93 },
  // --- Other major cities / capitals ---
  { state: "Zulia", name: "Maracaibo", lat: 10.65, lng: -71.64 },
  { state: "Carabobo", name: "Valencia", lat: 10.18, lng: -68.0 },
  { state: "Lara", name: "Iribarren", lat: 10.07, lng: -69.32 }, // Barquisimeto
  { state: "Bolívar", name: "Caroní", lat: 8.36, lng: -62.65 }, // Ciudad Guayana
  { state: "Bolívar", name: "Heres", lat: 8.13, lng: -63.55 }, // Ciudad Bolívar
  { state: "Aragua", name: "Girardot", lat: 10.25, lng: -67.6 }, // Maracay
  { state: "Anzoátegui", name: "Simón Bolívar", lat: 10.13, lng: -64.68 }, // Barcelona
  { state: "Anzoátegui", name: "Sotillo", lat: 10.21, lng: -64.62 }, // Puerto La Cruz
  { state: "Monagas", name: "Maturín", lat: 9.75, lng: -63.18 },
  { state: "Sucre", name: "Sucre", lat: 10.45, lng: -64.17 }, // Cumaná
  { state: "Táchira", name: "San Cristóbal", lat: 7.77, lng: -72.22 },
  { state: "Mérida", name: "Libertador", lat: 8.59, lng: -71.15 }, // Mérida city
  { state: "Trujillo", name: "Valera", lat: 9.32, lng: -70.6 },
  { state: "Barinas", name: "Barinas", lat: 8.62, lng: -70.21 },
  { state: "Portuguesa", name: "Guanare", lat: 9.04, lng: -69.74 },
  { state: "Falcón", name: "Miranda", lat: 11.4, lng: -69.67 }, // Coro
  { state: "Cojedes", name: "San Carlos", lat: 9.66, lng: -68.58 },
  { state: "Guárico", name: "Juan Germán Roscio", lat: 9.91, lng: -67.36 }, // San Juan de los Morros
  { state: "Nueva Esparta", name: "Mariño", lat: 10.96, lng: -63.85 }, // Porlamar
  { state: "Apure", name: "San Fernando", lat: 7.89, lng: -67.47 },
  { state: "Yaracuy", name: "San Felipe", lat: 10.34, lng: -68.74 },
  { state: "Delta Amacuro", name: "Tucupita", lat: 9.06, lng: -62.05 },
  { state: "Amazonas", name: "Atures", lat: 5.66, lng: -67.62 }, // Puerto Ayacucho
];

/** Strip accents + lowercase + collapse whitespace for fuzzy matching. */
function normKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

// Common free-text variants/typos seen in the data -> canonical municipio name.
const MUNICIPIO_ALIASES: Record<string, string> = {
  petare: "Sucre",
  petarr: "Sucre",
  "el paraiso": "Libertador",
  "23 de enero": "Libertador",
  "santa rosalia": "Libertador",
  "los chorros": "Sucre",
  catia: "Libertador",
  libertados: "Libertador",
  caracas: "Libertador",
  hatillo: "El Hatillo",
  maracay: "Girardot",
  barquisimeto: "Iribarren",
  "ciudad guayana": "Caroní",
  "puerto ordaz": "Caroní",
  "ciudad bolivar": "Heres",
  "puerto la cruz": "Sotillo",
  barcelona: "Simón Bolívar",
  coro: "Miranda",
  cumana: "Sucre",
  porlamar: "Mariño",
  merida: "Libertador",
  "puerto ayacucho": "Atures",
  "san juan de los morros": "Juan Germán Roscio",
};

// Index municipios by "state|normalizedName" for fast resolution.
const MUNICIPIO_INDEX = new Map<string, Municipio>(
  MUNICIPIOS.map((m) => [`${normKey(m.state)}|${normKey(m.name)}`, m]),
);

/**
 * Resolve a (state, municipality) pair to coordinates. Returns the municipio
 * centroid when we recognize the name (handling accents/typos/aliases),
 * otherwise falls back to the state centroid. Returns null only when the state
 * itself is unknown.
 */
export function resolveMunicipio(
  state: string | null | undefined,
  municipality: string | null | undefined,
): { lat: number; lng: number; level: "municipio" | "estado"; name: string; stateName: string } | null {
  const est = getEstado(state ?? undefined);
  if (!est) return null;

  if (municipality && municipality.trim()) {
    const raw = normKey(municipality);
    const canonical = MUNICIPIO_ALIASES[raw] ?? municipality.trim();
    const hit =
      MUNICIPIO_INDEX.get(`${normKey(est.name)}|${normKey(canonical)}`) ??
      MUNICIPIO_INDEX.get(`${normKey(est.name)}|${raw}`);
    if (hit) {
      return {
        lat: hit.lat,
        lng: hit.lng,
        level: "municipio",
        name: hit.name,
        stateName: est.name,
      };
    }
  }

  return {
    lat: est.lat,
    lng: est.lng,
    level: "estado",
    name: est.name,
    stateName: est.name,
  };
}

// ---------------------------------------------------------------------------
// Complete municipio list per federal entity (all 335 official municipios).
//
// Used to power the REQUIRED, state-dependent Municipio picker on the property
// screen. Names are the canonical official municipio names, sorted
// alphabetically within each state. This is just the controlled vocabulary —
// map centroids still come from the curated MUNICIPIOS list above, and any name
// not in that subset rolls up to the state centroid via resolveMunicipio().

export const MUNICIPIOS_BY_STATE: Record<string, string[]> = {
  Amazonas: [
    "Alto Orinoco",
    "Atabapo",
    "Atures",
    "Autana",
    "Manapiare",
    "Maroa",
    "Río Negro",
  ],
  Anzoátegui: [
    "Anaco",
    "Aragua",
    "Diego Bautista Urbaneja",
    "Fernando de Peñalver",
    "Francisco de Miranda",
    "Francisco del Carmen Carvajal",
    "Guanta",
    "Independencia",
    "José Gregorio Monagas",
    "Juan Antonio Sotillo",
    "Juan Manuel Cajigal",
    "Libertad",
    "Manuel Ezequiel Bruzual",
    "Pedro María Freites",
    "Píritu",
    "San José de Guanipa",
    "San Juan de Capistrano",
    "Santa Ana",
    "Simón Bolívar",
    "Simón Rodríguez",
    "Sir Arthur McGregor",
  ],
  Apure: [
    "Achaguas",
    "Biruaca",
    "Muñoz",
    "Páez",
    "Pedro Camejo",
    "Rómulo Gallegos",
    "San Fernando",
  ],
  Aragua: [
    "Bolívar",
    "Camatagua",
    "Francisco Linares Alcántara",
    "Girardot",
    "José Ángel Lamas",
    "José Félix Ribas",
    "José Rafael Revenga",
    "Libertador",
    "Mario Briceño Iragorry",
    "Ocumare de la Costa de Oro",
    "San Casimiro",
    "San Sebastián",
    "Santiago Mariño",
    "Santos Michelena",
    "Sucre",
    "Tovar",
    "Urdaneta",
    "Zamora",
  ],
  Barinas: [
    "Alberto Arvelo Torrealba",
    "Andrés Eloy Blanco",
    "Antonio José de Sucre",
    "Arismendi",
    "Barinas",
    "Bolívar",
    "Cruz Paredes",
    "Ezequiel Zamora",
    "Obispos",
    "Pedraza",
    "Rojas",
    "Sosa",
  ],
  Bolívar: [
    "Caroní",
    "Cedeño",
    "El Callao",
    "Gran Sabana",
    "Heres",
    "Padre Pedro Chien",
    "Piar",
    "Raúl Leoni",
    "Roscio",
    "Sifontes",
    "Sucre",
  ],
  Carabobo: [
    "Bejuma",
    "Carlos Arvelo",
    "Diego Ibarra",
    "Guacara",
    "Juan José Mora",
    "Libertador",
    "Los Guayos",
    "Miranda",
    "Montalbán",
    "Naguanagua",
    "Puerto Cabello",
    "San Diego",
    "San Joaquín",
    "Valencia",
  ],
  Cojedes: [
    "Anzoátegui",
    "Girardot",
    "Lima Blanco",
    "Pao de San Juan Bautista",
    "Ricaurte",
    "Rómulo Gallegos",
    "San Carlos",
    "Tinaco",
    "Tinaquillo",
  ],
  "Delta Amacuro": ["Antonio Díaz", "Casacoima", "Pedernales", "Tucupita"],
  "Distrito Capital": ["Libertador"],
  Falcón: [
    "Acosta",
    "Bolívar",
    "Buchivacoa",
    "Cacique Manaure",
    "Carirubana",
    "Colina",
    "Dabajuro",
    "Democracia",
    "Falcón",
    "Federación",
    "Jacura",
    "José Laurencio Silva",
    "Los Taques",
    "Mauroa",
    "Miranda",
    "Monseñor Iturriza",
    "Palmasola",
    "Petit",
    "Píritu",
    "San Francisco",
    "Sucre",
    "Tocópero",
    "Unión",
    "Urumaco",
    "Zamora",
  ],
  Guárico: [
    "Camaguán",
    "Chaguaramas",
    "El Socorro",
    "José Félix Ribas",
    "José Tadeo Monagas",
    "Juan Germán Roscio",
    "Julián Mellado",
    "Las Mercedes",
    "Leonardo Infante",
    "Ortiz",
    "Pedro Zaraza",
    "San Gerónimo de Guayabal",
    "San José de Guaribe",
    "Santa María de Ipire",
    "Sebastián Francisco de Miranda",
  ],
  "La Guaira": ["Vargas"],
  Lara: [
    "Andrés Eloy Blanco",
    "Crespo",
    "Iribarren",
    "Jiménez",
    "Morán",
    "Palavecino",
    "Simón Planas",
    "Torres",
    "Urdaneta",
  ],
  Mérida: [
    "Alberto Adriani",
    "Andrés Bello",
    "Antonio Pinto Salinas",
    "Aricagua",
    "Arzobispo Chacón",
    "Campo Elías",
    "Caracciolo Parra Olmedo",
    "Cardenal Quintero",
    "Guaraque",
    "Julio César Salas",
    "Justo Briceño",
    "Libertador",
    "Miranda",
    "Obispo Ramos de Lora",
    "Padre Noguera",
    "Pueblo Llano",
    "Rangel",
    "Rivas Dávila",
    "Santos Marquina",
    "Sucre",
    "Tovar",
    "Tulio Febres Cordero",
    "Zea",
  ],
  Miranda: [
    "Acevedo",
    "Andrés Bello",
    "Baruta",
    "Brión",
    "Buroz",
    "Carrizal",
    "Chacao",
    "Cristóbal Rojas",
    "El Hatillo",
    "Guaicaipuro",
    "Independencia",
    "Lander",
    "Los Salias",
    "Páez",
    "Paz Castillo",
    "Pedro Gual",
    "Plaza",
    "Simón Bolívar",
    "Sucre",
    "Urdaneta",
    "Zamora",
  ],
  Monagas: [
    "Acosta",
    "Aguasay",
    "Bolívar",
    "Caripe",
    "Cedeño",
    "Ezequiel Zamora",
    "Libertador",
    "Maturín",
    "Piar",
    "Punceres",
    "Santa Bárbara",
    "Sotillo",
    "Uracoa",
  ],
  "Nueva Esparta": [
    "Antolín del Campo",
    "Arismendi",
    "Díaz",
    "García",
    "Gómez",
    "Maneiro",
    "Marcano",
    "Mariño",
    "Península de Macanao",
    "Tubores",
    "Villalba",
  ],
  Portuguesa: [
    "Agua Blanca",
    "Araure",
    "Esteller",
    "Guanare",
    "Guanarito",
    "Monseñor José Vicente de Unda",
    "Ospino",
    "Páez",
    "Papelón",
    "San Genaro de Boconoíto",
    "San Rafael de Onoto",
    "Santa Rosalía",
    "Sucre",
    "Turén",
  ],
  Sucre: [
    "Andrés Eloy Blanco",
    "Andrés Mata",
    "Arismendi",
    "Benítez",
    "Bermúdez",
    "Bolívar",
    "Cajigal",
    "Cruz Salmerón Acosta",
    "Libertador",
    "Mariño",
    "Mejía",
    "Montes",
    "Ribero",
    "Sucre",
    "Valdez",
  ],
  Táchira: [
    "Andrés Bello",
    "Antonio Rómulo Costa",
    "Ayacucho",
    "Bolívar",
    "Cárdenas",
    "Córdoba",
    "Fernández Feo",
    "Francisco de Miranda",
    "García de Hevia",
    "Guásimos",
    "Independencia",
    "Jáuregui",
    "José María Vargas",
    "Junín",
    "Libertad",
    "Libertador",
    "Lobatera",
    "Michelena",
    "Panamericano",
    "Pedro María Ureña",
    "Rafael Urdaneta",
    "Samuel Darío Maldonado",
    "San Cristóbal",
    "San Judas Tadeo",
    "Seboruco",
    "Simón Rodríguez",
    "Sucre",
    "Torbes",
    "Uribante",
  ],
  Trujillo: [
    "Andrés Bello",
    "Boconó",
    "Bolívar",
    "Candelaria",
    "Carache",
    "Carvajal",
    "Escuque",
    "José Felipe Márquez Cañizales",
    "Juan Vicente Campo Elías",
    "La Ceiba",
    "Miranda",
    "Monte Carmelo",
    "Motatán",
    "Pampán",
    "Pampanito",
    "Rangel",
    "Sucre",
    "Trujillo",
    "Urdaneta",
    "Valera",
  ],
  Yaracuy: [
    "Arístides Bastidas",
    "Bolívar",
    "Bruzual",
    "Cocorote",
    "Independencia",
    "José Antonio Páez",
    "La Trinidad",
    "Manuel Monge",
    "Nirgua",
    "Peña",
    "San Felipe",
    "Sucre",
    "Urachiche",
    "Veroes",
  ],
  Zulia: [
    "Almirante Padilla",
    "Baralt",
    "Cabimas",
    "Catatumbo",
    "Colón",
    "Francisco Javier Pulgar",
    "Jesús Enrique Lossada",
    "Jesús María Semprún",
    "La Cañada de Urdaneta",
    "Lagunillas",
    "Machiques de Perijá",
    "Mara",
    "Maracaibo",
    "Miranda",
    "Páez",
    "Rosario de Perijá",
    "San Francisco",
    "Santa Rita",
    "Simón Bolívar",
    "Sucre",
    "Valmore Rodríguez",
  ],
};

/** Municipio names for a given estado (empty array for unknown states). */
export function municipiosFor(state: string | null | undefined): string[] {
  if (!state) return [];
  return MUNICIPIOS_BY_STATE[state.trim()] ?? [];
}

/**
 * Snap a coordinate to the closest curated municipio centroid WITHIN a given
 * state, returning its canonical name only when it's reasonably close and the
 * name exists in the official MUNICIPIOS_BY_STATE list (so it's selectable in
 * the picker). Best-effort autopopulate after geolocation; returns undefined
 * when nothing nearby/selectable is found. Pure math, fully offline.
 */
export function nearestMunicipio(
  lat: number,
  lng: number,
  state: string | null | undefined,
): string | undefined {
  if (!state) return undefined;
  const official = new Set(municipiosFor(state));
  let best: Municipio | undefined;
  let bestDist = Infinity;
  for (const m of MUNICIPIOS) {
    if (m.state !== state) continue;
    const dLat = m.lat - lat;
    const dLng = m.lng - lng;
    const dist = dLat * dLat + dLng * dLng;
    if (dist < bestDist) {
      bestDist = dist;
      best = m;
    }
  }
  // ~0.3° (~33 km) tolerance, and only when the name is an official option.
  if (best && bestDist <= 0.09 && official.has(best.name)) return best.name;
  return undefined;
}
