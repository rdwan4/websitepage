import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { postService } from '../services/postService';
import {
  getNextReminderOccurrence,
  getReminderNotificationKey,
} from '../services/reminderUtils';

const RESCHEDULE_INTERVAL_MS = 60 * 1000;

const showReminderNotification = async (title: string, body: string) => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `reminder-${title}`,
      });
      return;
    } catch (error) {
      console.warn('Service worker notification failed, falling back to Notification API.', error);
    }
  }

  new Notification(title, { body });
};

export const ReminderScheduler = () => {
  const { profile } = useAuth();

  useEffect(() => {
    if (!profile || typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    let cancelled = false;
    const timers: number[] = [];
    let intervalId: number | null = null;

    const clearTimers = () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.length = 0;
    };

    const registerServiceWorker = async () => {
      if (!('serviceWorker' in navigator)) {
        return;
      }

      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    };

    const scheduleNotifications = async () => {
      try {
        if (cancelled || Notification.permission !== 'granted') {
          return;
        }

        const reminders = await postService.getReminders(profile.id);
        if (cancelled) {
          return;
        }

        clearTimers();

        reminders
          .filter((reminder) => reminder.enabled)
          .forEach((reminder) => {
            const nextOccurrence = getNextReminderOccurrence(reminder, new Date());
            if (!nextOccurrence) {
              return;
            }

            const notificationKey = getReminderNotificationKey(reminder.id, nextOccurrence);
            if (window.localStorage.getItem(notificationKey)) {
              return;
            }

            const delay = Math.max(1000, nextOccurrence.getTime() - Date.now());
            const timer = window.setTimeout(() => {
              if (Notification.permission !== 'granted') {
                return;
              }

              window.localStorage.setItem(notificationKey, 'sent');
              void showReminderNotification(reminder.title, reminder.description || reminder.time);

              // Schedule the next upcoming occurrence after firing.
              void scheduleNotifications();
            }, delay);

            timers.push(timer);
          });
      } catch (error) {
        console.error('Failed to schedule reminders:', error);
      }
    };

    void registerServiceWorker();

    const refreshSchedules = () => {
      if (Notification.permission === 'granted') {
        void scheduleNotifications();
      }
    };

    refreshSchedules();

    intervalId = window.setInterval(refreshSchedules, RESCHEDULE_INTERVAL_MS);

    window.addEventListener('reminders-updated', refreshSchedules);
    window.addEventListener('focus', refreshSchedules);
    document.addEventListener('visibilitychange', refreshSchedules);

    return () => {
      cancelled = true;
      clearTimers();
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      window.removeEventListener('reminders-updated', refreshSchedules);
      window.removeEventListener('focus', refreshSchedules);
      document.removeEventListener('visibilitychange', refreshSchedules);
    };
  }, [profile?.id]);

  return null;
};

