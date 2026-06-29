/**
 * High-Precision GIS and Google Earth Engine Layer configuration
 * Used for aligning coordinates and rendering high-fidelity hybrid tracking overlays
 */
export function initializeMapConfig(center: [number, number], zoom: number) {
  return {
    center,
    zoom,
    osmUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    osmAttribution: '© OpenStreetMap contributors',
    satelliteUrl: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    satelliteAttribution: '© Google Satellite Hybrid',
    defaultDivisionCenter: {
      'Dhaka': [23.8103, 90.4125],
      'Chattogram': [22.3569, 91.7832],
      'Rajshahi': [24.3745, 88.6042],
      'Khulna': [22.8456, 89.5403],
      'Barishal': [22.7010, 90.3535],
      'Sylhet': [24.8949, 91.8687],
      'Rangpur': [25.7508, 89.2467],
      'Mymensingh': [24.7471, 90.4203],
    }
  };
}

/**
 * Calculates high-precision distance between two geographic coordinates (Haversine formula)
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}
