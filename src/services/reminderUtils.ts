import { Reminder, ReminderDayKey } from '../types';

const DAY_KEYS: ReminderDayKey[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const LEGACY_DAY_MAP: Record<string, ReminderDayKey> = {
  sunday: 'sunday',
  monday: 'monday',
  tuesday: 'tuesday',
  wednesday: 'wednesday',
  thursday: 'thursday',
  friday: 'friday',
  saturday: 'saturday',

  // Arabic labels (correct encoding)
  'الاحد': 'sunday',
  'الأحد': 'sunday',
  'الاثنين': 'monday',
  'الإثنين': 'monday',
  'الثلاثاء': 'tuesday',
  'الاربعاء': 'wednesday',
  'الأربعاء': 'wednesday',
  'الخميس': 'thursday',
  'الجمعة': 'friday',
  'السبت': 'saturday',

  // Mojibake fallback values from older saves
  'ø§ù„ø§ø­ø¯': 'sunday',
  'ø§ù„ø£ø­ø¯': 'sunday',
  'ø§ù„ø§ø«ù†ùšù†': 'monday',
  'ø§ù„ø¥ø«ù†ùšù†': 'monday',
  'ø§ù„ø«ù„ø§ø«ø§ø¡': 'tuesday',
  'ø§ù„ø§ø±ø¨ø¹ø§ø¡': 'wednesday',
  'ø§ù„ø£ø±ø¨ø¹ø§ø¡': 'wednesday',
  'ø§ù„ø®ù…ùšø³': 'thursday',
  'ø§ù„ø¬ù…ø¹ø©': 'friday',
  'ø§ù„ø³ø¨øª': 'saturday',
};

export const reminderDayKeys = DAY_KEYS;

export const normalizeReminderDay = (value: string): ReminderDayKey | null => {
  const key = value.trim().toLowerCase();
  return LEGACY_DAY_MAP[key] || null;
};

export const normalizeReminderDays = (days: string[]): ReminderDayKey[] => {
  const normalized = days
    .map(normalizeReminderDay)
    .filter((day): day is ReminderDayKey => Boolean(day));

  return [...new Set(normalized)];
};

export const getReminderDayLabel = (day: ReminderDayKey, lang: 'en' | 'ar') => {
  const labels: Record<ReminderDayKey, { en: string; ar: string }> = {
    sunday: { en: 'Sun', ar: 'الأحد' },
    monday: { en: 'Mon', ar: 'الاثنين' },
    tuesday: { en: 'Tue', ar: 'الثلاثاء' },
    wednesday: { en: 'Wed', ar: 'الأربعاء' },
    thursday: { en: 'Thu', ar: 'الخميس' },
    friday: { en: 'Fri', ar: 'الجمعة' },
    saturday: { en: 'Sat', ar: 'السبت' },
  };

  return labels[day][lang];
};

const getNextDayIndex = (targetDay: ReminderDayKey) => DAY_KEYS.indexOf(targetDay);

export const getNextReminderOccurrence = (reminder: Reminder, from = new Date()) => {
  const activeDays = normalizeReminderDays(reminder.days);
  if (!activeDays.length || !reminder.enabled) {
    return null;
  }

  const [hours, minutes] = reminder.time.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  for (let offset = 0; offset < 7; offset += 1) {
    const candidate = new Date(from);
    candidate.setDate(from.getDate() + offset);
    candidate.setHours(hours, minutes, 0, 0);

    const dayKey = DAY_KEYS[candidate.getDay()];
    if (!activeDays.includes(dayKey)) {
      continue;
    }

    if (candidate.getTime() > from.getTime()) {
      return candidate;
    }
  }

  const nextWeekDay = activeDays[0];
  const date = new Date(from);
  const currentDayIndex = date.getDay();
  const nextDayIndex = getNextDayIndex(nextWeekDay);
  const distance = (7 - currentDayIndex + nextDayIndex) % 7 || 7;
  date.setDate(date.getDate() + distance);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const getReminderNotificationKey = (reminderId: string, scheduledAt: Date) =>
  `reminder:${reminderId}:${scheduledAt.toISOString()}`;
