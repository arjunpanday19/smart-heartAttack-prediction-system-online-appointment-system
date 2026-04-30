import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ADMIN_USERNAME = "admin19042003";
const ADMIN_PASSWORD = "Admin@19042003";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      localStorage.setItem("adminSession", "true");
      navigate("/admin/dashboard");
    } else {
      setError("Invalid admin credentials. Access denied.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #0a0f2c 0%, #0d1b3e 40%, #0d47a1 100%)",
      fontFamily: "'Segoe UI', system-ui, sans-serif", padding: "1rem",
      position: "relative", overflow: "hidden",
    }}>
      {/* Decorative floating shapes */}
      <div style={{
        position: "absolute", top: "-80px", right: "-80px", width: "300px", height: "300px",
        borderRadius: "50%", background: "rgba(13,71,161,0.15)", filter: "blur(60px)",
      }} />
      <div style={{
        position: "absolute", bottom: "-100px", left: "-60px", width: "400px", height: "400px",
        borderRadius: "50%", background: "rgba(66,165,245,0.1)", filter: "blur(80px)",
      }} />

      <div style={{ width: "100%", maxWidth: "440px", position: "relative", zIndex: 1 }}>

        {/* Admin Shield Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: 80, height: 80, borderRadius: "20px", margin: "0 auto 1rem",
            background: "linear-gradient(135deg, #1565c0, #42a5f5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2.5rem", boxShadow: "0 8px 32px rgba(21,101,192,0.4)",
            border: "2px solid rgba(255,255,255,0.15)",
          }}>
            🛡️
          </div>
          <h1 style={{ color: "white", margin: 0, fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.3px" }}>
            Admin Portal
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", margin: "0.5rem 0 0", fontSize: "0.85rem", fontWeight: 500 }}>
            Aurelyf Care — Restricted Access
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          background: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)",
          borderRadius: "24px", border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.45)", padding: "2.5rem 2rem",
        }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Error Badge */}
            {error && (
              <div style={{
                background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)",
                borderRadius: "12px", padding: "12px 16px", color: "#fca5a5",
                fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px",
                animation: "shake 0.4s ease",
              }}>
                <span style={{ fontSize: "1.1rem" }}>🚫</span> {error}
              </div>
            )}

            {/* Username */}
            <div>
              <label style={{
                display: "block", color: "rgba(255,255,255,0.7)", fontSize: "0.78rem",
                fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "8px",
              }}>
                Admin Username
              </label>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
                  fontSize: "1rem", opacity: 0.5,
                }}>👤</span>
                <input
                  type="text" value={username} onChange={e => setUsername(e.target.value)} required
                  placeholder="Enter admin username"
                  autoComplete="username"
                  style={{
                    width: "100%", padding: "13px 14px 13px 42px", borderRadius: "14px",
                    border: "1.5px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)",
                    color: "white", fontSize: "0.95rem", boxSizing: "border-box", outline: "none",
                    transition: "border-color 0.2s, background 0.2s",
                  }}
                  onFocus={e => { e.target.style.borderColor = "rgba(66,165,245,0.6)"; e.target.style.background = "rgba(255,255,255,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.15)"; e.target.style.background = "rgba(255,255,255,0.08)"; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: "block", color: "rgba(255,255,255,0.7)", fontSize: "0.78rem",
                fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "8px",
              }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
                  fontSize: "1rem", opacity: 0.5,
                }}>🔒</span>
                <input
                  type={showPwd ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)} required
                  placeholder="Enter password"
                  autoComplete="current-password"
                  style={{
                    width: "100%", padding: "13px 46px 13px 42px", borderRadius: "14px",
                    border: "1.5px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)",
                    color: "white", fontSize: "0.95rem", boxSizing: "border-box", outline: "none",
                    transition: "border-color 0.2s, background 0.2s",
                  }}
                  onFocus={e => { e.target.style.borderColor = "rgba(66,165,245,0.6)"; e.target.style.background = "rgba(255,255,255,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.15)"; e.target.style.background = "rgba(255,255,255,0.08)"; }}
                />
                <button
                  type="button" onClick={() => setShowPwd(!showPwd)}
                  style={{
                    position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", color: "rgba(255,255,255,0.55)",
                    cursor: "pointer", fontSize: "1.05rem", padding: 0,
                  }}
                >{showPwd ? "🙈" : "👁"}</button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              style={{
                marginTop: "0.5rem", padding: "14px", borderRadius: "14px", border: "none",
                background: loading
                  ? "rgba(255,255,255,0.15)"
                  : "linear-gradient(135deg, #1565c0, #42a5f5)",
                color: "white", fontWeight: 700, fontSize: "1rem",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.25s", letterSpacing: "0.3px",
                boxShadow: loading ? "none" : "0 6px 24px rgba(21,101,192,0.4)",
              }}
            >
              {loading ? "⏳ Verifying..." : "🔐 Access Admin Panel"}
            </button>
          </form>
        </div>

        <p style={{
          textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "0.75rem",
          marginTop: "1.75rem", letterSpacing: "0.3px",
        }}>
          🔒 Restricted access — authorised personnel only
        </p>
      </div>

      {/* Shake animation for error */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
