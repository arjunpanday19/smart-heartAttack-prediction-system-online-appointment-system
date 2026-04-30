
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { addNotification } from "../utils/notifications";
import {
  ClipboardList, CheckCircle, Clock, IndianRupee,
  Inbox, XCircle, Check, X, Stethoscope,
  UserCircle, User, Cake, MapPin, Smartphone, Mail, Bell
} from "lucide-react";

/* ─── helpers ────────────────────────────────────────────────────────────── */
const FEE_PER_VISIT = 500; // default earning per accepted appointment (₹)

function statusNorm(s = "") {
  return s.toLowerCase(); // "pending" | "accepted" | "rejected"
}

/* ─── Stat Card ──────────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, color, accent, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: "1 1 180px",
        minWidth: 0,
        background: "white",
        borderRadius: 18,
        padding: "1.4rem 1.6rem",
        boxShadow: active
          ? `0 8px 28px ${accent}44`
          : "0 4px 16px rgba(0,0,0,0.07)",
        border: `2.5px solid ${active ? accent : "transparent"}`,
        cursor: "pointer",
        transition: "all 0.22s cubic-bezier(.4,0,.2,1)",
        transform: active ? "translateY(-4px)" : "none",
        userSelect: "none",
      }}
    >
      <div style={{ marginBottom: "0.4rem", color }}>{icon}</div>
      <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </p>
      <p style={{ margin: "4px 0 0", fontSize: "2rem", fontWeight: 800, color }}>
        {value}
      </p>
      {active && (
        <div style={{ marginTop: 8, height: 3, borderRadius: 4, background: accent }} />
      )}
    </div>
  );
}

/* ─── Status Badge ───────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const s = statusNorm(status);
  const map = {
    confirmed: { bg: "#dcfce7", color: "#15803d", icon: <CheckCircle size={13} strokeWidth={2.5} />, label: "Confirmed" },
    completed: { bg: "#e0f2fe", color: "#0369a1", icon: <Check size={13} strokeWidth={2.5} />, label: "Completed" },
    rejected: { bg: "#fee2e2", color: "#b91c1c", icon: <XCircle size={13} strokeWidth={2.5} />,    label: "Rejected" },
    cancelled: { bg: "#fee2e2", color: "#b91c1c", icon: <XCircle size={13} strokeWidth={2.5} />,    label: "Cancelled" },
    pending:  { bg: "#fef9c3", color: "#92400e", icon: <Clock size={13} strokeWidth={2.5} />,      label: "Pending"  },
  };
  const m = map[s] || map.pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 12px", borderRadius: 20, fontSize: "0.8rem", fontWeight: 700, background: m.bg, color: m.color,
    }}>
      {m.icon}{m.label}
    </span>
  );
}

/* ─── Patient Profile Modal ─────────────────────────────────────────────────── */
function PatientProfileModal({ appointment, onClose }) {
  if (!appointment) return null;

  const patient = appointment.patientId || {};

  const FieldRow = ({ icon, label, value }) => (
    <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
      <span style={{ marginTop: 2, color: "#6b7280", flexShrink: 0 }}>{icon}</span>
      <div>
        <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</p>
        <p style={{ margin: "2px 0 0", fontSize: "0.95rem", color: "#111827", fontWeight: 600 }}>{value || <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Not provided</span>}</p>
      </div>
    </div>
  );

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem", animation: "fadeIn 0.2s ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "white", borderRadius: 24, width: "100%", maxWidth: 460,
        boxShadow: "0 30px 70px rgba(0,0,0,0.25)",
        overflow: "hidden", animation: "slideDown 0.25s ease",
      }}>
        {/* Banner header */}
        <div style={{
          background: "linear-gradient(135deg,#7f1d1d,#b91c1c)",
          padding: "1.75rem 2rem",
          display: "flex", alignItems: "center", gap: "1.1rem", position: "relative",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "3px solid rgba(255,255,255,0.35)", flexShrink: 0,
          }}>
            <UserCircle size={38} color="white" strokeWidth={1.5} />
          </div>
          <div>
            <h2 style={{ color: "white", margin: 0, fontSize: "1.3rem", fontWeight: 800 }}>
              {patient.name || "Patient"}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", margin: "4px 0 0", fontSize: "0.83rem" }}>Patient Profile</p>
          </div>
          <button onClick={onClose} style={{
            position: "absolute", top: 14, right: 14,
            background: "rgba(255,255,255,0.15)", border: "none",
            borderRadius: "50%", width: 32, height: 32, cursor: "pointer",
            fontSize: "1rem", color: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        {/* Fields */}
        <div style={{ padding: "1.5rem 2rem", display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <FieldRow icon={<User size={18} />}       label="Full Name"    value={patient.name} />
          <FieldRow icon={<Cake size={18} />}        label="Date of Birth" value={patient.dateOfBirth} />
          <FieldRow icon={<MapPin size={18} />}      label="Address"       value={patient.address} />
          <FieldRow icon={<Smartphone size={18} />}  label="Mobile No."    value={patient.mobileNo} />
          <FieldRow icon={<Mail size={18} />}        label="Email"         value={patient.email} />
        </div>

        {/* Appointment context strip */}
        <div style={{ background: "#f9fafb", padding: "1rem 2rem", borderTop: "1px solid #f3f4f6", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <div><p style={{ margin: 0, fontSize: "0.72rem", color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>Appointment Date</p><p style={{ margin: "2px 0 0", fontWeight: 700, color: "#0d47a1" }}>{appointment.date}</p></div>
          <div><p style={{ margin: 0, fontSize: "0.72rem", color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>Time</p><p style={{ margin: "2px 0 0", fontWeight: 700, color: "#0d47a1" }}>{appointment.time}</p></div>
          <div><p style={{ margin: 0, fontSize: "0.72rem", color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>Reason</p><p style={{ margin: "2px 0 0", fontWeight: 600, color: "#374151" }}>{appointment.reason || "—"}</p></div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedPatient, setSelectedPatient] = useState(null); // appointment object for modal
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const notifiedIds = useRef(new Set());

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) { navigate("/login"); return; }
    const user = JSON.parse(userStr);
    if (user.role !== "doctor") { navigate("/"); return; }
    setDoctor(user);

    const fetchAppointments = async () => {
      try {
        const resp = await api.get("/appointments/doctor");
        const doctorAppointments = resp.data.data;
        
        doctorAppointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAppointments(doctorAppointments);

        // Notify doctor about pending appointments
        const notifiedKey = `doctor_notified_apts_${user.email}`;
        const alreadyNotified = new Set(JSON.parse(localStorage.getItem(notifiedKey) || "[]"));
        doctorAppointments.forEach((apt) => {
          if (statusNorm(apt.status) === "pending" && !alreadyNotified.has(apt._id)) {
            addNotification(user.email, {
              icon: "🗓️",
              type: "new_appointment",
              message: `${apt.patientId?.name || "A patient"} sent you an appointment request for ${apt.date} at ${apt.time}.`,
            });
            alreadyNotified.add(apt._id);
          }
        });
        localStorage.setItem(notifiedKey, JSON.stringify([...alreadyNotified]));
        notifiedIds.current = alreadyNotified;
      } catch (e) {
        console.error("Failed to fetch doctor appointments", e);
      }
    };
    
    fetchAppointments();
  }, [navigate]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.patch(`/appointments/status/${id}`, { status: newStatus });
      
      const updatedLocal = appointments.map((apt) =>
        apt._id === id ? { ...apt, status: newStatus } : apt
      );
      setAppointments(updatedLocal);

      const apt = appointments.find((a) => a._id === id);
      if (apt && apt.patientId) {
        addNotification(apt.patientId.email, {
          icon: newStatus === "confirmed" ? "✅" : (newStatus === "completed" ? "✅" : "❌"),
          type: "appointment_status",
          message:
            newStatus === "confirmed"
              ? `Your appointment on ${apt.date} at ${apt.time} has been accepted by the doctor. See you then! 🎉`
              : newStatus === "completed" 
              ? `Your appointment on ${apt.date} at ${apt.time} was marked as completed.`
              : `Your appointment on ${apt.date} at ${apt.time} was declined by the doctor. Please try a different date/time.`,
        });
      }
    } catch(err) {
      console.error("Failed to update status", err);
      alert("Failed to update status");
    }
  };

  if (!doctor) return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;

  /* ── Stats ── */
  const total    = appointments.length;
  const seen     = appointments.filter(a => statusNorm(a.status) === "accepted").length;
  const pending  = appointments.filter(a => statusNorm(a.status) === "pending").length;
  const earnings = seen * (doctor.consultingFee || FEE_PER_VISIT);

  /* ── Filtered rows ── */
  const filtered = activeFilter === "all"
    ? appointments
    : activeFilter === "earnings"
      ? appointments.filter(a => statusNorm(a.status) === "confirmed" || statusNorm(a.status) === "completed")
      : appointments.filter(a => statusNorm(a.status) === activeFilter);

  /* ── Pie Chart Stats ── */
  const videoCount = appointments.filter(a => (a.appointmentType || 'Physical Visit') === 'Video Call').length;
  const physicalCount = appointments.filter(a => (a.appointmentType || 'Physical Visit') === 'Physical Visit').length;
  const pieTotal = videoCount + physicalCount || 0;
  const videoPct = pieTotal > 0 ? Math.round((videoCount / pieTotal) * 100) : 0;

  /* ── Earning Chart Data ── */
  const chartDays = 7;
  const earningsData = Array.from({ length: chartDays }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (chartDays - 1 - i));
    const dateStr = d.toISOString().split('T')[0];
    return { label: d.toLocaleDateString('en-US', { weekday: 'short' }), dateStr, amount: 0 };
  });

  appointments.forEach(apt => {
    if (statusNorm(apt.status) === "confirmed" || statusNorm(apt.status) === "completed") {
      try {
        const aptDate = new Date(apt.date);
        const isVideo = apt.appointmentType === "Video Call";
        const fee = isVideo ? 699 : (doctor.consultingFee || FEE_PER_VISIT);
        
        if (!isNaN(aptDate.getTime())) {
          const aptDateStr = aptDate.toISOString().split('T')[0];
          const matchedDay = earningsData.find(d => d.dateStr === aptDateStr);
          if (matchedDay) matchedDay.amount += fee;
        } else {
           earningsData[chartDays-1].amount += fee;
        }
      } catch(e) {
        const isVideo = apt.appointmentType === "Video Call";
        earningsData[chartDays-1].amount += (isVideo ? 699 : (doctor.consultingFee || FEE_PER_VISIT));
      }
    }
  });

  const maxEarning = Math.max(...earningsData.map(d => d.amount), 1);

  /* ── Table heading from active filter ── */
  const tableTitle = {
    all:      "All Appointments",
    pending:  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Clock size={18} /> Pending Requests</span>,
    confirmed: <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><CheckCircle size={18} /> Confirmed</span>,
    earnings: <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><IndianRupee size={18} /> Earned Appointments</span>,
  }[activeFilter];

  /* ── Styles ── */
  const th = {
    padding: "13px 16px", fontWeight: 700, fontSize: "0.8rem",
    textTransform: "uppercase", letterSpacing: "0.5px",
    background: "#0d47a1", color: "white", textAlign: "left",
    whiteSpace: "nowrap",
  };
  const td = { padding: "13px 16px", borderBottom: "1px solid #f3f4f6", fontSize: "0.9rem", color: "#374151" };

  return (
    <>
            {/* ── Main Content Area ── */}
            <div className="main-panel">
              <div style={{ display: "none" }} className="desktop-header">
                {/* Hidden on mobile, handled by mobile-header. Shown below via inline style override for larger screens if we wanted, but let's just show it */}
              </div>
              <div style={{ marginBottom: "0.5rem" }} className="welcome-banner">
                <h1 style={{ margin: 0, fontSize: "1.9rem", fontWeight: 800, color: "#1a237e", display: "flex", alignItems: "center", gap: 10 }}>
                  Welcome, Dr. {doctor.name}
                </h1>
                <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "1rem" }}>
                  {doctor.specialty || "Specialist"}
                </p>
              </div>

              {/* ── Filter Tabs ── */}
              <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                {["all", "confirmed", "pending", "earnings"].map(filterKey => {
                   const labels = { all: "All", confirmed: "Confirmed", pending: "Pending", earnings: "Earnings" };
                   const isActive = activeFilter === filterKey;
                   return (
                     <button key={filterKey} onClick={() => setActiveFilter(filterKey)} style={{
                       padding: "8px 18px", borderRadius: 20, border: "none", cursor: "pointer",
                       fontWeight: isActive ? 700 : 600, fontSize: "0.9rem",
                       background: isActive ? "#0d47a1" : "white",
                       color: isActive ? "white" : "#4b5563",
                       boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                       transition: "all 0.2s"
                     }}>
                       {labels[filterKey]}
                     </button>
                   )
                })}
              </div>

              {/* ── Table Panel ── */}
              <div style={{ background: "white", borderRadius: 18, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                  <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#1a237e" }}>
                    {tableTitle}
                  </h2>
                  <span style={{ padding: "4px 14px", background: "#e8eaf6", color: "#3949ab", borderRadius: 20, fontWeight: 700, fontSize: "0.85rem" }}>
                    {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {filtered.length === 0 ? (
                  <div style={{ padding: "4rem 2rem", textAlign: "center", color: "#9ca3af" }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                      <Inbox size={56} color="#d1d5db" strokeWidth={1.2} />
                    </div>
                    <p style={{ margin: 0, fontSize: "1.05rem" }}>No appointments in this category.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={th}>Token No.</th>
                          <th style={th}>Patient Name</th>
                          <th style={th}>Type</th>
                          <th style={th}>Date / Time</th>
                          <th style={th}>Reason</th>
                          <th style={th}>Status</th>
                          {activeFilter === "earnings" && <th style={th}>Fee (₹)</th>}
                          <th style={th}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((apt, idx) => {
                          const s = statusNorm(apt.status);
                          const aType = apt.appointmentType || "Physical Visit";
                          const isVideo = aType === "Video Call";
                          const fee = isVideo ? 699 : (doctor.consultingFee || FEE_PER_VISIT);

                          return (
                            <tr key={apt._id} style={{ background: idx % 2 === 0 ? "white" : "#fafafa", transition: "background 0.2s" }}>
                              <td style={td}>
                                <div style={{ 
                                  background: "#1e3a8a", color: "white", width: 34, height: 34, 
                                  borderRadius: 10, display: "flex", flexDirection: "column", alignItems: "center", 
                                  justifyContent: "center", fontSize: "0.65rem", fontWeight: 800,
                                  boxShadow: "0 4px 10px rgba(30, 58, 138, 0.2)"
                                }}>
                                  <span style={{ fontSize: "0.5rem", opacity: 0.8, marginBottom: -2 }}>TKN</span>
                                  {apt.tokenNumber || idx + 1}
                                </div>
                              </td>
                              <td style={{ ...td, fontWeight: 600, color: "#1d4ed8", cursor: "pointer", textDecoration: "underline" }}
                                onClick={() => setSelectedPatient(apt)}>
                                {apt.patientId?.name || "Patient"}
                              </td>
                              <td style={td}>
                                <div style={{ 
                                   fontSize: "0.75rem", padding: "6px 12px", borderRadius: 12, fontWeight: 700,
                                   background: isVideo ? "#eff6ff" : "#f0fdf4",
                                   color: isVideo ? "#1d4ed8" : "#15803d",
                                   display: "flex", alignItems: "center", gap: 6, width: "fit-content"
                                }}>
                                  {isVideo ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z"></path><rect x="3" y="6" width="12" height="12" rx="2" ry="2"></rect></svg> : <MapPin size={14} />}
                                  {aType}
                                </div>
                              </td>
                              <td style={{ ...td, whiteSpace: "nowrap" }}>
                                <div style={{ fontWeight: 600 }}>{apt.date}</div>
                                <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{apt.time}</div>
                              </td>
                              <td style={{ ...td, maxWidth: 220 }}>
                                <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.5, fontSize: "0.85rem" }}>
                                  {apt.reason || <span style={{ color: "#9ca3af", fontStyle: "italic" }}>—</span>}
                                </span>
                              </td>
                              <td style={td}><StatusBadge status={apt.status} /></td>
                              {activeFilter === "earnings" && (
                                <td style={{ ...td, fontWeight: 700, color: "#7c3aed" }}>
                                  ₹{fee.toLocaleString()}
                                </td>
                              )}
                              <td style={td}>
                                {s === "pending" ? (
                                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", minWidth: 150 }}>
                                    <button
                                      onClick={() => handleStatusUpdate(apt._id, "confirmed")}
                                      style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px", background: "#dcfce7", color: "#15803d", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: "0.78rem" }}
                                    >
                                      <Check size={14} strokeWidth={2.5} /> Confirm
                                    </button>
                                    <button
                                      onClick={() => handleStatusUpdate(apt._id, "rejected")}
                                      style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px", background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: "0.78rem" }}
                                    >
                                      <X size={14} strokeWidth={2.5} /> Reject
                                    </button>
                                  </div>
                                ) : s === "confirmed" ? (
                                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", minWidth: 150 }}>
                                    <button
                                      onClick={() => handleStatusUpdate(apt._id, "completed")}
                                      style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px", background: "#e0f2fe", color: "#0369a1", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: "0.78rem" }}
                                    >
                                      Mark Completed
                                    </button>
                                  </div>
                                ) : (
                                  <span style={{ color: "#9ca3af", fontStyle: "italic", fontSize: "0.85rem" }}>Processed</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {activeFilter === "earnings" && (
                <p style={{ marginTop: "0.25rem", fontSize: "0.8rem", color: "#9ca3af", textAlign: "right" }}>
                  * Earnings calculated at ₹{(doctor.consultingFee || FEE_PER_VISIT).toLocaleString()} per accepted appointment
                  {!doctor.consultingFee && " (default rate — set your fee in your profile)"}
                </p>
              )}

              {/* ── Overview Metrics Below Table ── */}
              <div style={{ marginTop: "1.5rem" }}>
                <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.15rem", fontWeight: 800, color: "#111827", textTransform: "uppercase", letterSpacing: "0.5px" }}>Overview Metrics</h3>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200, background: "white", padding: "1.5rem", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ background: "#eff6ff", color: "#0d47a1", padding: 12, borderRadius: 12 }}><ClipboardList size={24} /></div>
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Total Appointments</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111827" }}>{total}</div>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 200, background: "white", padding: "1.5rem", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ background: "#f0fdf4", color: "#15803d", padding: 12, borderRadius: 12 }}><CheckCircle size={24} /></div>
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Patients Seen</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111827" }}>{seen}</div>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 200, background: "white", padding: "1.5rem", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ background: "#fef3c7", color: "#b45309", padding: 12, borderRadius: 12 }}><Clock size={24} /></div>
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Pending Requests</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111827" }}>{pending}</div>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 200, background: "white", padding: "1.5rem", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ background: "#f3e8ff", color: "#7e22ce", padding: 12, borderRadius: 12 }}><IndianRupee size={24} /></div>
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Total Earnings</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111827" }}>₹{earnings.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Charts Section ── */}
              <div style={{ display: "flex", gap: "1.5rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
                
                {/* Pie Chart Card */}
                <div style={{ flex: "1 1 300px", background: "white", borderRadius: 18, padding: "1.75rem", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
                  <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1.1rem", fontWeight: 800, color: "#111827", textTransform: "uppercase", letterSpacing: "0.5px" }}>Consultation Types</h3>
                  
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.75rem" }}>
                    {pieTotal > 0 ? (
                      <>
                        <div style={{
                            width: 160, height: 160, borderRadius: '50%',
                            background: `conic-gradient(#3b82f6 0% ${videoPct}%, #10b981 ${videoPct}% 100%)`,
                            position: "relative",
                            boxShadow: "0 8px 16px rgba(0,0,0,0.08)"
                        }}>
                          <div style={{
                             position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                             width: 80, height: 80, borderRadius: "50%", background: "white",
                             display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                             boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)"
                          }}>
                            <span style={{ fontWeight: 800, fontSize: "1.3rem", color: "#111827", lineHeight: 1 }}>{pieTotal}</span>
                            <span style={{ fontSize: "0.65rem", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", marginTop: 2 }}>Total</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: "column", gap: '0.85rem', width: "100%" }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', fontWeight: 600, color: "#4b5563" }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                               <div style={{ width: 14, height: 14, background: '#3b82f6', borderRadius: 4 }}></div>
                               Video Consults
                            </div>
                            <span>{videoCount} <span style={{ color: "#9ca3af", fontSize: "0.8rem", marginLeft: 4 }}>({videoPct}%)</span></span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', fontWeight: 600, color: "#4b5563" }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                               <div style={{ width: 14, height: 14, background: '#10b981', borderRadius: 4 }}></div>
                               Physical Consults
                            </div>
                            <span>{physicalCount} <span style={{ color: "#9ca3af", fontSize: "0.8rem", marginLeft: 4 }}>({100 - videoPct}%)</span></span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: "center", color: "#9ca3af", padding: "1.5rem" }}>No data to display</div>
                    )}
                  </div>
                </div>

                {/* Earning Graph Card */}
                <div style={{ flex: "2 1 400px", background: "white", borderRadius: 18, padding: "1.75rem", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column" }}>
                  <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1.1rem", fontWeight: 800, color: "#111827", textTransform: "uppercase", letterSpacing: "0.5px" }}>Earnings Overview</h3>
                  
                  <div style={{ display: "flex", alignItems: "flex-end", gap: "2%", height: 200, marginTop: "auto", position: "relative", paddingBottom: "2rem" }}>
                     {earningsData.map((d, i) => {
                       const barHeight = maxEarning > 0 ? (d.amount / maxEarning) * 100 : 0;
                       return (
                         <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                           <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#4f46e5", marginBottom: 6, opacity: d.amount > 0 ? 1 : 0 }}>
                             ₹{(d.amount >= 1000 ? (d.amount/1000).toFixed(1) + 'k' : d.amount)}
                           </div>
                           <div style={{ 
                             width: "100%", maxWidth: 40, height: `${Math.max(barHeight, 2)}%`, 
                             background: "linear-gradient(to top, #818cf8, #4f46e5)", 
                             borderRadius: "4px 4px 0 0",
                             transition: "height 0.4s ease-out"
                           }}></div>
                           <div style={{ position: "absolute", bottom: 0, fontSize: "0.75rem", fontWeight: 600, color: "#6b7280" }}>
                             {d.label}
                           </div>
                         </div>
                       )
                     })}
                  </div>
                </div>

              </div>
            </div>


      {/* Patient Profile Modal */}
      {selectedPatient && (
        <PatientProfileModal appointment={selectedPatient} onClose={() => setSelectedPatient(null)} />
      )}
    </>
  );
}
