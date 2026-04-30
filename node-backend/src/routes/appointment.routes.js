import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    bookAppointment,
    getPatientAppointments,
    getDoctorAppointments,
    getAllAppointments,
    updateAppointmentStatus,
    setAvailability,
    getAvailability,
    updateDoctorSettings,
    getDoctorSettings
} from "../controllers/appointment.controller.js";

const router = Router();

// Public route — patients need to see doctor settings without auth token
router.route("/doctor-settings/:doctorId").get(getDoctorSettings);

// Routes needing auth
router.use(verifyJWT); 

router.route("/book").post(bookAppointment);
router.route("/patient").get(getPatientAppointments);
router.route("/doctor").get(getDoctorAppointments);
router.route("/all").get(getAllAppointments);
router.route("/status/:appointmentId").patch(updateAppointmentStatus);

// Availability
router.route("/availability").post(setAvailability);
router.route("/availability/:doctorId").get(getAvailability);

// Doctor availability settings (saves to Doctor model)
router.route("/doctor-settings").patch(updateDoctorSettings);

export default router;

