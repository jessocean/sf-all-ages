// Haversine formula to calculate distance between two coordinates
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function getDistanceMiles(
  from: { lat: number; lng: number } | null | undefined,
  toLat?: number | null,
  toLng?: number | null
): number | undefined {
  if (!from || toLat === null || toLat === undefined || toLng === null || toLng === undefined) {
    return undefined;
  }
  return calculateDistance(from.lat, from.lng, toLat, toLng);
}

// Format distance for display
export function formatDistance(miles: number): string {
  if (miles < 0.1) {
    return "< 0.1 mi";
  }
  if (miles < 1) {
    return `${miles.toFixed(1)} mi`;
  }
  return `${miles.toFixed(1)} mi`;
}

// San Francisco center coordinates (for default)
export const SF_CENTER = {
  lat: 37.7749,
  lng: -122.4194,
};

// SF neighborhood approximate centers
export const SF_NEIGHBORHOODS: Record<string, { lat: number; lng: number }> = {
  "Mission": { lat: 37.7599, lng: -122.4148 },
  "Castro": { lat: 37.7609, lng: -122.4350 },
  "Noe Valley": { lat: 37.7502, lng: -122.4337 },
  "Bernal Heights": { lat: 37.7389, lng: -122.4156 },
  "Potrero Hill": { lat: 37.7560, lng: -122.4003 },
  "Dogpatch": { lat: 37.7584, lng: -122.3873 },
  "SoMa": { lat: 37.7785, lng: -122.3950 },
  "Hayes Valley": { lat: 37.7759, lng: -122.4245 },
  "Marina": { lat: 37.8015, lng: -122.4368 },
  "Pacific Heights": { lat: 37.7925, lng: -122.4382 },
  "North Beach": { lat: 37.8060, lng: -122.4103 },
  "Chinatown": { lat: 37.7941, lng: -122.4078 },
  "Financial District": { lat: 37.7946, lng: -122.3999 },
  "Sunset": { lat: 37.7602, lng: -122.4862 },
  "Richmond": { lat: 37.7799, lng: -122.4833 },
  "Haight-Ashbury": { lat: 37.7692, lng: -122.4481 },
  "Inner Sunset": { lat: 37.7602, lng: -122.4662 },
  "Outer Sunset": { lat: 37.7544, lng: -122.5057 },
  "Glen Park": { lat: 37.7340, lng: -122.4332 },
  "Excelsior": { lat: 37.7243, lng: -122.4256 },
  "Bayview": { lat: 37.7297, lng: -122.3890 },
  "Visitacion Valley": { lat: 37.7132, lng: -122.4046 },
  "Tenderloin": { lat: 37.7847, lng: -122.4141 },
  "Presidio": { lat: 37.7989, lng: -122.4662 },
  "Golden Gate Park": { lat: 37.7694, lng: -122.4862 },
  "Embarcadero": { lat: 37.7948, lng: -122.3930 },
};
