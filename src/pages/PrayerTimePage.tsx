import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { LocateFixed, MapPin, Settings2, Sparkles, Bell, BellOff, Clock3, Moon, Sun, Languages } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  computePrayerTimesAsync,
  computePrayerTimes,
  formatDuration,
  getManualLocation,
  parseMinutes,
  type Language,
  type PrayerKey,
  type PrayerLocation,
  type PrayerTimeMap,
  type SavedPrayerSettings,
  DEFAULT_PRAYER_SETTINGS,
} from '../lib/prayer';
import { isNativeApp } from '../lib/runtime';
import { cn } from '../lib/utils';
import { prayerLocationService } from '../services/prayerLocationService';
import { prayerSettingsService } from '../services/prayerSettingsService';
import { prayerNotificationService } from '../services/prayerNotificationService';

const labels = {
  en: {
    title: 'Prayer Time',
    nextPrayer: 'Next prayer',
    prayerTimes: 'Daily Schedule',
    location: 'Location',
    currentLocation: 'Use current location',
    openSettings: 'Settings',
    gpsDenied: 'GPS Denied',
    gpsUnavailable: 'GPS Unavailable',
    gpsActive: 'GPS Active',
    gpsSaved: 'GPS Saved',
    prayerNames: {
      fajr: 'Fajr',
      sunrise: 'Sunrise',
      dhuhr: 'Dhuhr',
      asr: 'Asr',
      maghrib: 'Maghrib',
      isha: 'Isha',
    } as Record<PrayerKey, string>,
    upcoming: 'Upnext',
    active: 'Now',
    passed: 'Done',
    remaining: 'Remaining',
    notifications: 'Adhan',
    on: 'On',
    off: 'Off',
  },
  ar: {
    title: 'مواقيت الصلاة',
    nextPrayer: 'الصلاة القادمة',
    prayerTimes: 'جدول الصلاة',
    location: 'الموقع',
    currentLocation: 'استخدم الموقع الحالي',
    openSettings: 'إعدادات',
    gpsDenied: 'تم رفض الإذن',
    gpsUnavailable: 'غير متاح',
    gpsActive: 'تم التفعيل',
    gpsSaved: 'موقع محفوظ',
    prayerNames: {
      fajr: 'الفجر',
      sunrise: 'الشروق',
      dhuhr: 'الظهر',
      asr: 'العصر',
      maghrib: 'المغرب',
      isha: 'العشاء',
    } as Record<PrayerKey, string>,
    upcoming: 'قادم',
    active: 'الآن',
    passed: 'انتهى',
    remaining: 'المتبقي',
    notifications: 'تنبيهات',
    on: 'مفعلة',
    off: 'معطلة',
  },
};

const formatDisplayTime = (clock: string, lang: Language) => {
  const [hours, minutes] = clock.split(':').map(Number);
  const normalizedHour = hours % 12 || 12;
  const suffix = lang === 'ar' ? (hours < 12 ? 'ص' : 'م') : hours < 12 ? 'AM' : 'PM';
  return `${normalizedHour}:${String(minutes).padStart(2, '0')} ${suffix}`;
};

export const PrayerTimePage = ({ lang, setLang, theme, toggleTheme }: { lang: Language, setLang?: any, theme?: any, toggleTheme?: any }) => {
  const t = labels[lang];
  const nativeApp = isNativeApp();
  const [settings, setSettings] = useState<SavedPrayerSettings>(DEFAULT_PRAYER_SETTINGS);
  const [gpsLocation, setGpsLocation] = useState<PrayerLocation | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimeMap | null>(null);
  const [activeLocation, setActiveLocation] = useState<PrayerLocation | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadInitialState = async () => {
      const [s, gps] = await Promise.all([prayerSettingsService.getSettings(), prayerSettingsService.getGpsLocation()]);
      setSettings(s);
      setGpsLocation(gps);
      setIsLoaded(true);
    };
    void loadInitialState();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const init = async () => {
      if (prayerTimes || !settings) return;
      const location = await getManualLocation(settings);
      const times = await computePrayerTimesAsync(new Date(), location);
      setPrayerTimes(times);
    };
    void init();
  }, [prayerTimes, settings]);

  useEffect(() => {
    const updateActiveLocation = async () => {
      const location = settings.locationMode === 'gps' && gpsLocation ? gpsLocation : await getManualLocation(settings);
      setActiveLocation(location);
    };
    void updateActiveLocation();
  }, [settings, gpsLocation]);

  useEffect(() => {
    if (!activeLocation) return;
    let isCancelled = false;
    void computePrayerTimesAsync(currentTime, activeLocation).then((res) => {
      if (!isCancelled) setPrayerTimes(res);
    });
    return () => { isCancelled = true; };
  }, [activeLocation, currentTime]);

  const prayerEntries = useMemo(() => {
    if (!prayerTimes) return null;
    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const nowSeconds = currentTime.getSeconds();
    const ordered = (Object.keys(prayerTimes) as PrayerKey[]).map((key) => ({
      key,
      time: prayerTimes[key],
      minutes: parseMinutes(prayerTimes[key]),
    }));
    const nextIndex = ordered.findIndex((entry) => entry.minutes > nowMinutes);
    const resolvedNextIndex = nextIndex === -1 ? 0 : nextIndex;
    const nextEntry = ordered[resolvedNextIndex];
    const nextTimeMinutes = nextIndex === -1 ? nextEntry.minutes + 1440 : nextEntry.minutes;
    const previousIndex = resolvedNextIndex === 0 ? ordered.length - 1 : resolvedNextIndex - 1;
    const previousEntry = ordered[previousIndex];
    const previousTimeMinutes = resolvedNextIndex === 0 ? previousEntry.minutes - 1440 : previousEntry.minutes;
    const progressRatio = Math.min(Math.max((nowMinutes - previousTimeMinutes) / Math.max(nextTimeMinutes - previousTimeMinutes, 1), 0), 1);

    // Calculate remaining time including current seconds
    const remainingMinutes = nextTimeMinutes - nowMinutes;
    const remainingMilliseconds = (remainingMinutes * 60 - nowSeconds) * 1000;

    return {
      ordered,
      nextPrayer: nextEntry.key,
      nextPrayerTime: nextEntry.time,
      countdown: formatDuration(remainingMilliseconds, lang, true),
      progressRatio,
    }
  }, [currentTime, lang, prayerTimes]);

  if (!prayerEntries || !activeLocation) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-app-card/70 px-5 py-3 text-sm text-app-muted backdrop-blur-md">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-app-accent/30 border-t-app-accent" />
          {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </div>
      </div>
    );
  }

  const toggleNotifications = async () => {
    const updated = { ...settings, notificationsEnabled: !settings.notificationsEnabled };
    setSettings(updated);
    await prayerSettingsService.saveSettings(updated);
    if (nativeApp) {
      if (updated.notificationsEnabled) {
        await prayerNotificationService.ensurePermissions();
        await prayerNotificationService.schedulePrayerNotifications({ settings: updated, prayerTimes, location: activeLocation, lang });
      } else {
        await prayerNotificationService.clearScheduledNotifications();
      }
    }
  };

  const requestLocation = async () => {
    const result = await prayerLocationService.requestCurrentLocation();
    if (result.location) {
      setGpsLocation(result.location);
      const updated = { ...settings, locationMode: 'gps' as const };
      setSettings(updated);
      await prayerSettingsService.saveGpsLocation(result.location);
      await prayerSettingsService.saveSettings(updated);
      window.dispatchEvent(new Event('prayer-settings-updated'));
    }
  };

  return (
    <div className={cn("min-h-screen bg-app-bg pb-24 px-4", nativeApp ? "pt-4" : "pt-44")}>
      <div className="container mx-auto max-w-6xl">

        {/* TOP BAR (Floating style) */}
        {nativeApp && (
          <div className={cn("flex items-center justify-between mb-6", lang === 'ar' && "flex-row-reverse")}>
             <div className="flex items-center gap-2">
                <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-xs font-black text-app-text shadow-sm active:scale-95 transition-all">
                   {lang === 'en' ? 'AR' : 'EN'}
                </button>
                <button onClick={toggleTheme} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-app-accent shadow-sm active:scale-95 transition-all">
                   {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </button>
             </div>
             <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg border border-white/5 bg-app-card/50 flex items-center justify-center p-1.5">
                   <img src="/favicon.svg" alt="App" className="h-full w-full object-contain" />
                </div>
             </div>
          </div>
        )}

        <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.02] p-6 shadow-2xl mb-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative h-48 w-44">
              <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
                <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                <motion.circle
                  cx="100" cy="100" r="85" fill="none" stroke="var(--app-accent)" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 85}
                  animate={{ strokeDashoffset: (1 - prayerEntries.progressRatio) * 2 * Math.PI * 85 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-app-accent tracking-widest">{t.nextPrayer}</p>
                    <p className="text-2xl font-bold text-app-text">{t.prayerNames[prayerEntries.nextPrayer]}</p>
                 </div>
              </div>
            </div>
            <div>
              <p className="text-[3.8rem] font-bold tracking-tighter leading-none">{prayerEntries.countdown}</p>
              <p className="text-sm font-bold text-app-muted mt-2">{formatDisplayTime(prayerEntries.nextPrayerTime, lang)}</p>
            </div>
          </div>
        </div>

        {/* PRAYER SCHEDULE HEADER with AZAN TOGGLE */}
        <div className={cn("mb-4 flex items-center justify-between", lang === 'ar' && "flex-row-reverse")}>
           <div className={cn("flex items-center gap-2", lang === 'ar' && "flex-row-reverse")}>
              <Clock3 className="h-5 w-5 text-app-accent" />
              <h2 className="text-lg font-black tracking-tight text-app-text">{t.prayerTimes}</h2>
           </div>

           <button
             onClick={() => void toggleNotifications()}
             className={cn(
               "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all shadow-md active:scale-95",
               settings.notificationsEnabled ? "bg-app-accent text-app-bg" : "bg-white/5 text-app-muted border border-white/10"
             )}
           >
             {settings.notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
             <span>{settings.notificationsEnabled ? t.on : t.off}</span>
           </button>
        </div>

        {/* 2-COLUMN GRID FOR PRAYER TIMES */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {prayerEntries.ordered.map((entry) => (
            <div key={entry.key} className={cn("flex items-center justify-between p-4 rounded-2xl border transition-all", entry.key === prayerEntries.nextPrayer ? "bg-app-accent/15 border-app-accent/40 shadow-lg shadow-app-accent/10" : "bg-white/[0.03] border-white/5")}>
              <span className={cn(
                "text-base font-black uppercase tracking-wide", // INCREASED FONT SIZE
                entry.key === prayerEntries.nextPrayer ? "text-app-accent" : "text-app-text"
              )}>
                {t.prayerNames[entry.key]}
              </span>
              <span className="text-[13px] font-bold opacity-90">{formatDisplayTime(entry.time, lang)}</span>
            </div>
          ))}
        </div>

        <section className="rounded-[2rem] border border-white/5 bg-app-card p-6 shadow-xl mb-10">
          <div className={cn("mb-5 flex items-center gap-3", lang === 'ar' && "flex-row-reverse")}>
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-app-accent/10 text-app-accent shadow-inner">
               <MapPin className="h-5 w-5" />
            </div>
            <div className={cn(lang === 'ar' && "text-right")}>
               <h2 className="font-bold text-sm text-app-text">{activeLocation.label}</h2>
               <p className="text-[10px] text-app-muted uppercase tracking-widest">{activeLocation.country}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
             <button onClick={() => requestLocation()} className="rounded-xl bg-white/5 border border-white/10 p-3.5 text-xs font-bold transition-all active:scale-95">Update GPS</button>
             <Link to="/prayer/settings" className="rounded-xl bg-app-accent text-app-bg p-3.5 text-xs font-bold text-center transition-all active:scale-95 shadow-lg shadow-app-accent/20">Settings</Link>
          </div>
        </section>
      </div>
    </div>
  );
};