import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Reminder, ReminderType } from '../types';
import { getReminderDayLabel, normalizeReminderDays, reminderDayKeys } from '../services/reminderUtils';

const translations = {
  en: {
    editReminder: 'Edit Reminder',
    addReminder: 'Add New Reminder',
    titleLabel: 'Title',
    descriptionLabel: 'Description',
    timeLabel: 'Time',
    typeLabel: 'Type',
    daysLabel: 'Days',
    enableReminder: 'Enable Reminder',
    cancel: 'Cancel',
    add: 'Add',
    update: 'Update',
    types: {
      prayer: 'Prayer',
      quran: 'Quran',
      dua: 'Dua',
      study: 'Study',
      general: 'General',
    },
  },
  ar: {
    editReminder: 'تعديل التذكير',
    addReminder: 'إضافة تذكير جديد',
    titleLabel: 'العنوان',
    descriptionLabel: 'الوصف',
    timeLabel: 'الوقت',
    typeLabel: 'النوع',
    daysLabel: 'الأيام',
    enableReminder: 'تفعيل التذكير',
    cancel: 'إلغاء',
    add: 'إضافة',
    update: 'تحديث',
    types: {
      prayer: 'صلاة',
      quran: 'قرآن',
      dua: 'دعاء',
      study: 'دراسة',
      general: 'عام',
    },
  },
};

export const ReminderModal = ({
  lang,
  onClose,
  onSave,
  reminder,
}: {
  lang: 'en' | 'ar';
  onClose: () => void;
  onSave: (reminder: Omit<Reminder, 'id' | 'user_id' | 'created_at'>) => void;
  reminder: Reminder | null;
}) => {
  const t = translations[lang];
  const [formData, setFormData] = useState({
    title: reminder?.title || '',
    description: reminder?.description || '',
    time: reminder?.time || '',
    type: reminder?.type || ('general' as ReminderType),
    days: normalizeReminderDays(reminder?.days || []),
    enabled: reminder?.enabled ?? true,
  });

  useEffect(() => {
    setFormData({
      title: reminder?.title || '',
      description: reminder?.description || '',
      time: reminder?.time || '',
      type: reminder?.type || ('general' as ReminderType),
      days: normalizeReminderDays(reminder?.days || []),
      enabled: reminder?.enabled ?? true,
    });
  }, [reminder]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-app-bg/80 backdrop-blur-xl" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={cn(
          'relative w-full max-w-md rounded-[3rem] border border-white/10 bg-app-card p-8 shadow-2xl',
          lang === 'ar' && 'text-right'
        )}
      >
        <button
          onClick={onClose}
          className={cn(
            'absolute top-6 rounded-full p-2 text-app-text/40 transition-all hover:bg-white/5 hover:text-app-text',
            lang === 'ar' ? 'left-6' : 'right-6'
          )}
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="mb-6 text-center text-2xl font-bold text-app-text">
          {reminder ? t.editReminder : t.addReminder}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-bold text-app-text">{t.titleLabel}</label>
            <input
              type="text"
              value={formData.title}
              onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-app-text focus:border-app-accent/50 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-app-text">{t.descriptionLabel}</label>
            <textarea
              value={formData.description}
              onChange={(event) =>
                setFormData((current) => ({ ...current, description: event.target.value }))
              }
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-app-text focus:border-app-accent/50 focus:outline-none"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-app-text">{t.timeLabel}</label>
              <input
                type="time"
                value={formData.time}
                onChange={(event) => setFormData((current) => ({ ...current, time: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-app-text focus:border-app-accent/50 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-app-text">{t.typeLabel}</label>
              <select
                value={formData.type}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, type: event.target.value as ReminderType }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-app-text focus:border-app-accent/50 focus:outline-none"
              >
                {Object.entries(t.types).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-bold text-app-text">{t.daysLabel}</label>
            <div className="grid grid-cols-4 gap-2">
              {reminderDayKeys.map((day) => {
                const active = formData.days.includes(day);

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() =>
                      setFormData((current) => ({
                        ...current,
                        days: active
                          ? current.days.filter((item) => item !== day)
                          : [...current.days, day],
                      }))
                    }
                    className={cn(
                      'rounded-lg border p-2 text-xs transition-all',
                      active
                        ? 'border-app-accent bg-app-accent text-app-bg'
                        : 'border-white/10 bg-white/5 text-app-text hover:bg-white/10'
                    )}
                  >
                    {getReminderDayLabel(day, lang)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-4">
            <label className="flex items-center gap-3 text-sm text-app-text">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, enabled: event.target.checked }))
                }
                className="h-4 w-4 rounded border border-white/10 bg-white/5"
              />
              {t.enableReminder}
            </label>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-app-text transition-all hover:bg-white/10"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="rounded-xl bg-app-accent px-6 py-3 font-bold text-app-bg transition-all hover:scale-105"
              >
                {reminder ? t.update : t.add}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};