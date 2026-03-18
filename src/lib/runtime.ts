import { Capacitor } from '@capacitor/core';

export const isNativeApp = () => Capacitor.isNativePlatform();

export const getPlatformLabel = () => {
  if (!isNativeApp()) return 'web';
  return Capacitor.getPlatform();
};
