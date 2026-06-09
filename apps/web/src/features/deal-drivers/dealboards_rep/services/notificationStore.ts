// Simple client-side notification store that persists across manager → rep views.
// Uses localStorage so notifications survive refreshes and work across tabs.

import type { Notification } from '../types/deal-boards.types';

const STORAGE_KEY = 'ri_notifications_v1';

function loadFromStorage(): Notification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Notification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: Notification[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore storage errors (e.g. quota exceeded)
  }
}

/** Add a notification from the manager view. */
export function addNotification(notification: Notification) {
  const current = loadFromStorage();
  // Prevent exact duplicates within the same minute
  const isDuplicate = current.some(
    (n) =>
      n.message === notification.message &&
      n.type === notification.type &&
      Math.abs(new Date(n.timestamp).getTime() - new Date(notification.timestamp).getTime()) < 60000
  );
  if (isDuplicate) return;

  const next = [notification, ...current];
  saveToStorage(next);
}

/** Get all stored notifications. */
export function getStoredNotifications(): Notification[] {
  return loadFromStorage();
}

/** Mark all stored notifications as read. */
export function markAllStoredRead() {
  const current = loadFromStorage();
  const next = current.map((n) => ({ ...n, read: true }));
  saveToStorage(next);
}

/** Clear stored notifications (useful for testing). */
export function clearStoredNotifications() {
  saveToStorage([]);
}
