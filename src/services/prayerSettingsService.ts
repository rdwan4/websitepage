import { Preferences } from '@capacitor/preferences';
import {
  DEFAULT_PRAYER_SETTINGS,
  PRAYER_GPS_LOCATION_KEY,
  PRAYER_SETTINGS_KEY,
  type PrayerLocation,
  type SavedPrayerSettings,
} from '../lib/prayer';

const parseJson = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
};

const PRAYER_LOCATION_PROMPTED_KEY = 'prayer-location-prompted';

export const prayerSettingsService = {
  async getSettings(): Promise<SavedPrayerSettings> {
    const { value } = await Preferences.get({ key: PRAYER_SETTINGS_KEY });
    return parseJson(value, DEFAULT_PRAYER_SETTINGS);
  },

  async saveSettings(settings: SavedPrayerSettings) {
    await Preferences.set({
      key: PRAYER_SETTINGS_KEY,
      value: JSON.stringify(settings),
    });
  },

  async getGpsLocation(): Promise<PrayerLocation | null> {
    const { value } = await Preferences.get({ key: PRAYER_GPS_LOCATION_KEY });
    if (!value) return null;
    try {
      return JSON.parse(value) as PrayerLocation;
    } catch {
      return null;
    }
  },

  async saveGpsLocation(location: PrayerLocation | null) {
    if (!location) {
      await Preferences.remove({ key: PRAYER_GPS_LOCATION_KEY });
      return;
    }
    await Preferences.set({
      key: PRAYER_GPS_LOCATION_KEY,
      value: JSON.stringify(location),
    });
  },

  async hasPromptedForLocation(): Promise<boolean> {
    const { value } = await Preferences.get({ key: PRAYER_LOCATION_PROMPTED_KEY });
    return value === 'true';
  },

  async markLocationPrompted() {
    await Preferences.set({
      key: PRAYER_LOCATION_PROMPTED_KEY,
      value: 'true',
    });
  },
};
