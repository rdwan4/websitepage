import { SURAH_METADATA } from '../data/surahMetadata';
import { QuranSurahMetadata } from '../types';

const PAGE_COUNT = 604;
const DEFAULT_REMOTE_BASE_URL = 'https://quran.islam-db.com/public/data/pages/quranpages_1920/images';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const padPage = (page: number) => String(page).padStart(3, '0');

export interface QuranSurahSource extends QuranSurahMetadata {}

const localBaseUrl = '/quran-pages';
const envBaseUrl = import.meta.env.VITE_QURAN_PAGES_BASE_URL;

export const quranService = {
  pageCount: PAGE_COUNT,
  baseUrl: trimTrailingSlash(envBaseUrl || DEFAULT_REMOTE_BASE_URL),
  localBaseUrl,
  surahs: SURAH_METADATA,

  clampPage(page: number) {
    if (!Number.isFinite(page)) {
      return 1;
    }

    return Math.min(PAGE_COUNT, Math.max(1, Math.round(page)));
  },

  getPageImageUrl(page: number) {
    const safePage = this.clampPage(page);
    return `${this.baseUrl}/page${padPage(safePage)}.png`;
  },

  getLocalPageImageUrl(page: number) {
    const safePage = this.clampPage(page);
    return `${localBaseUrl}/page${padPage(safePage)}.png`;
  },

  preloadAdjacentPages(page: number) {
    [page - 1, page + 1]
      .map((candidate) => this.clampPage(candidate))
      .filter((candidate, index, values) => values.indexOf(candidate) === index)
      .forEach((candidate) => {
        const image = new Image();
        image.src = this.getPageImageUrl(candidate);
      });
  },
};
