// ─── Notification Utility ─────────────────────────────────────────────────────
// All notifications are stored in MongoDB and fetched via the API.
// Uses the shared `api` axios instance which sends cookies (JWT) automatically.
//
// Notification shape (from backend):
//   { _id, icon, type, message, read, readAt, createdAt }

import api from "../api";

/** Get all notifications for the current logged-in user */
export async function getNotifications() {
  try {
    const res = await api.get("/notifications");
    return res.data?.data ?? [];
  } catch {
    return [];
  }
}

/** Mark a single notification as read (by MongoDB _id) */
export async function markRead(id) {
  try {
    await api.patch(`/notifications/${id}/read`);
    window.dispatchEvent(new Event("notifications_updated"));
  } catch (e) {
    console.error("markRead error:", e.message);
  }
}

/** Mark all notifications as read */
export async function markAllRead() {
  try {
    await api.patch("/notifications/read-all");
    window.dispatchEvent(new Event("notifications_updated"));
  } catch (e) {
    console.error("markAllRead error:", e.message);
  }
}

/**
 * addNotification – kept for backward compatibility.
 * No-op: all notifications are now created server-side inside controllers.
 */
export function addNotification(_email, _payload) {
  // Intentional no-op. The backend creates notifications directly.
}
