import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError }      from "../utils/ApiError.js";
import { ApiResponse }   from "../utils/ApiResponse.js";
import { Notification }  from "../models/notification.model.js";

// ── Internal helper (called by other controllers, NOT an HTTP route) ──────────
/**
 * createNotification({ userId, icon, type, message })
 * Silently swallows errors so it never breaks the parent request.
 */
export async function createNotification({ userId, icon = "🔔", type = "general", message }) {
  try {
    if (!userId || !message) return;

    // Deduplicate: skip if an identical unread notification was created < 60 s ago
    const cutoff = new Date(Date.now() - 60_000);
    const exists = await Notification.findOne({ userId, message, read: false, createdAt: { $gte: cutoff } });
    if (exists) return;

    await Notification.create({ userId, icon, type, message });
  } catch (err) {
    console.error("[createNotification] error:", err.message);
  }
}

// ── GET /api/v1/notifications ─────────────────────────────────────────────────
export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(100);

  return res.status(200).json(new ApiResponse(200, notifications, "Notifications fetched"));
});

// ── PATCH /api/v1/notifications/:id/read ─────────────────────────────────────
export const markReadOne = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const notif = await Notification.findOneAndUpdate(
    { _id: id, userId: req.user._id },
    { read: true, readAt: new Date() },
    { new: true }
  );
  if (!notif) throw new ApiError(404, "Notification not found");
  return res.status(200).json(new ApiResponse(200, notif, "Marked as read"));
});

// ── PATCH /api/v1/notifications/read-all ─────────────────────────────────────
export const markReadAll = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, read: false },
    { read: true, readAt: new Date() }
  );
  return res.status(200).json(new ApiResponse(200, {}, "All notifications marked as read"));
});
