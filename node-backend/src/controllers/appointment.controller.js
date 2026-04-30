import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError }      from "../utils/ApiError.js";
import { ApiResponse }   from "../utils/ApiResponse.js";
import { Appointment }   from "../models/appointment.model.js";
import { Availability }  from "../models/availability.model.js";
import { Doctor }        from "../models/doctor.model.js";
import { User }          from "../models/user.model.js";
import { createNotification } from "./notification.controller.js";

const bookAppointment = asyncHandler(async (req, res) => {
    const { doctorId, date, time, reason, appointmentType, location, locationCoords } = req.body;
    
    if (!doctorId || !date || !time) {
        throw new ApiError(400, "Doctor, date and time are required");
    }

    // Calculate next token number for this doctor on this date
    const dailyAppointments = await Appointment.find({ doctorId, date });
    const maxToken = dailyAppointments.reduce((max, apt) => {
        const token = apt.tokenNumber || 0;
        return token > max ? token : max;
    }, 0);
    const tokenNumber = maxToken + 1;

    const appointment = await Appointment.create({
        patientId: req.user._id,
        doctorId,
        date,
        time,
        reason,
        appointmentType,
        location,
        locationCoords,
        tokenNumber
    });

    // Also mark the slot as booked in Availability if available (legacy logic)
    const availability = await Availability.findOne({ doctorId, date });
    if (availability) {
        const slot = availability.slots.find(s => s.time === time);
        if (slot) {
            slot.isBooked = true;
            await availability.save();
        }
    }

    // Notify the doctor about the new appointment
    const doctor = await Doctor.findById(doctorId).populate("user", "_id");
    if (doctor?.user?._id) {
        await createNotification({
            userId:  doctor.user._id,
            icon:    "📅",
            type:    "new_appointment",
            message: `New appointment booked for ${date} at ${time} — Token #${tokenNumber}.`,
        });
    }

    return res.status(201).json(new ApiResponse(201, appointment, "Appointment booked successfully"));
});

const getPatientAppointments = asyncHandler(async (req, res) => {
    const appointments = await Appointment.find({ patientId: req.user._id })
        .populate({
            path: "doctorId",
            populate: {
                path: "user",
                select: "name profileImage"
            }
        })
        .sort({ date: -1, time: -1 });

    return res.status(200).json(new ApiResponse(200, appointments, "Patient appointments fetched successfully"));
});

const getDoctorAppointments = asyncHandler(async (req, res) => {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
        throw new ApiError(404, "Doctor profile not found");
    }

    const appointments = await Appointment.find({ doctorId: doctor._id })
        .populate("patientId", "name gender dateOfBirth profileImage mobileNo email locationCoords")
        .sort({ date: 1, time: 1 });

    return res.status(200).json(new ApiResponse(200, appointments, "Doctor appointments fetched successfully"));
});

const getAllAppointments = asyncHandler(async (req, res) => {
    const appointments = await Appointment.find({})
        .populate({
            path: "doctorId",
            populate: { path: "user", select: "name" }
        })
        .populate("patientId", "name")
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, appointments, "All appointments fetched"));
});

const updateAppointmentStatus = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    const { status, notes } = req.body;

    if (!status) {
        throw new ApiError(400, "Status is required");
    }

    const appointment = await Appointment.findByIdAndUpdate(appointmentId, { status, notes }, { new: true });
    if (!appointment) {
        throw new ApiError(404, "Appointment not found");
    }

    // If cancelled, free up the slot
    if (status === "cancelled") {
        const availability = await Availability.findOne({ doctorId: appointment.doctorId, date: appointment.date });
        if (availability) {
            const slot = availability.slots.find(s => s.time === appointment.time);
            if (slot) {
                slot.isBooked = false;
                await availability.save();
            }
        }
    }

    // Notify the patient about the status change (non-blocking)
    const iconMap = { confirmed: "✅", completed: "🏁", cancelled: "🚫", rejected: "❌" };
    const msgMap  = {
        confirmed: `Your appointment on ${appointment.date} at ${appointment.time} has been CONFIRMED by the doctor. Token #${appointment.tokenNumber}.`,
        completed: `Your appointment on ${appointment.date} at ${appointment.time} is marked as COMPLETED. Hope you feel better! 🌟`,
        cancelled: `Your appointment on ${appointment.date} at ${appointment.time} has been CANCELLED.`,
        rejected:  `Your appointment on ${appointment.date} at ${appointment.time} was REJECTED. Please try a different slot.`,
    };
    if (msgMap[status]) {
        createNotification({
            userId:  appointment.patientId,
            icon:    iconMap[status] || "🔔",
            type:    "appointment_status",
            message: msgMap[status],
        }).catch(e => console.error("notify patient:", e.message));
    }

    return res.status(200).json(new ApiResponse(200, appointment, "Appointment status updated"));
});


const setAvailability = asyncHandler(async (req, res) => {
    const { date, slots } = req.body;
    
    if(!date || !slots || !Array.isArray(slots)){
        throw new ApiError(400, "Invalid availability data")
    }

    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
        throw new ApiError(404, "Doctor profile not found");
    }

    let availability = await Availability.findOne({ doctorId: doctor._id, date });
    
    if (availability) {
        // Merge or replace
        availability.slots = slots;
        await availability.save();
    } else {
        availability = await Availability.create({
            doctorId: doctor._id,
            date,
            slots
        });
    }

    return res.status(200).json(new ApiResponse(200, availability, "Availability updated"));
});

const getAvailability = asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const { date } = req.query;

    let query = { doctorId };
    if (date) {
        query.date = date;
    }

    const availability = await Availability.find(query);
    return res.status(200).json(new ApiResponse(200, availability, "Availability fetched"));
});

// ─── Save doctor availability settings (to Doctor model) ───────────────────
const updateDoctorSettings = asyncHandler(async (req, res) => {
    const { days, morning, evening, slotDuration, capacityPerSlot } = req.body;

    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
        throw new ApiError(404, "Doctor profile not found");
    }

    doctor.availabilitySettings = {
        days: days || doctor.availabilitySettings?.days,
        morning: morning || doctor.availabilitySettings?.morning,
        evening: evening || doctor.availabilitySettings?.evening,
        slotDuration: slotDuration || doctor.availabilitySettings?.slotDuration,
        capacityPerSlot: capacityPerSlot || doctor.availabilitySettings?.capacityPerSlot,
    };

    // Also update the legacy timing field for backward compat
    if (days && morning) {
        doctor.timing = {
            days,
            startTime: morning.start,
            endTime: evening?.enabled ? evening.end : morning.end,
        };
    }

    await doctor.save();
    return res.status(200).json(new ApiResponse(200, doctor.availabilitySettings, "Availability settings updated"));
});

// ─── Get a doctor's availability settings + booked counts (public) ─────────
const getDoctorSettings = asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const { date } = req.query;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
        throw new ApiError(404, "Doctor not found");
    }

    const settings = doctor.availabilitySettings || {
        days: ["Monday","Tuesday","Wednesday","Thursday","Friday"],
        morning: { enabled: true, start: "09:00", end: "12:00" },
        evening: { enabled: true, start: "17:00", end: "20:00" },
        slotDuration: 60,
        capacityPerSlot: 2,
    };

    // If a date is provided, also return booked counts per slot
    let bookedCounts = {};
    if (date) {
        const appointments = await Appointment.find({
            doctorId,
            date,
            status: { $nin: ["cancelled", "rejected"] }
        });
        appointments.forEach(apt => {
            bookedCounts[apt.time] = (bookedCounts[apt.time] || 0) + 1;
        });
    }

    return res.status(200).json(new ApiResponse(200, { settings, bookedCounts }, "Doctor settings fetched"));
});

export {
    bookAppointment,
    getPatientAppointments,
    getDoctorAppointments,
    getAllAppointments,
    updateAppointmentStatus,
    setAvailability,
    getAvailability,
    updateDoctorSettings,
    getDoctorSettings
};

