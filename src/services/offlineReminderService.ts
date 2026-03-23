import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativeApp } from '../lib/runtime';
import { prayerSettingsService } from './prayerSettingsService';
import { supabase } from '../supabaseClient.js';
import { contentService } from './contentService';

export interface OfflineReminder {
  id: string | number;
  title_ar: string;
  title_en: string;
  text_ar: string;
  text_en: string;
}

const FALLBACK_HADITHS = [
  { id: 'fh1', title_ar: 'حديث نبوي', title_en: 'Hadith', text_ar: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ.', text_en: 'Actions are but by intentions.' },
  { id: 'fh2', title_ar: 'حديث نبوي', title_en: 'Hadith', text_ar: 'لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ.', text_en: 'None of you truly believes until he loves for his brother what he loves for himself.' }
];

const FALLBACK_DUAS = [
  { id: 'fd1', title_ar: 'دعاء من القرآن', title_en: 'Dua from Quran', text_ar: 'اللَّهُمَّ آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ.', text_en: 'Our Lord, give us in this world that which is good and in the Hereafter that which is good.' }
];

const OFFLINE_CHANNEL_ID = 'offline-reminders-v1';
export const LOCAL_WISDOM_ID_PREFIX = 8000; // 8000 = Today, 8001 = Tomorrow, etc.

export const offlineReminderService = {
  async init() {
    if (!isNativeApp()) return;
    try {
      await LocalNotifications.createChannel({
        id: OFFLINE_CHANNEL_ID,
        name: 'Daily Wisdom',
        description: 'Daily Hadith and Dua reminders',
        importance: 4,
        vibration: true,
      });
    } catch (e) {
      console.error('Failed to create offline channel:', e);
    }
  },

  async cancelToday() {
    if (!isNativeApp()) return;
    await LocalNotifications.cancel({ notifications: [{ id: LOCAL_WISDOM_ID_PREFIX }] });
  },

  async cancelDay(daysFromNow: number) {
    if (!isNativeApp()) return;
    await LocalNotifications.cancel({ notifications: [{ id: LOCAL_WISDOM_ID_PREFIX + daysFromNow }] });
  },

  async scheduleRandom(lang: 'en' | 'ar') {
    if (!isNativeApp()) return;

    const settings = await prayerSettingsService.getSettings();
    if (!settings.smartRemindersEnabled) {
      const idsToCancel = Array.from({ length: 14 }, (_, i) => ({ id: LOCAL_WISDOM_ID_PREFIX + i }));
      await LocalNotifications.cancel({ notifications: idsToCancel });
      return;
    }

    let targetHour = 11;
    let targetMinute = 0;
    if (settings.smartReminderMode === 'manual' && settings.smartReminderManualTime) {
      const [h, m] = settings.smartReminderManualTime.split(':').map(Number);
      targetHour = h;
      targetMinute = m;
    }

    // Fetch real content from Supabase
    let realHadiths: OfflineReminder[] = [];
    let realDuas: OfflineReminder[] = [];
    let realGuidance: OfflineReminder[] = [];

    try {
      const [{ items: hadiths }, { items: duas }, guidanceItems] = await Promise.all([
        contentService.getDailyCollection('hadith'),
        contentService.getDailyCollection('dua'),
        contentService.getGuidanceItems(true)
      ]);

      realHadiths = hadiths.map(h => ({ id: h.id, title_ar: h.title_ar || 'حديث نبوي', title_en: h.title || 'Hadith', text_ar: h.arabic_text || '', text_en: h.english_text }));
      realDuas = duas.map(d => ({ id: d.id, title_ar: d.title_ar || 'دعاء', title_en: d.title || 'Dua', text_ar: d.arabic_text || '', text_en: d.english_text }));
      realGuidance = guidanceItems.map(g => ({ id: g.id, title_ar: g.title_ar, title_en: g.title_en, text_ar: g.summary_ar || g.body_ar, text_en: g.summary_en || g.body_en }));
    } catch (e) {
      console.warn('Fallback to hardcoded wisdom due to fetch error:', e);
    }

    const notifications = [];
    const now = new Date();

    // Schedule for the next 14 days
    for (let i = 0; i < 14; i++) {
      let bank: OfflineReminder[];
      if (i % 3 === 0 && realHadiths.length) bank = realHadiths;
      else if (i % 3 === 1 && realDuas.length) bank = realDuas;
      else if (realGuidance.length) bank = realGuidance;
      else bank = i % 2 === 0 ? FALLBACK_HADITHS : FALLBACK_DUAS;

      const random = bank[Math.floor(Math.random() * bank.length)];
      if (!random) continue;

      const fireAt = new Date();
      fireAt.setDate(now.getDate() + i);
      fireAt.setHours(targetHour, targetMinute, 0, 0);

      // Skip if the time has already passed for today
      if (i === 0 && fireAt <= now) continue;

      notifications.push({
        id: LOCAL_WISDOM_ID_PREFIX + i,
        title: lang === 'ar' ? random.title_ar : random.title_en,
        body: lang === 'ar' ? random.text_ar : random.text_en,
        schedule: { at: fireAt, allowWhileIdle: true },
        channelId: OFFLINE_CHANNEL_ID,
        smallIcon: 'ic_launcher_foreground',
        extra: {
          notif_title: lang === 'ar' ? random.title_ar : random.title_en,
          notif_body: lang === 'ar' ? random.text_ar : random.text_en,
        },
      });
    }

    if (notifications.length) {
      await LocalNotifications.schedule({ notifications });
    }
  },

  async scheduleTest(lang: 'en' | 'ar') {
    if (!isNativeApp()) return;
    await this.init();
    const random = FALLBACK_HADITHS[0];
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 9991,
          title: lang === 'ar' ? 'تجربة حكمة اليوم (Offline)' : 'Daily Wisdom Test (Offline)',
          body: lang === 'ar' ? random.text_ar : random.text_en,
          schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true },
          channelId: OFFLINE_CHANNEL_ID,
          smallIcon: 'ic_launcher_foreground',
        }
      ]
    });
  }
};