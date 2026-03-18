import { isNativeApp } from './runtime';

export const triggerHapticTap = async () => {
  try {
    if (isNativeApp()) {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Light });
      return;
    }
  } catch {
    // Fall through to vibration fallback.
  }

  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(10);
  }
};

