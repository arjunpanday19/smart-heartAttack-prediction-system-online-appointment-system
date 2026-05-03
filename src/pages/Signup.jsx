import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import "../styles/form.css";
import { addNotification } from "../utils/notifications";
import api from "../api.js";

// ─── Password Strength Meter ──────────────────────────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: "Too weak", color: "#ef4444", pct: "20%" },
    { label: "Weak",     color: "#f97316", pct: "40%" },
    { label: "Fair",     color: "#eab308", pct: "60%" },
    { label: "Good",     color: "#22c55e", pct: "80%" },
    { label: "Strong",   color: "#16a34a", pct: "100%" },
  ];
  const lvl = levels[Math.min(score, 4)];

  return (
    <div style={{ marginTop: "4px" }}>
      <div className="pwd-strength-bar">
        <div className="pwd-strength-fill" style={{ width: lvl.pct, background: lvl.color }} />
      </div>
      <p style={{ fontSize: "0.75rem", color: lvl.color, margin: "3px 0 0", fontWeight: 600 }}>
        Password strength: {lvl.label}
      </p>
    </div>
  );
}

// ─── Reusable Field ───────────────────────────────────────────────────────────
function Field({ id, label, required, error, hint, children, counter }) {
  return (
    <div className="rhf-field">
      <label className="rhf-label" htmlFor={id}>
        {label} {required && <span className="req">*</span>}
      </label>
      {children}
      {counter}
      {error ? <span className="rhf-error">{error}</span> : hint ? <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{hint}</span> : null}
    </div>
  );
}

// ─── Signup Page ──────────────────────────────────────────────────────────────
// Helper: convert File to base64 string (kept for backward compatibility or preview if needed)
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Section divider helper
function SectionHead({ icon, title }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      margin: "1.5rem 0 0.75rem",
      paddingBottom: "0.5rem",
      borderBottom: "2px solid #e0e7ff",
    }}>
      <span style={{ fontSize: "1.1rem" }}>{icon}</span>
      <span style={{ fontWeight: 800, color: "#0d47a1", fontSize: "0.92rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</span>
    </div>
  );
}

// Reusable document upload box (image or PDF)
function DocUpload({ fileObj, valuePreview, error, placeholder, onUpload, onRemove }) {
  const isPdf = fileObj && fileObj.type === "application/pdf";
  const isImg = fileObj && fileObj.type.startsWith("image/");
  return (
    <div style={{
      border: `2px dashed ${error ? "#ef4444" : fileObj ? "#22c55e" : "#c7d2fe"}`,
      borderRadius: 12, padding: "1rem", textAlign: "center",
      background: fileObj ? "#f0fdf4" : "#fafbff", transition: "all 0.2s",
    }}>
      {fileObj ? (
        <div>
          {isImg && <img src={valuePreview} alt="doc" style={{ maxHeight: 90, maxWidth: "100%", borderRadius: 8, objectFit: "contain" }} />}
          {isPdf && <div style={{ fontSize: "2.5rem" }}>📄</div>}
          <p style={{ margin: "6px 0 0", fontSize: "0.78rem", color: "#15803d", fontWeight: 600 }}>
            ✅ {isPdf ? "PDF uploaded" : "Image uploaded"}
          </p>
          <button type="button" onClick={onRemove}
            style={{ marginTop: 6, fontSize: "0.75rem", color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
            ✕ Remove
          </button>
        </div>
      ) : (
        <label style={{ cursor: "pointer", display: "block" }}>
          <div style={{ fontSize: "1.8rem", marginBottom: 6 }}>📁</div>
          <p style={{ margin: 0, fontSize: "0.83rem", color: "#6b7280" }}>
            {placeholder}<br /><span style={{ fontSize: "0.75rem" }}>(JPG, PNG, PDF · max 5MB)</span>
          </p>
          <input type="file" accept="image/*,application/pdf" style={{ display: "none" }}
            onChange={e => { const f = e.target.files[0]; if (f) onUpload(f); }} />
        </label>
      )}
    </div>
  );
}

export default function Signup() {
  const navigate = useNavigate();
  const [role, setRole] = useState("patient");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successName, setSuccessName] = useState("");
  const [locationStatus, setLocationStatus] = useState("idle"); // idle | detecting | done | error
  const [locationCoords, setLocationCoords] = useState(null); // { latitude, longitude }
  // Doc file uploads
  const [docFiles, setDocFiles] = useState({
    profileImage: null,
    govtIdPhoto: null,
    medicalLicense: null,
    registrationCert: null,
  });
  const [docPreviews, setDocPreviews] = useState({});
  const [docErrors, setDocErrors] = useState({});

  // OTP States
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState("");
  const [isOtpSubmitting, setIsOtpSubmitting] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  useEffect(() => {
    const uStr = localStorage.getItem("user");
    // Redirect if user is already in localStorage and didn't just signup right now
    if (uStr && !showSuccess) {
      try {
        const u = JSON.parse(uStr);
        if (u.role === "doctor") navigate("/doctor-appointments");
        else if (u.role === "admin") navigate("/admin/dashboard");
        else navigate("/");
      } catch (e) {
        // Ignore parse error
      }
    }
  }, [navigate, showSuccess]);

  // ── Doctor active timing ──────────────────────────────────────────────────
  const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const [activeDays, setActiveDays] = useState(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [startTime, setStartTime]   = useState("09:00");
  const [endTime,   setEndTime]     = useState("17:00");
  const [timingError, setTimingError] = useState("");

  const toggleDay = (day) =>
    setActiveDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );



  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    trigger,
    reset,
    setValue,
    formState: { errors, isSubmitting, isValid, isDirty, isSubmitted },
  } = useForm({ mode: "onSubmit", reValidateMode: "onChange" });



  const password = watch("password", "");

  // ── Auto-detect location via Nominatim (OpenStreetMap) — free, no API key ──
  const autoDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocationStatus("detecting");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          setLocationCoords({ latitude, longitude });
          const data = await res.json();
          const a = data.address || {};
          // Build readable address parts
          const parts = [
            a.road || a.pedestrian || a.footway || "",
            a.neighbourhood || a.suburb || "",
            a.city || a.town || a.village || a.county || "",
            a.state || "",
          ].filter(Boolean);
          const readableAddress = parts.join(", ");
          const pincode = a.postcode || "";

          setValue("address", readableAddress, { shouldValidate: true, shouldDirty: true });
          if (pincode) setValue("pincode", pincode, { shouldValidate: true, shouldDirty: true });
          setLocationStatus("done");
        } catch {
          setLocationStatus("error");
          alert("Could not fetch address. Please enter manually.");
        }
      },
      () => {
        setLocationStatus("error");
        alert("Location access denied. Please enter your address manually.");
      },
      { timeout: 8000 }
    );
  };

  // Helper: compute field classes and state
  const fs = (name) => {
    const hasError = !!errors[name];
    return {
      cls: `rhf-input${!isSubmitted ? "" : hasError ? " invalid" : " valid"}`,
      error: isSubmitted ? errors[name]?.message : null,
      valid: isSubmitted && !hasError,
    };
  };

  const onSubmit = async (data) => {
    clearErrors();
    
    // Validate required doctor docs
    if (role === "doctor") {
      const errs = {};
      if (!docFiles.govtIdPhoto)      errs.govtIdPhoto      = "Govt ID photo is required";
      if (!docFiles.medicalLicense)   errs.medicalLicense   = "Medical license upload is required";
      if (!docFiles.registrationCert) errs.registrationCert = "Registration certificate is required";
      if (Object.keys(errs).length) { setDocErrors(errs); return; }
      // validate timing
      if (activeDays.length === 0) { setTimingError("Please select at least one available day."); return; }
      if (startTime >= endTime) { setTimingError("Start time must be before end time."); return; }
      setTimingError("");
    }
    setDocErrors({});

    try {
      const formData = new FormData();
      formData.append("fullName", data.fullName);
      formData.append("dateOfBirth", data.dateOfBirth);
      formData.append("gender", data.gender);
      formData.append("mobileNo", data.mobileNo);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("role", role);
      
      if (data.address) formData.append("address", data.address);
      if (data.pincode) formData.append("pincode", data.pincode);
      if (docFiles.profileImage) formData.append("profileImage", docFiles.profileImage);
      if (role === "doctor" && locationCoords) {
        formData.append("locationCoords", JSON.stringify(locationCoords));
      }

      if (role === "doctor") {
        formData.append("specialty", data.specialty);
        formData.append("timing", JSON.stringify({ days: activeDays, startTime, endTime }));
        formData.append("govtIdType", data.govtIdType || "aadhaar");
        formData.append("govtIdNumber", data.govtIdNumber);
        formData.append("medicalCouncil", data.medicalCouncil);
        formData.append("regYear", data.regYear);
        formData.append("medicalRegNumber", data.medicalRegNumber);
        
        if (docFiles.govtIdPhoto) formData.append("govtIdPhoto", docFiles.govtIdPhoto);
        if (docFiles.medicalLicense) formData.append("medicalLicense", docFiles.medicalLicense);
        if (docFiles.registrationCert) formData.append("registrationCert", docFiles.registrationCert);
      }

      const res = await api.post("/users/register", formData);
      
      setRegisteredEmail(data.email);
      setIsVerifying(true);
      
      addNotification(data.email, {
        icon: "✉️",
        type: "info",
        message: `An OTP has been sent to ${data.email}. Please verify to complete signup.`,
      });
      
    } catch (error) {
       console.error("Signup failed", error);
       const serverMessage = error.response?.data?.message;
       if (error.response?.status === 409) {
          setError("email", { type: "server", message: "This email is already registered. Please login instead." });
       } else if (error.response?.status === 400) {
          alert(serverMessage || "Please fill in all required fields.");
       } else if (!error.response) {
          alert("Cannot connect to server. Make sure the backend is running on port 8000.");
       } else {
          alert(serverMessage || "An error occurred during signup. Please try again.");
       }
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      alert("Please enter a valid 6-digit OTP");
      return;
    }

    setIsOtpSubmitting(true);
    try {
      const res = await api.post("/users/verify-otp", {
        email: registeredEmail,
        otp: otp
      });

      const verifiedUser = res.data.data.user;
      const token = res.data.data.accessToken;

      // Login the user
      localStorage.setItem("user", JSON.stringify(verifiedUser));
      if (verifiedUser.profileImage) {
        localStorage.setItem("profileImage", verifiedUser.profileImage);
      }
      if (token) localStorage.setItem("token", token);
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("auth-change"));

      addNotification(verifiedUser.email, {
        icon: "✅",
        type: "welcome",
        message: `Email verified! Welcome to Aurelyf Care, ${verifiedUser.name}.`,
      });

      setSuccessName(verifiedUser.name);
      setShowSuccess(true);
      setIsVerifying(false);
      setTimeout(() => navigate(role === "doctor" ? "/profile" : "/"), 2000);

    } catch (error) {
      console.error("Verification failed", error);
      alert(error.response?.data?.message || "Invalid OTP or verification failed.");
    } finally {
      setIsOtpSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await api.post("/users/resend-otp", { email: registeredEmail });
      alert("OTP resent successfully!");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to resend OTP.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo beating">❤️</div>
          <h1>Aurelyf Care</h1>
          <p>Create your account</p>
        </div>

        {/* Role toggle */}
        <div className="role-selection">
          <label className="role-option">
            <input type="radio" name="roleToggle" value="patient" checked={role === "patient"} onChange={e => { setRole(e.target.value); trigger(); }} />
            <span>👤 Patient</span>
          </label>
          <label className="role-option">
            <input type="radio" name="roleToggle" value="doctor" checked={role === "doctor"} onChange={e => { setRole(e.target.value); trigger(); }} />
            <span>👨‍⚕️ Doctor</span>
          </label>
        </div>

        {showSuccess ? (
          <div className="success-container">
            <div className="success-message-box">
              <div className="success-icon">✓</div>
              <h2>Thank You, {successName}!</h2>
              <p>Your account has been created and verified as a {role}.</p>
              {role === "doctor"
                ? <p className="redirect-text">Redirecting to your profile... (pending admin approval)</p>
                : <p className="redirect-text">Redirecting to home...</p>
              }
            </div>
          </div>
        ) : isVerifying ? (
          <div className="otp-container" style={{ textAlign: "center", padding: "20px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "15px" }}>📧</div>
            <h2>Verify Your Email</h2>
            <p style={{ color: "#666", marginBottom: "20px" }}>
              We've sent a 6-digit code to <strong>{registeredEmail}</strong>.<br/>
              Please enter it below to complete your registration.
            </p>
            <form onSubmit={handleVerifyOTP}>
              <div className="rhf-field">
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="rhf-input"
                  style={{ textAlign: "center", fontSize: "1.5rem", letterSpacing: "5px", fontWeight: "bold" }}
                  required
                />
              </div>
              <button
                type="submit"
                className="rhf-submit-btn"
                disabled={isOtpSubmitting}
                style={{ background: "linear-gradient(135deg,#0d47a1,#1565c0)", color: "white", marginTop: "20px" }}
              >
                {isOtpSubmitting ? <><div className="rhf-spinner" /> Verifying...</> : "Verify & Complete Signup"}
              </button>
            </form>
            <div style={{ marginTop: "20px", fontSize: "0.9rem" }}>
              Didn't receive the code?{" "}
              <button
                onClick={handleResendOTP}
                style={{ background: "none", border: "none", color: "#0d47a1", fontWeight: "bold", cursor: "pointer", textDecoration: "underline" }}
              >
                Resend OTP
              </button>
            </div>
            <button
              onClick={() => setIsVerifying(false)}
              style={{ background: "none", border: "none", color: "#666", marginTop: "15px", cursor: "pointer" }}
            >
              ← Back to Signup
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>

              {/* Doctor specialty dropdown */}
              {role === "doctor" && (() => { const f = fs("specialty"); return (
                <Field id="specialty" label="Medical Specialty" required error={f.error}>
                  <div className="rhf-input-wrap">
                    <select id="specialty"
                      className={`rhf-select${!isSubmitted ? "" : f.error ? " invalid" : " valid"}`}
                      {...register("specialty", {
                        required: role === "doctor" ? "Please select your medical specialty" : false,
                      })}>
                      <option value="">— Select Specialty —</option>

                      <optgroup label="General & Primary Care">
                        <option>General Physician</option>
                        <option>Family Medicine</option>
                        <option>Internal Medicine</option>
                        <option>Geriatrics</option>
                      </optgroup>

                      <optgroup label="Heart & Chest">
                        <option>Cardiologist</option>
                        <option>Cardiothoracic Surgeon</option>
                        <option>Pulmonologist</option>
                      </optgroup>

                      <optgroup label="Brain & Nervous System">
                        <option>Neurologist</option>
                        <option>Neurosurgeon</option>
                        <option>Psychiatrist</option>
                      </optgroup>

                      <optgroup label="Digestive System">
                        <option>Gastroenterologist</option>
                        <option>Hepatologist</option>
                        <option>Colorectal Surgeon</option>
                      </optgroup>

                      <optgroup label="Bones, Joints & Muscles">
                        <option>Orthopedic Surgeon</option>
                        <option>Rheumatologist</option>
                        <option>Sports Medicine</option>
                      </optgroup>

                      <optgroup label="Children & Women">
                        <option>Pediatrician</option>
                        <option>Neonatologist</option>
                        <option>Gynecologist / Obstetrician</option>
                        <option>Fertility Specialist</option>
                      </optgroup>

                      <optgroup label="Cancer">
                        <option>Medical Oncologist</option>
                        <option>Surgical Oncologist</option>
                        <option>Radiation Oncologist</option>
                        <option>Hematologist</option>
                      </optgroup>

                      <optgroup label="Skin, Eyes & ENT">
                        <option>Dermatologist</option>
                        <option>Ophthalmologist</option>
                        <option>ENT Specialist</option>
                      </optgroup>

                      <optgroup label="Hormones & Kidneys">
                        <option>Endocrinologist</option>
                        <option>Diabetologist</option>
                        <option>Nephrologist</option>
                        <option>Urologist</option>
                      </optgroup>

                      <optgroup label="Surgery">
                        <option>General Surgeon</option>
                        <option>Plastic Surgeon</option>
                        <option>Vascular Surgeon</option>
                        <option>Laparoscopic Surgeon</option>
                      </optgroup>

                      <optgroup label="Emergency & Critical Care">
                        <option>Emergency Medicine</option>
                        <option>Intensivist / ICU</option>
                        <option>Anesthesiologist</option>
                      </optgroup>

                      <optgroup label="Dental & Oral">
                        <option>Dentist</option>
                        <option>Orthodontist</option>
                        <option>Oral & Maxillofacial Surgeon</option>
                      </optgroup>

                      <optgroup label="Mental Health">
                        <option>Psychologist</option>
                        <option>Clinical Psychologist</option>
                        <option>Neuropsychiatrist</option>
                      </optgroup>

                      <optgroup label="Radiology & Pathology">
                        <option>Radiologist</option>
                        <option>Pathologist</option>
                        <option>Nuclear Medicine</option>
                      </optgroup>

                      <optgroup label="Other">
                        <option>Physiotherapist</option>
                        <option>Nutritionist / Dietitian</option>
                        <option>Ayurveda (BAMS)</option>
                        <option>Homeopathy</option>
                        <option>Other</option>
                      </optgroup>
                    </select>
                  </div>
                </Field>
              ); })()}


              {/* Profile Photo */}
              <div className="rhf-field">
                <label className="rhf-label">Profile Photo (Optional)</label>
                <div style={{
                  display: "flex", alignItems: "center", gap: "1rem"
                }}>
                  <div style={{
                    width: 70, height: 70, borderRadius: "50%", border: "2px dashed #c7d2fe",
                    display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                    background: docPreviews.profileImage ? "transparent" : "#fafbff"
                  }}>
                    {docPreviews.profileImage ? (
                      <img src={docPreviews.profileImage} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: "1.8rem" }}>👤</span>
                    )}
                  </div>
                  <label style={{
                    padding: "8px 16px", borderRadius: "20px", background: "#eef2ff", color: "#4338ca",
                    border: "1.5px solid #a5b4fc", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600
                  }}>
                    {docPreviews.profileImage ? "Change Photo" : "Upload Photo"}
                    <input type="file" accept="image/*" style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setDocFiles(p => ({ ...p, profileImage: file }));
                          setDocPreviews(p => ({ ...p, profileImage: URL.createObjectURL(file) }));
                        }
                      }} />
                  </label>
                  {docPreviews.profileImage && (
                    <button type="button" onClick={() => {
                      setDocFiles(p => ({ ...p, profileImage: null }));
                      setDocPreviews(p => ({ ...p, profileImage: null }));
                    }}
                      style={{ fontSize: "0.85rem", color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Full Name */}
              {(() => { const f = fs("fullName"); return (
                <Field id="fullName" label="Full Name" required error={f.error}>
                  <div className="rhf-input-wrap">
                    <input id="fullName" type="text" placeholder="Enter your full name" className={f.cls}
                      {...register("fullName", {
                        required: "Full name is required",
                        minLength: { value: 2, message: "Name must be at least 2 characters" },
                        pattern: { value: /^[a-zA-Z\s.'-]+$/, message: "Name can only contain letters, spaces, and hyphens" },
                      })} />
                  </div>
                </Field>
              ); })()}

              {/* Date of Birth */}
              {(() => { const f = fs("dateOfBirth"); return (
                <Field id="dateOfBirth" label="Date of Birth" required error={f.error}>
                  <div className="rhf-input-wrap">
                    <input id="dateOfBirth" type="date" className={f.cls}
                      {...register("dateOfBirth", {
                        required: "Date of birth is required",
                        validate: val => {
                          const dob = new Date(val);
                          const today = new Date();
                          const age = (today - dob) / (1000 * 60 * 60 * 24 * 365.25);
                          if (age < 1) return "Please enter a valid date of birth";
                          if (age > 120) return "Please enter a realistic date of birth";
                          return true;
                        },
                      })} />
                  </div>
                </Field>
              ); })()}

              {/* Gender */}
              {(() => { const f = fs("gender"); return (
                <Field id="gender" label="Gender" required error={f.error}>
                  <div className="rhf-input-wrap">
                    <select id="gender" className={`rhf-select${f.error ? " invalid" : f.valid ? " valid" : ""}`}
                      {...register("gender", { required: "Please select a gender" })}>
                      <option value="">— Select Gender —</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </Field>
              ); })()}

              {/* Mobile */}
              {(() => { const f = fs("mobileNo"); return (
                <Field id="mobileNo" label="Mobile Number" required error={f.error} hint="10-digit Indian mobile number">
                  <div className="rhf-input-wrap">
                    <input id="mobileNo" type="tel" placeholder="e.g. 9876543210" maxLength="10" className={f.cls}
                      {...register("mobileNo", {
                        required: "Mobile number is required",
                        pattern: { value: /^[6-9][0-9]{9}$/, message: "Enter a valid 10-digit mobile number starting with 6–9" },
                      })} />
                  </div>
                </Field>
              ); })()}

              {/* Address + Pincode — DOCTOR ONLY */}
              {role === "doctor" && (
                <>
                  {(() => { const f = fs("address"); return (
                    <Field id="address" label="Clinic / Hospital Address" required error={f.error} hint="Street, area, city, state">
                      <button
                        type="button"
                        onClick={autoDetectLocation}
                        disabled={locationStatus === "detecting"}
                        style={{
                          display: "flex", alignItems: "center", gap: "6px",
                          marginBottom: "8px", padding: "7px 14px",
                          background: locationStatus === "done" ? "#dcfce7" : "#eef2ff",
                          color: locationStatus === "done" ? "#15803d" : "#4338ca",
                          border: `1.5px solid ${locationStatus === "done" ? "#86efac" : "#a5b4fc"}`,
                          borderRadius: "20px", cursor: locationStatus === "detecting" ? "not-allowed" : "pointer",
                          fontSize: "0.82rem", fontWeight: 600, width: "fit-content", transition: "all 0.2s",
                        }}
                      >
                        {locationStatus === "detecting" ? (
                          <><span style={{ display: "inline-block", width: 13, height: 13, border: "2px solid #a5b4fc", borderTopColor: "#4338ca", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Detecting location...</>
                        ) : locationStatus === "done" ? <>✅ Location detected</> : <>📍 Auto-detect my location</>}
                      </button>
                      <div className="rhf-input-wrap">
                        <textarea
                          id="address" rows="3"
                          placeholder="e.g. 12, MG Road, Koramangala, Bangalore, Karnataka"
                          className={`rhf-textarea${f.error ? " invalid" : f.valid ? " valid" : ""}`}
                          style={{ resize: "vertical", padding: "11px 14px" }}
                          {...register("address", {
                            required: role === "doctor" ? "Clinic/hospital address is required" : false,
                            minLength: { value: 10, message: "Please enter a more complete address" },
                          })}
                        />
                      </div>
                    </Field>
                  ); })()}

                  {(() => { const f = fs("pincode"); return (
                    <Field id="pincode" label="Pincode" required error={f.error} hint="6-digit postal code">
                      <div className="rhf-input-wrap">
                        <input id="pincode" type="text" placeholder="e.g. 560034" maxLength="6"
                          className={f.cls}
                          {...register("pincode", {
                            required: role === "doctor" ? "Pincode is required" : false,
                            pattern: { value: /^[1-9][0-9]{5}$/, message: "Enter a valid 6-digit pincode" },
                          })}
                        />
                      </div>
                    </Field>
                  ); })()}

                  {/* ── Active Consultation Timing ── */}
                  <div style={{
                    background: "#f0f9ff", border: "1.5px solid #bae6fd",
                    borderRadius: 14, padding: "1rem 1.25rem",
                  }}>
                    <p style={{ margin: "0 0 10px", fontWeight: 800, color: "#0369a1", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.4px" }}>⏰ Active Consultation Timing</p>

                    <p style={{ margin: "0 0 8px", fontSize: "0.8rem", fontWeight: 700, color: "#374151" }}>Available Days <span style={{ color: "#e53935" }}>*</span></p>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                        <button
                          key={day} type="button"
                          onClick={() => toggleDay(day)}
                          style={{
                            padding: "5px 12px", borderRadius: 20, fontSize: "0.8rem", fontWeight: 700,
                            border: "1.5px solid",
                            borderColor: activeDays.includes(day) ? "#0284c7" : "#cbd5e1",
                            background: activeDays.includes(day) ? "#0284c7" : "white",
                            color: activeDays.includes(day) ? "white" : "#64748b",
                            cursor: "pointer", transition: "all 0.15s",
                          }}
                        >{day}</button>
                      ))}
                    </div>
                    {timingError && <p style={{ color: "#e53935", fontSize: "0.78rem", margin: "0 0 8px" }}>{timingError}</p>}

                    <p style={{ margin: "0 0 8px", fontSize: "0.8rem", fontWeight: 700, color: "#374151" }}>Consultation Hours <span style={{ color: "#e53935" }}>*</span></p>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <label style={{ fontSize: "0.72rem", color: "#6b7280", fontWeight: 600 }}>From</label>
                        <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                          style={{ padding: "8px 10px", borderRadius: 10, border: "1.5px solid #bae6fd", fontSize: "0.9rem", outline: "none", fontFamily: "inherit" }} />
                      </div>
                      <span style={{ fontSize: "1.1rem", color: "#94a3b8", marginTop: 18 }}>→</span>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <label style={{ fontSize: "0.72rem", color: "#6b7280", fontWeight: 600 }}>To</label>
                        <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                          style={{ padding: "8px 10px", borderRadius: 10, border: "1.5px solid #bae6fd", fontSize: "0.9rem", outline: "none", fontFamily: "inherit" }} />
                      </div>
                    </div>
                  </div>

                </>
              )}

              {/* ══ DOCTOR-ONLY VERIFICATION SECTIONS ══ */}
              {role === "doctor" && (
                <>
                  {/* ── 1. Government ID Proof ── */}
                  <SectionHead icon="🪪" title="Government ID Proof" />

                  {/* ID Type */}
                  {(() => { const f = fs("govtIdType"); return (
                    <Field id="govtIdType" label="ID Type" required error={f.error}>
                      <div className="rhf-input-wrap">
                        <select id="govtIdType" className={`rhf-select${f.error ? " invalid" : ""}`}
                          {...register("govtIdType", { required: role === "doctor" ? "Please select ID type" : false })}>
                          <option value="">— Select —</option>
                          <option value="aadhaar">Aadhaar Card</option>
                          <option value="pan">PAN Card</option>
                        </select>
                      </div>
                    </Field>
                  ); })()}

                  {/* ID Number */}
                  {(() => { const f = fs("govtIdNumber"); return (
                    <Field id="govtIdNumber" label="ID Number" required error={f.error} hint="Aadhaar: 12 digits  |  PAN: 10 characters">
                      <div className="rhf-input-wrap">
                        <input id="govtIdNumber" type="text" placeholder="Enter ID number" className={f.cls}
                          {...register("govtIdNumber", {
                            required: role === "doctor" ? "ID number is required" : false,
                            minLength: { value: 10, message: "Enter at least 10 characters" },
                          })} />
                      </div>
                    </Field>
                  ); })()}

                  {/* Govt ID Photo Upload */}
                  <div className="rhf-field">
                    <label className="rhf-label">ID Photo <span className="req">*</span></label>
                    <div style={{
                      border: `2px dashed ${docErrors.govtIdPhoto ? "#ef4444" : docFiles.govtIdPhoto ? "#22c55e" : "#c7d2fe"}`,
                      borderRadius: 12, padding: "1rem", textAlign: "center", cursor: "pointer",
                      background: docFiles.govtIdPhoto ? "#f0fdf4" : "#fafbff",
                      transition: "all 0.2s",
                    }}>
                      {docFiles.govtIdPhoto ? (
                        <div>
                          <img src={docPreviews.govtIdPhoto} alt="ID" style={{ maxHeight: 100, maxWidth: "100%", borderRadius: 8, objectFit: "contain" }} />
                          <p style={{ margin: "6px 0 0", fontSize: "0.78rem", color: "#15803d", fontWeight: 600 }}>✅ ID photo uploaded</p>
                          <button type="button" onClick={() => {
                            setDocFiles(p => ({ ...p, govtIdPhoto: null }));
                            setDocPreviews(p => ({...p, govtIdPhoto: null}));
                          }}
                            style={{ marginTop: 6, fontSize: "0.75rem", color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                            ✕ Remove
                          </button>
                        </div>
                      ) : (
                        <label style={{ cursor: "pointer", display: "block" }}>
                          <div style={{ fontSize: "1.8rem", marginBottom: 6 }}>📸</div>
                          <p style={{ margin: 0, fontSize: "0.83rem", color: "#6b7280" }}>Click to upload ID photo <br /><span style={{ fontSize: "0.75rem" }}>(JPG, PNG • max 5MB)</span></p>
                          <input type="file" accept="image/*" style={{ display: "none" }}
                            onChange={async e => {
                              const file = e.target.files[0];
                              if (!file) return;
                              setDocFiles(p => ({ ...p, govtIdPhoto: file }));
                              setDocPreviews(p => ({ ...p, govtIdPhoto: URL.createObjectURL(file) }));
                              setDocErrors(p => ({ ...p, govtIdPhoto: null }));
                            }} />
                        </label>
                      )}
                    </div>
                    {docErrors.govtIdPhoto && <span className="rhf-error">{docErrors.govtIdPhoto}</span>}
                  </div>

                  {/* ── 2. Medical Council Details ── */}
                  <SectionHead icon="🏥" title="Medical Council Details" />

                  {(() => { const f = fs("medicalCouncil"); return (
                    <Field id="medicalCouncil" label="Medical Council Name" required error={f.error} hint="e.g. Maharashtra Medical Council, MCI">
                      <div className="rhf-input-wrap">
                        <input id="medicalCouncil" type="text" placeholder="e.g. Maharashtra Medical Council" className={f.cls}
                          {...register("medicalCouncil", { required: role === "doctor" ? "Medical council name is required" : false })} />
                      </div>
                    </Field>
                  ); })()}

                  {(() => { const f = fs("regYear"); return (
                    <Field id="regYear" label="Year of Registration" required error={f.error}>
                      <div className="rhf-input-wrap">
                        <input id="regYear" type="number" placeholder="e.g. 2015" min="1960" max={new Date().getFullYear()} className={f.cls}
                          {...register("regYear", {
                            required: role === "doctor" ? "Year of registration is required" : false,
                            min: { value: 1960, message: "Enter a valid year" },
                            max: { value: new Date().getFullYear(), message: "Year cannot be in the future" },
                          })} />
                      </div>
                    </Field>
                  ); })()}

                  {(() => { const f = fs("medicalRegNumber"); return (
                    <Field id="medicalRegNumber" label="Medical Registration Number" required error={f.error}>
                      <div className="rhf-input-wrap">
                        <input id="medicalRegNumber" type="text" placeholder="e.g. MMC-12345" className={f.cls}
                          {...register("medicalRegNumber", { required: role === "doctor" ? "Registration number is required" : false })} />
                      </div>
                    </Field>
                  ); })()}

                  {/* ── 3. Document Uploads ── */}
                  <SectionHead icon="📄" title="Qualification & License Uploads" />

                  {/* Medical License */}
                  <div className="rhf-field">
                    <label className="rhf-label">Medical License <span className="req">*</span></label>
                    <DocUpload
                      fileObj={docFiles.medicalLicense}
                      valuePreview={docPreviews.medicalLicense}
                      error={docErrors.medicalLicense}
                      placeholder="Upload Medical License (PDF or Image)"
                      onUpload={async (file) => {
                        setDocFiles(p => ({ ...p, medicalLicense: file }));
                        setDocPreviews(p => ({...p, medicalLicense: URL.createObjectURL(file)}));
                        setDocErrors(p => ({ ...p, medicalLicense: null }));
                      }}
                      onRemove={() => {
                        setDocFiles(p => ({ ...p, medicalLicense: null }));
                        setDocPreviews(p => ({...p, medicalLicense: null}));
                      }}
                    />
                    {docErrors.medicalLicense && <span className="rhf-error">{docErrors.medicalLicense}</span>}
                  </div>

                  {/* Registration Certificate */}
                  <div className="rhf-field">
                    <label className="rhf-label">Registration Certificate <span className="req">*</span></label>
                    <DocUpload
                      fileObj={docFiles.registrationCert}
                      valuePreview={docPreviews.registrationCert}
                      error={docErrors.registrationCert}
                      placeholder="Upload Registration Certificate (PDF or Image)"
                      onUpload={async (file) => {
                        setDocFiles(p => ({ ...p, registrationCert: file }));
                        setDocPreviews(p => ({...p, registrationCert: URL.createObjectURL(file)}));
                        setDocErrors(p => ({ ...p, registrationCert: null }));
                      }}
                      onRemove={() => {
                        setDocFiles(p => ({ ...p, registrationCert: null }));
                        setDocPreviews(p => ({...p, registrationCert: null}));
                      }}
                    />
                    {docErrors.registrationCert && <span className="rhf-error">{docErrors.registrationCert}</span>}
                  </div>
                </>
              )}

              {/* Email */}
              {(() => { const f = fs("email"); return (
                <Field id="email" label="Email Address" required error={f.error}>
                  <div className="rhf-input-wrap">
                    <input id="email" type="email" placeholder="Enter your email" className={f.cls}
                      {...register("email", {
                        required: "Email address is required",
                        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Please enter a valid email (e.g. user@example.com)" },
                      })} />
                  </div>
                </Field>
              ); })()}
              {/* Already-registered nudge */}
              {errors.email?.type === "server" && (
                <p style={{ margin: "-8px 0 14px", fontSize: "0.83rem", color: "#555", textAlign: "center" }}>
                  Already have an account?{" "}
                  <Link to="/login" style={{ color: "#0d47a1", fontWeight: 700, textDecoration: "underline" }}>Login here →</Link>
                </p>
              )}

              {/* Password */}
              {(() => { const f = fs("password"); return (
                <Field id="password" label="Password" required error={f.error}>
                  <div className="rhf-input-wrap">
                    <input id="password" type="password" placeholder="Min 6 characters" className={f.cls}
                      {...register("password", {
                        required: "Password is required",
                        minLength: { value: 6, message: "Password must be at least 6 characters" },
                        validate: {
                          notOnlyNumbers: v => !/^\d+$/.test(v) || "Password cannot be all numbers",
                        },
                      })} />
                  </div>
                  <PasswordStrength password={password} />
                </Field>
              ); })()}

              {/* Confirm Password */}
              {(() => { const f = fs("confirmPassword"); return (
                <Field id="confirmPassword" label="Confirm Password" required error={f.error}>
                  <div className="rhf-input-wrap">
                    <input id="confirmPassword" type="password" placeholder="Repeat your password" className={f.cls}
                      {...register("confirmPassword", {
                        required: "Please confirm your password",
                        validate: val => val === password || "Passwords do not match — please check again",
                      })} />
                  </div>
                </Field>
              ); })()}

              <button
                type="submit"
                className="rhf-submit-btn"
                disabled={isSubmitting}
                style={{ background: "linear-gradient(135deg,#0d47a1,#1565c0)", color: "white" }}
              >
                {isSubmitting
                  ? <><div className="rhf-spinner" /> Creating account...</>
                  : "Create Account"
                }
              </button>
            </form>

            <div className="divider"><span>OR</span></div>
            <button onClick={() => alert("Google signup coming soon!")} className="google-btn">
              <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%234285F4' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'/%3E%3Cpath fill='%2334A853' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'/%3E%3Cpath fill='%23FBBC05' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'/%3E%3Cpath fill='%23EA4335' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'/%3E%3Cpath fill='none' d='M1 1h22v22H1z'/%3E%3C/svg%3E" alt="Google" />
              Continue with Google
            </button>
            <div className="auth-footer">
              <p>Already have an account? <Link to="/login">Login</Link></p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
