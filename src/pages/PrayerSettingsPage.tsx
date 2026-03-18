import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  Play,
  Search,
  MapPin,
  Volume2,
  Navigation,
  Mic2,
  Bell,
  Loader2,
  Info,
  Smartphone,
  Sparkles,
  ChevronDown,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AZAN_OPTIONS,
  CITY_OPTIONS,
  DEFAULT_PRAYER_SETTINGS,
  computePrayerTimesAsync,
  computePrayerTimes,
  getManualLocation,
  type AzanChoice,
  type Language,
  type PrayerKey,
  type PrayerLocation,
  type PrayerTimeMap,
  type SavedPrayerSettings,
} from '../lib/prayer';
import { isNativeApp } from '../lib/runtime';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { prayerLocationService } from '../services/prayerLocationService';
import { prayerNotificationService } from '../services/prayerNotificationService';
import { prayerSettingsService } from '../services/prayerSettingsService';
import { offlineReminderService } from '../services/offlineReminderService';

const labels = {
  en: {
    title: 'Prayer Settings',
    subtitle: 'Manage your location and adhan alerts',
    back: 'Back',
    locationSection: 'Location',
    locationDesc: 'Set your city to get accurate prayer times.',
    alertsSection: 'Prayer Alerts',
    alertsDesc: 'Choose which prayers you want to be notified for.',
    remindersSection: 'Daily Reminders',
    remindersDesc: 'Get daily wisdom and duas on your phone.',
    soundSection: 'Adhan Voice',
    soundDesc: 'Select the voice for your prayer notifications.',
    currentLocation: 'Use My GPS',
    currentLocationDesc: 'Detect your location automatically.',
    chooseCity: 'Select City',
    searchCity: 'Search City',
    searchHint: 'Type city name...',
    noSearchResults: 'No cities found.',
    notificationsEnabled: 'Adhan Notifications',
    smartRemindersEnabled: 'Daily Wisdom Alerts',
    smartReminderMode: 'Reminder Time',
    smartModeAuto: 'Automatic',
    smartModeManual: 'Custom Time',
    smartManualTime: 'Set Time',
    reminderMinutes: 'Alert timing',
    reminderMinutesDesc: 'Minutes before actual prayer time.',
    testAlarm: 'Test Adhan Now',
    testAlarmDesc: 'Sends a notification in 5 seconds.',
    testOffline: 'Test Offline Wisdom',
    testOfflineDesc: 'Sends a Hadith/Dua in 5 seconds.',
    exactSettings: 'System Settings',
    exactSettingsDesc: 'Open Android notification priority.',
    chooseAzan: 'Select',
    preview: 'Listen',
    selected: 'Active',
    minutes: 'min',
    prayerNames: {
      fajr: 'Fajr',
      sunrise: 'Sunrise',
      dhuhr: 'Dhuhr',
      asr: 'Asr',
      maghrib: 'Maghrib',
      isha: 'Isha',
    } as Record<PrayerKey, string>,
  },
  ar: {
    title: 'إعدادات الصلاة',
    subtitle: 'تحكم في الموقع وتنبيهات الأذان',
    back: 'رجوع',
    locationSection: 'الموقع',
    locationDesc: 'حدد مدينتك للحصول على مواقيت صلاة دقيقة.',
    alertsSection: 'تنبيهات الصلاة',
    alertsDesc: 'اختر الصلوات التي تريد استلام تنبيه لها.',
    remindersSection: 'تذكيرات يومية',
    remindersDesc: 'احصل على حكم وأذكار يومية على هاتفك.',
    soundSection: 'صوت الأذان',
    soundDesc: 'اختر المؤذن المفضل لتنبيهات الصلاة.',
    currentLocation: 'موقعي الحالي (GPS)',
    currentLocationDesc: 'تحديد موقعك تلقائياً عبر القمر الصناعي.',
    chooseCity: 'اختر مدينة',
    searchCity: 'بحث عن مدينة',
    searchHint: 'اكتب اسم المدينة...',
    noSearchResults: 'لم يتم العثور على نتائج.',
    notificationsEnabled: 'تفعيل صوت الأذان',
    notificationLanguage: 'لغة التنبيهات',
    useAppLanguage: 'تلقائي',
    forceArabic: 'العربية',
    forceEnglish: 'الإنجليزية',
    smartRemindersEnabled: 'تنبيهات الحكمة اليومية',
    smartReminderMode: 'وقت التذكير',
    smartModeAuto: 'تلقائي',
    smartModeManual: 'وقت مخصص',
    smartManualTime: 'ضبط الوقت',
    lastSyncLabel: 'آخر مزامنة',
    reminderMinutes: 'توقيت التنبيه',
    reminderMinutesDesc: 'عدد الدقائق قبل دخول وقت الصلاة.',
    testAlarm: 'تجربة الأذان الآن',
    testAlarmDesc: 'سيرسل تنبيهاً تجريبياً بعد 5 ثوانٍ.',
    testOffline: 'تجربة حكمة اليوم',
    testOfflineDesc: 'سيرسل حديثاً/دعاءً بعد 5 ثوانٍ.',
    exactSettings: 'إعدادات النظام',
    exactSettingsDesc: 'فتح إعدادات إشعارات الأندرويد.',
    chooseAzan: 'تفعيل',
    preview: 'استماع',
    selected: 'مفعل',
    minutes: 'دقيقة',
    prayerNames: {
      fajr: 'الفجر',
      sunrise: 'الشروق',
      dhuhr: 'الظهر',
      asr: 'العصر',
      maghrib: 'المغرب',
      isha: 'العشاء',
    } as Record<PrayerKey, string>,
  },
};

const SectionHeader = ({ title, subtitle, icon: Icon, lang }: { title: string; subtitle: string; icon: any; lang: string }) => (
  <div className={cn("mb-6 flex items-start gap-4", lang === 'ar' && "flex-row-reverse text-right")}>
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-app-accent/10 text-app-accent border border-app-accent/20 shadow-inner">
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <h2 className="text-xl font-bold text-app-text tracking-tight">{title}</h2>
      <p className="text-sm text-app-muted leading-relaxed">{subtitle}</p>
    </div>
  </div>
);

const SettingBlock = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("rounded-3xl border border-white/5 bg-white/[0.02] p-5 sm:p-6", className)}>
    {children}
  </div>
);

export const PrayerSettingsPage = ({ lang }: { lang: Language }) => {
  const t = (labels[lang] || labels.en) as any;
  const { profile, user } = useAuth();
  const [settings, setSettings] = useState<SavedPrayerSettings>(DEFAULT_PRAYER_SETTINGS);
  const [gpsLocation, setGpsLocation] = useState<PrayerLocation | null>(null);
  const [previewAzan, setPreviewAzan] = useState<(typeof AZAN_OPTIONS)[0] | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PrayerLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimeMap | null>(null);
  const [activeLocation, setActiveLocation] = useState<PrayerLocation | null>(null);

  useEffect(() => {
    const loadInitialState = async () => {
      const [savedSettings, savedGpsLocation] = await Promise.all([
        prayerSettingsService.getSettings(),
        prayerSettingsService.getGpsLocation(),
      ]);
      setSettings(savedSettings);
      setGpsLocation(savedGpsLocation);
      setIsLoaded(true);
    };
    void loadInitialState();
  }, []);

  useEffect(() => {
    const init = async () => {
      if (prayerTimes) return;
      const location = await getManualLocation(DEFAULT_PRAYER_SETTINGS);
      const times = computePrayerTimes(new Date(), location);
      setPrayerTimes(times);
    };
    void init();
  }, [prayerTimes]);

  useEffect(() => {
    if (!isLoaded) return;
    void prayerSettingsService.saveSettings(settings);
  }, [isLoaded, settings]);

  useEffect(() => {
    const updateActiveLocation = async () => {
      const location = settings.locationMode === 'gps' && gpsLocation ? gpsLocation : await getManualLocation(settings);
      setActiveLocation(location);
    };
    void updateActiveLocation();
  }, [settings, gpsLocation]);

  useEffect(() => {
    let isCancelled = false;
    const refreshPrayerTimes = async () => {
      if (!activeLocation) return;
      const resolved = await computePrayerTimesAsync(new Date(), activeLocation);
      if (!isCancelled) setPrayerTimes(resolved);
    };
    void refreshPrayerTimes();
    return () => { isCancelled = true; };
  }, [activeLocation]);

  useEffect(() => {
    if (!isLoaded || !isNativeApp()) return;
    void prayerNotificationService.schedulePrayerNotifications({
      settings,
      prayerTimes,
      location: activeLocation,
      lang
    });
  }, [activeLocation, isLoaded, prayerTimes, settings]);

  const requestLocation = async () => {
    const result = await prayerLocationService.requestCurrentLocation();
    if (result.location) {
      setGpsLocation(result.location);
      setSettings((c) => ({ ...c, locationMode: 'gps' }));
      await prayerSettingsService.saveGpsLocation(result.location);
    }
  };

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    let isCancelled = false;
    setIsSearching(true);
    const timeout = window.setTimeout(() => {
      void prayerLocationService.searchLocations(query).then((results) => {
        if (!isCancelled) setSearchResults(results);
      }).finally(() => {
        if (!isCancelled) setIsSearching(false);
      });
    }, 320);
    return () => { isCancelled = true; window.clearTimeout(timeout); };
  }, [searchQuery]);

  const applyManualLocation = (location: PrayerLocation) => {
    setSettings((current) => ({
      ...current,
      locationMode: 'manual',
      manualCityId: 'custom',
      customLocationLabel: location.label,
      customCountry: location.country,
      customLatitude: String(location.latitude),
      customLongitude: String(location.longitude),
      customTimeZone: location.timeZone,
    }));
    setSearchQuery(`${location.label}${location.country ? `, ${location.country}` : ''}`);
    setSearchResults([]);
  };

  const scheduleTestAdhan = async () => {
    await prayerNotificationService.scheduleTestNotification(settings, lang);
  };

  const scheduleTestOffline = async () => {
    await offlineReminderService.scheduleTest(lang);
  };

  return (
    <div className="min-h-screen bg-app-bg pb-32 pt-20">
      <div className="container mx-auto max-w-2xl px-4 sm:px-6">
        {/* HEADER */}
        <div className={cn("mb-10 flex flex-col gap-4", lang === 'ar' && "text-right")}>
          <Link to="/prayer" className={cn("flex w-fit items-center gap-2 text-sm font-bold text-app-accent hover:underline", lang === 'ar' && "ml-auto")}>
            <ArrowRight className={cn("h-4 w-4", lang === 'ar' ? "" : "rotate-180")} />
            {t.back}
          </Link>
          <h1 className="text-4xl font-bold tracking-tight text-app-text">{t.title}</h1>
          <p className="text-app-muted">{t.subtitle}</p>
        </div>

        <div className="space-y-12">
          {/* SECTION: LOCATION */}
          <section>
            <SectionHeader title={t.locationSection} subtitle={t.locationDesc} icon={MapPin} lang={lang} />
            <div className="space-y-4">
              <button onClick={() => void requestLocation()} className={cn("flex w-full items-center justify-between gap-4 rounded-[1.5rem] bg-app-accent p-5 text-app-bg transition-all active:scale-95 shadow-lg shadow-app-accent/20", lang === 'ar' && "flex-row-reverse")}>
                <div className={cn(lang === 'ar' && "text-right")}>
                  <p className="font-bold">{t.currentLocation}</p>
                  <p className="text-xs font-medium opacity-80">{t.currentLocationDesc}</p>
                </div>
                <Navigation className="h-6 w-6" />
              </button>

              <SettingBlock>
                <div className="grid gap-6">
                  <div className={cn(lang === 'ar' && "text-right")}>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-app-muted">{t.chooseCity}</label>
                    <div className="relative">
                      <select value={settings.manualCityId} onChange={(e) => setSettings(c => ({ ...c, manualCityId: e.target.value, locationMode: 'manual' }))} className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-app-text outline-none focus:border-app-accent/50">
                        {CITY_OPTIONS.map(city => <option key={city.id} value={city.id}>{city.location.label}</option>)}
                        <option value="custom">{t.customLocation || 'Custom'}</option>
                      </select>
                      <ChevronDown className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted", lang === 'ar' ? "left-4" : "right-4")} />
                    </div>
                  </div>

                  <div className={cn(lang === 'ar' && "text-right")}>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-app-muted">{t.searchCity}</label>
                    <div className="relative">
                      <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted", lang === 'ar' ? "right-4" : "left-4")} />
                      <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t.searchHint} className={cn("w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-app-text outline-none focus:border-app-accent/50", lang === 'ar' ? "pr-12" : "pl-12")} />
                    </div>
                    {searchResults.length > 0 && (
                      <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-white/10 bg-app-card">
                        {searchResults.map((result, i) => (
                          <button key={i} onClick={() => applyManualLocation(result)} className={cn("w-full border-b border-white/5 p-3 text-left text-sm hover:bg-white/5 last:border-b-0", lang === 'ar' && "text-right")}>
                            {result.label}, {result.country}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </SettingBlock>
            </div>
          </section>

          {/* SECTION: ALERTS */}
          <section>
            <SectionHeader title={t.alertsSection} subtitle={t.alertsDesc} icon={BellRing} lang={lang} />
            <div className="space-y-4">
              <SettingBlock>
                <div className={cn("flex items-center justify-between", lang === 'ar' && "flex-row-reverse")}>
                  <div>
                    <p className="font-bold text-app-text">{t.notificationsEnabled}</p>
                    <p className="text-xs text-app-muted mt-0.5">{lang === 'ar' ? 'تفعيل تنبيهات الأذان' : 'Receive audio adhan notifications'}</p>
                  </div>
                  <button onClick={() => setSettings(c => ({...c, notificationsEnabled: !c.notificationsEnabled}))} className={cn("relative h-7 w-12 rounded-full transition-all", settings.notificationsEnabled ? "bg-app-accent" : "bg-white/10")}>
                    <div className={cn("absolute top-1 h-5 w-5 rounded-full bg-white transition-all shadow-lg", settings.notificationsEnabled ? (lang === 'ar' ? "right-6" : "left-6") : (lang === 'ar' ? "right-1" : "left-1"))} />
                  </button>
                </div>
              </SettingBlock>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {(Object.keys(settings.prayerToggles) as PrayerKey[]).map(key => (
                  <button key={key} onClick={() => setSettings(c => ({ ...c, prayerToggles: { ...c.prayerToggles, [key]: !c.prayerToggles[key] } }))} className={cn("flex flex-col items-center gap-3 rounded-3xl border p-5 transition-all active:scale-95", settings.prayerToggles[key] ? "border-app-accent/30 bg-app-accent/10" : "border-white/5 bg-white/[0.02] opacity-50")}>
                    <Bell className={cn("h-6 w-6", settings.prayerToggles[key] ? "text-app-accent" : "text-app-muted")} />
                    <span className="text-xs font-bold uppercase tracking-widest">{t.prayerNames[key]}</span>
                  </button>
                ))}
              </div>

              <SettingBlock>
                <div className={cn("flex items-center justify-between", lang === 'ar' && "flex-row-reverse")}>
                  <div>
                    <p className="font-bold text-app-text">{lang === 'ar' ? 'تشغيل الأذان كاملاً' : 'Play Full Azan'}</p>
                    <p className="text-xs text-app-muted mt-0.5">{lang === 'ar' ? 'سيتم تشغيل الأذان كاملاً بدلاً من تنبيه قصير' : 'Play the full azan instead of a short notification'}</p>
                  </div>
                  <button onClick={() => setSettings(c => ({...c, allowFullPlayback: !c.allowFullPlayback}))} className={cn("relative h-7 w-12 rounded-full transition-all", settings.allowFullPlayback ? "bg-app-accent" : "bg-white/10")}>
                    <div className={cn("absolute top-1 h-5 w-5 rounded-full bg-white transition-all shadow-lg", settings.allowFullPlayback ? (lang === 'ar' ? "right-6" : "left-6") : (lang === 'ar' ? "right-1" : "left-1"))} />
                  </button>
                </div>
              </SettingBlock>

              <SettingBlock>
                <div className={cn("flex items-center justify-between", lang === 'ar' && "flex-row-reverse")}>
                  <div>
                    <p className="text-sm font-bold text-app-text">{t.reminderMinutes}</p>
                    <p className="text-[10px] text-app-muted mt-0.5">{t.reminderMinutesDesc}</p>
                  </div>
                  <div className="flex gap-2">
                    {[0, 5, 10, 15].map(m => (
                      <button key={m} onClick={() => setSettings(c => ({ ...c, reminderMinutes: m }))} className={cn("h-9 w-9 rounded-lg text-[10px] font-black transition-all", settings.reminderMinutes === m ? "bg-app-accent text-app-bg shadow-md" : "bg-white/5 text-app-muted")}>{m}</button>
                    ))}
                  </div>
                </div>
              </SettingBlock>
            </div>
          </section>

          {/* SECTION: DAILY REMINDERS */}
          <section>
            <SectionHeader title={t.remindersSection} subtitle={t.remindersDesc} icon={Sparkles} lang={lang} />
            <div className="space-y-4">
              <SettingBlock>
                <div className={cn("flex items-center justify-between", lang === 'ar' && "flex-row-reverse")}>
                  <div>
                    <p className="font-bold text-app-text">{t.smartRemindersEnabled}</p>
                    <p className="text-xs text-app-muted mt-0.5">{lang === 'ar' ? 'استلام حكم وأدعية يومية' : 'Receive daily wisdom and duas'}</p>
                  </div>
                  <button
                    onClick={() => setSettings(c => ({...c, smartRemindersEnabled: !c.smartRemindersEnabled}))}
                    className={cn("relative h-7 w-12 rounded-full transition-all", settings.smartRemindersEnabled ? "bg-app-accent" : "bg-white/10")}
                  >
                    <div className={cn("absolute top-1 h-5 w-5 rounded-full bg-white transition-all shadow-lg", settings.smartRemindersEnabled ? (lang === 'ar' ? "right-6" : "left-6") : (lang === 'ar' ? "right-1" : "left-1"))} />
                  </button>
                </div>
              </SettingBlock>

              {settings.smartRemindersEnabled && (
                <SettingBlock>
                  <div className="space-y-6">
                    <div className={cn("flex items-center justify-between", lang === 'ar' && "flex-row-reverse")}>
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-app-accent" />
                        <p className="text-sm font-bold text-app-text">{t.smartReminderMode}</p>
                      </div>
                      <div className="flex bg-white/5 rounded-xl p-1">
                        <button
                          onClick={() => setSettings(c => ({...c, smartReminderMode: 'auto'}))}
                          className={cn("px-3 py-1 rounded-lg text-xs font-bold", settings.smartReminderMode === 'auto' ? "bg-app-accent text-app-bg" : "text-app-muted")}
                        >
                          {t.smartModeAuto}
                        </button>
                        <button
                          onClick={() => setSettings(c => ({...c, smartReminderMode: 'manual'}))}
                          className={cn("px-3 py-1 rounded-lg text-xs font-bold", settings.smartReminderMode === 'manual' ? "bg-app-accent text-app-bg" : "text-app-muted")}
                        >
                          {t.smartModeManual}
                        </button>
                      </div>
                    </div>
                    {settings.smartReminderMode === 'manual' && (
                      <div className={cn("flex items-center justify-between", lang === 'ar' && "flex-row-reverse")}>
                        <p className="text-sm font-bold text-app-text">{t.smartManualTime}</p>
                        <input
                          type="time"
                          value={settings.smartReminderManualTime}
                          onChange={e => setSettings(c => ({...c, smartReminderManualTime: e.target.value}))}
                          className="rounded-xl border border-white/10 bg-white/5 p-2 text-sm text-app-text outline-none focus:border-app-accent/50"
                        />
                      </div>
                    )}
                  </div>
                </SettingBlock>
              )}
            </div>
          </section>

          {/* SECTION: SOUND */}
          <section>
            <SectionHeader title={t.soundSection} subtitle={t.soundDesc} icon={Volume2} lang={lang} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {AZAN_OPTIONS.map(azan => (
                <SettingBlock key={azan.id} className={cn(settings.selectedAzan === azan.id && "border-app-accent/30 bg-app-accent/10")}>
                  <div className="flex flex-col h-full">
                    <div className={cn("flex items-start gap-4", lang === 'ar' && "flex-row-reverse text-right")}>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                        <Mic2 className="h-6 w-6 text-app-muted" />
                      </div>
                      <div className={cn(lang === 'ar' && "text-right")}>
                        <p className="font-bold text-app-text">{azan.label[lang]}</p>
                        <p className="text-xs text-app-muted">{azan.reciter[lang]}</p>
                      </div>
                    </div>
                    <div className={cn("mt-4 flex flex-1 items-end gap-2", lang === 'ar' && "flex-row-reverse")}>
                      <button onClick={() => setSettings(c => ({ ...c, selectedAzan: azan.id }))} className={cn("flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all", settings.selectedAzan === azan.id ? "bg-app-accent text-app-bg" : "bg-white/10 text-app-text hover:bg-white/20")}>
                        {settings.selectedAzan === azan.id ? <CheckCircle2 className="h-4 w-4" /> : <Mic2 className="h-4 w-4" />}
                        {settings.selectedAzan === azan.id ? t.selected : t.chooseAzan}
                      </button>
                      <button onClick={() => setPreviewAzan(azan)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-app-text transition-all hover:bg-white/20">
                        <Play className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </SettingBlock>
              ))}
            </div>
          </section>

          {/* SECTION: ADVANCED */}
          <section>
            <SectionHeader title={lang === 'ar' ? 'إعدادات متقدمة' : 'Advanced'} subtitle={lang === 'ar' ? 'اختبر التنبيهات واضبط الإعدادات الدقيقة' : 'Test alerts and fine-tune settings'} icon={Info} lang={lang} />
            <div className="space-y-4">
              <SettingBlock>
                <button onClick={() => void scheduleTestAdhan()} className={cn("flex w-full items-center justify-between", lang === 'ar' && "flex-row-reverse")}>
                  <div className={cn(lang === 'ar' && "text-right")}>
                    <p className="font-bold text-app-text">{t.testAlarm}</p>
                    <p className="text-xs text-app-muted mt-0.5">{t.testAlarmDesc}</p>
                  </div>
                  <BellRing className="h-5 w-5 text-app-accent" />
                </button>
              </SettingBlock>
              <SettingBlock>
                <button onClick={() => void scheduleTestOffline()} className={cn("flex w-full items-center justify-between", lang === 'ar' && "flex-row-reverse")}>
                  <div className={cn(lang === 'ar' && "text-right")}>
                    <p className="font-bold text-app-text">{t.testOffline}</p>
                    <p className="text-xs text-app-muted mt-0.5">{t.testOfflineDesc}</p>
                  </div>
                  <Sparkles className="h-5 w-5 text-app-accent" />
                </button>
              </SettingBlock>
              {isNativeApp() && user?.aud === 'authenticated' && (
                <SettingBlock>
                  <button onClick={() => prayerNotificationService.promptExactAlarmSettings()} className={cn("flex w-full items-center justify-between", lang === 'ar' && "flex-row-reverse")}>
                    <div className={cn(lang === 'ar' && "text-right")}>
                      <p className="font-bold text-app-text">{t.exactSettings}</p>
                      <p className="text-xs text-app-muted mt-0.5">{t.exactSettingsDesc}</p>
                    </div>
                    <Smartphone className="h-5 w-5 text-app-accent" />
                  </button>
                </SettingBlock>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {previewAzan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setPreviewAzan(null)}>
          <div className="w-full max-w-sm rounded-3xl bg-app-card p-6 shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/10 bg-white/5">
                <Mic2 className="h-8 w-8 text-app-muted" />
              </div>
              <div>
                <p className="text-xl font-bold">{previewAzan.label[lang]}</p>
                <p className="text-sm text-app-muted">{previewAzan.reciter[lang]}</p>
              </div>
            </div>
            <audio src={previewAzan.fullSrc} controls autoPlay className="mt-6 w-full" onEnded={() => setPreviewAzan(null)} />
          </div>
        </div>
      )}

      {isSearching && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-app-accent px-4 py-2 text-sm font-bold text-app-bg shadow-lg">
          <Loader2 className="h-4 w-4 animate-spin" />
          {lang === 'ar' ? 'جاري البحث...' : 'Searching...'}
        </div>
      )}
    </div>
  );
};