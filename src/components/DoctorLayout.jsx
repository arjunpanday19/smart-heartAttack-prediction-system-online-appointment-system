import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ClipboardList, Stethoscope, UserCircle, Mail, Bell, BellOff, LogOut, Clock, ShieldAlert } from "lucide-react";
import { getNotifications, markRead, markAllRead } from "../utils/notifications";
import api from "../api";

// ─── Sidebar Notification Bell ────────────────────────────────────────────────
function SidebarNotificationBell({ user }) {
  const [open, setOpen]   = useState(false);
  const [notifs, setNotifs] = useState([]);
  const dropRef = useRef(null);

  const load = async () => {
    const data = await getNotifications();
    setNotifs(data);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const interval = setInterval(load, 30_000);
    window.addEventListener("notifications_updated", load);
    return () => {
      clearInterval(interval);
      window.removeEventListener("notifications_updated", load);
    };
  }, [user?.email]); // eslint-disable-line

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notifs.filter((n) => !n.read).length;

  const handleMarkOne = async (id) => { await markRead(id); load(); };
  const handleMarkAll = async ()   => { await markAllRead(); load(); };

  return (
    <div ref={dropRef} style={{ position: "relative" }}>
      {/* Trigger row — styled like a nav-item */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: "0.85rem",
          padding: "0.85rem 1.2rem", borderRadius: 10, cursor: "pointer",
          border: "none", background: open ? "rgba(255,255,255,0.15)" : "transparent",
          color: open ? "white" : "rgba(255,255,255,0.75)", fontWeight: 600,
          fontSize: "0.95rem", transition: "background 0.2s", position: "relative",
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = "transparent"; }}
      >
        <Bell size={20} />
        <span style={{ flex: 1, textAlign: "left" }}>Notifications</span>
        {unread > 0 && (
          <span style={{
            background: "#ef4444", color: "white", fontSize: "0.7rem",
            fontWeight: 800, padding: "2px 7px", borderRadius: 10, minWidth: 20,
            textAlign: "center",
          }}>{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {/* Dropdown — rendered to the right of the sidebar */}
      {open && (
        <div style={{
          position: "fixed", top: "auto", left: 268, width: 340, maxHeight: 420,
          background: "white", borderRadius: 16,
          boxShadow: "0 12px 40px rgba(0,0,0,0.22)",
          zIndex: 9999, overflow: "hidden",
          display: "flex", flexDirection: "column",
          border: "1px solid #e5e7eb",
          animation: "slideIn 0.2s ease",
        }}>
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px 10px", borderBottom: "1px solid #f3f4f6",
          }}>
            <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#111", display: "flex", alignItems: "center", gap: 6 }}>
              <Bell size={16} color="#0d47a1" strokeWidth={2.5} />
              Notifications
              {unread > 0 && (
                <span style={{ marginLeft: 4, background: "#ef4444", color: "white", fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                  {unread} new
                </span>
              )}
            </span>
            {unread > 0 && (
              <button onClick={handleMarkAll} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem", color: "#0d47a1", fontWeight: 700, padding: "4px 8px", borderRadius: 8, textDecoration: "underline" }}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {notifs.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#9ca3af", fontSize: "0.88rem" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.5rem" }}>
                  <BellOff size={40} color="#d1d5db" strokeWidth={1.5} />
                </div>
                No notifications yet
              </div>
            ) : (
              notifs.map((n) => (
                <div key={n._id} style={{
                  display: "flex", gap: "10px", padding: "12px 16px",
                  borderBottom: "1px solid #f9fafb",
                  background: n.read ? "#fafafa" : "#eff6ff",
                  transition: "background 0.2s", alignItems: "flex-start",
                }}>
                  <span style={{ fontSize: "1.25rem", flexShrink: 0, marginTop: 2 }}>{n.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "0.83rem", color: n.read ? "#6b7280" : "#111827", lineHeight: 1.5, wordBreak: "break-word" }}>
                      {n.message}
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: "0.7rem", color: "#9ca3af" }}>
                      {new Date(n.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => handleMarkOne(n._id)}
                      style={{
                        flexShrink: 0, background: "#dbeafe", border: "none", borderRadius: 20,
                        padding: "3px 10px", cursor: "pointer", fontSize: "0.7rem",
                        fontWeight: 700, color: "#1d4ed8", whiteSpace: "nowrap", marginTop: 2,
                      }}
                    >
                      ✓ Read
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Approval Pending Screen (fullscreen, no sidebar, no dashboard) ──────────
function ApprovalPendingScreen({ user, onLogout, onRefresh }) {
  const [checking, setChecking] = useState(false);

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const res = await api.get(`/users/me?email=${encodeURIComponent(user.email)}`);
      const freshUser = res.data.data;
      localStorage.setItem("user", JSON.stringify(freshUser));
      window.dispatchEvent(new Event("storage"));

      if (freshUser.doctorProfile?.status === "approved") {
        window.location.reload();
      } else {
        onRefresh?.(freshUser);
      }
    } catch (err) {
      console.error("Failed to check status:", err);
    }
    setChecking(false);
  };

  const status = user?.doctorProfile?.status || "pending";
  const isRejected = status === "rejected";

  return (
    <>
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes pulse-ring { 0% { transform: scale(0.9); opacity: 1; } 100% { transform: scale(1.4); opacity: 0; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div style={{
        minHeight: "100vh",
        background: isRejected
          ? "linear-gradient(135deg, #1a0505 0%, #3b0a0a 40%, #7f1d1d 100%)"
          : "linear-gradient(135deg, #0a0f2c 0%, #0d1b3e 40%, #0d47a1 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Segoe UI', system-ui, sans-serif", padding: "2rem",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "-100px", right: "-60px", width: "350px", height: "350px", borderRadius: "50%", background: isRejected ? "rgba(239,68,68,0.08)" : "rgba(66,165,245,0.08)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", bottom: "-120px", left: "-80px", width: "400px", height: "400px", borderRadius: "50%", background: isRejected ? "rgba(239,68,68,0.06)" : "rgba(13,71,161,0.1)", filter: "blur(100px)" }} />

        <div style={{ maxWidth: "520px", width: "100%", textAlign: "center", position: "relative", zIndex: 1, animation: "fadeInUp 0.6s ease" }}>
          <div style={{ position: "relative", display: "inline-block", marginBottom: "2rem" }}>
            <div style={{ position: "absolute", inset: "-15px", borderRadius: "50%", border: isRejected ? "2px solid rgba(239,68,68,0.3)" : "2px solid rgba(66,165,245,0.3)", animation: "pulse-ring 2s ease infinite" }} />
            <div style={{
              width: 100, height: 100, borderRadius: "50%",
              background: isRejected ? "linear-gradient(135deg, #b91c1c, #ef4444)" : "linear-gradient(135deg, #1565c0, #42a5f5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: isRejected ? "0 12px 40px rgba(239,68,68,0.35)" : "0 12px 40px rgba(21,101,192,0.35)",
              animation: "float 3s ease-in-out infinite",
            }}>
              {isRejected ? <ShieldAlert size={48} color="white" strokeWidth={1.8} /> : <Clock size={48} color="white" strokeWidth={1.8} />}
            </div>
          </div>

          <h1 style={{ color: "white", fontSize: "2rem", fontWeight: 800, margin: "0 0 0.75rem", letterSpacing: "-0.3px" }}>
            {isRejected ? "Profile Rejected" : "Approval Pending"}
          </h1>

          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.05rem", lineHeight: 1.6, margin: "0 0 2rem", maxWidth: "420px", marginLeft: "auto", marginRight: "auto" }}>
            {isRejected
              ? "Your doctor profile has been reviewed and was not approved. Please contact support or update your documents and re-submit."
              : "Your doctor registration has been received. Our admin team is currently reviewing your credentials and documents. You'll gain full access once approved."
            }
          </p>

          <div style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(16px)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.12)", padding: "1.75rem", marginBottom: "2rem", boxShadow: "0 16px 48px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center", marginBottom: "1.25rem" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(255,255,255,0.2)" }}>
                <Stethoscope size={24} color="white" />
              </div>
              <div style={{ textAlign: "left" }}>
                <p style={{ margin: 0, color: "white", fontWeight: 700, fontSize: "1.05rem" }}>Dr. {user?.name || "Doctor"}</p>
                <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.5)", fontSize: "0.82rem" }}>
                  {user?.doctorProfile?.specialty || user?.specialty || "Specialist"} · {user?.email}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px 20px", borderRadius: "12px", background: isRejected ? "rgba(239,68,68,0.15)" : "rgba(251,191,36,0.15)", border: isRejected ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(251,191,36,0.3)" }}>
              <span style={{ fontSize: "1.2rem" }}>{isRejected ? "❌" : "⏳"}</span>
              <span style={{ color: isRejected ? "#fca5a5" : "#fde68a", fontWeight: 700, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Status: {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "320px", margin: "0 auto" }}>
            <button
              onClick={handleCheckStatus}
              disabled={checking}
              style={{
                padding: "14px 24px", borderRadius: "14px", border: "none",
                background: checking ? "rgba(255,255,255,0.15)" : "linear-gradient(135deg, #1565c0, #42a5f5)",
                color: "white", fontWeight: 700, fontSize: "0.95rem",
                cursor: checking ? "not-allowed" : "pointer", transition: "all 0.2s",
                boxShadow: checking ? "none" : "0 6px 24px rgba(21,101,192,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              }}
            >
              {checking ? "⏳ Checking..." : "🔄 Check Approval Status"}
            </button>
            <button
              onClick={onLogout}
              style={{
                padding: "12px 24px", borderRadius: "14px",
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: "0.88rem",
                cursor: "pointer", transition: "all 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              }}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>

          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.75rem", marginTop: "2rem", letterSpacing: "0.3px" }}>
            {isRejected ? "📧 For queries, contact support@aurelyfcare.com" : "🔔 You'll be notified once your profile is approved"}
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Main Doctor Layout ──────────────────────────────────────────────────────
export default function DoctorLayout({ children, user, setUser }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("profileImage");
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("auth-change"));
    navigate("/login");
  };

  // ── Check if doctor is approved ──
  const doctorStatus = user?.doctorProfile?.status || "pending";
  const isApproved = doctorStatus === "approved";

  // If doctor is NOT approved, show ONLY the pending banner — nothing else
  if (user && user.role === "doctor" && !isApproved) {
    return (
      <ApprovalPendingScreen
        user={user}
        onLogout={handleLogout}
        onRefresh={(freshUser) => setUser(freshUser)}
      />
    );
  }

  const isCenteredPage = pathname === "/profile" || pathname === "/contact";

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .dashboard-layout { display: flex; min-height: 100vh; background: linear-gradient(135deg, #f5f7fa, #e8edf5); font-family: 'Segoe UI', sans-serif; position: relative; }
        .left-sidebar { width: 260px; background: #0d47a1; color: white; display: flex; flex-direction: column; flex-shrink: 0; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: sticky; top: 0; height: 100vh; overflow-y: auto; }
        .sidebar-overlay { display: none; }
        .main-wrapper { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .mobile-header { display: none; padding: 1rem 1.5rem; background: #0d47a1; color: white; align-items: center; gap: 1rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1); position: sticky; top: 0; z-index: 50; }
        .content-area { display: flex; gap: 2rem; align-items: flex-start; max-width: 1400px; margin: 0 auto; width: 100%; padding: 2rem 2.5rem; }
        .content-area.centered { justify-content: center; padding-top: 1rem; padding-bottom: 2rem; }
        .main-panel { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1.5rem; width: 100%; max-width: 100%; }
        
        .nav-item { padding: 0.85rem 1.2rem; border-radius: 10px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 0.85rem; transition: background 0.2s; }
        .nav-item.active { background: rgba(255,255,255,0.15); color: white; }
        .nav-item:not(.active) { color: rgba(255,255,255,0.75); }
        .nav-item:not(.active):hover { background: rgba(255,255,255,0.08); color: white; }

        .hamburger-btn { background: transparent; border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0.5rem; border-radius: 6px; }
        .hamburger-btn:hover { background: rgba(255,255,255,0.15); }

        @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }

        @media (max-width: 1100px) {
          .content-area { flex-direction: column; padding: 1.5rem; width: 100%; }
        }
        
        @media (max-width: 850px) {
          .left-sidebar { position: fixed; top: 0; left: 0; height: 100vh; z-index: 100; transform: translateX(-100%); }
          .left-sidebar.open { transform: translateX(0); }
          .sidebar-overlay.open { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 99; backdrop-filter: blur(2px); }
          .mobile-header { display: flex; }
          .content-area { padding: 1rem; width: 100%; overflow-x: hidden; }
        }
      `}</style>

      <div className="dashboard-layout">
        <div className={`sidebar-overlay ${isSidebarOpen ? "open" : ""}`} onClick={() => setIsSidebarOpen(false)}></div>

        {/* ── Left Sidebar ── */}
        <div className={`left-sidebar ${isSidebarOpen ? "open" : ""}`}>
          <div style={{ padding: "1.75rem 1.5rem", fontSize: "1.5rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.6rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ background: "white", color: "#0d47a1", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Stethoscope size={22} strokeWidth={2.5} />
            </div>
            Auralyf Care
          </div>
          <div style={{ padding: "1.5rem 1rem", display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
            <div className={`nav-item ${pathname === "/doctor-appointments" ? "active" : ""}`} onClick={() => { navigate("/doctor-appointments"); setIsSidebarOpen(false); }}>
              <ClipboardList size={20} /> Dashboard Overview
            </div>
            <div className={`nav-item ${pathname === "/doctor-availability" ? "active" : ""}`} onClick={() => { navigate("/doctor-availability"); setIsSidebarOpen(false); }}>
              <Clock size={20} /> Manage Availability
            </div>

            {/* ── Real Notification Bell in sidebar ── */}
            <SidebarNotificationBell user={user} />

            <div className={`nav-item ${pathname === "/contact" ? "active" : ""}`} onClick={() => { navigate("/contact"); setIsSidebarOpen(false); }}>
              <Mail size={20} /> Contact Us
            </div>
          </div>

          <div style={{ padding: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div className={`nav-item ${pathname === "/profile" ? "active" : ""}`} onClick={() => { navigate("/profile"); setIsSidebarOpen(false); }}>
              <UserCircle size={20} /> My Profile
            </div>
            <div className="nav-item" style={{ color: "#ff8a80" }} onClick={handleLogout}>
              <LogOut size={20} /> Log Out
            </div>
          </div>
        </div>

        {/* ── Main Wrapper ── */}
        <div className="main-wrapper">
          <div className="mobile-header">
             <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)}>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
             </button>
             <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>Doctor Area</h2>
          </div>

          <div className={`content-area ${isCenteredPage ? "centered" : ""}`}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
