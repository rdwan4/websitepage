import { QuranSurahText } from '../types';

const API_ROOT = 'https://api.alquran.cloud/v1';

export const quranTextService = {
  async getSurah(surahNumber: number): Promise<QuranSurahText> {
    const response = await fetch(`${API_ROOT}/surah/${surahNumber}/quran-uthmani`);
    const result = await response.json();

    if (!response.ok || result.code !== 200 || !result.data) {
      throw new Error('Unable to load Quran text right now.');
    }

    return result.data as QuranSurahText;
  },
};
