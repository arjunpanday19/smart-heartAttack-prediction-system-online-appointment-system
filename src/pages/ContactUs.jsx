import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  MessageCircle, AlertCircle, Star, AlertTriangle, CheckCircle,
} from "lucide-react";
import api from "../api";

/* ─── Star Rating Component ──────────────────────────────────────────────── */
function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: "6px", margin: "0.5rem 0" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: "2.2rem", lineHeight: 1, padding: "2px",
            color: star <= (hovered || value) ? "#f59e0b" : "#d1d5db",
            transition: "color 0.15s, transform 0.1s",
            transform: star <= (hovered || value) ? "scale(1.2)" : "scale(1)",
          }}
        >
          ★
        </button>
      ))}
      {value > 0 && (
        <span style={{ alignSelf: "center", fontSize: "0.85rem", color: "#6b7280", marginLeft: 8 }}>
          {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][value]}
        </span>
      )}
    </div>
  );
}

/* ─── Shared field wrapper ───────────────────────────────────────────────── */
function Field({ label, error, children, required }) {
  const lbl = { display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.4px" };
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <label style={lbl}>{label} {required && <span style={{ color: "#e53935" }}>*</span>}</label>
      {children}
      {error && <p style={{ color: "#e53935", fontSize: "0.78rem", margin: "4px 0 0" }}>{error}</p>}
    </div>
  );
}

const textareaStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 12, resize: "vertical",
  fontSize: "0.92rem", fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  border: "1.5px solid #e5e7eb", minHeight: 130, lineHeight: 1.6,
  transition: "border-color 0.18s",
};

/* ─── Contact Us Page ────────────────────────────────────────────────────── */
export default function ContactUs() {
  const [activeTab, setActiveTab] = useState("complaint"); // "complaint" | "feedback"
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submittedType, setSubmittedType] = useState("");

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  /* ── Complaint form ── */
  const {
    register: regC, handleSubmit: handleC, reset: resetC,
    formState: { errors: errC, isSubmitting: submittingC },
  } = useForm({ mode: "onSubmit" });

  /* ── Feedback form ── */
  const {
    register: regF, handleSubmit: handleF, reset: resetF,
    formState: { errors: errF, isSubmitting: submittingF },
  } = useForm({ mode: "onSubmit" });

  const onSubmitComplaint = async (data) => {
    try {
        const payload = {
            name: currentUser?.name || "Guest",
            email: currentUser?.email || "unknown",
            message: data.complaint,
            type: "complaint",
            userRole: currentUser?.role || "guest"
        };
        await api.post("/contacts", payload);
        
        resetC();
        setSubmittedType("complaint");
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 4000);
    } catch (error) {
        console.error("Complaint submission failed:", error);
        alert("Failed to submit complaint. Please try again later.");
    }
  };

  const onSubmitFeedback = async (data) => {
    if (rating === 0) return;
    try {
        const payload = {
            name: currentUser?.name || "Guest",
            email: currentUser?.email || "unknown",
            message: data.feedback,
            type: "feedback",
            rating,
            userRole: currentUser?.role || "guest"
        };
        await api.post("/contacts", payload);
        
        resetF();
        setRating(0);
        setSubmittedType("feedback");
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 4000);
    } catch (error) {
        console.error("Feedback submission failed:", error);
        alert("Failed to submit feedback. Please try again later.");
    }
  };

  /* ── Styles ── */
  const tabBtn = (active) => ({
    display: "inline-flex", alignItems: "center", gap: 7,
    padding: "10px 28px", border: "none", borderRadius: 24, cursor: "pointer",
    fontWeight: 700, fontSize: "0.9rem", transition: "all 0.18s",
    background: active ? "linear-gradient(135deg,#0d47a1,#1565c0)" : "white",
    color: active ? "white" : "#6b7280",
    boxShadow: active ? "0 4px 14px rgba(13,71,161,0.3)" : "0 2px 8px rgba(0,0,0,0.06)",
  });

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "linear-gradient(135deg,#f5f7fa,#e8edf5)", padding: "2rem 1rem", fontFamily: "'Segoe UI',sans-serif", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", width: "100%" }}>

        {/* Page Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem" }}>
            <MessageCircle size={56} color="#0d47a1" strokeWidth={1.6} />
          </div>
          <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 800, color: "#0d47a1" }}>Contact Us</h1>
          <p style={{ margin: "0.5rem 0 0", color: "#6b7280", fontSize: "0.95rem" }}>
            We value your opinion — submit a complaint or share your feedback.
          </p>
        </div>

        {/* Success Banner */}
        {submitted && (
          <div style={{
            background: "#dcfce7", border: "1px solid #86efac", borderRadius: 14,
            padding: "14px 20px", marginBottom: "1.5rem", textAlign: "center",
            color: "#15803d", fontWeight: 700, fontSize: "0.95rem",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            animation: "fadeIn 0.3s ease",
          }}>
            <CheckCircle size={18} strokeWidth={2.5} />
            Your {submittedType} has been submitted successfully! Thank you.
          </div>
        )}

        {/* Tab Switcher */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.75rem", justifyContent: "center" }}>
          <button style={tabBtn(activeTab === "complaint")} onClick={() => setActiveTab("complaint")}>
            <AlertCircle size={16} strokeWidth={2.5} /> Complaint
          </button>
          <button style={tabBtn(activeTab === "feedback")} onClick={() => setActiveTab("feedback")}>
            <Star size={16} strokeWidth={2.5} /> Feedback
          </button>
        </div>

        {/* Card */}
        <div style={{ background: "white", borderRadius: 20, boxShadow: "0 10px 40px rgba(0,0,0,0.1)", overflow: "hidden" }}>

          {/* Card header */}
          <div style={{
            background: activeTab === "complaint"
              ? "linear-gradient(135deg,#7f1d1d,#b91c1c)"
              : "linear-gradient(135deg,#1a237e,#0d47a1)",
            padding: "1.5rem 2rem",
          }}>
            <h2 style={{ color: "white", margin: 0, fontSize: "1.3rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
              {activeTab === "complaint"
                ? <><AlertCircle size={22} strokeWidth={2} /> Submit a Complaint</>
                : <><Star size={22} strokeWidth={2} /> Share Your Feedback</>}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", margin: "4px 0 0", fontSize: "0.85rem" }}>
              {activeTab === "complaint"
                ? "Tell us about an issue you've experienced."
                : "Help us improve by rating your experience."}
            </p>
          </div>

          <div style={{ padding: "2rem" }}>

            {/* ── Complaint Form ── */}
            {activeTab === "complaint" && (
              <form onSubmit={handleC(onSubmitComplaint)} noValidate>
                {!currentUser && (
                  <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: 12, padding: "12px 16px", marginBottom: "1.25rem", fontSize: "0.85rem", color: "#92400e", display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertTriangle size={15} strokeWidth={2} /> You are not logged in. Your submission will be recorded as a guest.
                  </div>
                )}
                <Field label="Your Complaint" required error={errC.complaint?.message}>
                  <textarea
                    placeholder="Describe your complaint in detail..."
                    style={{ ...textareaStyle, borderColor: errC.complaint ? "#e53935" : "#e5e7eb" }}
                    {...regC("complaint", {
                      required: "Please describe your complaint.",
                      minLength: { value: 20, message: "Please provide at least 20 characters." },
                    })}
                  />
                </Field>
                <button
                  type="submit"
                  disabled={submittingC}
                  style={{
                    width: "100%", padding: 14, borderRadius: 14, border: "none",
                    background: submittingC ? "#9ca3af" : "linear-gradient(135deg,#b91c1c,#7f1d1d)",
                    color: "white", fontWeight: 700, fontSize: "1rem", cursor: submittingC ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  <AlertCircle size={18} strokeWidth={2} />
                  {submittingC ? "Submitting..." : "Submit Complaint"}
                </button>
              </form>
            )}

            {/* ── Feedback Form ── */}
            {activeTab === "feedback" && (
              <form onSubmit={handleF(onSubmitFeedback)} noValidate>
                {!currentUser && (
                  <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: 12, padding: "12px 16px", marginBottom: "1.25rem", fontSize: "0.85rem", color: "#92400e", display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertTriangle size={15} strokeWidth={2} /> You are not logged in. Your submission will be recorded as a guest.
                  </div>
                )}

                <Field label="Your Rating" required error={rating === 0 && errF.feedback ? "Please select a star rating." : null}>
                  <StarRating value={rating} onChange={setRating} />
                  {rating === 0 && (
                    <p style={{ color: "#9ca3af", fontSize: "0.78rem", margin: "4px 0 0" }}>Click a star to rate</p>
                  )}
                </Field>

                <Field label="Your Feedback" required error={errF.feedback?.message}>
                  <textarea
                    placeholder="Share your experience or suggestions..."
                    style={{ ...textareaStyle, borderColor: errF.feedback ? "#e53935" : "#e5e7eb" }}
                    {...regF("feedback", {
                      required: "Please write your feedback.",
                      minLength: { value: 10, message: "Please provide at least 10 characters." },
                    })}
                  />
                </Field>

                <button
                  type="submit"
                  disabled={submittingF || rating === 0}
                  style={{
                    width: "100%", padding: 14, borderRadius: 14, border: "none",
                    background: (submittingF || rating === 0) ? "#9ca3af" : "linear-gradient(135deg,#0d47a1,#1565c0)",
                    color: "white", fontWeight: 700, fontSize: "1rem",
                    cursor: (submittingF || rating === 0) ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  <Star size={18} strokeWidth={2} />
                  {submittingF ? "Submitting..." : "Submit Feedback"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
