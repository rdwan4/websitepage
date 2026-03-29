import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Bookmark, ChevronLeft, ChevronRight, Download, Maximize2, Minimize2, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { quranService } from '../services/quranService';
import { quranTextService } from '../services/quranTextService';
import { quranOfflineService } from '../services/quranOfflineService';
import { isNativeApp } from '../lib/runtime';
import { cn } from '../lib/utils';

const labels = {
  en: {
    back: 'Back to Home',
    title: 'Quran Mushaf',
    page: 'Page',
    jump: 'Go to page',
    surahSearch: 'Search surah',
    surahs: 'Surahs',
    bookmark: 'Bookmark',
    saveBookmark: 'Save Bookmark',
    removeBookmark: 'Remove Bookmark',
    noBookmark: 'No bookmark saved.',
    goBookmark: 'Go to Bookmark',
    previous: 'Previous',
    next: 'Next',
    openPage: 'Open Page',
    startsPage: 'Starts page',
    ayahJump: 'Go to Ayah',
    ayahNumber: 'Ayah number',
    jumpAyah: 'Open Ayah',
    locatingAyah: 'Locating ayah...',
    ayahNotFound: 'Ayah not found in selected surah.',
    downloadOffline: 'Download Quran Offline',
    downloading: 'Downloading...',
    offlineReady: 'Offline ready',
    offlineHint: 'Download once, then Quran pages open even without internet.',
    loading: 'Loading page...',
    failed: 'Failed to load page image.',
    fullscreen: 'Fullscreen reading',
    exitFullscreen: 'Exit fullscreen',
  },
  ar: {
    back: 'العودة للرئيسية',
    title: 'مصحف القرآن',
    page: 'الصفحة',
    jump: 'الانتقال إلى صفحة',
    surahSearch: 'ابحث عن سورة',
    surahs: 'السور',
    bookmark: 'العلامة',
    saveBookmark: 'حفظ العلامة',
    removeBookmark: 'إزالة العلامة',
    noBookmark: 'لا توجد علامة محفوظة.',
    goBookmark: 'الذهاب إلى العلامة',
    previous: 'السابق',
    next: 'التالي',
    openPage: 'فتح الصفحة',
    startsPage: 'تبدأ من صفحة',
    ayahJump: 'الذهاب إلى آية',
    ayahNumber: 'رقم الآية',
    jumpAyah: 'فتح الآية',
    locatingAyah: 'جارٍ تحديد الآية...',
    ayahNotFound: 'لم يتم العثور على الآية في السورة المحددة.',
    downloadOffline: 'تنزيل القرآن دون إنترنت',
    downloading: 'جارٍ التنزيل...',
    offlineReady: 'جاهز دون إنترنت',
    offlineHint: 'نزّل مرة واحدة ثم افتح الصفحات حتى بدون اتصال.',
    loading: 'جارٍ تحميل الصفحة...',
    failed: 'تعذر تحميل صورة الصفحة.',
    fullscreen: 'قراءة بملء الشاشة',
    exitFullscreen: 'إغلاق ملء الشاشة',
  },
};

const PAGE_KEY = 'quran-current-page';
const BOOKMARK_KEY = 'quran-bookmark-page';
const OFFLINE_READY_KEY = 'quran-offline-ready';

type CacheMessage = {
  type: 'QURAN_CACHE_PROGRESS' | 'QURAN_CACHE_DONE' | 'QURAN_CACHE_ERROR';
  done?: number;
  total?: number;
  message?: string;
};

export const QuranReaderPage = ({ lang }: { lang: 'en' | 'ar' }) => {
  const t = labels[lang];
  const nativeApp = isNativeApp();
  const [page, setPage] = useState<number>(() => {
    const stored = Number(window.localStorage.getItem(PAGE_KEY) || '1');
    return quranService.clampPage(stored);
  });
  const [inputPage, setInputPage] = useState<string>(() => String(page));
  const [surahQuery, setSurahQuery] = useState('');
  const [ayahSurahId, setAyahSurahId] = useState<number>(1);
  const [ayahNumber, setAyahNumber] = useState<string>('');
  const [locatingAyah, setLocatingAyah] = useState(false);
  const [ayahError, setAyahError] = useState('');
  const [bookmarkPage, setBookmarkPage] = useState<number | null>(() => {
    const stored = Number(window.localStorage.getItem(BOOKMARK_KEY) || '');
    return Number.isFinite(stored) && stored > 0 ? quranService.clampPage(stored) : null;
  });
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [pageImageUrl, setPageImageUrl] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadDone, setDownloadDone] = useState(0);
  const [downloadTotal, setDownloadTotal] = useState(quranService.pageCount);
  const [downloadError, setDownloadError] = useState('');
  const [offlineReady, setOfflineReady] = useState(
    () => window.localStorage.getItem(OFFLINE_READY_KEY) === 'true'
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(PAGE_KEY, String(page));
    setInputPage(String(page));
    setLoaded(false);
    setLoadError(false);
    quranService.preloadAdjacentPages(page);
  }, [page]);

  useEffect(() => {
    let cancelled = false;

    const loadPageImage = async () => {
      try {
        const url = await quranOfflineService.resolvePageUrl(page);
        if (!cancelled) {
          setPageImageUrl(url);
        }
      } catch {
        if (!cancelled) {
          setPageImageUrl(quranService.getRemotePageImageUrl(page));
        }
      }
    };

    void loadPageImage();

    return () => {
      cancelled = true;
    };
  }, [page]);

  useEffect(() => {
    if (bookmarkPage) {
      window.localStorage.setItem(BOOKMARK_KEY, String(bookmarkPage));
    } else {
      window.localStorage.removeItem(BOOKMARK_KEY);
    }
  }, [bookmarkPage]);

  useEffect(() => {
    if (offlineReady) {
      window.localStorage.setItem(OFFLINE_READY_KEY, 'true');
    }
  }, [offlineReady]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        setDirection(-1);
        setPage((current) => quranService.clampPage(current - 1));
      } else if (event.key === 'ArrowLeft') {
        setDirection(1);
        setPage((current) => quranService.clampPage(current + 1));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent<CacheMessage>) => {
      const payload = event.data;
      if (!payload || typeof payload !== 'object') return;

      if (payload.type === 'QURAN_CACHE_PROGRESS') {
        setIsDownloading(true);
        setDownloadDone(payload.done || 0);
        setDownloadTotal(payload.total || quranService.pageCount);
      } else if (payload.type === 'QURAN_CACHE_DONE') {
        setIsDownloading(false);
        setOfflineReady(true);
        setDownloadError('');
        setDownloadDone(quranService.pageCount);
        setDownloadTotal(quranService.pageCount);
      } else if (payload.type === 'QURAN_CACHE_ERROR') {
        console.error(payload.message || 'Quran offline cache failed');
        setIsDownloading(false);
        setDownloadError(payload.message || (lang === 'ar' ? 'تعذر تنزيل القرآن دون إنترنت. حاول مرة أخرى.' : 'Offline download failed. Please try again.'));
      }
    };

    navigator.serviceWorker?.addEventListener('message', onMessage as EventListener);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', onMessage as EventListener);
    };
  }, [lang]);

  const currentSurah = useMemo(() => {
    return quranService.surahs.find((surah) => page >= surah.start_page && page <= surah.end_page) || null;
  }, [page]);

  const filteredSurahs = useMemo(() => {
    const query = surahQuery.trim().toLowerCase();
    if (!query) return quranService.surahs;
    return quranService.surahs.filter((surah) => (
      surah.id.toString().includes(query) ||
      surah.name_en.toLowerCase().includes(query) ||
      surah.transliteration_en.toLowerCase().includes(query) ||
      surah.name_ar.includes(query)
    ));
  }, [surahQuery]);

  const isCurrentPageBookmarked = bookmarkPage === page;

  const handleOfflineDownload = async () => {
    if (isNativeApp()) {
      setDownloadError('');
      setIsDownloading(true);
      setDownloadDone(0);
      setDownloadTotal(quranService.pageCount);

      try {
        await quranOfflineService.cacheAllPages((done, total) => {
          setDownloadDone(done);
          setDownloadTotal(total);
        });
        setOfflineReady(true);
      } catch (error) {
        console.error('Failed to cache Quran pages for native app:', error);
        setDownloadError(lang === 'ar' ? 'تعذر تنزيل القرآن دون إنترنت. حاول مرة أخرى.' : 'Offline download failed. Please try again.');
      } finally {
        setIsDownloading(false);
      }
      return;
    }

    if (!('serviceWorker' in navigator)) {
      setDownloadError(lang === 'ar' ? 'ميزة التنزيل غير مدعومة على هذا الجهاز.' : 'Offline download is not supported on this device.');
      return;
    }

    setDownloadError('');
    setIsDownloading(true);
    setDownloadDone(0);
    setDownloadTotal(quranService.pageCount);

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const target = registration.active || registration.waiting || registration.installing;
      if (!target) {
        throw new Error('No active service worker found.');
      }

      target.postMessage({
        type: 'CACHE_QURAN_PAGES',
        baseUrl: quranService.baseUrl,
        total: quranService.pageCount,
      });
    } catch (error) {
      console.error('Failed to start offline download:', error);
      setIsDownloading(false);
      setDownloadError(lang === 'ar' ? 'تعذر تنزيل القرآن دون إنترنت. حاول مرة أخرى.' : 'Offline download failed. Please try again.');
    }
  };

  const handleGoToAyah = async () => {
    const targetAyah = Number(ayahNumber || '0');
    if (!targetAyah) return;

    setLocatingAyah(true);
    setAyahError('');

    try {
      const surah = await quranTextService.getSurah(ayahSurahId);
      const ayah = surah.ayahs.find((item) => item.numberInSurah === targetAyah);

      if (!ayah?.page) {
        setAyahError(t.ayahNotFound);
        return;
      }

      const targetPage = quranService.clampPage(ayah.page);
      setDirection(targetPage >= page ? 1 : -1);
      setPage(targetPage);
    } catch (error) {
      console.error('Failed to locate ayah:', error);
      setAyahError(t.ayahNotFound);
    } finally {
      setLocatingAyah(false);
    }
  };

  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95,
      rotateY: direction > 0 ? 45 : -45,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95,
      rotateY: direction < 0 ? 45 : -45,
    }),
  };

  const paginate = (newDirection: 1 | -1) => {
    setDirection(newDirection);
    setPage((current) => quranService.clampPage(current + newDirection));
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#e9e2cc] pb-28 pt-44 md:pt-44">
      <div className="container mx-auto px-4 md:px-6">
        <div
          className={cn(
            'mb-6 flex flex-col justify-between gap-5 md:flex-row md:items-end',
            lang === 'ar' && 'md:flex-row-reverse text-right'
          )}
        >
          <div>
            {!nativeApp && (
              <Link
                to="/"
                className={cn(
                  'mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:underline',
                  lang === 'ar' && 'flex-row-reverse'
                )}
              >
                <ArrowLeft className="h-4 w-4" />
                {t.back}
              </Link>
            )}
            <h1 className={cn('font-serif text-slate-950', nativeApp ? 'text-2xl' : 'text-3xl md:text-5xl')}>{t.title}</h1>
          </div>

          <div className={cn('flex flex-wrap items-center gap-2', lang === 'ar' && 'flex-row-reverse')}>
            <button
              onClick={() => setIsFullscreen(true)}
              className={cn('rounded-md border border-black/10 bg-slate-900 font-semibold text-white hover:bg-slate-800', nativeApp ? 'px-2 py-1 text-[9px]' : 'px-2 py-1 text-[10px]')}
            >
              <span className="inline-flex items-center gap-1.5">
                <Maximize2 className="h-3 w-3" />
                {t.fullscreen}
              </span>
            </button>
            <div className={cn('rounded-xl bg-white/75 font-semibold text-slate-800 shadow', nativeApp ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm')}>
              {t.page} {page} / {quranService.pageCount}
            </div>
            {currentSurah && (
              <div className={cn('rounded-md bg-white/75 text-slate-700 shadow', nativeApp ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1 text-[11px]')}>
                {currentSurah.name_en} - {currentSurah.name_ar}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-5">
          {/* Mobile toggle for sidebar */}
          <div className="lg:hidden order-1 flex gap-2">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={cn(
                'flex-1 rounded-xl border border-black/10 px-4 py-3 text-sm font-semibold transition-all',
                isSidebarOpen
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'bg-white/75 text-slate-900 hover:bg-white'
              )}
            >
              {isSidebarOpen
                ? (lang === 'ar' ? '✕ إغلاق القائمة' : '✕ Close Menu')
                : (lang === 'ar' ? '☰ السور والتنقل' : '☰ Surahs & Navigation')}
            </button>
          </div>

          <aside className={cn(
            'order-2 h-fit rounded-2xl border border-black/10 bg-white/75 shadow-lg lg:order-1',
            nativeApp ? 'p-3' : 'p-4',
            // On mobile: hide unless toggled open
            isSidebarOpen ? 'block' : 'hidden lg:block'
          )}>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
              {t.jump}
            </label>
            <div className="mb-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={inputPage}
                onChange={(event) => setInputPage(event.target.value.replace(/[^\d]/g, ''))}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return;
                  const target = quranService.clampPage(Number(inputPage || page));
                  setDirection(target >= page ? 1 : -1);
                  setPage(target);
                }}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
                placeholder="1 - 604"
              />
            </div>
            <button
              onClick={() => {
                const target = quranService.clampPage(Number(inputPage || page));
                setDirection(target >= page ? 1 : -1);
                setPage(target);
              }}
              className="w-full rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              {t.openPage}
            </button>

            <button
              onClick={() => setBookmarkPage(isCurrentPageBookmarked ? null : page)}
              className={cn(
                'mt-3 w-full rounded-xl border px-3 py-2 text-sm font-semibold transition-colors',
                isCurrentPageBookmarked
                  ? 'border-amber-500 bg-amber-50 text-amber-900 hover:bg-amber-100'
                  : 'border-black/10 bg-white text-slate-800 hover:border-amber-300'
              )}
            >
              <span className="inline-flex items-center gap-2">
                <Bookmark className={cn('h-4 w-4', isCurrentPageBookmarked && 'fill-amber-500 text-amber-500')} />
                {isCurrentPageBookmarked ? t.removeBookmark : t.saveBookmark}
              </span>
            </button>

            <div className="mt-3 rounded-xl border border-black/10 bg-white p-3 text-xs text-slate-700">
              <p className="mb-2 font-bold uppercase tracking-[0.08em] text-slate-600">{t.bookmark}</p>
              {bookmarkPage ? (
                <div className="space-y-2">
                  <p>{t.page} {bookmarkPage}</p>
                  <button
                    onClick={() => {
                      setDirection(bookmarkPage >= page ? 1 : -1);
                      setPage(bookmarkPage);
                    }}
                    className="w-full rounded-lg bg-amber-500 px-2 py-1.5 font-semibold text-white hover:bg-amber-600"
                  >
                    {t.goBookmark}
                  </button>
                </div>
              ) : (
                <p>{t.noBookmark}</p>
              )}
            </div>

            <button
              onClick={() => void handleOfflineDownload()}
              disabled={isDownloading}
              className="mt-3 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:border-emerald-300 disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-2">
                <Download className="h-4 w-4" />
                {isDownloading ? t.downloading : t.downloadOffline}
              </span>
            </button>
            {(isDownloading || offlineReady) && (
              <p className="mt-1 text-[11px] font-semibold text-emerald-700">
                {isDownloading ? `${t.downloading} ${downloadDone}/${downloadTotal}` : t.offlineReady}
              </p>
            )}
            {downloadError && (
              <p className="mt-1 text-[11px] font-semibold text-red-700">
                {downloadError}
              </p>
            )}

            <div className="my-4 border-t border-black/10" />

            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
              {t.surahs}
            </label>
            <div className="mb-3 flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={surahQuery}
                onChange={(event) => setSurahQuery(event.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
                placeholder={t.surahSearch}
              />
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {filteredSurahs.map((surah) => (
                <button
                  key={surah.id}
                  onClick={() => {
                    setDirection(1);
                    setPage(surah.start_page);
                  }}
                  className={cn(
                    'w-full rounded-xl border px-3 py-2 text-left text-xs transition-colors',
                    currentSurah?.id === surah.id
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                      : 'border-black/10 bg-white text-slate-800 hover:border-emerald-300'
                  )}
                >
                  <div className="font-semibold">{surah.id}. {surah.name_en}</div>
                  <div className="text-[11px] text-slate-600">{surah.name_ar}</div>
                  <div className="text-[10px] text-slate-500">
                    {t.startsPage} {surah.start_page}
                  </div>
                </button>
              ))}
            </div>

            <div className="my-4 border-t border-black/10" />

            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
              {t.ayahJump}
            </label>
            <select
              value={ayahSurahId}
              onChange={(event) => setAyahSurahId(Number(event.target.value))}
              className="mb-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
            >
              {quranService.surahs.map((surah) => (
                <option key={surah.id} value={surah.id}>
                  {surah.id}. {surah.name_en} - {surah.name_ar}
                </option>
              ))}
            </select>
            <input
              value={ayahNumber}
              onChange={(event) => setAyahNumber(event.target.value.replace(/[^\d]/g, ''))}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void handleGoToAyah();
                }
              }}
              placeholder={t.ayahNumber}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
            />
            <button
              onClick={() => void handleGoToAyah()}
              disabled={locatingAyah}
              className="mt-2 w-full rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {locatingAyah ? t.locatingAyah : t.jumpAyah}
            </button>
            {ayahError && <p className="mt-1 text-[11px] font-semibold text-red-700">{ayahError}</p>}
          </aside>

          <section className="order-1 lg:order-2 rounded-2xl border border-black/10 bg-[#ddd4bd] p-3 shadow-xl md:p-5">
            <div className="relative mx-auto max-w-[560px] overflow-hidden rounded-xl border border-black/15 bg-[#efe8d3] p-2 shadow-inner">
              <div className="relative aspect-[3/4.35] w-full overflow-hidden perspective-1000">
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                  <motion.div
                    key={page}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: 'spring', stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 },
                      rotateY: { duration: 0.4 }
                    }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={1}
                    onDragEnd={(_e, { offset, velocity }) => {
                      const swipe = swipePower(offset.x, velocity.x);
                      if (swipe < -10000) {
                        paginate(1);
                      } else if (swipe > 10000) {
                        paginate(-1);
                      }
                    }}
                    className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing"
                  >
                    <div className="relative h-full w-full">
                      {/* Paper shadow/spine effect */}
                      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/5 to-transparent z-10 pointer-events-none" />
                      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/5 to-transparent z-10 pointer-events-none" />

                      <img
                        src={pageImageUrl}
                        alt={`Quran page ${page}`}
                        onLoad={() => setLoaded(true)}
                        onError={() => setLoadError(true)}
                        referrerPolicy="no-referrer"
                        className="h-full w-full rounded-md object-contain object-center shadow-2xl"
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>

                {!loaded && !loadError && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#efe8d3]/90 text-sm font-semibold text-slate-700">
                    <div className="flex flex-col items-center gap-3">
                       <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" />
                       {t.loading}
                    </div>
                  </div>
                )}
                {loadError && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-50 text-sm font-semibold text-red-700">
                    {t.failed}
                  </div>
                )}
              </div>
            </div>

            <div className={cn('mt-4 flex items-center justify-between gap-3', lang === 'ar' && 'flex-row-reverse')}>
              <button
                onClick={() => paginate(-1)}
                disabled={page <= 1}
                className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50 transition-all active:scale-95"
              >
                <ChevronLeft className="h-4 w-4" />
                {t.previous}
              </button>

              <div className="text-sm font-bold text-slate-800 tracking-tight">
                {t.page} {page} / {quranService.pageCount}
              </div>

              <button
                onClick={() => paginate(1)}
                disabled={page >= quranService.pageCount}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 transition-all active:scale-95 shadow-md shadow-emerald-900/10"
              >
                {t.next}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        </div>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-[120] bg-[#e9e2cc] px-2 py-3 md:px-4 overflow-hidden">
          <div className={cn('mb-3 flex items-center justify-between gap-3', lang === 'ar' && 'flex-row-reverse')}>
            <button
              onClick={() => setIsFullscreen(false)}
              className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-900"
            >
              <Minimize2 className="h-4 w-4" />
              {t.exitFullscreen}
            </button>
            <div className="text-sm font-bold text-slate-900">
              {t.page} {page} / {quranService.pageCount}
            </div>
          </div>
          <div className="flex h-[calc(100vh-8.5rem)] flex-col justify-center perspective-1000">
            <div className="relative mx-auto h-full w-full max-w-[760px] overflow-hidden rounded-2xl bg-[#ddd4bd] shadow-2xl">
              <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                  key={`fullscreen-${page}`}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: 'spring', stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                    rotateY: { duration: 0.4 }
                  }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={(_e, { offset, velocity }) => {
                    const swipe = swipePower(offset.x, velocity.x);
                    if (swipe < -10000) paginate(1);
                    else if (swipe > 10000) paginate(-1);
                  }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <img
                    src={pageImageUrl}
                    alt={`Quran page ${page}`}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-contain object-center"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className={cn('mt-4 flex items-center justify-between gap-3', lang === 'ar' && 'flex-row-reverse')}>
              <button
                onClick={() => paginate(-1)}
                disabled={page <= 1}
                className="p-3 rounded-full bg-white/80 border border-black/10 text-slate-900 disabled:opacity-50"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={() => paginate(1)}
                disabled={page >= quranService.pageCount}
                className="p-3 rounded-full bg-emerald-700 text-white disabled:opacity-50 shadow-lg shadow-emerald-900/20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
