import { LocalNotifications, type Importance } from '@capacitor/local-notifications';
import {
  AZAN_OPTIONS,
  type Language,
  type PrayerKey,
  type PrayerLocation,
  type PrayerTimeMap,
  type SavedPrayerSettings,
} from '../lib/prayer';
import { isNativeApp } from '../lib/runtime';

const CHANNEL_PREFIX = 'prayer-azan-';
const CHANNEL_VERSION = 'v3';
const NOTIFICATION_ID_BASE = 4000;
const SCHEDULE_DAYS = 14;

const prayerLabels: Record<Language, Record<PrayerKey, string>> = {
  en: {
    fajr: 'Fajr',
    sunrise: 'Sunrise',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',
  },
  ar: {
    fajr: 'الفجر',
    sunrise: 'الشروق',
    dhuhr: 'الظهر',
    asr: 'العصر',
    maghrib: 'المغرب',
    isha: 'العشاء',
  },
};

const dayStartInTimeZone = (baseDate: Date, timeZone: string, dayOffset: number) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(baseDate);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const utcMidnight = new Date(Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day) + dayOffset, 0, 0, 0));
  const offsetFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const offsetParts = offsetFormatter.formatToParts(utcMidnight);
  const offsetMap = Object.fromEntries(offsetParts.map((part) => [part.type, part.value]));
  const zonedUtc = Date.UTC(
    Number(offsetMap.year),
    Number(offsetMap.month) - 1,
    Number(offsetMap.day),
    Number(offsetMap.hour),
    Number(offsetMap.minute),
    Number(offsetMap.second)
  );
  const offsetMs = zonedUtc - utcMidnight.getTime();
  return new Date(utcMidnight.getTime() - offsetMs);
};

const buildNotificationDate = (baseDate: Date, timeZone: string, clock: string, reminderMinutes: number) => {
  const [hours, minutes] = clock.split(':').map(Number);
  const midnight = dayStartInTimeZone(baseDate, timeZone, 0);
  return new Date(midnight.getTime() + ((hours * 60 + minutes - reminderMinutes + 1440) % 1440) * 60000);
};

const getChannelId = (soundId: string, fullPlayback: boolean) => `${CHANNEL_PREFIX}${soundId}-${fullPlayback ? 'full' : 'clip'}-${CHANNEL_VERSION}`;

export const prayerNotificationService = {
  async ensurePermissions() {
    if (!isNativeApp()) {
      return { granted: false, exactAlarm: false, nativeOnly: true };
    }

    const check = await LocalNotifications.checkPermissions();
    if (check.display !== 'granted') {
      const permission = await LocalNotifications.requestPermissions();
      const exact = await LocalNotifications.checkExactNotificationSetting();
      return {
        granted: permission.display === 'granted',
        exactAlarm: exact.exact_alarm === 'granted',
        nativeOnly: false,
      };
    }

    const exact = await LocalNotifications.checkExactNotificationSetting();
    return { granted: true, exactAlarm: exact.exact_alarm === 'granted', nativeOnly: false };
  },

  async promptExactAlarmSettings() {
    if (!isNativeApp()) return { exactAlarm: false, nativeOnly: true };
    const result = await LocalNotifications.changeExactNotificationSetting();
    return { exactAlarm: result.exact_alarm === 'granted', nativeOnly: false };
  },

  async configureChannels() {
    if (!isNativeApp()) return;

    const channels = AZAN_OPTIONS.flatMap(option => [
      {
        id: getChannelId(option.id, true),
        name: `${option.label.en} (Full)`,
        description: `${option.label.en} full azan reminders`,
        importance: 4 as Importance, // High
        sound: option.androidFullSound,
        vibration: true,
        lights: true,
      },
      {
        id: getChannelId(option.id, false),
        name: option.label.en,
        description: `${option.label.en} prayer reminders`,
        importance: 4 as Importance, // High
        sound: option.androidSound,
        vibration: true,
        lights: true,
      }
    ]);

    // Delete old channels
    const existingChannels = await LocalNotifications.listChannels();
    const channelsToDelete = existingChannels.channels.filter(c => c.id.startsWith(CHANNEL_PREFIX) && !channels.some(ch => ch.id === c.id));
    await Promise.all(channelsToDelete.map(c => LocalNotifications.deleteChannel({ id: c.id })));

    // Create new or update existing channels
    await Promise.all(channels.map(channel => LocalNotifications.createChannel(channel)));
  },

  async clearScheduledNotifications() {
    if (!isNativeApp()) return;
    const pending = await LocalNotifications.getPending();
    if (!pending.notifications.length) return;
    await LocalNotifications.cancel({ notifications: pending.notifications.map((item) => ({ id: item.id })) });
  },

  async schedulePrayerNotifications(params: {
    settings: SavedPrayerSettings;
    prayerTimes: PrayerTimeMap;
    location: PrayerLocation;
    lang: Language;
  }) {
    console.log('PNService: Scheduling start. Native:', isNativeApp());
    if (!isNativeApp()) return { scheduled: 0, nativeOnly: true };

    const { settings, prayerTimes, location, lang } = params;
    console.log('PNService: Params:', { 
      enabled: settings.notificationsEnabled, 
      azan: settings.selectedAzan, 
      location: location.label,
      reminder: settings.reminderMinutes
    });

    if (!settings.notificationsEnabled) {
      console.log('PNService: Notifications disabled, clearing.');
      await this.clearScheduledNotifications();
      return { scheduled: 0, nativeOnly: false };
    }

    try {
      console.log('PNService: Configuring channels...');
      await this.configureChannels();
      
      console.log('PNService: Clearing old notifications...');
      await this.clearScheduledNotifications();

      const now = new Date();
      const azan = AZAN_OPTIONS.find(x => x.id === settings.selectedAzan);
      const sound = azan ? (settings.allowFullPlayback ? azan.androidFullSound : azan.androidSound) : undefined;
      console.log('PNService: Sound to use:', sound);

      const notifications = (Object.keys(settings.prayerToggles) as PrayerKey[])
        .filter((prayerKey) => settings.prayerToggles[prayerKey])
        .flatMap((prayerKey, prayerIndex) => {
          const label = prayerLabels[lang][prayerKey];
          return Array.from({ length: SCHEDULE_DAYS }, (_, dayOffset) => {
            const targetDate = dayStartInTimeZone(now, location.timeZone, dayOffset);
            const prayerTime = prayerTimes[prayerKey];
            if (!prayerTime) return null;

            const fireAt = buildNotificationDate(targetDate, location.timeZone, prayerTime, settings.reminderMinutes);
            
            if (fireAt <= now) {
              // Only log if it's very close or suspicious
              return null;
            }

            const body = lang === 'ar'
              ? `${label} في ${location.label}${settings.reminderMinutes ? ` بعد ${settings.reminderMinutes} دقيقة` : ' الآن'}`
              : `${label} for ${location.label}${settings.reminderMinutes ? ` in ${settings.reminderMinutes} minutes` : ' now'}`;

            const notificationId = NOTIFICATION_ID_BASE + prayerIndex * 10 + dayOffset;
            const notifTitle = lang === 'ar' ? 'تذكير بالصلاة' : 'Prayer Reminder';

            return {
              id: notificationId,
              title: notifTitle,
              body,
              schedule: { at: fireAt, allowWhileIdle: true },
              channelId: getChannelId(settings.selectedAzan, settings.allowFullPlayback),
              smallIcon: 'ic_launcher_foreground',
              sound: sound,
              extra: {
                notif_title: notifTitle,
                notif_body: body,
              },
            };
          }).filter(Boolean);
        })
        .filter(Boolean);

      console.log(`PNService: Generated ${notifications.length} notifications.`);

      if (notifications.length) {
        await LocalNotifications.schedule({ notifications });
        console.log('PNService: Successfully scheduled.');
      }

      return { scheduled: notifications.length, nativeOnly: false };
    } catch (e) {
      console.error('PNService: Error in scheduling cascade:', e);
      return { scheduled: 0, error: e };
    }
  },

  async scheduleTestNotification(settings: SavedPrayerSettings, lang: Language) {
    if (!isNativeApp()) return { scheduled: false, nativeOnly: true };

    // 1. Force Permission Check
    const permission = await this.ensurePermissions();
    if (!permission.granted) {
      return { scheduled: false, nativeOnly: false, error: 'Permission denied' };
    }

    // 2. Force Channel Creation
    await this.configureChannels();

    const azan = AZAN_OPTIONS.find(x => x.id === settings.selectedAzan);
    if (!azan) {
      return { scheduled: false, nativeOnly: false, error: 'Azan not found' };
    }

    const sound = settings.allowFullPlayback ? azan.androidFullSound : azan.androidSound;

    // 3. Schedule for 5 seconds from now (Faster testing)
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 9999,
            title: lang === 'ar' ? 'تجربة الأذان' : 'Adhan Test',
            body: lang === 'ar' ? 'سيعمل صوت الأذان الآن.' : 'Adhan sound should play now.',
            schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true },
            channelId: getChannelId(settings.selectedAzan, settings.allowFullPlayback),
            sound,
            smallIcon: 'ic_launcher_foreground',
          },
        ],
      });
      return { scheduled: true, nativeOnly: false };
    } catch (e) {
      console.error('Test notification failed:', e);
      return { scheduled: false, nativeOnly: false, error: 'Schedule failed' };
    }
  },
};
