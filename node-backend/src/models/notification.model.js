import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    icon: {
      type: String,
      default: "🔔",
    },
    type: {
      type: String,
      default: "general",
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    // When read is set to true, readAt is stamped.
    // MongoDB TTL index fires expireAfterSeconds=604800 (7 days) after readAt.
    // Unread notifications have readAt=null and are NEVER auto-deleted.
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ── TTL index: delete 7 days after the notification is read ──────────────────
// Only fires when readAt is not null (i.e. notification has been marked read).
notificationSchema.index({ readAt: 1 }, { expireAfterSeconds: 604800 });

export const Notification = mongoose.model("Notification", notificationSchema);
