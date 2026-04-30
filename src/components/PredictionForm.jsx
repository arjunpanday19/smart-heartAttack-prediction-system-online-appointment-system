import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import API from "../api/api";
import api from "../api.js";
import "../styles/form.css";
import {
  HeartPulse, Ban, Activity, User, Cigarette,
  Wine, Dumbbell, Gauge, Droplets, BedDouble, Brain, Users, AlertTriangle, ShieldCheck
} from "lucide-react";

// ─── Reusable Field ───────────────────────────────────────────────────────────
function Field({ id, label, required, error, hint, children, unit, icon }) {
  return (
    <div className="rhf-field" style={{ marginBottom: "0.85rem" }}>
      <label className="rhf-label" htmlFor={id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {icon && <span style={{ color: "#0d47a1", display: "flex" }}>{icon}</span>}
        {label} {required && <span className="req">*</span>}
        {unit && <span style={{ marginLeft: 4, color: "#6b7280", fontWeight: 400, fontSize: "0.76rem" }}>({unit})</span>}
      </label>
      {children}
      {error
        ? <span className="rhf-error">{error}</span>
        : hint
          ? <span style={{ fontSize: "0.74rem", color: "#6b7280" }}>{hint}</span>
          : null}
    </div>
  );
}

// ─── Prediction Form Component ────────────────────────────────────────────────
export default function PredictionForm({ user }) {
  const [result, setResult]         = useState(null);
  const [serverError, setServerError] = useState("");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      setHistoryLoading(true);
      try {
        const res = await api.get("/predictions/patient");
        setHistory(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch prediction history", err);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm({ mode: "onSubmit", reValidateMode: "onChange" });

  const fs = (name) => ({
    cls: `rhf-input${!isSubmitted ? "" : errors[name] ? " invalid" : " valid"}`,
    error: isSubmitted ? errors[name]?.message : null,
  });

  const onSubmit = async (data) => {
    setServerError("");
    setResult(null);
    try {
      const res = await API.post("/predict", data);
      const predictionResult = res.data;
      setResult(predictionResult);

      // Save to backend
      try {
        await api.post("/predictions", { inputs: data, result: predictionResult });
        // Refresh history
        const histRes = await api.get("/predictions/patient");
        setHistory(histRes.data.data || []);
      } catch (saveErr) {
        console.error("Failed to save prediction to backend", saveErr);
      }
    } catch {
      setServerError("Unable to connect to the prediction service. Make sure the backend is running on port 5000.");
    }
  };

  const handleReset = () => { reset(); setResult(null); setServerError(""); };

  // ── Field definitions ──────────────────────────────────────────────────────
  const numberFields = [
    { name: "age",          label: "Age",                  unit: "years",  min: 1,   max: 120, hint: "Your age in years", icon: <User size={14}/> },
    { name: "bmi",          label: "BMI",                  unit: "kg/m²",  min: 10,  max: 70,  hint: "Body Mass Index (weight/height²)", icon: <Activity size={14}/> },
    { name: "systolic_bp",  label: "Systolic BP",          unit: "mmHg",   min: 50,  max: 300, hint: "Upper blood pressure reading", icon: <Gauge size={14}/> },
    { name: "diastolic_bp", label: "Diastolic BP",         unit: "mmHg",   min: 30,  max: 200, hint: "Lower blood pressure reading", icon: <Droplets size={14}/> },
    { name: "heart_rate",   label: "Max Heart Rate",       unit: "bpm",    min: 30,  max: 220, hint: "Maximum heart rate achieved", icon: <HeartPulse size={14}/> },
    { name: "stress_level", label: "Stress Level",         unit: "0–1",    min: 0,   max: 1,   hint: "0 = No stress, 1 = High stress (decimals ok)", icon: <Brain size={14}/> },
    { name: "sleep_hours",  label: "Sleep Hours",          unit: "hrs/night", min: 1, max: 24, hint: "Average hours of sleep per night", icon: <BedDouble size={14}/> },
  ];

  const dropdownFields = [
    { name: "gender",            label: "Sex",              icon: <User size={14}/>,       options: [{ v: 0, l: "Female" }, { v: 1, l: "Male" }] },
    { name: "smoking",           label: "Smoker?",          icon: <Cigarette size={14}/>,  options: [{ v: 0, l: "No" },     { v: 1, l: "Yes" }] },
    { name: "alcohol",           label: "Drinks Alcohol?",  icon: <Wine size={14}/>,       options: [{ v: 0, l: "No" },     { v: 1, l: "Yes" }] },
    { name: "physical_activity", label: "Physically Active?", icon: <Dumbbell size={14}/>, options: [{ v: 0, l: "No" },     { v: 1, l: "Yes" }] },
    { name: "family_history",    label: "Family History of Heart Disease?", icon: <Users size={14}/>, options: [{ v: 0, l: "No" }, { v: 1, l: "Yes" }] },
  ];

  return (
    <div className="card" style={{ maxWidth: 680, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.5rem" }}>
          <HeartPulse size={48} color="#e53935" strokeWidth={1.6} />
        </div>
        <h2 style={{ margin: 0, color: "#1a237e", fontSize: "1.5rem" }}>Heart Attack Risk Prediction</h2>
        <p style={{ color: "#6b7280", fontSize: "0.88rem", marginTop: "0.4rem" }}>
          Fill in all 12 health parameters accurately. Our AI model will assess your risk instantly.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Two-column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1.5rem" }}>

          {/* Number fields */}
          {numberFields.map(({ name, label, unit, min, max, hint, icon }) => {
            const f = fs(name);
            return (
              <Field key={name} id={name} label={label} required unit={unit} error={f.error} hint={hint} icon={icon}>
                <div className="rhf-input-wrap">
                  <input
                    id={name}
                    type="number"
                    step="any"
                    placeholder={`${min} – ${max}`}
                    className={f.cls}
                    {...register(name, {
                      required: `${label} is required`,
                      min: { value: min, message: `Min ${min}` },
                      max: { value: max, message: `Max ${max}` },
                      validate: v => !isNaN(parseFloat(v)) || `Must be a number`,
                    })}
                  />
                </div>
              </Field>
            );
          })}

          {/* Dropdown fields */}
          {dropdownFields.map(({ name, label, icon, options }) => {
            const f = fs(name);
            return (
              <Field key={name} id={name} label={label} required error={f.error} icon={icon}>
                <div className="rhf-input-wrap">
                  <select
                    id={name}
                    className={f.cls}
                    style={{ cursor: "pointer" }}
                    {...register(name, { required: `${label} is required` })}
                  >
                    <option value="">— Select —</option>
                    {options.map(o => (
                      <option key={o.v} value={o.v}>{o.l}</option>
                    ))}
                  </select>
                </div>
              </Field>
            );
          })}
        </div>

        {/* Server error */}
        {serverError && (
          <div className="rhf-form-error-banner">
            <Ban size={16} strokeWidth={2.5} />
            <span>{serverError}</span>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
          <button
            type="submit"
            className="rhf-submit-btn"
            disabled={isSubmitting}
            style={{ flex: 2, background: "linear-gradient(135deg,#e53935,#c62828)", color: "white" }}
          >
            {isSubmitting
              ? <><div className="rhf-spinner" /> Analysing...</>
              : <><HeartPulse size={16} style={{ marginRight: 6 }} />Predict My Risk</>
            }
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rhf-submit-btn"
            style={{ flex: 1, background: "#f3f4f6", color: "#374151" }}
          >
            ↺ Reset
          </button>
        </div>
      </form>

      {/* Result */}
      {result && (
        <div style={{
          marginTop: "1.75rem",
          borderRadius: "20px",
          padding: "2rem",
          textAlign: "center",
          background: result.risk === 1
            ? "linear-gradient(135deg,#fff1f1,#fee2e2)"
            : "linear-gradient(135deg,#f0fdf4,#dcfce7)",
          border: `1.5px solid ${result.risk === 1 ? "#fca5a5" : "#86efac"}`,
          boxShadow: result.risk === 1
            ? "0 8px 24px rgba(220,38,38,0.12)"
            : "0 8px 24px rgba(22,163,74,0.12)",
        }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem" }}>
            {result.risk === 1
              ? <AlertTriangle size={52} color="#dc2626" strokeWidth={1.8} />
              : <ShieldCheck size={52} color="#16a34a" strokeWidth={1.8} />
            }
          </div>
          <h3 style={{
            margin: "0 0 0.5rem",
            fontSize: "1.5rem",
            color: result.risk === 1 ? "#991b1b" : "#15803d",
          }}>
            {result.prediction}
          </h3>

          {/* Probability bar */}
          <p style={{ color: "#555", margin: "0.25rem 0 1rem", fontSize: "0.9rem" }}>
            Predicted probability of heart attack:
          </p>
          <div style={{ background: "#e5e7eb", borderRadius: 99, height: 14, overflow: "hidden", maxWidth: 360, margin: "0 auto 0.6rem" }}>
            <div style={{
              width: `${result.probability}%`,
              height: "100%",
              background: result.risk === 1
                ? "linear-gradient(90deg,#f97316,#dc2626)"
                : "linear-gradient(90deg,#4ade80,#16a34a)",
              borderRadius: 99,
              transition: "width 0.8s ease",
            }} />
          </div>
          <p style={{ margin: 0, fontWeight: 800, fontSize: "1.6rem", color: result.risk === 1 ? "#dc2626" : "#16a34a" }}>
            {result.probability}%
          </p>

          {result.risk === 1 ? (
            <p style={{ marginTop: "1rem", color: "#7f1d1d", fontSize: "0.85rem", lineHeight: 1.6 }}>
              ⚠️ Our model indicates an elevated risk. Please consult a cardiologist and adopt a healthier lifestyle.
            </p>
          ) : (
            <p style={{ marginTop: "1rem", color: "#14532d", fontSize: "0.85rem", lineHeight: 1.6 }}>
              ✅ Our model indicates a lower risk. Keep maintaining a healthy lifestyle and get regular check-ups.
            </p>
          )}

          <p style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "#9ca3af" }}>
            * This is an AI-based assessment and does not replace professional medical advice.
          </p>

          <div style={{ marginTop: "1.5rem", borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: "1.25rem" }}>
            <p style={{ margin: "0 0 1rem", fontSize: "0.95rem", fontWeight: 600, color: result.risk === 1 ? "#991b1b" : "#15803d" }}>
              {result.risk === 1 
                ? "Immediate consultation is recommended. Visit our specialists today." 
                : "Want a detailed evaluation? Check in with our cardiologists."}
            </p>
            <Link 
              to="/doctors" 
              style={{ 
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 24px", background: result.risk === 1 ? "#dc2626" : "#16a34a", 
                color: "white", borderRadius: "12px", textDecoration: "none", fontWeight: 700,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)", transition: "transform 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
              <Users size={18} /> Book Appointment with Specialist
            </Link>
          </div>
        </div>
      )}

      {/* Prediction History Section */}
      {user && history.length > 0 && (
        <div style={{ marginTop: "3rem", borderTop: "2px solid #e5e7eb", paddingTop: "2rem" }}>
          <h2 style={{ fontSize: "1.4rem", color: "#1a237e", marginBottom: "1rem" }}>Prediction History</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {history.map((item, idx) => {
              const isHighRisk = item.result.risk === 1;
              return (
                <div key={item._id || idx} style={{
                  background: "white", padding: "1.25rem", borderRadius: "16px",
                  border: `1px solid ${isHighRisk ? "#fca5a5" : "#86efac"}`,
                  borderLeft: `6px solid ${isHighRisk ? "#ef4444" : "#22c55e"}`,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "#6b7280" }}>
                        {new Date(item.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                      <h4 style={{ margin: "4px 0 0", fontSize: "1.1rem", color: isHighRisk ? "#b91c1c" : "#15803d" }}>
                        {item.result.prediction} ({item.result.probability}%)
                      </h4>
                    </div>
                    <span style={{ padding: "4px 12px", background: isHighRisk ? "#fee2e2" : "#dcfce7", color: isHighRisk ? "#b91c1c" : "#15803d", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 700 }}>
                      {isHighRisk ? "High Risk" : "Low Risk"}
                    </span>
                  </div>
                  
                  {/* Show key inputs */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "0.5rem", marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #e5e7eb" }}>
                    <div style={{ fontSize: "0.8rem", color: "#4b5563" }}><strong>Age:</strong> {item.inputs.age}</div>
                    <div style={{ fontSize: "0.8rem", color: "#4b5563" }}><strong>BMI:</strong> {item.inputs.bmi}</div>
                    <div style={{ fontSize: "0.8rem", color: "#4b5563" }}><strong>BP:</strong> {item.inputs.systolic_bp}/{item.inputs.diastolic_bp}</div>
                    <div style={{ fontSize: "0.8rem", color: "#4b5563" }}><strong>HR:</strong> {item.inputs.heart_rate}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
