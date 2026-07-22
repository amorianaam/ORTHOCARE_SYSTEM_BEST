import { create } from 'zustand';

const useSocketStore = create((set) => ({
  latestPatientEvent: null,
  latestLabEvent: null,
  latestRadiologyEvent: null,
  latestSilentUpdate: null,
  notifications: [],
  unreadCount: 0,

  setSilentUpdate: (event) => set({ latestSilentUpdate: { ...event, timestamp: Date.now() } }),

  addNotification: (event) => set((state) => {
    const newEvent = { ...event, timestamp: Date.now(), id: Math.random().toString(36).substr(2, 9) };
    const updatedNotifications = [newEvent, ...state.notifications].slice(0, 50);
    return { notifications: updatedNotifications, unreadCount: state.unreadCount + 1 };
  }),

  markAllAsRead: () => set({ unreadCount: 0 }),
  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
  clearAllNotifications: () => set({ notifications: [], unreadCount: 0 }),
  deleteNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id),
    unreadCount: Math.max(0, state.unreadCount - (state.notifications.find(n => n.id === id)?.read ? 0 : 1))
  })),

  setPatientEvent: (event) => set((state) => {
    const newEvent = { ...event, timestamp: Date.now(), id: Math.random().toString(36).substr(2, 9) };
    const updatedNotifications = [newEvent, ...state.notifications].slice(0, 50);
    return { latestPatientEvent: newEvent, notifications: updatedNotifications, unreadCount: state.unreadCount + 1 };
  }),
  setLabEvent: (event) => set((state) => {
    const newEvent = { ...event, timestamp: Date.now(), id: Math.random().toString(36).substr(2, 9) };
    const updatedNotifications = [newEvent, ...state.notifications].slice(0, 50);
    return { latestLabEvent: newEvent, notifications: updatedNotifications, unreadCount: state.unreadCount + 1 };
  }),
  setRadiologyEvent: (event) => set((state) => {
    const newEvent = { ...event, timestamp: Date.now(), id: Math.random().toString(36).substr(2, 9) };
    const updatedNotifications = [newEvent, ...state.notifications].slice(0, 50);
    return { latestRadiologyEvent: newEvent, notifications: updatedNotifications, unreadCount: state.unreadCount + 1 };
  }),
}));

export default useSocketStore;
