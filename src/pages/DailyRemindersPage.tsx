import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Clock,
  Edit,
  Loader2,
  LocateFixed,
  MapPin,
  Moon,
  Plus,
  Search,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { contentService } from '../services/contentService';
import { postService } from '../services/postService';
import {
  getReminderDayLabel,
  getNextReminderOccurrence,
  normalizeReminderDays,
  reminderDayKeys,
} from '../services/reminderUtils';
import { useAuth } from '../context/AuthContext';
import { DailyContentSet, Reminder, ReminderType } from '../types';
import { ReminderModal } from '../components/ReminderModal.tsx';

const translations = {
  en: {
    back: 'Back to Home',
    title: 'My Daily Reminders',
    subtitle: 'Create and schedule custom reminders for prayer, study, or any other activity to stay on track.',
    addReminder: 'Add New Reminder',
    verseOfTheDay: 'Verse of the Day',
    quickStats: 'Quick Stats',
    totalReminders: 'Total Reminders',
    active: 'Active',
    myReminders: 'My Reminders',
    createFirst: "You don't have any reminders yet. Create one to get started!",
    authNeeded: 'Please sign in to view and manage your reminders.',
    searchPlaceholder: 'Search reminders...',
    filterByType: 'Filter by type',
    types: {
      prayer: 'Prayer',
      quran: 'Quran',
      dua: 'Dua',
      study: 'Study',
      general: 'General',
    },
    upcoming: 'Next up',
    noReminders: 'No Reminders Here',
    editReminder: 'Edit Reminder',
    titleLabel: 'Title',
    descriptionLabel: 'Description',
    timeLabel: 'Time',
    typeLabel: 'Type',
    daysLabel: 'Days',
    enableReminder: 'Enable Reminder',
    cancel: 'Cancel',
    add: 'Add',
    update: 'Update',
    fetchError: 'An error occurred while fetching reminders.',
    deleteError: 'An error occurred while deleting the reminder.',
    saveError: 'An error occurred while saving the reminder.',
    notifications: 'Notifications',
    enableNotifications: 'Enable Notifications',
    notificationsEnabled: 'Notifications are enabled.',
    notificationsDenied: 'Notifications are disabled. Please enable them in your browser settings.',
    notificationsPrompt: 'Enable notifications to receive timely reminders.',
  },
  ar: {
    back: 'العودة إلى الرئيسية',
    title: 'تذكيراتي اليومية',
    subtitle: 'أنشئ وجدولة تذكيرات مخصصة للصلاة، الدراسة، أو أي نشاط آخر للبقاء على المسار الصحيح.',
    addReminder: 'إضافة تذكير جديد',
    verseOfTheDay: 'آية اليوم',
    quickStats: 'إحصائيات سريعة',
    totalReminders: 'مجموع التذكيرات',
    active: 'نشط',
    myReminders: 'تذكيراتي',
    createFirst: 'ليس لديك أي تذكيرات بعد. أنشئ واحدة لتبدأ!',
    authNeeded: 'يرجى تسجيل الدخول لعرض وإدارة تذكيراتك.',
    searchPlaceholder: 'البحث في التذكيرات...',
    filterByType: 'تصفية حسب النوع',
    types: {
      prayer: 'صلاة',
      quran: 'قرآن',
      dua: 'دعاء',
      study: 'دراسة',
      general: 'عام',
    },
    upcoming: 'القادم',
    noReminders: 'لا توجد تذكيرات هنا',
    editReminder: 'تعديل التذكير',
    titleLabel: 'العنوان',
    descriptionLabel: 'الوصف',
    timeLabel: 'الوقت',
    typeLabel: 'النوع',
    daysLabel: 'الأيام',
    enableReminder: 'تفعيل التذكير',
    cancel: 'إلغاء',
    add: 'إضافة',
    update: 'تحديث',
    fetchError: 'حدث خطأ أثناء جلب التذكيرات.',
    deleteError: 'حدث خطأ أثناء حذف التذكير.',
    saveError: 'حدث خطأ أثناء حفظ التذكير.',
    notifications: 'الإشعارات',
    enableNotifications: 'تفعيل الإشعارات',
    notificationsEnabled: 'تم تفعيل الإشعارات.',
    notificationsDenied: 'تم تعطيل الإشعارات. يرجى تفعيلها من إعدادات المتصفح.',
    notificationsPrompt: 'فعل الإشعارات لتلقي التذكيرات في الوقت المناسب.',
  },
};



const getNotificationState = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported' as const;
  }

  return Notification.permission;
};

export const DailyRemindersPage = ({
  lang,
  onAuthClick,
}: {
  lang: 'en' | 'ar';
  onAuthClick: () => void;
}) => {
  const { profile } = useAuth();
  const t = translations[lang];
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [verseOfTheDay, setVerseOfTheDay] = useState<DailyContentSet | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notificationState, setNotificationState] = useState(getNotificationState());

  useEffect(() => {
    const fetchVerse = async () => {
      try {
        const verse = await contentService.getDailyCollection('inspiration');
        if (verse) {
          setVerseOfTheDay(verse);
        }
      } catch (error) {
        console.error("Failed to fetch verse of the day", error);
      }
    };

    fetchVerse();
  }, []);



  useEffect(() => {
    const fetchReminders = async () => {
      if (!profile) {
        setReminders([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const data = await postService.getReminders(profile.id);
        const normalized = data.map((reminder) => ({
          ...reminder,
          days: normalizeReminderDays(reminder.days),
        }));
        setReminders(normalized);
      } catch (fetchError: any) {
        setError(fetchError.message || t.fetchError);
      } finally {
        setLoading(false);
      }
    };

    void fetchReminders();
  }, [profile, t.fetchError]);

  const filteredReminders = useMemo(() => {
    return reminders.filter((reminder) => {
      const matchesSearch =
        reminder.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reminder.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || reminder.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [filterType, reminders, searchQuery]);

  const requestNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationState('unsupported');
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationState(permission);
  };

  const broadcastReminderUpdate = () => {
    window.dispatchEvent(new Event('reminders-updated'));
  };

  const toggleReminder = async (id: string) => {
    const reminder = reminders.find((item) => item.id === id);
    if (!reminder) return;

    try {
      const updated = await postService.updateReminder(id, {
        enabled: !reminder.enabled,
      });
      setReminders((current) =>
        current.map((item) => (item.id === id ? { ...updated, days: normalizeReminderDays(updated.days) } : item))
      );
      broadcastReminderUpdate();
    } catch (toggleError) {
      console.error('Error toggling reminder:', toggleError);
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      await postService.deleteReminder(id);
      setReminders((current) => current.filter((item) => item.id !== id));
      broadcastReminderUpdate();
    } catch (deleteError) {
      setError(t.deleteError);
      console.error('Error deleting reminder:', deleteError);
    }
  };

  const saveReminder = async (reminderData: Omit<Reminder, 'id' | 'user_id' | 'created_at'>) => {
    if (!profile) return;

    try {
      if (editingReminder) {
        const updated = await postService.updateReminder(editingReminder.id, reminderData);
        setReminders((current) =>
          current.map((item) =>
            item.id === editingReminder.id ? { ...updated, days: normalizeReminderDays(updated.days) } : item
          )
        );
      } else {
        const created = await postService.createReminder({
          ...reminderData,
          user_id: profile.id,
        });
        setReminders((current) => [{ ...created, days: normalizeReminderDays(created.days) }, ...current]);
      }

      setShowModal(false);
      setEditingReminder(null);
      broadcastReminderUpdate();
    } catch (saveError) {
      setError(t.saveError);
      console.error('Error saving reminder:', saveError);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg pt-32 pb-20">
      <div className="container mx-auto px-6">
        <div
          className={cn(
            'mb-16 flex flex-col justify-between gap-8 md:flex-row md:items-center',
            lang === 'ar' && 'md:flex-row-reverse text-right'
          )}
        >
          <div className="max-w-3xl">
            <Link
              to="/"
              className={cn(
                'group mb-6 inline-flex items-center gap-2 text-app-accent hover:underline',
                lang === 'ar' && 'flex-row-reverse'
              )}
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              {t.back}
            </Link>
            <h1 className="mb-6 font-serif text-6xl leading-tight text-app-text md:text-7xl">{t.title}</h1>
            <p className="text-xl leading-relaxed text-app-muted">{t.subtitle}</p>
          </div>

          <button
            onClick={() => (profile ? setShowModal(true) : onAuthClick())}
            className="flex items-center justify-center gap-3 rounded-2xl bg-app-accent px-8 py-4 text-sm font-bold uppercase tracking-widest text-app-bg shadow-xl shadow-app-accent/20 transition-all hover:scale-105"
          >
            <Plus className="h-5 w-5" />
            {t.addReminder}
          </button>
        </div>

        <div className="mb-8 rounded-2xl border border-white/10 bg-app-card p-6">
          <h3 className="mb-4 text-xl font-bold">{t.notifications}</h3>
          {notificationState === 'granted' && (
            <p className="text-sm text-green-400">{t.notificationsEnabled}</p>
          )}
          {notificationState === 'denied' && (
            <p className="text-sm text-red-400">{t.notificationsDenied}</p>
          )}
          {notificationState === 'default' && (
            <div>
              <p className="mb-4 text-sm text-app-muted">{t.notificationsPrompt}</p>
              <button
                onClick={requestNotifications}
                className="rounded-xl bg-app-accent px-6 py-3 font-bold text-app-bg transition-all hover:scale-105"
              >
                {t.enableNotifications}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-1">
            {verseOfTheDay && verseOfTheDay.items.length > 0 && (
              <div className="rounded-[3rem] border border-white/10 bg-app-card p-8 shadow-xl">
                <h3 className="mb-6 text-xl font-bold text-app-text">{t.verseOfTheDay}</h3>
                <p className="mb-4 text-lg text-app-text">{verseOfTheDay.items[0].english_text}</p>
                <p className="text-sm text-app-muted">{verseOfTheDay.items[0].source_reference}</p>
              </div>
            )}

            <div className="rounded-[3rem] border border-white/10 bg-app-card p-8 shadow-xl">
              <h3 className="mb-6 text-xl font-bold text-app-text">{t.quickStats}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/5 p-4 text-center">
                  <div className="text-2xl font-bold text-app-accent">{reminders.length}</div>
                  <div className="text-xs text-app-muted">{t.totalReminders}</div>
                </div>
                <div className="rounded-2xl bg-white/5 p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {reminders.filter((reminder) => reminder.enabled).length}
                  </div>
                  <div className="text-xs text-app-muted">{t.active}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-[3rem] border border-white/10 bg-app-card p-8 shadow-xl">
              <div
                className={cn(
                  'mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-center',
                  lang === 'ar' && 'md:flex-row-reverse'
                )}
              >
                <div>
                  <h3 className="mb-2 text-2xl font-bold text-app-text">{t.myReminders}</h3>
                  <p className="text-sm text-app-muted">{profile ? t.createFirst : t.authNeeded}</p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="relative">
                    <Search
                      className={cn(
                        'absolute top-1/2 h-5 w-5 -translate-y-1/2 text-app-muted',
                        lang === 'ar' ? 'right-4' : 'left-4'
                      )}
                    />
                    <input
                      type="text"
                      placeholder={t.searchPlaceholder}
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className={cn(
                        'w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-sm text-app-text transition-all focus:border-app-accent/50 focus:outline-none',
                        lang === 'ar' ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4'
                      )}
                    />
                  </div>

                  <select
                    value={filterType}
                    onChange={(event) => setFilterType(event.target.value)}
                    className={cn(
                      'rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-app-text focus:border-app-accent/50 focus:outline-none',
                      lang === 'ar' && 'text-right'
                    )}
                  >
                    <option value="all">{t.filterByType}</option>
                    {Object.entries(t.types).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-24 animate-pulse rounded-2xl bg-white/5" />
                  ))}
                </div>
              ) : filteredReminders.length > 0 && profile ? (
                <div className="space-y-4">
                  {filteredReminders.map((reminder, index) => {
                    const nextOccurrence = getNextReminderOccurrence(reminder);

                    return (
                      <motion.div
                        key={reminder.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="rounded-2xl border border-white/10 bg-white/5 p-6 transition-all hover:border-app-accent/30"
                      >
                        <div
                          className={cn(
                            'flex flex-col justify-between gap-4 lg:flex-row lg:items-center',
                            lang === 'ar' && 'lg:flex-row-reverse'
                          )}
                        >
                          <div className="flex-1">
                            <div
                              className={cn(
                                'mb-2 flex items-center gap-3',
                                lang === 'ar' && 'flex-row-reverse'
                              )}
                            >
                              <span className="rounded-full bg-app-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-app-accent">
                                {t.types[reminder.type]}
                              </span>
                              <span className="text-sm text-app-muted">{reminder.time}</span>
                            </div>

                            <h4 className="mb-2 text-lg font-bold text-app-text">{reminder.title}</h4>
                            <p className="mb-4 text-sm text-app-muted">{reminder.description}</p>

                            <div className={cn('mb-3 flex flex-wrap gap-2', lang === 'ar' && 'flex-row-reverse')}>
                              {normalizeReminderDays(reminder.days).map((day) => (
                                <span
                                  key={`${reminder.id}-${day}`}
                                  className="rounded-lg bg-white/10 px-2 py-1 text-xs text-app-muted"
                                >
                                  {getReminderDayLabel(day, lang)}
                                </span>
                              ))}
                            </div>

                            {nextOccurrence && (
                              <div className="text-xs text-app-muted">
                                {t.upcoming}: {nextOccurrence.toLocaleString()}
                              </div>
                            )}
                          </div>

                          <div className={cn('flex items-center gap-3', lang === 'ar' && 'flex-row-reverse')}>
                            <button
                              onClick={() => void toggleReminder(reminder.id)}
                              className={cn(
                                'rounded-lg p-2 transition-all',
                                reminder.enabled
                                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                              )}
                            >
                              <CheckCircle2 className="h-5 w-5" />
                            </button>

                            <button
                              onClick={() => {
                                setEditingReminder(reminder);
                                setShowModal(true);
                              }}
                              className="p-2 text-app-muted transition-colors hover:text-app-accent"
                            >
                              <Edit className="h-5 w-5" />
                            </button>

                            <button
                              onClick={() => void deleteReminder(reminder.id)}
                              className="p-2 text-app-muted transition-colors hover:text-red-400"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center">
                  <Bell className="mx-auto mb-6 h-16 w-16 text-app-muted opacity-20" />
                  <h3 className="mb-2 text-xl font-bold text-app-text">{t.noReminders}</h3>
                  <p className="text-app-muted">{profile ? t.createFirst : t.authNeeded}</p>
                  {profile && (
                    <button
                      onClick={() => setShowModal(true)}
                      className="mt-4 rounded-xl bg-app-accent px-6 py-3 font-bold text-app-bg transition-all hover:scale-105"
                    >
                      {t.addReminder}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <ReminderModal
          lang={lang}
          reminder={editingReminder}
          onClose={() => {
            setShowModal(false);
            setEditingReminder(null);
          }}
          onSave={saveReminder}
        />
      )}
    </div>
  );
};
