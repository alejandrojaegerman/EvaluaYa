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
