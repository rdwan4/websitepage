import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, Heart } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';
import { cn } from '../lib/utils';

export const NotificationReaderModal = ({ lang }: { lang: 'en' | 'ar' }) => {
  const { activeNotification, setActiveNotification } = useNotificationStore();

  if (!activeNotification) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setActiveNotification(null)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={cn(
            "relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-app-card shadow-2xl",
            "bg-gradient-to-b from-app-card to-app-bg"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-app-accent/10">
                <Heart className="h-5 w-5 text-app-accent" />
              </div>
              <h3 className="font-bold text-app-text">{activeNotification.title}</h3>
            </div>
            <button
              onClick={() => setActiveNotification(null)}
              className="rounded-full bg-white/5 p-2 text-app-muted transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-8">
            <p className="text-center text-lg leading-relaxed text-app-text/90">
              {activeNotification.body}
            </p>
          </div>

          {/* Footer */}
          <div className="bg-white/5 px-6 py-4">
            <button
              onClick={() => setActiveNotification(null)}
              className="w-full rounded-2xl bg-app-accent px-4 py-3 font-bold text-app-bg transition-transform active:scale-95"
            >
              {lang === 'ar' ? 'تمت القراءة' : 'Done Reading'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
