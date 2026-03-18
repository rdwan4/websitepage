import { CalculationMethod, Coordinates, Madhab, PrayerTimes, Qibla } from 'adhan';
import fixedPrayerDatasetIndexJson from '../data/fixedPrayerDatasetIndex.json';

export type Language = 'en' | 'ar';

export type PrayerKey = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type AzanChoice = 'raad-alkurdi' | 'besho-qadir' | 'omar-hashim' | 'ramadan-shakur';

export type PrayerLocation = {
  label: string;
  country: string;
  latitude: number;
  longitude: number;
  timeZone: string;
};

export type SavedPrayerSettings = {
  locationMode: 'gps' | 'manual';
  manualCityId: string;
  selectedAzan: AzanChoice;
  notificationLanguage: 'app' | 'en' | 'ar';
  reminderMinutes: number;
  allowFullPlayback: boolean;
  notificationsEnabled: boolean;
  smartRemindersEnabled: boolean;
  smartReminderMode: 'auto' | 'manual';
  smartReminderManualTime: string;
  prayerToggles: Record<PrayerKey, boolean>;
  customLocationLabel: string;
  customCountry: string;
  customLatitude: string;
  customLongitude: string;
  customTimeZone: string;
};

export type PrayerTimeMap = Record<PrayerKey, string>;

export const PRAYER_SETTINGS_KEY = 'prayer-page-settings';
export const PRAYER_GPS_LOCATION_KEY = 'prayer-page-gps-location';

export const DEFAULT_PRAYER_SETTINGS: SavedPrayerSettings = {
  locationMode: 'manual',
  manualCityId: 'baghdad',
  selectedAzan: 'raad-alkurdi',
  notificationLanguage: 'app',
  reminderMinutes: 0,
  allowFullPlayback: false,
  notificationsEnabled: true,
  smartRemindersEnabled: true,
  smartReminderMode: 'auto',
  smartReminderManualTime: '20:30',
  prayerToggles: {
    fajr: true,
    sunrise: false,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
  },
  customLocationLabel: '',
  customCountry: '',
  customLatitude: '',
  customLongitude: '',
  customTimeZone: '',
};

export const CITY_OPTIONS: Array<{ id: string; location: PrayerLocation }> = [
  { id: 'baghdad', location: { label: 'Baghdad', country: 'Iraq', latitude: 33.3152, longitude: 44.3661, timeZone: 'Asia/Baghdad' } },
  { id: 'erbil', location: { label: 'Erbil', country: 'Iraq', latitude: 36.1911, longitude: 44.0092, timeZone: 'Asia/Baghdad' } },
  { id: 'sulaymaniyah', location: { label: 'Sulaymaniyah', country: 'Iraq', latitude: 35.5613, longitude: 45.4302, timeZone: 'Asia/Baghdad' } },
  { id: 'mosul', location: { label: 'Mosul', country: 'Iraq', latitude: 36.34, longitude: 43.13, timeZone: 'Asia/Baghdad' } },
  { id: 'basra', location: { label: 'Basra', country: 'Iraq', latitude: 30.5085, longitude: 47.7804, timeZone: 'Asia/Baghdad' } },
  { id: 'kalak', location: { label: 'Kalak', country: 'Iraq', latitude: 36.115, longitude: 44.3256, timeZone: 'Asia/Baghdad' } },
  { id: 'makkah', location: { label: 'Makkah', country: 'Saudi Arabia', latitude: 21.3891, longitude: 39.8579, timeZone: 'Asia/Riyadh' } },
  { id: 'madinah', location: { label: 'Madinah', country: 'Saudi Arabia', latitude: 24.5247, longitude: 39.5692, timeZone: 'Asia/Riyadh' } },
  { id: 'istanbul', location: { label: 'Istanbul', country: 'Turkey', latitude: 41.0082, longitude: 28.9784, timeZone: 'Europe/Istanbul' } },
  { id: 'cairo', location: { label: 'Cairo', country: 'Egypt', latitude: 30.0444, longitude: 31.2357, timeZone: 'Africa/Cairo' } },
  { id: 'london', location: { label: 'London', country: 'United Kingdom', latitude: 51.5072, longitude: -0.1276, timeZone: 'Europe/London' } },
];

export const AZAN_OPTIONS: Array<{
  id: AzanChoice;
  label: { en: string; ar: string };
  reciter: { en: string; ar: string };
  fullSrc: string;
  clipSrc: string;
  androidSound: string;
  androidFullSound: string;
}> = [
  {
    id: 'raad-alkurdi',
    label: { en: 'Raad Al Kurdi', ar: 'رعد الكردي' },
    reciter: { en: 'Deep and resonant azan tone', ar: 'نبرة أذان عميقة ورنانة' },
    fullSrc: '/azan/raad-alkurdi.mp3',
    clipSrc: '/azan-clips/raad-alkurdi-notification.mp3',
    androidSound: 'raad_alkurdi_notification.mp3',
    androidFullSound: 'raad_alkurdi.mp3',
  },
  {
    id: 'besho-qadir',
    label: { en: 'Besho Qadir', ar: 'بيشو قادر' },
    reciter: { en: 'Balanced and clear azan tone', ar: 'نبرة أذان متوازنة وواضحة' },
    fullSrc: '/azan/besho-qadir.mp3',
    clipSrc: '/azan-clips/besho-qadir-notification.mp3',
    androidSound: 'besho_qadir_notification.mp3',
    androidFullSound: 'besho_qadir.mp3',
  },
  {
    id: 'omar-hashim',
    label: { en: 'Omar Hashim', ar: 'عمر هاشم' },
    reciter: { en: 'Soft and spiritual azan tone', ar: 'نبرة أذان هادئة وروحانية' },
    fullSrc: '/azan/omar-hashim.mp3',
    clipSrc: '/azan-clips/omar-hashim-notification.mp3',
    androidSound: 'omar_hashim_notification.mp3',
    androidFullSound: 'omar_hashim.mp3',
  },
  {
    id: 'ramadan-shakur',
    label: { en: 'Ramadan Shakur', ar: 'رمضان شكور' },
    reciter: { en: 'Short and calm azan tone', ar: 'نبرة أذان قصيرة وهادئة' },
    fullSrc: '/azan/ramadan-shakur.mp3',
    clipSrc: '/azan-clips/ramadan-shakur-notification.mp3',
    androidSound: 'ramadan_shakur_notification.mp3',
    androidFullSound: 'ramadan_shakur.mp3',
  },
];

type FixedLocationEntry = {
  id: number;
  name: string;
  countryCode: string;
  country: string;
  latitude: number;
  longitude: number;
  fixed: number;
  sourceId: number;
};

type FixedPrayerLocationsDataset = {
  locations: FixedLocationEntry[];
};

type FixedPrayerSourceTimes = Record<string, [string, string, string, string, string, string]>;

type FixedPrayerDatasetIndexEntry = {
  code: string;
  countries: string[];
};

const fixedPrayerDatasetIndex = fixedPrayerDatasetIndexJson as FixedPrayerDatasetIndexEntry[];
const prayerRegionLocationModules = import.meta.glob('../data/prayerRegions/*-locations.json');
const prayerRegionSourceModules = import.meta.glob('../data/prayerSources/*/*.json');
const fixedPrayerLocationPromises = new Map<string, Promise<FixedPrayerLocationsDataset>>();
const fixedPrayerSourcePromises = new Map<string, Promise<FixedPrayerSourceTimes>>();

const formatClock = (date: Date, timeZone: string) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

const buildCalculationParameters = (_location: PrayerLocation) => {
  const params = CalculationMethod.MuslimWorldLeague();
  params.madhab = Madhab.Shafi;
  return params;
};

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

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[`'’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const resolveCountryCode = (country: string) => {
  const normalizedCountry = normalize(country);
  const match = fixedPrayerDatasetIndex.find((entry) =>
    entry.countries.some((candidate) => normalize(candidate) === normalizedCountry)
  );

  return match?.code || null;
};

const loadFixedPrayerLocations = async (countryCode: string): Promise<FixedPrayerLocationsDataset | null> => {
  const modulePath = `../data/prayerRegions/${countryCode}-locations.json`;
  const importer = prayerRegionLocationModules[modulePath];
  if (!importer) return null;

  if (!fixedPrayerLocationPromises.has(countryCode)) {
    fixedPrayerLocationPromises.set(
      countryCode,
      importer().then((module: any) => module.default as FixedPrayerLocationsDataset)
    );
  }

  return fixedPrayerLocationPromises.get(countryCode)!;
};

const loadFixedPrayerSourceTimes = async (
  countryCode: string,
  sourceId: number
): Promise<FixedPrayerSourceTimes | null> => {
  const sourceKey = `${countryCode}:${sourceId}`;
  const modulePath = `../data/prayerSources/${countryCode}/${sourceId}.json`;
  const importer = prayerRegionSourceModules[modulePath];
  if (!importer) return null;

  if (!fixedPrayerSourcePromises.has(sourceKey)) {
    fixedPrayerSourcePromises.set(
      sourceKey,
      importer().then((module: any) => module.default as FixedPrayerSourceTimes)
    );
  }

  return fixedPrayerSourcePromises.get(sourceKey)!;
};

const getTimeZoneForCoordinates = async (latitude: number, longitude: number) => {
  try {
    const tzLookup = (await import('tz-lookup')).default;
    return tzLookup(latitude, longitude);
  } catch {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
};

const getMonthDayKey = (date: Date, timeZone: string) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.month}-${values.day}`;
};

const findFixedPrayerMatch = async (location: PrayerLocation) => {
  const countryCode = resolveCountryCode(location.country);
  if (!countryCode) return { countryCode: null, match: null };

  const fixedPrayerLocations = await loadFixedPrayerLocations(countryCode);
  if (!fixedPrayerLocations) return { countryCode: null, match: null };

  const normalizedLabel = normalize(location.label);
  const normalizedCountry = normalize(location.country);

  const exact = fixedPrayerLocations.locations.find((entry) => {
    const sameName = normalize(entry.name) === normalizedLabel;
    const sameCountry = !normalizedCountry || normalize(entry.country) === normalizedCountry;
    return sameName && sameCountry;
  });

  if (exact) {
    return { countryCode, match: exact };
  }

  const sameCountryEntries = fixedPrayerLocations.locations.filter((entry) =>
    !location.country || normalize(entry.country) === normalizedCountry
  );

  const nearest = (sameCountryEntries.length ? sameCountryEntries : fixedPrayerLocations.locations)
    .map((entry) => ({
      entry,
      distanceKm: getDistanceKm(location.latitude, location.longitude, entry.latitude, entry.longitude),
    }))
    .sort((left, right) => left.distanceKm - right.distanceKm)[0];

  if (!nearest || nearest.distanceKm > 80) {
    return { countryCode, match: null };
  }

  return { countryCode, match: nearest.entry };
};

const mapFixedTimes = (values: [string, string, string, string, string, string]): PrayerTimeMap => ({
  fajr: values[0],
  sunrise: values[1],
  dhuhr: values[2],
  asr: values[3],
  maghrib: values[4],
  isha: values[5],
});

export const parseMinutes = (clock: string) => {
  const [hours, minutes] = clock.split(':').map(Number);
  return hours * 60 + minutes;
};

export const formatDuration = (msRemaining: number, lang: Language, withSeconds = false) => {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (withSeconds) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  if (lang === 'ar') {
    return `${hours} س ${minutes} د`;
  }

  return `${hours}h ${minutes}m`;
};

export const getCustomLocation = async (
  settings: Pick<SavedPrayerSettings, 'customLocationLabel' | 'customCountry' | 'customLatitude' | 'customLongitude' | 'customTimeZone'>
): Promise<PrayerLocation | null> => {
  const latitude = Number(settings.customLatitude);
  const longitude = Number(settings.customLongitude);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  return {
    label: settings.customLocationLabel.trim() || 'Custom Location',
    country: settings.customCountry.trim(),
    latitude,
    longitude,
    timeZone: settings.customTimeZone.trim() || (await getTimeZoneForCoordinates(latitude, longitude)),
  };
};

export const getManualLocation = async (
  settings: Pick<SavedPrayerSettings, 'manualCityId' | 'customLocationLabel' | 'customCountry' | 'customLatitude' | 'customLongitude' | 'customTimeZone'>
) => {
  if (settings.manualCityId === 'custom') {
    return (await getCustomLocation(settings)) || CITY_OPTIONS[0].location;
  }

  return CITY_OPTIONS.find((city) => city.id === settings.manualCityId)?.location || CITY_OPTIONS[0].location;
};

export const buildCustomLocationFromSearch = async (params: {
  label: string;
  country: string;
  latitude: number;
  longitude: number;
}): Promise<PrayerLocation> => ({
  label: params.label,
  country: params.country,
  latitude: params.latitude,
  longitude: params.longitude,
  timeZone: await getTimeZoneForCoordinates(params.latitude, params.longitude),
});

export const computePrayerTimes = (date: Date, location: PrayerLocation): PrayerTimeMap => {
  const coordinates = new Coordinates(location.latitude, location.longitude);
  const params = buildCalculationParameters(location);
  const prayerTimes = new PrayerTimes(coordinates, date, params);

  return {
    fajr: formatClock(prayerTimes.fajr, location.timeZone),
    sunrise: formatClock(prayerTimes.sunrise, location.timeZone),
    dhuhr: formatClock(prayerTimes.dhuhr, location.timeZone),
    asr: formatClock(prayerTimes.asr, location.timeZone),
    maghrib: formatClock(prayerTimes.maghrib, location.timeZone),
    isha: formatClock(prayerTimes.isha, location.timeZone),
  };
};

export const computePrayerTimesAsync = async (date: Date, location: PrayerLocation): Promise<PrayerTimeMap> => {
  const { countryCode, match } = await findFixedPrayerMatch(location);
  const monthDay = getMonthDayKey(date, location.timeZone);

  if (countryCode && match) {
    const sourceTimes = await loadFixedPrayerSourceTimes(countryCode, match.sourceId);
    const fixedTimes = sourceTimes?.[monthDay];
    if (fixedTimes) {
      return mapFixedTimes(fixedTimes);
    }
  }

  return computePrayerTimes(date, location);
};

export const getQiblaBearing = (location: PrayerLocation) => {
  return Math.round(Qibla(new Coordinates(location.latitude, location.longitude)));
};