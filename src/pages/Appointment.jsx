import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import "../styles/form.css";
import { addNotification } from "../utils/notifications";
import api from "../api";
import {
  CalendarDays, AlertTriangle, MapPin, Locate,
  CheckCircle, XCircle, Stethoscope, Clock
} from "lucide-react";

// ─── Slot generation helper (same logic as appointmentService but runs client-side) ─
function generateTimeSlots(start, end, duration) {
  const slots = [];
  let current = new Date(`2000-01-01T${start}:00`);
  const endTime = new Date(`2000-01-01T${end}:00`);
  while (current < endTime) {
    const next = new Date(current.getTime() + duration * 60000);
    if (next > endTime) break;
    const fmt = (d) => d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
    slots.push(`${fmt(current)} - ${fmt(next)}`);
    current = next;
  }
  return slots;
}

// ─── Reusable Field ───────────────────────────────────────────────────────────
function Field({ id, label, required, error, hint, children, counter, style }) {
  return (
    <div className="rhf-field" style={style}>
      <label className="rhf-label" htmlFor={id}>
        {label} {required && <span className="req">*</span>}
      </label>
      {children}
      {counter}
      {error ? <span className="rhf-error">{error}</span> : hint ? <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{hint}</span> : null}
    </div>
  );
}

// ─── Appointment Page ─────────────────────────────────────────────────────────
export default function Appointment() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedDoctor = location.state?.doctorName || null;
  const selectedDoctorEmail = location.state?.doctorEmail || null;
  const selectedDoctorId = location.state?.doctorId || null; // Doctor model _id
  const [loggedUser, setLoggedUser] = useState(null);
  const [locationText, setLocationText] = useState("");
  const [locationCoords, setLocationCoords] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [generatedToken, setGeneratedToken] = useState(null);
  const [consultationMode, setConsultationMode] = useState("Physical Visit");
  const [doctorSettings, setDoctorSettings] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    setError,
    clearErrors,
    formState: { errors, isSubmitting, isValid, isDirty, isSubmitted },
  } = useForm({ mode: "onSubmit", reValidateMode: "onChange" });

  const dateValue = watch("date");
  const reasonValue = watch("reason", "");
  const MAX_REASON = 300;

  const detectLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("error");
      return;
    }
    setLocationStatus("detecting");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocationCoords({ latitude, longitude });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`, { headers: { "Accept-Language": "en" } });
          const data = await res.json();
          const a = data.address || {};
          const parts = [
            a.road || a.pedestrian || a.footway || "",
            a.neighbourhood || a.suburb || "",
            a.city || a.town || a.village || a.county || "",
            a.state || "",
            a.postcode ? `- ${a.postcode}` : ""
          ].filter(Boolean);
          setLocationText(parts.join(", "));
          setLocationStatus("done");
        } catch { 
           setLocationText(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`); 
           setLocationStatus("done"); 
        }
      },
      () => setLocationStatus("error"),
      { timeout: 8000 }
    );
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) { navigate("/login"); return; }
    const user = JSON.parse(userStr);
    if (user.role !== "patient") { alert("Only patients can book appointments."); navigate("/"); return; }
    setLoggedUser(user);
    setValue("name", user.name || "");
    setValue("email", user.email || "");
    if (user.mobileNo) setValue("phone", user.mobileNo);
    trigger(["name", "email"]);

    detectLocation();
  }, [navigate, setValue, trigger]);

  // Fetch doctor availability settings from backend when doctorId available
  useEffect(() => {
    if (!selectedDoctorId) return;
    const fetchSettings = async () => {
      try {
        const res = await api.get(`/appointments/doctor-settings/${selectedDoctorId}`);
        setDoctorSettings(res.data.data?.settings || null);
      } catch (err) {
        console.error("Failed to fetch doctor settings:", err);
      }
    };
    fetchSettings();
  }, [selectedDoctorId]);

  // Generate slots when date changes + fetch booked counts from backend
  useEffect(() => {
    if (!selectedDoctorId || !dateValue || !doctorSettings) return;

    const loadSlots = async () => {
      setSlotsLoading(true);
      try {
        // Check if selected day is a working day
        const dayOfWeek = new Date(dateValue).toLocaleDateString("en-US", { weekday: "long" });
        if (!doctorSettings.days?.includes(dayOfWeek)) {
          setAvailableSlots([]);
          setSlotsLoading(false);
          return;
        }

        // Generate time slots from settings
        let allSlots = [];
        if (doctorSettings.morning?.enabled) {
          allSlots = [...allSlots, ...generateTimeSlots(doctorSettings.morning.start, doctorSettings.morning.end, doctorSettings.slotDuration)];
        }
        if (doctorSettings.evening?.enabled) {
          allSlots = [...allSlots, ...generateTimeSlots(doctorSettings.evening.start, doctorSettings.evening.end, doctorSettings.slotDuration)];
        }

        // Fetch booked counts from backend
        const res = await api.get(`/appointments/doctor-settings/${selectedDoctorId}?date=${dateValue}`);
        const bookedCounts = res.data.data?.bookedCounts || {};
        const capacity = doctorSettings.capacityPerSlot || 2;

        const slotsWithStatus = allSlots.map(time => {
          const count = bookedCounts[time] || 0;
          const ratio = count / capacity;
          let status = "normal";
          if (ratio >= 1) status = "booked";
          else if (ratio >= 0.5) status = "half";
          return { time, count, capacity, status };
        });

        setAvailableSlots(slotsWithStatus);
        setSelectedSlot(null);
        setValue("time", "");
      } catch (err) {
        console.error("Failed to load slots:", err);
        setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };
    loadSlots();
  }, [selectedDoctorId, dateValue, doctorSettings, setValue]);

  const fs = (name) => {
    const hasError = !!errors[name];
    return {
      cls: `rhf-input${!isSubmitted ? "" : hasError ? " invalid" : " valid"}`,
      error: isSubmitted ? errors[name]?.message : null,
      valid: isSubmitted && !hasError,
    };
  };

  const onSubmit = async (data) => {
    if (!selectedSlot) {
      setError("time", { type: "required", message: "Please select a time slot" });
      return;
    }
    clearErrors();

    try {
      // Book via backend API
      const res = await api.post("/appointments/book", {
        doctorId: selectedDoctorId,
        date: data.date,
        time: selectedSlot.time,
        reason: data.reason,
        appointmentType: consultationMode,
        ...(locationStatus === "done" && locationText ? { location: locationText } : {}),
        ...(locationStatus === "done" && locationCoords ? { locationCoords } : {}),
      });

      const appointment = res.data.data;
      const token = appointment.tokenNumber || (selectedSlot.count + 1);

      addNotification(data.email, {
        icon: "📅",
        type: "appointment_booked",
        message: `Your appointment request for ${data.date} at ${selectedSlot.time} has been sent. Your Token is #${token}.`,
      });

      setGeneratedToken(token);
      setSubmitStatus("success");
    } catch (err) {
      console.error("Failed to book appointment:", err);
      alert(err.response?.data?.message || "Failed to book appointment. Please try again.");
    }
  };

  const prefillStyle = { width: "100%", padding: "11px 40px 11px 14px", borderRadius: "10px", border: "2px solid #c7d2fe", fontSize: "0.95rem", background: "#eef2ff", color: "#3730a3", outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
  const remaining = MAX_REASON - reasonValue.length;
  const counterClass = remaining < 20 ? "rhf-char-counter over" : remaining < 50 ? "rhf-char-counter warn" : "rhf-char-counter";

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f5f7fa,#e8edf5)", padding: "2rem 1rem", fontFamily: "'Segoe UI',sans-serif" }}>
      <div style={{ maxWidth: "650px", margin: "0 auto" }}>
        <div style={{ background: "white", borderRadius: "24px", boxShadow: "0 12px 45px rgba(0,0,0,0.12)", overflow: "hidden", position: "relative" }}>

          {/* Header */}
          <div style={{ background: "linear-gradient(135deg,#0d47a1,#1565c0)", padding: "2rem", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem" }}>
              <CalendarDays size={52} color="white" strokeWidth={1.8} />
            </div>
            <h2 style={{ color: "white", margin: 0, fontSize: "1.6rem" }}>Book an Appointment</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", margin: "0.4rem 0 0", fontSize: "0.9rem" }}>Select a date and choose an available slot</p>
          </div>

          <div style={{ padding: "2rem" }}>
            {selectedDoctor && (
              <div style={{ background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: "10px", padding: "10px 14px", marginBottom: "1.25rem", color: "#1d4ed8", fontSize: "0.88rem", display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                <Stethoscope size={16} strokeWidth={2} />
                <span>Booking with <strong>Dr. {selectedDoctor}</strong></span>
              </div>
            )}

            {submitStatus === "success" ? (
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                <div style={{ width: 80, height: 80, background: "#dcfce7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                  <CheckCircle size={44} color="#15803d" />
                </div>
                <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#111827", margin: "0 0 0.5rem" }}>Booking Successful! 🎉</h2>
                <p style={{ color: "#6b7280", margin: "0 0 2rem" }}>Your appointment with Dr. {selectedDoctor} has been secured.</p>
                
                <div style={{ background: "#f0f7ff", border: "2px dashed #bfdbfe", borderRadius: 20, padding: "2rem", marginBottom: "2rem" }}>
                   <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 800, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "1px" }}>Your Token Number</p>
                   <h1 style={{ margin: "0.5rem 0", fontSize: "3.5rem", fontWeight: 900, color: "#1e3a8a" }}>Token #{generatedToken}</h1>
                   <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#1e40af", fontSize: "0.9rem", fontWeight: 600 }}>
                      <Clock size={16} /> <span>{dateValue} at {selectedSlot?.time}</span>
                   </div>
                </div>

                <button 
                  onClick={() => navigate("/profile")}
                  style={{ width: "100%", padding: "1.1rem", borderRadius: 15, border: "none", background: "#0d47a1", color: "white", fontSize: "1.1rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 20px rgba(13, 71, 161, 0.3)" }}
                >
                  Confirm & Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <Field id="name" label="Full Name" required><input id="name" type="text" readOnly style={prefillStyle} {...register("name")} /></Field>
                  <Field id="email" label="Email Address" required><input id="email" type="email" readOnly style={prefillStyle} {...register("email")} /></Field>
                </div>

                <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
                         <MapPin size={16} color="#1565c0" /> Current Location
                      </label>
                      <button 
                        type="button" 
                        onClick={detectLocation}
                        disabled={locationStatus === "detecting"}
                        style={{ background: "none", border: "none", color: "#1565c0", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
                      >
                         {locationStatus === "detecting" ? "Detecting..." : "Re-detect"}
                      </button>
                   </div>
                   {locationStatus === "detecting" ? (
                      <div style={{ fontSize: "0.85rem", color: "#64748b", display: "flex", alignItems: "center", gap: 8 }}>
                         <div className="rhf-spinner" style={{ width: 14, height: 14, border: "2px solid #e2e8f0", borderTopColor: "#1565c0" }} />
                         Detecting your clinic/home location...
                      </div>
                   ) : locationStatus === "done" ? (
                      <div style={{ fontSize: "0.88rem", color: "#1e293b", fontWeight: 500 }}>
                         📍 {locationText || "Location captured"}
                      </div>
                   ) : (
                      <div style={{ fontSize: "0.85rem", color: "#ef4444" }}>
                         ⚠️ Location detection failed. Please enable location access.
                      </div>
                   )}
                </div>

                <Field label="Consultation Mode" required>
                   <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <button 
                        type="button" 
                        onClick={() => setConsultationMode("Physical Visit")}
                        style={{
                           padding: "1rem", borderRadius: 12, border: "2px solid",
                           borderColor: consultationMode === "Physical Visit" ? "#2962ff" : "#f1f5f9",
                           background: consultationMode === "Physical Visit" ? "#eef2ff" : "white",
                           color: consultationMode === "Physical Visit" ? "#1a237e" : "#64748b",
                           display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer",
                           transition: "all 0.2s", fontWeight: 800
                        }}
                      >
                         <MapPin size={20} />
                         <span>Physical Visit</span>
                         <span style={{ fontSize: "0.75rem", fontWeight: 600, opacity: 0.8 }}>₹500</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setConsultationMode("Video Call")}
                        style={{
                           padding: "1rem", borderRadius: 12, border: "2px solid",
                           borderColor: consultationMode === "Video Call" ? "#2962ff" : "#f1f5f9",
                           background: consultationMode === "Video Call" ? "#eef2ff" : "white",
                           color: consultationMode === "Video Call" ? "#1a237e" : "#64748b",
                           display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer",
                           transition: "all 0.2s", fontWeight: 800
                        }}
                      >
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z"></path><rect x="3" y="6" width="12" height="12" rx="2" ry="2"></rect></svg>
                         <span>Video Call</span>
                         <span style={{ fontSize: "0.75rem", fontWeight: 600, opacity: 0.8 }}>₹699</span>
                      </button>
                   </div>
                </Field>

                <Field id="date" label="1. Choose Date" required error={fs("date").error}>
                  <input id="date" type="date" className={fs("date").cls} min={new Date().toISOString().split("T")[0]}
                    {...register("date", { required: "Please select a date" })} />
                </Field>

                {dateValue && (
                  <Field label="2. Select Available Slot" required error={errors.time?.message}>
                    {slotsLoading ? (
                      <div style={{ padding: "1.5rem", textAlign: "center", color: "#64748b" }}>
                        <div className="rhf-spinner" style={{ width: 20, height: 20, border: "2px solid #e2e8f0", borderTopColor: "#1565c0", margin: "0 auto 8px" }} />
                        Loading available slots...
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.75rem", marginTop: "0.5rem" }}>
                        {availableSlots.length > 0 ? availableSlots.map((slot, idx) => {
                          const isSelected = selectedSlot?.time === slot.time;
                          const isFull = slot.status === "booked";
                          const getColors = () => {
                            if (isFull) return { bg: "#fee2e2", border: "#fecaca", text: "#ef4444" };
                            if (slot.status === "half") return { bg: "#fef3c7", border: "#fde68a", text: "#b45309" };
                            return { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d" };
                          };
                          const colors = getColors();
                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={isFull}
                              onClick={() => { setSelectedSlot(slot); clearErrors("time"); }}
                              style={{
                                padding: "0.75rem", borderRadius: 12, border: `2px solid ${isSelected ? "#0d47a1" : colors.border}`,
                                background: isSelected ? "#0d47a1" : colors.bg,
                                color: isSelected ? "white" : colors.text,
                                cursor: isFull ? "not-allowed" : "pointer",
                                transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                                opacity: isFull ? 0.6 : 1, transform: isSelected ? "scale(1.03)" : "scale(1)"
                              }}
                            >
                              <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>{slot.time}</span>
                              <span style={{ fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase" }}>
                                {isFull ? "Full" : `${slot.count}/${slot.capacity} Booked`}
                              </span>
                            </button>
                          );
                        }) : (
                          <div style={{ gridColumn: "1/-1", padding: "1.5rem", background: "#f8fafc", borderRadius: 12, textAlign: "center", color: "#64748b" }}>
                            <AlertTriangle size={24} style={{ marginBottom: 8 }} />
                            <p style={{ margin: 0, fontSize: "0.9rem" }}>
                              {doctorSettings ? "Doctor is not available on this day. Please choose another date." : "This doctor hasn't set up availability yet."}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </Field>
                )}

                <Field id="reason" label="Reason for Visit" required error={fs("reason").error} counter={<span className={counterClass}>{reasonValue.length}/{MAX_REASON}</span>}>
                  <textarea id="reason" rows="3" placeholder="Describe your symptoms..." className={fs("reason").cls} {...register("reason", { required: "Please enter reason", minLength: { value: 10, message: "Min 10 chars" } })} />
                </Field>

                <button type="submit" disabled={isSubmitting} className="rhf-submit-btn" style={{ background: "linear-gradient(135deg,#0d47a1,#1565c0)", color: "white", marginTop: "0.5rem" }}>
                  {isSubmitting ? <div className="rhf-spinner" /> : "Confirm & Pay ₹500"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
