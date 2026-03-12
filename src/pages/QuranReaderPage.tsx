import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Bookmark, ChevronLeft, ChevronRight, Download, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { quranService } from '../services/quranService';
import { quranTextService } from '../services/quranTextService';
import { cn } from '../lib/utils';

const labels = {
  en: {
    back: 'Back to Home',
    title: 'Quran Mushaf',
    subtitle: 'One full page at a time with page-turn effect.',
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
  },
  ar: {
    back: 'العودة للرئيسية',
    title: 'مصحف القرآن',
    subtitle: 'صفحة كاملة واحدة في كل مرة مع تأثير تقليب الصفحات.',
    page: 'الصفحة',
    jump: 'انتقال إلى صفحة',
    surahSearch: 'ابحث عن سورة',
    surahs: 'السور',
    bookmark: 'العلامة',
    saveBookmark: 'حفظ العلامة',
    removeBookmark: 'حذف العلامة',
    noBookmark: 'لا توجد علامة محفوظة.',
    goBookmark: 'الذهاب إلى العلامة',
    previous: 'السابق',
    next: 'التالي',
    openPage: 'فتح الصفحة',
    startsPage: 'تبدأ من صفحة',
    ayahJump: 'الذهاب إلى آية',
    ayahNumber: 'رقم الآية',
    jumpAyah: 'فتح الآية',
    locatingAyah: 'جار تحديد الآية...',
    ayahNotFound: 'لم يتم العثور على الآية في السورة المحددة.',
    downloadOffline: 'تنزيل القرآن للعمل دون إنترنت',
    downloading: 'جار التنزيل...',
    offlineReady: 'جاهز دون إنترنت',
    offlineHint: 'نزّل مرة واحدة ثم تفتح الصفحات حتى بدون اتصال.',
    loading: 'جاري تحميل الصفحة...',
    failed: 'تعذر تحميل صورة الصفحة.',
  },
};

const PAGE_KEY = 'quran-current-page';
const BOOKMARK_KEY = 'quran-bookmark-page';
const OFFLINE_READY_KEY = 'quran-offline-ready';

type CacheProgressMessage = {
  type: 'QURAN_CACHE_PROGRESS';
  done: number;
  total: number;
};

type CacheDoneMessage = {
  type: 'QURAN_CACHE_DONE';
};

type CacheErrorMessage = {
  type: 'QURAN_CACHE_ERROR';
  message?: string;
};

type CacheMessage = CacheProgressMessage | CacheDoneMessage | CacheErrorMessage;

export const QuranReaderPage = ({ lang }: { lang: 'en' | 'ar' }) => {
  const t = labels[lang];
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
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadDone, setDownloadDone] = useState(0);
  const [downloadTotal, setDownloadTotal] = useState(quranService.pageCount);
  const [offlineReady, setOfflineReady] = useState(
    () => window.localStorage.getItem(OFFLINE_READY_KEY) === 'true'
  );

  useEffect(() => {
    window.localStorage.setItem(PAGE_KEY, String(page));
    setInputPage(String(page));
    setLoaded(false);
    setLoadError(false);
    quranService.preloadAdjacentPages(page);
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
        setDownloadDone(quranService.pageCount);
        setDownloadTotal(quranService.pageCount);
      } else if (payload.type === 'QURAN_CACHE_ERROR') {
        console.error(payload.message || 'Quran offline cache failed');
        setIsDownloading(false);
      }
    };

    navigator.serviceWorker?.addEventListener('message', onMessage as EventListener);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', onMessage as EventListener);
    };
  }, []);

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

  const pageImageUrl = quranService.getPageImageUrl(page);
  const isCurrentPageBookmarked = bookmarkPage === page;

  const handleOfflineDownload = async () => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

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

  return (
    <div className="min-h-screen bg-[#e9e2cc] pb-28 pt-24 md:pt-28">
      <div className="container mx-auto px-4 md:px-6">
        <div
          className={cn(
            'mb-6 flex flex-col justify-between gap-5 md:flex-row md:items-end',
            lang === 'ar' && 'md:flex-row-reverse text-right'
          )}
        >
          <div>
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
            <h1 className="font-serif text-3xl text-slate-950 md:text-5xl">{t.title}</h1>
            <p className="mt-2 text-sm text-slate-700 md:text-base">{t.subtitle}</p>
          </div>

          <div className={cn('flex flex-wrap items-center gap-3', lang === 'ar' && 'flex-row-reverse')}>
            <div className="rounded-xl bg-white/75 px-4 py-2 text-sm font-semibold text-slate-800 shadow">
              {t.page} {page} / {quranService.pageCount}
            </div>
            {currentSurah && (
              <div className="rounded-xl bg-white/75 px-4 py-2 text-sm text-slate-700 shadow">
                {currentSurah.name_en} - {currentSurah.name_ar}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="order-2 h-fit rounded-2xl border border-black/10 bg-white/75 p-4 shadow-lg lg:order-1">
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
            <p className="mt-2 text-[11px] text-slate-600">{t.offlineHint}</p>
            {(isDownloading || offlineReady) && (
              <p className="mt-1 text-[11px] font-semibold text-emerald-700">
                {isDownloading ? `${t.downloading} ${downloadDone}/${downloadTotal}` : t.offlineReady}
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

          <section className="order-1 rounded-2xl border border-black/10 bg-[#ddd4bd] p-3 shadow-xl md:p-5 lg:order-2">
            <div className="relative mx-auto max-w-[560px] overflow-hidden rounded-xl border border-black/15 bg-[#efe8d3] p-2 shadow-inner">
              <div className="relative aspect-[3/4.35] w-full">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.img
                    key={page}
                    src={pageImageUrl}
                    alt={`Quran page ${page}`}
                    onLoad={() => setLoaded(true)}
                    onError={() => setLoadError(true)}
                    referrerPolicy="no-referrer"
                    initial={{ rotateY: direction > 0 ? -90 : 90, opacity: 0.3 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: direction > 0 ? 90 : -90, opacity: 0.2 }}
                    transition={{ duration: 0.45, ease: 'easeInOut' }}
                    style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
                    className="absolute inset-0 h-full w-full rounded-md object-contain object-center"
                  />
                </AnimatePresence>

                {!loaded && !loadError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#efe8d3]/90 text-sm font-semibold text-slate-700">
                    {t.loading}
                  </div>
                )}
                {loadError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-50 text-sm font-semibold text-red-700">
                    {t.failed}
                  </div>
                )}
              </div>
            </div>

            <div className={cn('mt-4 flex items-center justify-between gap-3', lang === 'ar' && 'flex-row-reverse')}>
              <button
                onClick={() => {
                  setDirection(-1);
                  setPage((current) => quranService.clampPage(current - 1));
                }}
                disabled={page <= 1}
                className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                {t.previous}
              </button>

              <div className="text-sm font-semibold text-slate-700">
                {t.page} {page}
              </div>

              <button
                onClick={() => {
                  setDirection(1);
                  setPage((current) => quranService.clampPage(current + 1));
                }}
                disabled={page >= quranService.pageCount}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {t.next}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
