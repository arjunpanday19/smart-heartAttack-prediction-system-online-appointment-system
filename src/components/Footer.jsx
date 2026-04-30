import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Home, HeartPulse, Info, MessageCircle, KeyRound, UserPlus,
  CalendarDays, User, ClipboardList, ShieldCheck, Heart,
} from "lucide-react";

export default function Footer() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const load = () => {
      const u = localStorage.getItem("user");
      setUser(u ? JSON.parse(u) : null);
    };
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  /* ── Role-specific columns ── */
  const columns = getColumns(user);

  return (
    <footer style={{
      background: "linear-gradient(135deg,#0a0f2c 0%,#0d47a1 100%)",
      color: "rgba(255,255,255,0.85)",
      fontFamily: "'Segoe UI', sans-serif",
      padding: "3rem 2rem 1.5rem",
      marginTop: "auto",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Top grid: Brand + role columns */}
        <div style={{ display: "grid", gridTemplateColumns: `1fr repeat(${columns.length}, auto)`, gap: "2.5rem 3rem", marginBottom: "2.5rem", flexWrap: "wrap" }}>

          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
              <span style={{ color: "white", fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.2 }}>Smart Heart Attack Prediction<br /> with Online Appointment Booking System</span>
            </div>
            <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.7, margin: 0, maxWidth: 240 }}>
              AI-powered cardiac risk analysis combined along with seamless appointment booking — your heart, our priority.
            </p>
          </div>

          {/* Role columns */}
          {columns.map(col => (
            <div key={col.heading}>
              <h4 style={{ color: "white", fontWeight: 700, fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.6px", margin: "0 0 0.9rem" }}>
                {col.heading}
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                {col.links.map(l => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "0.86rem", transition: "color 0.18s" }}
                      onMouseEnter={e => e.currentTarget.style.color = "white"}
                      onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
                    >
                      <span style={{ opacity: 0.8 }}>{l.icon}</span>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 5 }}>
            © 2026 Heart Attack Prediction with Appointment Booking System, Inc. All rights reserved. Made with <Heart size={13} color="#ef4444" fill="#ef4444" style={{ display: "inline", verticalAlign: "middle" }} /> by Arjun Panday.
          </p>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255,255,255,0.35)" }}>
            {user ? `Logged in as ${user.name} (${user.role})` : "Guest"}
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ── Role-based column definitions ─────────────────────────────────────── */
function getColumns(user) {
  const role = user?.role;

  /* Guest */
  if (!user) return [
    {
      heading: "Explore",
      links: [
        { label: "Home",       to: "/",        icon: <Home size={14} /> },
        { label: "Prediction", to: "/predict",  icon: <HeartPulse size={14} /> },
        { label: "About",      to: "/about",    icon: <Info size={14} /> },
        { label: "Contact Us", to: "/contact",  icon: <MessageCircle size={14} /> },
      ],
    },
    {
      heading: "Account",
      links: [
        { label: "Login",    to: "/login",   icon: <KeyRound size={14} /> },
        { label: "Sign Up",  to: "/signup",  icon: <UserPlus size={14} /> },
      ],
    },
  ];

  /* Patient */
  if (role === "patient") return [
    {
      heading: "Quick Links",
      links: [
        { label: "Home",             to: "/",             icon: <Home size={14} /> },
        { label: "Prediction",       to: "/predict",      icon: <HeartPulse size={14} /> },
        { label: "Book Appointment", to: "/appointment",  icon: <CalendarDays size={14} /> },
        { label: "My Profile",       to: "/profile",      icon: <User size={14} /> },
      ],
    },
    {
      heading: "Support",
      links: [
        { label: "About",      to: "/about",   icon: <Info size={14} /> },
        { label: "Contact Us", to: "/contact", icon: <MessageCircle size={14} /> },
      ],
    },
  ];

  /* Doctor */
  if (role === "doctor") return [
    {
      heading: "Doctor Portal",
      links: [
        { label: "My Appointments", to: "/doctor-appointments", icon: <ClipboardList size={14} /> },
        { label: "My Profile",      to: "/profile",             icon: <User size={14} /> },
      ],
    },
    {
      heading: "Support",
      links: [
        { label: "About",      to: "/about",   icon: <Info size={14} /> },
        { label: "Contact Us", to: "/contact", icon: <MessageCircle size={14} /> },
      ],
    },
  ];

  /* Admin fallback */
  return [
    {
      heading: "Admin",
      links: [
        { label: "Dashboard", to: "/admin/dashboard", icon: <ShieldCheck size={14} /> },
      ],
    },
  ];
}
