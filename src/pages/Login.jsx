import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import "../styles/form.css";
import api from "../api.js";


// ─── Reusable Field Component ─────────────────────────────────────────────────
function Field({ id, label, required, error, children, hint, counter }) {
  return (
    <div className="rhf-field">
      <label className="rhf-label" htmlFor={id}>
        {label} {required && <span className="req">*</span>}
      </label>
      {children}
      {counter}
      {error && <span className="rhf-error">{error}</span>}
      {hint && !error && <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{hint}</span>}
    </div>
  );
}

// ─── Welcome Popup ────────────────────────────────────────────────────────────
function WelcomePopup({ user, appointments, onClose, onNavigate }) {
  const msgs = (user.role === "patient" ? (appointments || []).slice(0, 3) : []).map((apt) => {
    const s = (apt.status || "").toLowerCase();
    if (s === "confirmed" || s === "accepted") return { icon: "✅", msg: `Appointment on ${apt.date} at ${apt.time} confirmed!`, bg: "#e8f5e9", color: "#2e7d32", border: "#4caf50" };
    if (s === "completed") return { icon: "✅", msg: `Appointment on ${apt.date} at ${apt.time} was completed.`, bg: "#e3f2fd", color: "#0d47a1", border: "#2196f3" };
    if (s === "rejected" || s === "cancelled") return { icon: "❌", msg: `The appointment (${apt.date} at ${apt.time}) was declined or cancelled.`, bg: "#ffebee", color: "#c62828", border: "#ef5350" };
    return { icon: "⏳", msg: `Appointment on ${apt.date} at ${apt.time} is under review.`, bg: "#fff3e0", color: "#e65100", border: "#ff9800" };
  });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", animation: "fadeIn 0.3s ease" }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: "24px", padding: "2.5rem", maxWidth: "480px", width: "100%", position: "relative", boxShadow: "0 25px 60px rgba(0,0,0,0.25)", animation: "slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "#f5f5f5", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: "1rem" }}>✕</button>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "3rem", animation: "heartbeat 1s ease infinite" }}>❤️</div>
          <h2 style={{ margin: "0.5rem 0 0.25rem", color: "#1a237e", fontSize: "1.6rem" }}>Welcome back,</h2>
          <h3 style={{ margin: 0, color: "#e53935", fontSize: "1.8rem", fontWeight: 800 }}>{user.name}! 👋</h3>
          <p style={{ margin: "0.5rem 0 0", color: "#888", fontSize: "0.9rem" }}>{user.role === "doctor" ? "Signed in as Doctor 👨‍⚕️" : "Signed in as Patient 🧑"}</p>
        </div>
        {msgs.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <p style={{ color: "#555", fontWeight: 600, marginBottom: "0.75rem", fontSize: "0.9rem" }}>📋 Appointment Updates:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {msgs.map((m, i) => (
                <div key={i} style={{ background: m.bg, borderLeft: `4px solid ${m.border}`, borderRadius: 8, padding: "0.75rem 1rem", display: "flex", gap: "0.6rem" }}>
                  <span style={{ flexShrink: 0 }}>{m.icon}</span>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: m.color, lineHeight: 1.4 }}>{m.msg}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {user.role === "patient" && msgs.length === 0 && (
          <div style={{ background: "#e3f2fd", borderRadius: 12, padding: "1rem", textAlign: "center", marginBottom: "1.5rem" }}>
            <p style={{ margin: 0, color: "#0d47a1", fontSize: "0.9rem" }}>💡 No appointments yet. Book now to get started!</p>
          </div>
        )}
        {user.role === "admin" && (
          <div style={{ background: "#fef3c7", borderRadius: 12, padding: "1rem", textAlign: "center", marginBottom: "1.5rem" }}>
            <p style={{ margin: 0, color: "#92400e", fontSize: "0.9rem" }}>🛡️ Admin Panel access granted. You can manage users and approvals.</p>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {user.role === "patient" && <>
            <button onClick={() => onNavigate("/doctors")} style={{ padding: 14, background: "linear-gradient(135deg,#0d47a1,#1565c0)", color: "white", border: "none", borderRadius: 14, cursor: "pointer", fontWeight: 700, fontSize: "1rem" }}>📅 Book an Appointment</button>
            <button onClick={() => onNavigate("/predict")} style={{ padding: 14, background: "linear-gradient(135deg,#e53935,#c62828)", color: "white", border: "none", borderRadius: 14, cursor: "pointer", fontWeight: 700, fontSize: "1rem" }}>🫀 Heart Attack Prediction</button>
            <button onClick={onClose} style={{ padding: 10, background: "transparent", color: "#888", border: "1px solid #ddd", borderRadius: 14, cursor: "pointer", fontWeight: 600 }}>Continue to Home</button>
          </>}
          {user.role === "doctor" && (() => {
            const docStatus = user.doctorProfile?.status || "pending";
            const isApproved = docStatus === "approved";
            return isApproved ? (
              <button onClick={() => onNavigate("/doctor-appointments")} style={{ padding: 14, background: "linear-gradient(135deg,#0d47a1,#1565c0)", color: "white", border: "none", borderRadius: 14, cursor: "pointer", fontWeight: 700, fontSize: "1rem" }}>📋 Go to My Appointments</button>
            ) : (
              <>
                <div style={{ background: "#fef3c7", borderLeft: "4px solid #f59e0b", borderRadius: 8, padding: "0.85rem 1rem", marginBottom: "0.5rem" }}>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "#92400e", fontWeight: 600 }}>⏳ Your profile is under review by our admin team. You'll get full access once approved.</p>
                </div>
                <button onClick={() => onNavigate("/doctor-appointments")} style={{ padding: 14, background: "linear-gradient(135deg,#0d47a1,#1565c0)", color: "white", border: "none", borderRadius: 14, cursor: "pointer", fontWeight: 700, fontSize: "1rem" }}>📋 View Status</button>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate();
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [userAppointments, setUserAppointments] = useState([]);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const uStr = localStorage.getItem("user");
    // Redirect if user is already in localStorage and didn't just login right now
    if (uStr && !loggedInUser) {
      try {
        const u = JSON.parse(uStr);
        if (u.role === "doctor") navigate("/doctor-appointments");
        else if (u.role === "admin") navigate("/admin/dashboard");
        else navigate("/");
      } catch (e) {
        // Ignore parse error
      }
    }
  }, [navigate, loggedInUser]);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting, isValid, isDirty, isSubmitted },
  } = useForm({ mode: "onSubmit", reValidateMode: "onChange" });



  const fieldState = (name) => {
    const hasError = !!errors[name];
    return {
      inputClass: `rhf-input${!isSubmitted ? "" : hasError ? " invalid" : " valid"}`,
      error: isSubmitted ? errors[name]?.message : null,
      valid: isSubmitted && !hasError,
    };
  };

  const onSubmit = async (data) => {
    clearErrors();

    try {
      const res = await api.post("/users/login", { email: data.email, password: data.password });
      const user = res.data.data.user;
      const token = res.data.data.accessToken;

      localStorage.setItem("user", JSON.stringify(user));
      if (user.role === "admin") {
        localStorage.setItem("adminSession", "true");
      }
      if (user.profileImage) {
        localStorage.setItem("profileImage", user.profileImage);
      }
      if (token) localStorage.setItem("token", token); // save JWT for API calls
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("auth-change"));
      
      let mine = [];
      try {
         const aptRes = await api.get(user.role === 'doctor' ? "/appointments/doctor" : "/appointments/patient");
         mine = aptRes.data.data;
      } catch (aptErr) {
         console.error("Failed to fetch appointments", aptErr);
      }

      setLoggedInUser(user);
      setUserAppointments(mine);
      setShowPopup(true);
      
    } catch (error) {
       console.error("Login failed", error);
       if (error.response?.status === 404) {
         setError("email", { type: "server", message: "No account found with this email. Please register first." });
       } else if (error.response?.status === 401) {
         setError("password", { type: "server", message: "Incorrect password — please try again" });
       } else if (error.response?.status === 403) {
         setError("email", { type: "server", message: error.response.data.message || "Account not verified. Please check your email for OTP." });
       } else {
         setError("email", { type: "server", message: "Login failed. Please try again." });
       }
    }
  };

  const emailState = fieldState("email");
  const pwState = fieldState("password");

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo beating">❤️</div>
          <h1>Aurelyf Care</h1>
          <p>Login to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>

          {/* Email */}
          <Field id="email" label="Email Address" required
            error={emailState.error}>
            <div className="rhf-input-wrap">
              <input
                id="email" type="email" placeholder="Enter your email"
                className={emailState.inputClass}
                {...register("email", {
                  required: "Email address is required",
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Please enter a valid email (e.g. user@example.com)" },
                })}
              />
            </div>
          </Field>


          {/* Password */}
          <Field id="password" label="Password" required
            error={pwState.error}>
            <div className="rhf-input-wrap">
              <input
                id="password" type="password" placeholder="Enter your password"
                className={pwState.inputClass}
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 6, message: "Password must be at least 6 characters" },
                })}
              />
            </div>
          </Field>

          <button
            type="submit"
            className="rhf-submit-btn"
            disabled={isSubmitting}
            style={{ background: "linear-gradient(135deg,#0d47a1,#1565c0)", color: "white" }}
          >
            {isSubmitting ? <><div className="rhf-spinner" /> Logging in...</> : "Login →"}
          </button>
        </form>

        <div className="divider"><span>OR</span></div>

        <button onClick={() => alert("Google login coming soon!")} className="google-btn">
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%234285F4' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'/%3E%3Cpath fill='%2334A853' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'/%3E%3Cpath fill='%23FBBC05' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'/%3E%3Cpath fill='%23EA4335' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'/%3E%3Cpath fill='none' d='M1 1h22v22H1z'/%3E%3C/svg%3E" alt="Google" />
          Continue with Google
        </button>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
          <p><Link to="/" className="forgot-link">Forgot Password?</Link></p>
        </div>
      </div>

      {showPopup && loggedInUser && (
        <WelcomePopup
          user={loggedInUser} appointments={userAppointments}
          onClose={() => { 
            setShowPopup(false); 
            if (loggedInUser.role === "doctor") navigate("/doctor-appointments");
            else if (loggedInUser.role === "admin") navigate("/admin/dashboard");
            else navigate("/"); 
          }}
          onNavigate={(path) => { setShowPopup(false); navigate(path); }}
        />
      )}
    </div>
  );
}
