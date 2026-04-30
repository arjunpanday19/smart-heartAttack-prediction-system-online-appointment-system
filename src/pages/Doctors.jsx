import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Stethoscope, MapPin, Phone, IndianRupee,
  CalendarDays, Search, Users, Inbox, Filter,
  Navigation, Loader2
} from "lucide-react";

/* ─── Specialty colour map ───────────────────────────────────────────── */
const SPEC_COLORS = {
  Cardiologist:          { bg: "#fef2f2", accent: "#e53935", light: "#fee2e2" },
  Neurologist:           { bg: "#faf5ff", accent: "#7c3aed", light: "#ede9fe" },
  Orthopedic:            { bg: "#fff7ed", accent: "#ea580c", light: "#ffedd5" },
  Pediatrician:          { bg: "#fef9c3", accent: "#ca8a04", light: "#fef08a" },
  Dermatologist:         { bg: "#f0fdf4", accent: "#16a34a", light: "#dcfce7" },
  Psychiatrist:          { bg: "#eff6ff", accent: "#2563eb", light: "#dbeafe" },
  Gynecologist:          { bg: "#fdf2f8", accent: "#db2777", light: "#fce7f3" },
  General:               { bg: "#f0f9ff", accent: "#0284c7", light: "#e0f2fe" },
};
function getSpecColor(specialty) {
  const key = Object.keys(SPEC_COLORS).find(k => specialty?.toLowerCase().includes(k.toLowerCase()));
  return SPEC_COLORS[key] || { bg: "#f0f7ff", accent: "#0d47a1", light: "#dbeafe" };
}

/* ─── Availability timing blocks (deterministic from name hash) ──────── */
/* ─── Format 24h time → 12h AM/PM ────────────────────────────────────── */
function fmt12(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

/* ─── Get human-readable timing from doctor object ───────────────────── */
function formatTiming(doctor) {
  if (!doctor.timing) return null;
  const { days, startTime, endTime } = doctor.timing;
  if (!days || days.length === 0) return null;
  const dayStr = days.join(", ");
  return `${dayStr}  ${fmt12(startTime)} – ${fmt12(endTime)}`;
}

/* ─── Distance Calculation (Haversine formula) in km ─────────────────── */
function getDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/* ─── Doctor Card ─────────────────────────────────────────────────────── */
function DoctorCard({ doctor, onBook, userCoords }) {
  const col = getSpecColor(doctor.specialty);
  const timing = formatTiming(doctor);
  const initials = doctor.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  
  // Calculate distance if both patient coords and doctor coords exist
  let distanceStr = null;
  if (userCoords && doctor.locationCoords) {
    const d = getDistance(userCoords.lat, userCoords.lon, doctor.locationCoords.latitude, doctor.locationCoords.longitude);
    if (d !== null) distanceStr = d < 1 ? "< 1 km away" : `${d.toFixed(1)} km away`;
  }

  return (
    <div style={{
      background: "white", borderRadius: 20,
      boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      overflow: "hidden", display: "flex", flexDirection: "column",
      border: "1px solid #f0f0f0", transition: "box-shadow 0.22s, transform 0.22s",
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.14)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "none"; }}
    >
      {/* Card top accent */}
      <div style={{ height: 6, background: `linear-gradient(90deg, ${col.accent}, ${col.accent}aa)` }} />

      {/* Avatar + name */}
      <div style={{ padding: "1.5rem 1.5rem 1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        {doctor.govtIdPhoto ? (
          <img src={doctor.govtIdPhoto} alt={doctor.name}
            style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: `3px solid ${col.light}`, flexShrink: 0 }} />
        ) : (
          <div style={{
            width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
            background: `linear-gradient(135deg, ${col.accent}, ${col.accent}cc)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: 800, fontSize: "1.4rem",
            border: `3px solid ${col.light}`,
          }}>{initials}</div>
        )}
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "1.05rem", fontWeight: 800, color: "#111827", lineHeight: 1.3, wordBreak: "break-word" }}>
            Dr. {doctor.name}
          </h3>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.78rem",
            fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            background: col.light, color: col.accent,
          }}>
            <Stethoscope size={12} strokeWidth={2.5} /> {doctor.specialty || "General Physician"}
          </span>
        </div>
      </div>

      {/* Info grid */}
      <div style={{ padding: "0 1.5rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.6rem", flex: 1 }}>

        {/* Timing */}
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <CalendarDays size={15} color={col.accent} strokeWidth={2} style={{ marginTop: 2, flexShrink: 0 }} />
          <span style={{ fontSize: "0.83rem", color: timing ? "#374151" : "#9ca3af", lineHeight: 1.4, fontStyle: timing ? "normal" : "italic" }}>
            {timing || "Timing not set"}
          </span>
        </div>

        {/* Location + Distance */}
        {doctor.address && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <MapPin size={15} color={col.accent} strokeWidth={2} style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.83rem", color: "#374151", lineHeight: 1.4 }}>
                {doctor.address}{doctor.pincode ? `, ${doctor.pincode}` : ""}
              </span>
              {distanceStr && (
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: col.accent, marginTop: 2, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Navigation size={10} /> {distanceStr}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Phone */}
        {doctor.mobileNo && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Phone size={15} color={col.accent} strokeWidth={2} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: "0.83rem", color: "#374151" }}>{doctor.mobileNo}</span>
          </div>
        )}

        {/* Consulting fee */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <IndianRupee size={15} color={col.accent} strokeWidth={2} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: "0.83rem", color: "#374151", fontWeight: 700 }}>
            {doctor.consultingFee != null ? `₹${doctor.consultingFee} per visit` : "Fee not specified"}
          </span>
        </div>
      </div>

      {/* Book button */}
      <div style={{ padding: "0 1.5rem 1.5rem" }}>
        <button
          onClick={() => onBook(doctor)}
          style={{
            width: "100%", padding: "11px", border: "none", borderRadius: 14, cursor: "pointer",
            fontWeight: 700, fontSize: "0.95rem",
            background: `linear-gradient(135deg, ${col.accent}, ${col.accent}cc)`,
            color: "white", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: `0 4px 14px ${col.accent}44`,
            transition: "opacity 0.18s, transform 0.18s",
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "0.92"; e.currentTarget.style.transform = "scale(1.02)"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "none"; }}
        >
          <CalendarDays size={16} strokeWidth={2.5} /> Book Appointment
        </button>
      </div>
    </div>
  );
}

/* ─── Doctors Page ────────────────────────────────────────────────────── */
export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch]   = useState("");
  const [specFilter, setSpecFilter] = useState("all");
  const [userCoords, setUserCoords] = useState(null);
  const [locStatus, setLocStatus]   = useState("idle"); // idle | detecting | found | error
  const [appointments, setAppointments] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch approved doctors from backend API
    const loadDoctors = async () => {
      try {
        const { default: api } = await import("../api");
        const res = await api.get("/users/doctors");
        const apiDoctors = res.data.data; // Array of Doctor docs with populated 'user'

        // Map API doctors to the shape DoctorCard expects
        const mapped = apiDoctors.map(doc => ({
          _id: doc._id,
          name: doc.user?.name || "Doctor",
          email: doc.user?.email || "",
          mobileNo: doc.user?.mobileNo || "",
          address: doc.user?.address || "",
          pincode: doc.user?.pincode || "",
          profileImage: doc.user?.profileImage || "",
          locationCoords: doc.user?.locationCoords || null,
          specialty: doc.specialty || "General Physician",
          timing: doc.timing || null,
          govtIdPhoto: doc.user?.profileImage || "",
          consultingFee: doc.consultingFee || null,
          status: doc.status,
        }));
        setDoctors(mapped);
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
        setDoctors([]);
      }
    };
    loadDoctors();

    const currUser = JSON.parse(localStorage.getItem("user") || "null");
    setUser(currUser);
    if (currUser && currUser.role === "patient") {
      // Fetch patient appointments from backend
      const loadAppointments = async () => {
        try {
          const { default: api } = await import("../api");
          const res = await api.get("/appointments/patient");
          const mine = res.data.data || [];
          mine.sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp));
          setAppointments(mine);
        } catch (e) {
          console.error("Failed to fetch appointments:", e);
          setAppointments([]);
        }
      };
      loadAppointments();
    }
  }, []);

  /* check if logged-in patient before booking */
  const handleBook = (doctor) => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role !== "patient") {
      alert("Only patients can book appointments.");
      return;
    }
    // navigate to appointment page — prefill doctor info via state
    navigate("/appointment", { state: { doctorName: doctor.name, doctorEmail: doctor.email, doctorId: doctor._id } });
  };

  /* unique specialties for filter */
  const specialties = ["all", ...Array.from(new Set(doctors.map(d => d.specialty).filter(Boolean))).sort()];

  const filtered = doctors.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase())
      || (d.specialty || "").toLowerCase().includes(search.toLowerCase())
      || (d.address || "").toLowerCase().includes(search.toLowerCase());
    const matchSpec = specFilter === "all" || d.specialty === specFilter;
    return matchSearch && matchSpec;
  });

  // Sort by distance if location is available
  if (userCoords) {
    filtered.sort((a, b) => {
      const distA = a.locationCoords ? getDistance(userCoords.lat, userCoords.lon, a.locationCoords.latitude, a.locationCoords.longitude) : 99999;
      const distB = b.locationCoords ? getDistance(userCoords.lat, userCoords.lon, b.locationCoords.latitude, b.locationCoords.longitude) : 99999;
      return distA - distB;
    });
  }

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported by your browser");
      return;
    }
    setLocStatus("detecting");
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocStatus("found");
      },
      () => setLocStatus("error")
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f5f7fa,#e8edf5)", fontFamily: "'Segoe UI',sans-serif" }}>

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg,#0a0f2c 0%,#0d47a1 60%,#1a237e 100%)",
        padding: "3.5rem 1.5rem 2.5rem", textAlign: "center",
      }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem" }}>
          <Users size={52} color="white" strokeWidth={1.6} />
        </div>
        <h1 style={{ color: "white", margin: "0 0 0.6rem", fontSize: "2.2rem", fontWeight: 800 }}>
          Our Verified Doctors
        </h1>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "1rem", margin: "0 auto 2rem", maxWidth: 520, lineHeight: 1.7 }}>
          Browse certified specialists and book your appointment in seconds.
          All doctors on our platform are verified by our admin team.
        </p>

        {/* Search bar + Location Button */}
        <div style={{
          maxWidth: 700, margin: "0 auto", position: "relative",
          display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center", alignItems: "center"
        }}>
          <div style={{ position: "relative", flex: "1 1 280px", minWidth: 0 }}>
            <Search size={18} color="#9ca3af" strokeWidth={2}
              style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Search by name, specialty, or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%", padding: "12px 14px 12px 44px",
                borderRadius: 14, border: "none", outline: "none",
                fontSize: "0.93rem", boxSizing: "border-box",
                boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
              }}
            />
          </div>
          <button
            onClick={detectLocation}
            disabled={locStatus === "detecting"}
            style={{
              padding: "12px 18px", borderRadius: 14, border: "none",
              background: locStatus === "found" ? "#10b981" : "rgba(255,255,255,0.15)",
              color: "white", fontWeight: 600, fontSize: "0.9rem",
              backdropFilter: "blur(8px)", cursor: locStatus === "detecting" ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 6, transition: "background 0.2s"
            }}
          >
            {locStatus === "detecting" ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Navigation size={16} />}
            {locStatus === "found" ? "Sorted by distance" : "Find doctors near me"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1rem" }}>

        {/* Patient Appointments Section */}
        {user && user.role === "patient" && (
          <div style={{ marginBottom: "2.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "10px" }}>
              <h2 style={{ fontSize: "1.4rem", color: "#1a237e", margin: 0 }}>Your Appointments</h2>
              <button 
                onClick={() => navigate("/profile")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  padding: "10px 20px", background: "white", color: "#0d47a1",
                  border: "2px solid #0d47a1", borderRadius: 12, fontWeight: 700,
                  cursor: "pointer", fontSize: "0.9rem", transition: "all 0.2s"
                }}
              >
                Manage Appointments &rarr;
              </button>
            </div>
            
            {appointments.length > 0 ? (
              <div style={{ display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "1rem" }}>
                {appointments.slice(0, 3).map(apt => (
                  <div key={apt.id} style={{
                    minWidth: 280, background: "white", borderRadius: 16, padding: "1.25rem",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <span style={{ fontWeight: 700, color: "#111827" }}>{apt.date}</span>
                      <span style={{ 
                        fontSize: "0.75rem", fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                        background: (apt.status || "pending").toLowerCase() === "accepted" ? "#dcfce7" : (apt.status || "pending").toLowerCase() === "rejected" ? "#fee2e2" : "#fef9c3",
                        color: (apt.status || "pending").toLowerCase() === "accepted" ? "#15803d" : (apt.status || "pending").toLowerCase() === "rejected" ? "#b91c1c" : "#92400e"
                      }}>
                        {apt.status ? apt.status.charAt(0).toUpperCase() + apt.status.slice(1) : "Pending"}
                      </span>
                    </div>
                    <p style={{ margin: "0 0 5px", fontSize: "0.9rem", color: "#4f46e5", fontWeight: 600 }}>Dr. {apt.doctorName}</p>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#6b7280" }}>{apt.time}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                background: "white", borderRadius: 16, padding: "1.5rem", textAlign: "center",
                boxShadow: "0 4px 15px rgba(0,0,0,0.05)", border: "1px dashed #ced4da"
              }}>
                <p style={{ color: "#6b7280", margin: 0, fontSize: "0.95rem" }}>You haven't booked any appointments yet. Select a doctor below to get started.</p>
              </div>
            )}
          </div>
        )}

        {/* Specialty filter pills */}
        {specialties.length > 1 && (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem", alignItems: "center" }}>
            <Filter size={16} color="#6b7280" strokeWidth={2} />
            {specialties.map(sp => (
              <button key={sp} onClick={() => setSpecFilter(sp)} style={{
                padding: "6px 16px", borderRadius: 20, border: "1.5px solid",
                borderColor: specFilter === sp ? "#0d47a1" : "#e5e7eb",
                background: specFilter === sp ? "#0d47a1" : "white",
                color: specFilter === sp ? "white" : "#374151",
                fontWeight: specFilter === sp ? 700 : 500,
                fontSize: "0.82rem", cursor: "pointer", transition: "all 0.15s",
                textTransform: sp === "all" ? "capitalize" : "inherit",
              }}>
                {sp === "all" ? "All Specialties" : sp}
              </button>
            ))}
          </div>
        )}

        {/* Count */}
        <p style={{ color: "#6b7280", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
          Showing <strong style={{ color: "#111" }}>{filtered.length}</strong> doctor{filtered.length !== 1 ? "s" : ""}
          {specFilter !== "all" ? ` in ${specFilter}` : ""}
        </p>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}>
            {filtered.map(doc => (
              <DoctorCard key={doc.email} doctor={doc} onBook={handleBook} userCoords={userCoords} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "4rem 2rem", color: "#9ca3af" }}>
            <Inbox size={64} color="#d1d5db" strokeWidth={1.4} style={{ marginBottom: "1rem" }} />
            {doctors.length === 0 ? (
              <>
                <p style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 0.5rem", color: "#374151" }}>
                  No doctors registered yet
                </p>
                <p style={{ margin: 0, fontSize: "0.9rem" }}>
                  Doctors will appear here once they register and are approved by the admin.
                </p>
              </>
            ) : (
              <>
                <p style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 0.5rem", color: "#374151" }}>
                  No doctors match your search
                </p>
                <p style={{ margin: 0, fontSize: "0.9rem" }}>Try a different name or specialty.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
