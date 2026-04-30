import { Link } from "react-router-dom";
import PredictionForm from "../components/PredictionForm";
import { LockKeyhole, KeyRound, UserPlus } from "lucide-react";

export default function Prediction({ user }) {

  // ── Not logged in → show gate screen ─────────────────────────────────────
  if (!user) {
    return (
      <div style={{
        minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg,#f5f7fa,#e8edf5)", padding: "2rem", fontFamily: "'Segoe UI',sans-serif"
      }}>
        <div style={{
          background: "white", borderRadius: "24px", boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
          padding: "3rem 2.5rem", maxWidth: "420px", width: "100%", textAlign: "center"
        }}>
          {/* Icon */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
            <LockKeyhole size={72} color="#1a237e" strokeWidth={1.6} />
          </div>

          {/* Heading */}
          <h2 style={{ margin: "0 0 0.5rem", color: "#1a237e", fontSize: "1.6rem" }}>Login Required</h2>
          <p style={{ color: "#666", fontSize: "0.95rem", margin: "0 0 1.75rem", lineHeight: 1.6 }}>
            Heart attack prediction is only available for registered users.<br />
            Please <strong>log in</strong> or <strong>create an account</strong> to continue.
          </p>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/login" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "11px 28px", background: "linear-gradient(135deg,#0d47a1,#1565c0)",
              color: "white", borderRadius: "25px", textDecoration: "none",
              fontWeight: 700, fontSize: "0.95rem", boxShadow: "0 4px 12px rgba(13,71,161,0.35)"
            }}>
              <KeyRound size={16} strokeWidth={2.5} /> Login
            </Link>
            <Link to="/signup" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "11px 28px", background: "linear-gradient(135deg,#e53935,#c62828)",
              color: "white", borderRadius: "25px", textDecoration: "none",
              fontWeight: 700, fontSize: "0.95rem", boxShadow: "0 4px 12px rgba(229,57,53,0.3)"
            }}>
              <UserPlus size={16} strokeWidth={2.5} /> Register
            </Link>
          </div>

          {/* Back link */}
          <p style={{ marginTop: "1.5rem", fontSize: "0.82rem", color: "#aaa" }}>
            <Link to="/" style={{ color: "#6b7280", textDecoration: "underline" }}>← Back to Home</Link>
          </p>
        </div>
      </div>
    );
  }

  // ── Logged in → show prediction form ─────────────────────────────────────
  return (
    <div className="page">
      <PredictionForm user={user} />
    </div>
  );
}
