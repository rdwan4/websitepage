import { Geolocation } from '@capacitor/geolocation';
import { CITY_OPTIONS, type PrayerLocation, buildCustomLocationFromSearch } from '../lib/prayer';
import { isNativeApp } from '../lib/runtime';

export type PrayerLocationResult = {
  location: PrayerLocation | null;
  errorKey: 'denied' | 'unavailable' | null;
};

export type PrayerLocationSearchResult = PrayerLocation;

const buildLocation = async (latitude: number, longitude: number, label = 'Current Location', country = ''): Promise<PrayerLocation> => ({
  label,
  country,
  latitude,
  longitude,
  timeZone: await (async () => {
    try {
      const tzLookup = (await import('tz-lookup')).default;
      return tzLookup(latitude, longitude);
    } catch {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
  })(),
});

const toRadians = (value: number) => (value * Math.PI) / 180;

const getDistanceKm = (latitudeA: number, longitudeA: number, latitudeB: number, longitudeB: number) => {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(latitudeB - latitudeA);
  const deltaLon = toRadians(longitudeB - longitudeA);
  const latA = toRadians(latitudeA);
  const latB = toRadians(latitudeB);

  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(latA) * Math.cos(latB) * Math.sin(deltaLon / 2) ** 2;

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const getNearestKnownLocation = async (latitude: number, longitude: number) => {
  const nearest = CITY_OPTIONS.map((city) => ({
    city,
    distanceKm: getDistanceKm(latitude, longitude, city.location.latitude, city.location.longitude),
  })).sort((left, right) => left.distanceKm - right.distanceKm)[0];

  if (!nearest || nearest.distanceKm > 30) return null;

  return await buildLocation(latitude, longitude, nearest.city.location.label, nearest.city.location.country);
};

const reverseGeocode = async (latitude: number, longitude: number) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=14&accept-language=en`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) return null;

    const payload = (await response.json()) as {
      address?: Record<string, string | undefined>;
    };

    const address = payload.address;
    if (!address) return null;

    const placeLabel =
      address.village ||
      address.town ||
      address.city ||
      address.municipality ||
      address.county ||
      address.state;

    const country = address.country || '';

    if (!placeLabel && !country) return null;

    return await buildLocation(latitude, longitude, placeLabel || 'Current Location', country);
  } catch {
    return null;
  }
};

const buildResolvedLocation = async (latitude: number, longitude: number) => {
  const exactLocation = await reverseGeocode(latitude, longitude);
  if (exactLocation) return exactLocation;

  const nearestKnownLocation = await getNearestKnownLocation(latitude, longitude);
  if (nearestKnownLocation) return nearestKnownLocation;

  return await buildLocation(latitude, longitude);
};

export const prayerLocationService = {
  async requestCurrentLocation(): Promise<PrayerLocationResult> {
    try {
      if (isNativeApp()) {
        const permissions = await Geolocation.requestPermissions();
        if (permissions.location === 'denied' || permissions.coarseLocation === 'denied') {
          return { location: null, errorKey: 'denied' };
        }

        let position;
        try {
          position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0,
          });
        } catch {
          position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: false,
            timeout: 20000,
            maximumAge: 0,
          });
        }

        return {
          location: await buildResolvedLocation(position.coords.latitude, position.coords.longitude),
          errorKey: null,
        };
      }

      if (!navigator.geolocation) {
        return { location: null, errorKey: 'unavailable' };
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      return {
        location: await buildResolvedLocation(position.coords.latitude, position.coords.longitude),
        errorKey: null,
      };
    } catch (error) {
      const code = typeof error === 'object' && error && 'code' in error ? Number((error as { code?: number }).code) : 0;
      if (code === 1) {
        return { location: null, errorKey: 'denied' };
      }
      return { location: null, errorKey: 'unavailable' };
    }
  },

  async searchLocations(query: string): Promise<PrayerLocationSearchResult[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(trimmed)}&addressdetails=1&limit=8&accept-language=en`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) return [];

      const payload = (await response.json()) as Array<{
        lat: string;
        lon: string;
        address?: Record<string, string | undefined>;
      }>;

      const promises = payload.map((item) => {
        const address = item.address || {};
        const label =
          address.city ||
          address.town ||
          address.village ||
          address.municipality ||
          address.county ||
          trimmed;
        const country = address.country || '';
        return buildCustomLocationFromSearch({
          label,
          country,
          latitude: Number(item.lat),
          longitude: Number(item.lon),
        });
      });

      return await Promise.all(promises);
    } catch {
      return [];
    }
  },
};