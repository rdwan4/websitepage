import { useEffect, useRef } from 'react';
import { prayerLocationService } from '../services/prayerLocationService';
import { prayerSettingsService } from '../services/prayerSettingsService';
import { broadcastNotificationService } from '../services/broadcastNotificationService';
import { Preferences } from '@capacitor/preferences';

const HAS_LAUNCHED_FLAG = 'hasLaunched-v3';

export const LocationPermissionGate = () => {
  const isChecking = useRef(false);

  useEffect(() => {
    const checkPermissions = async () => {
      if (isChecking.current) return;
      isChecking.current = true;

      try {
        const { value } = await Preferences.get({ key: HAS_LAUNCHED_FLAG });
        if (value === 'true') {
          console.log('PermissionGate: Already launched, skipping gate.');
          return;
        }

        console.log('PermissionGate: First launch detected. Requesting Location...');
        const result = await prayerLocationService.requestCurrentLocation();
        
        if (result.location) {
          console.log('PermissionGate: Location acquired:', result.location.label);
          const settings = await prayerSettingsService.getSettings();
          const updated = { ...settings, locationMode: 'gps' as const };
          await prayerSettingsService.saveGpsLocation(result.location);
          await prayerSettingsService.saveSettings(updated);
          
          // Force a global event so prayer times update immediately
          window.dispatchEvent(new Event('prayer-settings-updated'));
        }

        console.log('PermissionGate: Requesting Notifications...');
        await broadcastNotificationService.init();
        await broadcastNotificationService.syncPending();
        
        await Preferences.set({ key: HAS_LAUNCHED_FLAG, value: 'true' });
        console.log('PermissionGate: Gate sequence complete.');
      } catch (e) {
        console.error('PermissionGate: Critical error in gate:', e);
      }
    };

    void checkPermissions();
  }, []);

  return null;
};