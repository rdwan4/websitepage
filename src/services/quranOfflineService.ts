import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { quranService } from './quranService';
import { isNativeApp } from '../lib/runtime';

const OFFLINE_READY_KEY = 'quran-offline-ready';

const padPage = (page: number) => String(page).padStart(3, '0');
const getPagePath = (page: number) => `quran-pages/page${padPage(page)}.png`;

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Failed to convert file to base64.'));
        return;
      }
      const [, base64] = result.split(',');
      resolve(base64 || '');
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read file.'));
    reader.readAsDataURL(blob);
  });

const setOfflineReady = (ready: boolean) => {
  window.localStorage.setItem(OFFLINE_READY_KEY, ready ? 'true' : 'false');
};

const delay = (ms: number) => new Promise<void>((resolve) => {
  window.setTimeout(resolve, ms);
});

export const quranOfflineService = {
  isOfflineReady() {
    return window.localStorage.getItem(OFFLINE_READY_KEY) === 'true';
  },

  async getCachedPageUrl(page: number) {
    if (!isNativeApp()) return null;

    try {
      const file = await Filesystem.getUri({
        directory: Directory.Data,
        path: getPagePath(page),
      });

      await Filesystem.stat({
        directory: Directory.Data,
        path: getPagePath(page),
      });

      return Capacitor.convertFileSrc(file.uri);
    } catch {
      return null;
    }
  },

  async resolvePageUrl(page: number) {
    const cachedUrl = await this.getCachedPageUrl(page);
    return cachedUrl || quranService.getRemotePageImageUrl(page);
  },

  async cachePage(page: number) {
    const safePage = quranService.clampPage(page);
    const remoteUrl = quranService.getRemotePageImageUrl(safePage);

    if (isNativeApp() && typeof (Filesystem as unknown as { downloadFile?: unknown }).downloadFile === 'function') {
      await (Filesystem as unknown as {
        downloadFile: (args: { url: string; path: string; directory: Directory; recursive: boolean }) => Promise<unknown>;
      }).downloadFile({
        url: remoteUrl,
        directory: Directory.Data,
        path: getPagePath(safePage),
        recursive: true,
      });
      return;
    }

    const response = await fetch(remoteUrl);
    if (!response.ok) {
      throw new Error(`Failed to download Quran page ${safePage} (${response.status}).`);
    }

    const blob = await response.blob();
    const base64 = await blobToBase64(blob);

    await Filesystem.writeFile({
      directory: Directory.Data,
      path: getPagePath(safePage),
      data: base64,
      recursive: true,
    });
  },

  async cacheAllPages(onProgress?: (done: number, total: number) => void) {
    const total = quranService.pageCount;
    const failedPages: number[] = [];

    for (let page = 1; page <= total; page += 1) {
      let cached = false;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          await this.cachePage(page);
          cached = true;
          break;
        } catch (error) {
          if (attempt === 3) {
            failedPages.push(page);
          } else {
            await delay(350);
          }
        }
      }
      onProgress?.(page, total);
    }

    if (failedPages.length > 0) {
      setOfflineReady(false);
      throw new Error(`Failed to cache ${failedPages.length} pages.`);
    }

    setOfflineReady(true);
  },
};
