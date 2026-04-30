import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addNotification } from "../utils/notifications";
import api from "../api";

// ─── Shared styles ────────────────────────────────────────────────────────────
const thStyle = {
  padding: "10px 14px", textAlign: "left", fontSize: "0.75rem", fontWeight: 700,
  color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.4px",
  borderBottom: "2px solid #f3f4f6", whiteSpace: "nowrap",
};
const tdStyle = {
  padding: "12px 14px", fontSize: "0.88rem", color: "#374151",
  borderBottom: "1px solid #f3f4f6", verticalAlign: "middle",
};
const btnBase = {
  padding: "5px 14px", borderRadius: "20px", border: "none",
  fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", transition: "opacity 0.15s",
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    approved: { label: "✅ Approved", bg: "#dcfce7", color: "#15803d", border: "#86efac" },
    pending:  { label: "⏳ Pending",  bg: "#fef9c3", color: "#92400e", border: "#fde047" },
    rejected: { label: "❌ Rejected", bg: "#fee2e2", color: "#b91c1c", border: "#fca5a5" },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
}

// ─── Stat Card (optionally clickable) ────────────────────────────────────────
function StatCard({ icon, label, value, color, onClick, active }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: active ? `linear-gradient(135deg,${color}18,${color}08)` : "white",
        borderRadius: "16px", padding: "1.5rem 1.75rem",
        boxShadow: active ? `0 4px 20px ${color}30` : "0 4px 20px rgba(0,0,0,0.08)",
        borderLeft: `5px solid ${color}`,
        display: "flex", alignItems: "center", gap: "1.25rem", flex: 1, minWidth: "180px",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s",
        outline: active ? `2px solid ${color}` : "none",
      }}
    >
      <div style={{ fontSize: "2.2rem" }}>{icon}</div>
      <div>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>{label}</p>
        <p style={{ margin: "2px 0 0", color: "#111827", fontSize: "2rem", fontWeight: 800, lineHeight: 1 }}>{value}</p>
        {onClick && <p style={{ margin: "4px 0 0", fontSize: "0.7rem", color: color, fontWeight: 600 }}>Click to view →</p>}
      </div>
    </div>
  );
}

// ─── Fullscreen Document Viewer ───────────────────────────────────────────────
function DocViewerModal({ src, label, onClose }) {
  if (!src) return null;
  const isPdf = src.startsWith("data:application/pdf");
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "1rem", animation: "fadeIn 0.2s ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 900, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <span style={{ color: "white", fontWeight: 700, fontSize: "1rem" }}>{label}</span>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.15)", border: "none", color: "white",
            borderRadius: "50%", width: 36, height: 36, cursor: "pointer", fontSize: "1.1rem",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>
        {/* Content */}
        {isPdf ? (
          <iframe src={src} title={label} style={{ width: "100%", height: "80vh", borderRadius: 12, border: "none" }} />
        ) : (
          <img src={src} alt={label} style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: 12 }} />
        )}
      </div>
    </div>
  );
}

// ─── Clickable thumbnail ──────────────────────────────────────────────────────
function DocThumb({ src, label, onView }) {
  if (!src) return <span style={{ color: "#9ca3af", fontSize: "0.8rem" }}>—</span>;
  // Handle Cloudinary URLs or data strings
  const isPdf = typeof src === 'string' && src.startsWith("data:application/pdf");
  return (
    <button onClick={() => onView(src, label)} style={{
      background: "none", border: "1.5px solid #e5e7eb", borderRadius: 10,
      padding: "6px 10px", cursor: "pointer", display: "inline-flex",
      alignItems: "center", gap: 6, transition: "all 0.18s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#0d47a1"; e.currentTarget.style.background = "#eff6ff"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "none"; }}
    >
      {isPdf
        ? <span style={{ fontSize: "1.2rem" }}>📄</span>
        : <img src={src} alt={label} style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 6 }} />
      }
      <span style={{ fontSize: "0.75rem", color: "#1d4ed8", fontWeight: 600 }}>🔍 View</span>
    </button>
  );
}

// ─── Verification Details Panel (shown below each doctor row) ─────────────────
function DocVerificationPanel({ user, onView }) {
  const doc = user.doctorProfile || {};
  const idTypeLabel = doc.govtIdType === "pan" ? "PAN Card" : "Aadhaar Card";
  return (
    <tr>
      <td colSpan={8} style={{ padding: "0 14px 16px", background: "#f0f7ff" }}>
        <div style={{
          background: "white", borderRadius: 14, padding: "1.25rem 1.5rem",
          border: "1.5px solid #dbeafe", display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "1rem",
        }}>
          {/* Govt ID */}
          <div>
            <p style={{ margin: "0 0 6px", fontWeight: 800, color: "#0d47a1", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.4px" }}>Government ID</p>
            <p style={{ margin: "0 0 2px", fontSize: "0.85rem", color: "#374151" }}><b>Type:</b> {idTypeLabel}</p>
            <p style={{ margin: "0 0 8px", fontSize: "0.85rem", color: "#374151" }}><b>Number:</b> {doc.govtIdNumber || "—"}</p>
            <DocThumb src={doc.govtIdPhoto} label="Govt ID Photo" onView={onView} />
          </div>
          {/* Medical Council */}
          <div>
            <p style={{ margin: "0 0 6px", fontWeight: 800, color: "#0d47a1", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.4px" }}> Medical Council</p>
            <p style={{ margin: "0 0 2px", fontSize: "0.85rem", color: "#374151" }}><b>Council:</b> {doc.medicalCouncil || "—"}</p>
            <p style={{ margin: "0 0 2px", fontSize: "0.85rem", color: "#374151" }}><b>Reg. Year:</b> {doc.regYear || "—"}</p>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#374151" }}><b>Reg. No:</b> {doc.medicalRegNumber || "—"}</p>
          </div>
          {/* Documents */}
          <div>
            <p style={{ margin: "0 0 8px", fontWeight: 800, color: "#0d47a1", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.4px" }}> Uploaded Documents</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "0.8rem", color: "#6b7280", width: 130 }}>Medical License:</span>
                <DocThumb src={doc.medicalLicense} label="Medical License" onView={onView} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "0.8rem", color: "#6b7280", width: 130 }}>Reg. Certificate:</span>
                <DocThumb src={doc.registrationCert} label="Registration Certificate" onView={onView} />
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─── Profile Modal ────────────────────────────────────────────────────────────
function ProfileModal({ user, onClose }) {
  if (!user) return null;
  const isDoctor = user.role === "doctor";

  const fields = isDoctor
    ? [
        { label: "Full Name",   value: user.name,        icon: "👤" },
        { label: "Email",        value: user.email,       icon: "📧" },
        { label: "Mobile",       value: user.mobileNo || "—", icon: "📱" },
        { label: "Specialty",    value: user.doctorProfile?.specialty || "—", icon: "🏥" },
        { label: "Gender",       value: user.gender || "—",   icon: "⚧" },
        { label: "Date of Birth",value: user.dateOfBirth || "—", icon: "🎂" },
        { label: "Address",      value: user.address || "—",   icon: "📍" },
        { label: "Pincode",      value: user.pincode || "—",   icon: "🗺️" },
        { label: "Profile Status", value: (user.doctorProfile?.status || "pending").toUpperCase(), icon: "🔖" },
      ]
    : [
        { label: "Full Name",    value: user.name,        icon: "👤" },
        { label: "Email",        value: user.email,       icon: "📧" },
        { label: "Mobile",       value: user.mobileNo || "—", icon: "📱" },
        { label: "Gender",       value: user.gender || "—",   icon: "⚧" },
        { label: "Date of Birth",value: user.dateOfBirth || "—", icon: "🎂" },
        { label: "Address",      value: user.address || "—",   icon: "📍" },
        { label: "Pincode",      value: user.pincode || "—",   icon: "🗺️" },
      ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem", animation: "fadeIn 0.25s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "white", borderRadius: "24px", width: "100%", maxWidth: "520px",
          boxShadow: "0 30px 70px rgba(0,0,0,0.25)", overflow: "hidden",
          animation: "slideDown 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Banner header */}
        <div style={{
          background: isDoctor
            ? "linear-gradient(135deg,#0a0f2c,#0d47a1)"
            : "linear-gradient(135deg,#7f1d1d,#b91c1c)",
          padding: "2rem",
          display: "flex", alignItems: "center", gap: "1.25rem",
          position: "relative",
        }}>
          {/* Avatar */}
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2.2rem", flexShrink: 0,
            border: "3px solid rgba(255,255,255,0.4)",
          }}>
            {isDoctor ? "👨‍⚕️" : "🧑"}
          </div>
          <div>
            <h2 style={{ color: "white", margin: 0, fontSize: "1.35rem", fontWeight: 800 }}>{user.name}</h2>
            <p style={{ color: "rgba(255,255,255,0.7)", margin: "4px 0 0", fontSize: "0.85rem" }}>
              {isDoctor ? `👨‍⚕️ Doctor · ${user.specialty || "—"}` : "🧑 Patient"}
            </p>
            {isDoctor && (
              <div style={{ marginTop: "8px" }}>
                <StatusBadge status={user.doctorProfile?.status || "pending"} />
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 14, right: 14,
              background: "rgba(255,255,255,0.15)", border: "none",
              borderRadius: "50%", width: 32, height: 32, cursor: "pointer",
              fontSize: "1rem", color: "white", lineHeight: 1,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
        </div>

        {/* Fields grid */}
        <div style={{ padding: "1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {fields.map(({ label, value, icon }) => (
            <div key={label} style={{
              background: "#f8fafc", borderRadius: "12px", padding: "0.85rem 1rem",
              borderLeft: "3px solid #e5e7eb",
            }}>
              <p style={{ margin: 0, fontSize: "0.7rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                {icon} {label}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "0.88rem", color: "#111827", fontWeight: 600, wordBreak: "break-word" }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        <div style={{ padding: "0 1.5rem 1.5rem", textAlign: "right" }}>
          <button
            onClick={onClose}
            style={{ padding: "9px 24px", background: "#f1f5f9", border: "none", borderRadius: "20px", cursor: "pointer", fontWeight: 600, color: "#475569" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar Nav Item ─────────────────────────────────────────────────────────
function SidebarItem({ icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: "12px",
        padding: "12px 16px", border: "none", borderRadius: "12px",
        cursor: "pointer", transition: "all 0.2s", textAlign: "left",
        background: active ? "rgba(255,255,255,0.15)" : "transparent",
        color: active ? "white" : "rgba(255,255,255,0.6)",
        fontWeight: active ? 700 : 500, fontSize: "0.9rem",
        borderLeft: active ? "3px solid #42a5f5" : "3px solid transparent",
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ fontSize: "1.15rem", width: "24px", textAlign: "center" }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge > 0 && (
        <span style={{
          background: "#ef4444", color: "white", fontSize: "0.7rem", fontWeight: 800,
          padding: "2px 8px", borderRadius: "10px", minWidth: "20px", textAlign: "center",
        }}>{badge}</span>
      )}
    </button>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
const TABS = ["requests", "approved", "patients", "feedback"];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab]           = useState("requests");
  const [users, setUsers]       = useState([]);
  const [profileUser, setProfileUser] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [docViewer, setDocViewer]     = useState(null);
  const [feedbackSubTab, setFeedbackSubTab] = useState("complaint");
  const [feedbackRole, setFeedbackRole]     = useState("all");
  const [submissions, setSubmissions]       = useState([]);
  const [replyText, setReplyText]           = useState({}); // { [submissionId]: string }

  useEffect(() => {
    if (localStorage.getItem("adminSession") !== "true") {
      navigate("/admin/login"); return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
        const usersResp = await api.get("/users/all");
        setUsers(usersResp.data.data);

        const contactsResp = await api.get("/contacts");
        setSubmissions(contactsResp.data.data);
    } catch (error) {
        console.error("Error loading data from server:", error);
    }
  };

  const updateDoctorStatus = async (user, newStatus) => {
    try {
        if (!user.doctorProfile?._id) return;
        
        await api.patch(`/users/admin/approve-doctor/${user.doctorProfile._id}`, { status: newStatus });
        
        // Refresh local state
        loadData();

        addNotification(user.email, {
          icon: newStatus === "approved" ? "✅" : newStatus === "rejected" ? "❌" : "⏳",
          type: "profile_status",
          message:
            newStatus === "approved"
              ? "🎉 Your doctor profile has been approved by admin! You can now receive patient appointments."
              : newStatus === "rejected"
              ? "Your doctor profile was rejected by admin. Please contact support for more information."
              : "Your doctor profile status has been reset to pending review.",
        });
    } catch (error) {
        console.error("Error updating doctor status:", error);
    }
  };

  const handleSendReply = async (sub) => {
    const text = (replyText[sub._id] || "").trim();
    if (!text) return;
    
    try {
        await api.patch(`/contacts/${sub._id}`, { adminReply: text });
        
        // Refresh local state
        loadData();

        // Notify the user
        if (sub.email && sub.email !== "unknown") {
          addNotification(sub.email, {
            icon: "📬",
            type: "admin_reply",
            message: `Admin replied to your complaint: "${text}"`,
          });
        }
        // Clear the reply input
        setReplyText(prev => ({ ...prev, [sub._id]: "" }));
    } catch (error) {
        console.error("Error sending reply:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminSession");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("storage"));
    navigate("/login");
  };

  const doctors          = users.filter(u => u.role === "doctor");
  const approvedDoctors  = doctors.filter(d => d.doctorProfile?.status === "approved");
  const pendingDoctors   = doctors.filter(d => d.doctorProfile?.status !== "approved");
  const patients         = users.filter(u => u.role === "patient");

  // Current date for dashboard header
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });


  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ─── Responsive styles ─── */}
      <style>{`
        .admin-navbar { display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; height: 64px; position: sticky; top: 0; z-index: 100; background: linear-gradient(135deg, #0a0f2c, #0d47a1); box-shadow: 0 2px 16px rgba(0,0,0,0.2); }
        .admin-brand { display: flex; align-items: center; gap: 12px; }
        .admin-right { display: flex; align-items: center; gap: 12px; }
        .admin-pending-pill { padding: 4px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; background: rgba(251,191,36,0.2); color: #fde68a; border: 1px solid rgba(251,191,36,0.3); animation: pulse 2s infinite; }
        .admin-signout-btn { padding: 7px 16px; border-radius: 10px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px; }
        .admin-signout-btn:hover { background: rgba(239,68,68,0.25); }
        .admin-page-header { background: white; padding: 1.25rem 2rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 4px rgba(0,0,0,0.03); flex-wrap: wrap; gap: 0.75rem; }
        .admin-content { max-width: 1300px; margin: 0 auto; padding: 2rem; }
        .admin-stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem; }
        .admin-tabs-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 1.5rem; padding: 1rem 1.25rem; background: white; border-radius: 14px; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
        .admin-tab-btn { padding: 10px 22px; border-radius: 12px; border: 2px solid transparent; cursor: pointer; font-weight: 700; font-size: 0.88rem; transition: all 0.18s; display: flex; align-items: center; gap: 8px; }
        .admin-tab-btn.active { background: linear-gradient(135deg,#0d47a1,#1565c0); color: white; border-color: transparent; box-shadow: 0 4px 16px rgba(13,71,161,0.3); }
        .admin-tab-btn:not(.active) { background: #f8fafc; color: #475569; border-color: #e5e7eb; }
        .admin-tab-btn:not(.active):hover { background: #e0e7ff; border-color: #a5b4fc; color: #1e40af; }
        .admin-tab-count { padding: 2px 8px; border-radius: 8px; font-size: 0.72rem; font-weight: 800; }
        .admin-tab-btn.active .admin-tab-count { background: rgba(255,255,255,0.25); color: white; }
        .admin-tab-btn:not(.active) .admin-tab-count { background: #e5e7eb; color: #6b7280; }

        @media (max-width: 768px) {
          .admin-navbar { padding: 0 1rem; height: 56px; }
          .admin-brand-text { display: none; }
          .admin-signout-label { display: none; }
          .admin-page-header { padding: 1rem; }
          .admin-content { padding: 1rem; }
          .admin-stats-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
          .admin-tabs-row { gap: 6px; padding: 0.75rem; }
          .admin-tab-btn { padding: 8px 14px; font-size: 0.78rem; }
        }
        @media (max-width: 480px) {
          .admin-stats-grid { grid-template-columns: 1fr; }
          .admin-tabs-row { flex-direction: column; }
          .admin-tab-btn { width: 100%; justify-content: center; }
        }
      `}</style>

      {/* ─── Top Navbar (Branding + Sign Out only) ─── */}
      <nav className="admin-navbar">
        <div className="admin-brand">
          <div style={{
            width: 38, height: 38, borderRadius: "10px",
            background: "linear-gradient(135deg, #1565c0, #42a5f5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.2rem", boxShadow: "0 4px 12px rgba(21,101,192,0.4)",
          }}>
            🛡️
          </div>
          <div className="admin-brand-text">
            <h1 style={{ color: "white", margin: 0, fontSize: "1.05rem", fontWeight: 800, letterSpacing: "-0.2px" }}>Aurelyf Care</h1>
            <p style={{ color: "rgba(255,255,255,0.45)", margin: 0, fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Admin Panel</p>
          </div>
        </div>

        <div className="admin-right">
          <button onClick={handleLogout} className="admin-signout-btn">
            🚪 <span className="admin-signout-label">Sign Out</span>
          </button>
        </div>
      </nav>

      {/* ─── Page Header ─── */}
      {/* <div className="admin-page-header">
        <div>
          <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "#0f172a" }}>
            {tab === "requests" && "📋 Doctor Requests"}
            {tab === "approved" && "✅ Approved Doctors"}
            {tab === "patients" && "🧑 Patient Management"}
            {tab === "feedback" && "💬 Complaints & Feedback"}
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#94a3b8" }}>{dateStr}</p>
        </div>
        <span style={{
          padding: "5px 14px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 700,
          background: "#f0f7ff", color: "#1565c0", border: "1px solid #dbeafe",
        }}>
          👥 {users.length} Total Users
        </span>
      </div> */}

      {/* ─── Main Content ─── */}
      <div className="admin-content">

        {/* Stats Cards */}
        <div className="admin-stats-grid">
          <StatCard icon="👨‍⚕️" label="Total Doctors"    value={doctors.length}          color="#0d47a1" />
          <StatCard
            icon="✅" label="Approved Doctors" value={approvedDoctors.length}  color="#16a34a"
            onClick={() => setTab("approved")} active={tab === "approved"}
          />
          <StatCard icon="⏳" label="Pending Requests" value={pendingDoctors.length}   color="#d97706" onClick={() => setTab("requests")} active={tab === "requests"} />
          <StatCard
            icon="🧑" label="Total Patients"   value={patients.length}         color="#e53935"
            onClick={() => setTab("patients")} active={tab === "patients"}
          />
          <StatCard
            icon="💬" label="Feedback & Complaints" value={submissions.length} color="#7c3aed"
            onClick={() => setTab("feedback")} active={tab === "feedback"}
          />
        </div>

        {/* ─── Tab Navigation (below cards) ─── */}
        <div className="admin-tabs-row">
          {TABS.map(t => {
            const icons = { requests: "📋", approved: "✅", patients: "🧑", feedback: "💬" };
            const labels = { requests: "Requests", approved: "Approved", patients: "Patients", feedback: "Feedback" };
            const counts = { requests: pendingDoctors.length, approved: approvedDoctors.length, patients: patients.length, feedback: submissions.length };
            return (
              <button key={t} className={`admin-tab-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
                {icons[t]} {labels[t]} <span className="admin-tab-count">{counts[t]}</span>
              </button>
            );
          })}
        </div>

        {/* Panel */}
        <div style={{ background: "white", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.07)", overflow: "hidden" }}>

          {/* ── Doctor Requests tab ── */}
          {tab === "requests" && (
            pendingDoctors.length === 0
              ? <div style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>🎉 No pending doctor requests!</div>
              : <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ background: "#f9fafb" }}>
                      <tr>
                        <th style={thStyle}>#</th><th style={thStyle}>Name</th><th style={thStyle}>Email</th>
                        <th style={thStyle}>Specialty</th><th style={thStyle}>Mobile</th><th style={thStyle}>Status</th>
                        <th style={thStyle}>Actions</th><th style={thStyle}>Profile</th><th style={thStyle}>Docs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingDoctors.map((doc, i) => {
                        const status = doc.doctorProfile?.status || "pending";
                        const isExpanded = expandedRow === doc._id;
                        return (
                          <React.Fragment key={doc._id}>
                            <tr style={{ background: isExpanded ? "#f0f7ff" : i % 2 === 0 ? "white" : "#fafafa" }}>
                              <td style={tdStyle}>{i + 1}</td>
                              <td style={{ ...tdStyle, fontWeight: 600, color: "#111827" }}>{doc.name}</td>
                              <td style={tdStyle}>{doc.email}</td>
                              <td style={tdStyle}>{doc.doctorProfile?.specialty || "—"}</td>
                              <td style={tdStyle}>{doc.mobileNo || "—"}</td>
                              <td style={tdStyle}><StatusBadge status={status} /></td>
                              <td style={tdStyle}>
                                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                  {status !== "approved" && <button onClick={() => updateDoctorStatus(doc, "approved")} style={{ ...btnBase, background: "#dcfce7", color: "#15803d" }}>✅ Approve</button>}
                                  {status !== "rejected" && <button onClick={() => updateDoctorStatus(doc, "rejected")} style={{ ...btnBase, background: "#fee2e2", color: "#b91c1c" }}>❌ Reject</button>}
                                  {status !== "pending" && <button onClick={() => updateDoctorStatus(doc, "pending")} style={{ ...btnBase, background: "#fef9c3", color: "#92400e" }}>⏳ Reset</button>}
                                </div>
                              </td>
                              <td style={tdStyle}><button onClick={() => setProfileUser(doc)} style={{ ...btnBase, background: "#eff6ff", color: "#1d4ed8" }}>👁 Profile</button></td>
                              <td style={tdStyle}><button onClick={() => setExpandedRow(isExpanded ? null : doc._id)} style={{ ...btnBase, background: isExpanded ? "#fef9c3" : "#f3f4f6", color: "#374151" }}>{isExpanded ? "▲ Hide" : "🔍 Verify"}</button></td>
                            </tr>
                            {isExpanded && <DocVerificationPanel user={doc} onView={(src, label) => setDocViewer({ src, label })} />}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
          )}

          {/* ── Approved Doctors tab ── */}
          {tab === "approved" && (
            approvedDoctors.length === 0
              ? <div style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>No approved doctors yet.</div>
              : <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ background: "#f9fafb" }}>
                      <tr>
                        <th style={thStyle}>#</th><th style={thStyle}>Name</th><th style={thStyle}>Email</th>
                        <th style={thStyle}>Specialty</th><th style={thStyle}>Mobile</th><th style={thStyle}>Status</th>
                        <th style={thStyle}>Actions</th><th style={thStyle}>Profile</th><th style={thStyle}>Docs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvedDoctors.map((doc, i) => {
                        const isExpanded = expandedRow === doc._id;
                        return (
                          <React.Fragment key={doc._id}>
                            <tr style={{ background: isExpanded ? "#f0f7ff" : i % 2 === 0 ? "white" : "#fafafa" }}>
                              <td style={tdStyle}>{i + 1}</td>
                              <td style={{ ...tdStyle, fontWeight: 600, color: "#111827" }}>{doc.name}</td>
                              <td style={tdStyle}>{doc.email}</td>
                              <td style={tdStyle}>{doc.doctorProfile?.specialty || "—"}</td>
                              <td style={tdStyle}>{doc.mobileNo || "—"}</td>
                              <td style={tdStyle}><StatusBadge status="approved" /></td>
                              <td style={tdStyle}>
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <button onClick={() => updateDoctorStatus(doc, "rejected")} style={{ ...btnBase, background: "#fee2e2", color: "#b91c1c" }}>❌ Revoke</button>
                                  <button onClick={() => updateDoctorStatus(doc, "pending")} style={{ ...btnBase, background: "#fef9c3", color: "#92400e" }}>⏳ Reset</button>
                                </div>
                              </td>
                              <td style={tdStyle}><button onClick={() => setProfileUser(doc)} style={{ ...btnBase, background: "#eff6ff", color: "#1d4ed8" }}>👁 Profile</button></td>
                              <td style={tdStyle}><button onClick={() => setExpandedRow(isExpanded ? null : doc._id)} style={{ ...btnBase, background: isExpanded ? "#fef9c3" : "#f3f4f6", color: "#374151" }}>{isExpanded ? "▲ Hide" : "🔍 Verify"}</button></td>
                            </tr>
                            {isExpanded && <DocVerificationPanel user={doc} onView={(src, label) => setDocViewer({ src, label })} />}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
          )}

          {/* ── Patients tab ── */}
          {tab === "patients" && (
            patients.length === 0
              ? <div style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>No patients registered yet.</div>
              : <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ background: "#f9fafb" }}>
                      <tr>
                        <th style={thStyle}>#</th><th style={thStyle}>Name</th><th style={thStyle}>Email</th>
                        <th style={thStyle}>Mobile</th><th style={thStyle}>Gender</th><th style={thStyle}>Date of Birth</th><th style={thStyle}>Profile</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.map((p, i) => (
                        <tr key={p.email} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                          <td style={tdStyle}>{i + 1}</td>
                          <td style={{ ...tdStyle, fontWeight: 600, color: "#111827" }}>{p.name}</td>
                          <td style={tdStyle}>{p.email}</td>
                          <td style={tdStyle}>{p.mobileNo || "—"}</td>
                          <td style={tdStyle}>{p.gender || "—"}</td>
                          <td style={tdStyle}>{p.dateOfBirth || "—"}</td>
                          <td style={tdStyle}><button onClick={() => setProfileUser(p)} style={{ ...btnBase, background: "#fff1f2", color: "#be123c" }}>👁 View Profile</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
          )}

          {/* ── Feedback tab ── */}
          {tab === "feedback" && (() => {
            const filtByType = submissions.filter(s => s.type === feedbackSubTab);
            const filtByRole = feedbackRole === "all" ? filtByType : filtByType.filter(s => s.userRole === feedbackRole);
            const Stars = ({ n }) => <span style={{ color: "#f59e0b", fontSize: "1.15rem", letterSpacing: -1 }}>{[1,2,3,4,5].map(i => i <= n ? "★" : "☆").join("")}</span>;
            const pillBtn = (active, label, onClick) => (
              <button onClick={onClick} style={{ padding: "6px 18px", borderRadius: 20, border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.82rem", background: active ? "linear-gradient(135deg,#0d47a1,#1565c0)" : "#f3f4f6", color: active ? "white" : "#374151" }}>{label}</button>
            );
            return (
              <div style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
                  {pillBtn(feedbackSubTab === "complaint", "🚨 Complaints", () => setFeedbackSubTab("complaint"))}
                  {pillBtn(feedbackSubTab === "feedback",  "⭐ Feedback",   () => setFeedbackSubTab("feedback"))}
                  <span style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
                    {pillBtn(feedbackRole === "all", "All", () => setFeedbackRole("all"))}
                    {pillBtn(feedbackRole === "doctor", "Doctors", () => setFeedbackRole("doctor"))}
                    {pillBtn(feedbackRole === "patient", "Patients", () => setFeedbackRole("patient"))}
                  </span>
                </div>
                {filtByRole.length === 0 ? (
                  <div style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>📭 No {feedbackSubTab}s found for this filter.</div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead style={{ background: "#f9fafb" }}>
                        <tr>
                          <th style={thStyle}>#</th><th style={thStyle}>Name</th><th style={thStyle}>Email</th><th style={thStyle}>Role</th><th style={thStyle}>Date</th>
                          {feedbackSubTab === "feedback" && <th style={thStyle}>Rating</th>}
                          <th style={thStyle}>{feedbackSubTab === "complaint" ? "Complaint" : "Feedback"}</th>
                          {feedbackSubTab === "complaint" && <th style={{ ...thStyle, minWidth: 220 }}>Reply</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {filtByRole.map((s, i) => (
                          <tr key={s._id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                            <td style={tdStyle}>{i + 1}</td>
                            <td style={{ ...tdStyle, fontWeight: 600, color: "#111827" }}>{s.name}</td>
                            <td style={tdStyle}>{s.email}</td>
                            <td style={tdStyle}>
                              {(() => {
                                const role = (s.userRole || "guest").toLowerCase();
                                const roleMap = {
                                  patient:  { icon: "🧑", label: "Patient",  bg: "#fce4ec", color: "#c62828" },
                                  doctor:   { icon: "👨‍⚕️", label: "Doctor",   bg: "#e3f2fd", color: "#0d47a1" },
                                  guest:    { icon: "👤", label: "Guest",    bg: "#f3f4f6", color: "#374151" },
                                };
                                const r = roleMap[role] || roleMap.guest;
                                return (
                                  <span style={{ padding: "3px 12px", borderRadius: 20, fontSize: "0.78rem", fontWeight: 700, background: r.bg, color: r.color }}>
                                    {r.icon} {r.label}
                                  </span>
                                );
                              })()}
                            </td>
                            <td style={tdStyle}>{new Date(s.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                            {feedbackSubTab === "feedback" && <td style={tdStyle}><Stars n={s.rating || 0} /></td>}
                            <td style={{ ...tdStyle, maxWidth: 340, whiteSpace: "pre-wrap" }}>{s.message || "—"}</td>
                            {feedbackSubTab === "complaint" && (
                              <td style={{ ...tdStyle, minWidth: 220 }}>
                                {s.adminReply ? (
                                  <div style={{ fontSize: "0.82rem" }}>
                                    <span style={{ display: "block", color: "#15803d", fontWeight: 700, marginBottom: 4 }}>✅ Replied</span>
                                    <span style={{ color: "#374151", whiteSpace: "pre-wrap" }}>{s.adminReply}</span>
                                    <button onClick={() => setReplyText(prev => ({ ...prev, [s._id]: s.adminReply }))} style={{ marginTop: 6, background: "none", border: "none", color: "#6b7280", fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline", padding: 0 }}>Edit reply</button>
                                  </div>
                                ) : (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <textarea rows={2} placeholder="Type a reply..." value={replyText[s._id] || ""} onChange={e => setReplyText(prev => ({ ...prev, [s._id]: e.target.value }))} style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: "0.82rem", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
                                    <button onClick={() => handleSendReply(s)} disabled={!(replyText[s._id] || "").trim()} style={{ padding: "6px 14px", background: "linear-gradient(135deg,#0d47a1,#1565c0)", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: "0.8rem", alignSelf: "flex-start", opacity: !(replyText[s._id] || "").trim() ? 0.45 : 1 }}>📬 Send Reply</button>
                                  </div>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

        </div>
      </div>

      {profileUser && <ProfileModal user={profileUser} onClose={() => setProfileUser(null)} />}
      {docViewer && <DocViewerModal src={docViewer.src} label={docViewer.label} onClose={() => setDocViewer(null)} />}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
      `}</style>
    </div>
  );
}
