import { App as CapacitorApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '../supabaseClient.js';
import { BroadcastNotification } from '../types';
import { isNativeApp } from '../lib/runtime';
import { postService } from './postService';
import { prayerSettingsService } from './prayerSettingsService';

const BROADCAST_CHANNEL_ID = 'community-broadcasts-v6';
const BROADCAST_SEEN_KEY = 'broadcast-seen-ids-v6'; 
const INSTALL_REF_DATE_KEY = 'broadcast-install-ref-date-v6';
const FCM_TOKEN_STORAGE_KEY = 'last-fcm-token-v6';
const deliveringIds = new Set<string>();
let isInitialized = false;
let isRegistering = false;

export const broadcastNotificationService = {
  async init() {
    if (!isNativeApp() || isInitialized || isRegistering) {
      return;
    }

    isRegistering = true;
    console.log('BNService: init() logic starting...');

    try {
      // 1. Force Listeners before registration
      await PushNotifications.removeAllListeners();

      await PushNotifications.addListener('registration', async (token) => {
        console.log('BNService: Native registration successful.');
        await Preferences.set({ key: FCM_TOKEN_STORAGE_KEY, value: token.value });
        await broadcastNotificationService.syncTokenToProfile(token.value);
      });


      await PushNotifications.addListener('registrationError', (error) => {
        console.error('BNService: Native registration error:', error);
      });

      await PushNotifications.addListener('pushNotificationReceived', (n) => {
        console.log('BNService: Push banner received (Foreground).');
        void this.syncPending();
      });

      await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('BNService: User tapped notification.');
        void this.syncPending();
      });

      // 2. Refresh/Check Permissions
      let perm = await PushNotifications.checkPermissions();
      if (perm.receive === 'prompt') {
        perm = await PushNotifications.requestPermissions();
      }

      if (perm.receive !== 'granted') {
        console.warn('BNService: Permission for push was not granted.');
      }

      // 3. Register native push
      console.log('BNService: Calling register()...');
      await PushNotifications.register();

      // Check for existing token and sync immediately
      const savedToken = (await Preferences.get({ key: FCM_TOKEN_STORAGE_KEY })).value;
      if (savedToken) {
        console.log('BNService: Using existing token from storage');
        await broadcastNotificationService.syncTokenToProfile(savedToken);
      }

      // 4. Configure Channels
      await broadcastNotificationService.configureChannels();

      // 5. Setup install-date buffer (7 days history for new users)
      const { value: refDate } = await Preferences.get({ key: INSTALL_REF_DATE_KEY });
      if (!refDate) {
        const historyStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        await Preferences.set({ key: INSTALL_REF_DATE_KEY, value: historyStart });
        console.log('BNService: New install - allowing 7 days of history.');
      }

      // 6. Manual Sync to catch anything missing
      await broadcastNotificationService.syncPending();

      // 7. Listen for newly created broadcasts while app is actively open
      supabase
        .channel('public:broadcast_notifications')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'broadcast_notifications' },
          (payload) => {
             console.log('BNService: Realtime broadcast detected', payload);
             void broadcastNotificationService.syncPending();
          }
        )
        .subscribe();
      
      isInitialized = true;
    } catch (e) {
      console.error('BNService: Failed to initialize native push:', e);
    } finally {
      isRegistering = false;
    }
  },

  async syncTokenToProfile(providedToken?: string) {
    if (!isNativeApp()) return;
    try {
      const token = providedToken || (await Preferences.get({ key: FCM_TOKEN_STORAGE_KEY })).value;
      if (!token) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      console.log('BNService: Saving token to Supabase for:', session.user.id);
      const { error } = await supabase
        .from('profiles')
        .update({ fcm_token: token })
        .eq('id', session.user.id);
        
      if (error) console.error('Token save failed:', error.message);
      else console.log('BNService: Token saved successfully.');
    } catch (e) {
      console.error('BNService: Token sync failure:', e);
    }
  },

  async configureChannels() {
    if (!isNativeApp()) return;
    try {
      // Create high-importance channel for the app
      await LocalNotifications.createChannel({
        id: BROADCAST_CHANNEL_ID,
        name: 'Islamic Updates',
        description: 'New advice and broadcasts',
        importance: 5,
        vibration: true,
        visibility: 1,
      });

      // Standard fallback channel for raw pushes
      await LocalNotifications.createChannel({
        id: 'fcm_fallback_notification_channel',
        name: 'Standard Alerts',
        importance: 5,
      });
    } catch (e) {}
  },

  async deliverLocal(n: BroadcastNotification) {
    if (deliveringIds.has(n.id)) return;
    deliveringIds.add(n.id);

    try {
      const { value: seenRaw } = await Preferences.get({ key: BROADCAST_SEEN_KEY });
      const seenIds = new Set(JSON.parse(seenRaw || '[]'));
      if (seenIds.has(n.id)) return;

      const title = n.title_ar || n.title_en || 'Islamic Light';
      const body = n.body_ar || n.body_en || 'Check the app for details.';
      const sendTime = new Date(n.send_at).getTime();
      const now = Date.now();
      const isFuture = sendTime > now;

      if (isNativeApp()) {
        const { isActive } = await CapacitorApp.getState();
        // Use 5000+ range for broadcasts to avoid collision with prayers (4000+) or offline (8000+)
        const notificationId = 5000 + (Math.abs(n.id.split('-').reduce((a, b) => a + b.charCodeAt(0), 0)) % 1000);

        const notificationPayload = {
          id: notificationId,
          title,
          body,
          channelId: BROADCAST_CHANNEL_ID,
          extra: { 
            nId: n.id,
            notif_title: title,
            notif_body: body
          }
        };

        if (isFuture) {
          console.log('BNService: Scheduling future broadcast for:', n.send_at);
          await LocalNotifications.schedule({
            notifications: [{
              ...notificationPayload,
              schedule: { at: new Date(sendTime), allowWhileIdle: true },
            }]
          });
        } else {
          // Past notification
          if (!isActive) {
            console.log('BNService: App is closed, showing local banner for:', n.id);
            await LocalNotifications.schedule({
              notifications: [{
                ...notificationPayload,
                schedule: { at: new Date(now + 500), allowWhileIdle: true },
              }]
            });
          } else {
            console.log('BNService: App is active, showing in-app banner for:', n.id);
            import('../store/notificationStore').then(({ useNotificationStore }) => {
              useNotificationStore.getState().setActiveNotification({ title, body });
            });
          }
        }
      }

      seenIds.add(n.id);
      await Preferences.set({ key: BROADCAST_SEEN_KEY, value: JSON.stringify(Array.from(seenIds)) });

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          await postService.markBroadcastDelivered(n.id, session.user.id);
        }
      } catch (e) {
        console.warn('BNService: Failed to mark delivered in DB', e);
      }
    } finally {
      deliveringIds.delete(n.id);
    }
  },

  async syncPending() {
    console.log('BNService: syncPending starting...');
    const { data, error } = await supabase
      .from('broadcast_notifications')
      .select('*')
      .eq('is_active', true)
      .order('send_at', { ascending: false })
      .limit(30);

    if (error || !data) return;

    const { value: seenRaw } = await Preferences.get({ key: BROADCAST_SEEN_KEY });
    const seenIds = new Set(JSON.parse(seenRaw || '[]'));

    const { value: refDateStr } = await Preferences.get({ key: INSTALL_REF_DATE_KEY });
    const refDate = refDateStr ? new Date(refDateStr).getTime() : 0;

    const unseen = (data as BroadcastNotification[]).filter(n => {
      if (seenIds.has(n.id)) {
        console.log('BNService: Notification already seen:', n.id);
        return false;
      }
      const sendTime = new Date(n.send_at).getTime();
      const tooOld = sendTime <= refDate;
      if (tooOld) {
        console.log('BNService: Notification too old for this install:', n.id, n.send_at);
        return false;
      }
      return true;
    });

    console.log(`BNService: Final unread count for delivery: ${unseen.length}`);
    for (const n of unseen) {
      await broadcastNotificationService.deliverLocal(n);
    }
  }
};