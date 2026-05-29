import Booking, { BOOKING_STATUSES } from "../models/booking.js";

export const CANCELLED_RETENTION_DAYS = 15;
export const CANCELLED_RETENTION_MS =
  CANCELLED_RETENTION_DAYS * 24 * 60 * 60 * 1000;

function cancelledBefore() {
  return new Date(Date.now() - CANCELLED_RETENTION_MS);
}

/** Remove cancelled/rejected bookings older than 15 days. */
export async function pruneOldCancelledBookings() {
  const cutoff = cancelledBefore();
  const terminalStatuses = [
    BOOKING_STATUSES.CANCELLED,
    BOOKING_STATUSES.REJECTED,
  ];

  const result = await Booking.deleteMany({
    status: { $in: terminalStatuses },
    $or: [
      { cancelledAt: { $lt: cutoff } },
      {
        cancelledAt: { $exists: false },
        updatedAt: { $lt: cutoff },
      },
    ],
  });

  return { bookingsDeleted: result.deletedCount };
}
