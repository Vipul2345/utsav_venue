import prisma from '../prisma';

// Known approximate coordinates for major cities in India
export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  bangalore: { lat: 12.9716, lng: 77.5946 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  delhi: { lat: 28.6139, lng: 77.209 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  pune: { lat: 18.5204, lng: 73.8567 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
  chandigarh: { lat: 30.7333, lng: 76.7794 },
  goa: { lat: 15.2993, lng: 74.124 },
  kochi: { lat: 9.9312, lng: 76.2673 },
  coimbatore: { lat: 11.0168, lng: 76.9558 },
  mysore: { lat: 12.2958, lng: 76.6394 },
  mysuru: { lat: 12.2958, lng: 76.6394 },
};

/**
 * Calculates Haversine distance in kilometers between two sets of GPS coordinates
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export interface DetectCityResult {
  success: boolean;
  detectedCity: {
    id: string;
    name: string;
    slug: string;
    state: string;
    hallCount: number;
  };
  hasVenues: boolean;
  isFallback: boolean;
  originalCity?: string;
  distanceKm: number | null;
  message: string;
}

export async function detectNearestCity(
  lat: number | null,
  lng: number | null
): Promise<DetectCityResult> {
  const cities = await prisma.city.findMany({
    where: { isActive: true },
    include: {
      halls: {
        where: { status: 'APPROVED' },
        select: {
          id: true,
          name: true,
          slug: true,
          latitude: true,
          longitude: true,
          address: true,
        },
      },
    },
  });

  if (cities.length === 0) {
    throw new Error('No active cities found in the database.');
  }

  // If no coordinates provided, fallback to default city with venues
  if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
    const cityWithVenues = cities.find((c) => c.halls.length > 0) || cities[0];
    return {
      success: true,
      detectedCity: {
        id: cityWithVenues.id,
        name: cityWithVenues.name,
        slug: cityWithVenues.slug,
        state: cityWithVenues.state,
        hallCount: cityWithVenues.halls.length,
      },
      hasVenues: cityWithVenues.halls.length > 0,
      isFallback: false,
      distanceKm: null,
      message: 'Default city selected (no GPS coordinates provided).',
    };
  }

  // Calculate distance to each city
  const citiesWithDistance = cities.map((c) => {
    let cityLat = CITY_COORDINATES[c.slug]?.lat;
    let cityLng = CITY_COORDINATES[c.slug]?.lng;

    if (!cityLat || !cityLng) {
      const hallsWithCoords = c.halls.filter((h) => h.latitude && h.longitude);
      if (hallsWithCoords.length > 0) {
        cityLat =
          hallsWithCoords.reduce((acc, h) => acc + (h.latitude || 0), 0) /
          hallsWithCoords.length;
        cityLng =
          hallsWithCoords.reduce((acc, h) => acc + (h.longitude || 0), 0) /
          hallsWithCoords.length;
      } else {
        cityLat = 12.9716;
        cityLng = 77.5946;
      }
    }

    const dist = calculateHaversineDistanceKm(lat, lng, cityLat, cityLng);
    return {
      ...c,
      calculatedDistanceKm: dist,
      hasApprovedHalls: c.halls.length > 0,
    };
  });

  citiesWithDistance.sort((a, b) => a.calculatedDistanceKm - b.calculatedDistanceKm);
  const closestCity = citiesWithDistance[0];

  if (closestCity.hasApprovedHalls) {
    return {
      success: true,
      detectedCity: {
        id: closestCity.id,
        name: closestCity.name,
        slug: closestCity.slug,
        state: closestCity.state,
        hallCount: closestCity.halls.length,
      },
      hasVenues: true,
      isFallback: false,
      distanceKm: closestCity.calculatedDistanceKm,
      message: `Detected near ${closestCity.name} (${closestCity.calculatedDistanceKm} km away).`,
    };
  }

  const fallbackCity = citiesWithDistance.find((c) => c.hasApprovedHalls) || closestCity;

  return {
    success: true,
    detectedCity: {
      id: fallbackCity.id,
      name: fallbackCity.name,
      slug: fallbackCity.slug,
      state: fallbackCity.state,
      hallCount: fallbackCity.halls.length,
    },
    hasVenues: fallbackCity.hasApprovedHalls,
    isFallback: fallbackCity.id !== closestCity.id,
    originalCity: closestCity.name,
    distanceKm: fallbackCity.calculatedDistanceKm,
    message:
      fallbackCity.id !== closestCity.id
        ? `No active venues in ${closestCity.name}. Showing nearest available venues in ${fallbackCity.name} (${fallbackCity.calculatedDistanceKm} km away).`
        : `Showing venues in ${fallbackCity.name}.`,
  };
}
