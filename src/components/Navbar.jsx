import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  getNotifications,
  markRead,
  markAllRead,
} from "../utils/notifications";
import { Bell, BellOff, HeartPulse, Lock } from "lucide-react";

// ─── Bell Dropdown ────────────────────────────────────────────────────────────
function NotificationBell({ user }) {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const dropRef = useRef(null);

  const load = async () => {
    const data = await getNotifications();
    setNotifs(data);
  };

  // Load on mount and re-load when notifications_updated event fires
  useEffect(() => {
    if (!user) return;
    load();
    // Poll every 30 seconds to catch server-side pushes
    const interval = setInterval(load, 30_000);
    window.addEventListener("notifications_updated", load);
    return () => {
      clearInterval(interval);
      window.removeEventListener("notifications_updated", load);
    };
  }, [user?.email]); // eslint-disable-line

  // Close when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notifs.filter((n) => !n.read).length;

  const handleMarkRead = async (id) => {
    await markRead(id);
    load();
  };

  const handleMarkAll = async () => {
    await markAllRead();
    load();
  };

  return (
    <div
      ref={dropRef}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {/* Bell Button */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Notifications"
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          lineHeight: 1,
          padding: "6px 8px",
          borderRadius: "50%",
          transition: "background 0.18s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(255,255,255,0.15)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
      >
        <Bell size={22} strokeWidth={2} />
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              background: "#ef4444",
              color: "white",
              fontSize: "0.65rem",
              fontWeight: 800,
              width: 18,
              height: 18,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid white",
              lineHeight: 1,
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: 340,
            maxHeight: 420,
            background: "white",
            borderRadius: 16,
            boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
            zIndex: 9999,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            border: "1px solid #f0f0f0",
            animation: "slideDown 0.2s ease",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px 10px",
              borderBottom: "1px solid #f3f4f6",
            }}
          >
            <span
              style={{
                fontWeight: 800,
                fontSize: "0.95rem",
                color: "#111",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Bell size={16} color="#0d47a1" strokeWidth={2.5} />
              Notifications
              {unread > 0 && (
                <span
                  style={{
                    marginLeft: 4,
                    background: "#ef4444",
                    color: "white",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 20,
                  }}
                >
                  {unread} new
                </span>
              )}
            </span>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  color: "#0d47a1",
                  fontWeight: 700,
                  padding: "4px 8px",
                  borderRadius: 8,
                  textDecoration: "underline",
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {notifs.length === 0 ? (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "#9ca3af",
                  fontSize: "0.88rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <BellOff size={40} color="#d1d5db" strokeWidth={1.5} />
                </div>
                No notifications yet
              </div>
            ) : (
              notifs.map((n) => (
                <div
                  key={n._id}
                  style={{
                    display: "flex",
                    gap: "10px",
                    padding: "12px 16px",
                    borderBottom: "1px solid #f9fafb",
                    background: n.read ? "#fafafa" : "#eff6ff",
                    transition: "background 0.2s",
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    style={{ fontSize: "1.3rem", flexShrink: 0, marginTop: 2 }}
                  >
                    {n.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.83rem",
                        color: n.read ? "#6b7280" : "#111827",
                        lineHeight: 1.5,
                        wordBreak: "break-word",
                      }}
                    >
                      {n.message}
                    </p>
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: "0.7rem",
                        color: "#9ca3af",
                      }}
                    >
                      {new Date(n.createdAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => handleMarkRead(n._id)}
                      title="Mark as read"
                      style={{
                        flexShrink: 0,
                        background: "#dbeafe",
                        border: "none",
                        borderRadius: 20,
                        padding: "3px 10px",
                        cursor: "pointer",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        color: "#1d4ed8",
                        whiteSpace: "nowrap",
                        marginTop: 2,
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

// ─── Navbar ───────────────────────────────────────────────────────────────────
export default function Navbar({ user, profileImage }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const showBell = user?.role === "patient" || user?.role === "doctor";

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div
          className="navbar-logo"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <HeartPulse size={28} color="#ef4444" strokeWidth={2.2} />
        </div>
        <h2>Aurelyf Care</h2>
      </div>
      <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div className={`navbar-links ${menuOpen ? "active" : ""}`}>
        {user?.role === "doctor" ? (
          // ── Doctor nav ──
          (() => {
            const isApproved = user.status === "approved";
            return (
              <>
                {isApproved ? (
                  <Link
                    to="/doctor-appointments"
                    onClick={() => setMenuOpen(false)}
                  >
                    Appointments
                  </Link>
                ) : (
                  <span
                    title="Available after admin approves your profile"
                    style={{
                      color: "rgba(255,255,255,0.35)",
                      cursor: "not-allowed",
                      fontWeight: 500,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    Appointments <Lock size={14} strokeWidth={2.5} />
                  </span>
                )}
                <Link to="/about" onClick={() => setMenuOpen(false)}>
                  About
                </Link>
                <Link to="/contact" onClick={() => setMenuOpen(false)}>
                  Contact Us
                </Link>
                {isApproved && <NotificationBell user={user} />}
                <Link
                  to="/profile"
                  className="nav-profile-container"
                  onClick={() => setMenuOpen(false)}
                >
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="nav-profile-img"
                    />
                  ) : (
                    <div className="nav-profile-placeholder">
                      {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                </Link>
              </>
            );
          })()
        ) : (
          // ── Patient / Guest nav ──
          <>
            <Link to="/" onClick={() => setMenuOpen(false)}>
              Home
            </Link>
            
            <Link to="/predict" onClick={() => setMenuOpen(false)}>
              Prediction
            </Link>
            <Link to="/about" onClick={() => setMenuOpen(false)}>
              About
            </Link>
            <Link to="/contact" onClick={() => setMenuOpen(false)}>
              Contact Us
            </Link>

            {user ? (
              <>
                <Link to="/doctors" onClick={() => setMenuOpen(false)}>
                  Doctors
                </Link>
                {showBell && <NotificationBell user={user} />}
                <Link
                  to="/profile"
                  className="nav-profile-container"
                  onClick={() => setMenuOpen(false)}
                >
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="nav-profile-img"
                    />
                  ) : (
                    <div className="nav-profile-placeholder">
                      {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="nav-btn login-btn"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="nav-btn signup-btn"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </>
        )}
      </div>
    </nav>
  );
}
