
/**
 * appointmentService.js
 * Handles localStorage logic for dynamic availability and token generation.
 */

const STORAGE_KEYS = {
  AVAILABILITY: "doctor_availability",
  APPOINTMENTS: "appointments"
};

/**
 * Get availability settings for a specific doctor.
 * Falls back to default if not set.
 */
export const getDoctorAvailability = (doctorEmail) => {
  const allAvailability = JSON.parse(localStorage.getItem(STORAGE_KEYS.AVAILABILITY) || "{}");
  return allAvailability[doctorEmail] || null;
};

/**
 * Save availability settings for a doctor.
 */
export const saveDoctorAvailability = (doctorEmail, settings) => {
  const allAvailability = JSON.parse(localStorage.getItem(STORAGE_KEYS.AVAILABILITY) || "{}");
  allAvailability[doctorEmail] = settings;
  localStorage.setItem(STORAGE_KEYS.AVAILABILITY, JSON.stringify(allAvailability));
};

/**
 * Helper to generate time slots based on start/end time and duration (in minutes).
 */
const generateTimeSlots = (start, end, duration) => {
  const slots = [];
  let current = new Date(`2000-01-01T${start}:00`);
  const endTime = new Date(`2000-01-01T${end}:00`);

  while (current < endTime) {
    const next = new Date(current.getTime() + duration * 60000);
    if (next > endTime) break;

    const timeString = current.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit"
    });
    const nextString = next.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit"
    });

    slots.push(`${timeString} - ${nextString}`);
    current = next;
  }
  return slots;
};

/**
 * Returns an array of available slots (Morning + Evening) for a doctor.
 */
export const getAvailableSlotsForDoctor = (doctorEmail) => {
  const settings = getDoctorAvailability(doctorEmail);
  if (!settings) return [];

  let morningSlots = [];
  if (settings.morning?.enabled) {
    morningSlots = generateTimeSlots(settings.morning.start, settings.morning.end, settings.slotDuration);
  }

  let eveningSlots = [];
  if (settings.evening?.enabled) {
    eveningSlots = generateTimeSlots(settings.evening.start, settings.evening.end, settings.slotDuration);
  }

  return [...morningSlots, ...eveningSlots];
};

/**
 * Calculates current bookings and color status for a slot.
 */
export const getSlotStatus = (doctorEmail, date, timeSlot) => {
  const settings = getDoctorAvailability(doctorEmail);
  if (!settings) return { count: 0, status: "normal" };

  const allAppointments = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPOINTMENTS) || "[]");
  const booked = allAppointments.filter(
    (apt) => apt.doctorEmail === doctorEmail && apt.date === date && apt.time === timeSlot && apt.status !== "rejected"
  ).length;

  const capacity = settings.capacityPerSlot || 1;
  const ratio = booked / capacity;

  let status = "normal"; // green
  if (ratio >= 1) {
    status = "booked"; // red
  } else if (ratio >= 0.5) {
    status = "half"; // yellow
  }

  return { count: booked, capacity, status };
};

/**
 * Generates the next sequential token number for a doctor on a specific date.
 */
export const getNextTokenNumber = (doctorEmail, date) => {
  const allAppointments = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPOINTMENTS) || "[]");
  const dailyAppointments = allAppointments.filter(
    (apt) => apt.doctorEmail === doctorEmail && apt.date === date
  );

  // Find maximum token number used so far
  const maxToken = dailyAppointments.reduce((max, apt) => {
    const token = parseInt(apt.tokenNumber) || 0;
    return token > max ? token : max;
  }, 0);

  return maxToken + 1;
};
