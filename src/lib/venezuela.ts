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
