import { create } from 'zustand';

interface NotificationStore {
  activeNotification: { title: string; body: string } | null;
  setActiveNotification: (notification: { title: string; body: string } | null) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  activeNotification: null,
  setActiveNotification: (notification) => set({ activeNotification: notification }),
}));
