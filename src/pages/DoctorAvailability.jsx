
import { useState, useEffect } from "react";
import { Clock, Calendar, Save, CheckCircle, AlertCircle } from "lucide-react";
import api from "../api";

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DURATIONS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 hr", value: 60 }
];

export default function DoctorAvailability() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    morning: { start: "09:00", end: "12:00", enabled: true },
    evening: { start: "17:00", end: "20:00", enabled: true },
    slotDuration: 60,
    capacityPerSlot: 2
  });
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const u = JSON.parse(userStr);
      setUser(u);
      // Fetch current settings from backend
      const fetchSettings = async () => {
        try {
          if (u.doctorProfile?._id) {
            const res = await api.get(`/appointments/doctor-settings/${u.doctorProfile._id}`);
            const fetched = res.data.data?.settings;
            if (fetched && fetched.days) {
              setSettings({
                days: fetched.days || settings.days,
                morning: fetched.morning || settings.morning,
                evening: fetched.evening || settings.evening,
                slotDuration: fetched.slotDuration || settings.slotDuration,
                capacityPerSlot: fetched.capacityPerSlot || settings.capacityPerSlot,
              });
            }
          }
        } catch (err) {
          console.error("Failed to fetch availability settings:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, []);

  const toggleDay = (day) => {
    setSettings(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await api.patch("/appointments/doctor-settings", settings);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      alert("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;
  if (!user) return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;

  return (
    <div className="main-panel">
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.9rem", fontWeight: 800, color: "#1a237e", display: "flex", alignItems: "center", gap: 10 }}>
          <Clock size={32} /> Manage Availability
        </h1>
        <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "1rem" }}>
          Configure your working days and consultation slots. Changes are saved to the database and reflected to patients.
        </p>
      </div>

      <div style={{
        background: "white",
        borderRadius: 24,
        padding: "2rem",
        boxShadow: "0 10px 40px rgba(0,0,0,0.04)",
        display: "flex",
        flexDirection: "column",
        gap: "2rem"
      }}>
        
        {/* Working Days */}
        <div>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
            <Calendar size={18} /> Working Days
          </h3>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {ALL_DAYS.map(day => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                style={{
                  padding: "0.8rem 1.2rem",
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  background: settings.days.includes(day) ? "#2962ff" : "#f5f7fa",
                  color: settings.days.includes(day) ? "white" : "#64748b",
                  transition: "all 0.2s",
                  boxShadow: settings.days.includes(day) ? "0 4px 12px rgba(41, 98, 255, 0.3)" : "none"
                }}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Start/End Times Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
          
          {/* Morning Slot */}
          <div style={{
            padding: "1.5rem",
            borderRadius: 20,
            background: settings.morning.enabled ? "#fffbeb" : "#fafafa",
            border: `2px solid ${settings.morning.enabled ? "#fef3c7" : "#f1f5f9"}`,
            position: "relative"
          }}>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
                <h4 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, color: "#92400e" }}>
                   ☀️ Morning Slot
                </h4>
                <div 
                   onClick={() => setSettings(s => ({...s, morning: {...s.morning, enabled: !s.morning.enabled}}))}
                   style={{
                      padding: "4px 12px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 800, cursor: "pointer",
                      background: settings.morning.enabled ? "#f59e0b" : "#e2e8f0",
                      color: "white"
                   }}
                >
                   {settings.morning.enabled ? "Active" : "Disabled"}
                </div>
             </div>
             
             <div style={{ display: "flex", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                   <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "#6b7280", textTransform: "uppercase" }}>Start Time</label>
                   <input 
                      type="time" 
                      value={settings.morning.start}
                      onChange={e => setSettings(s => ({...s, morning: {...s.morning, start: e.target.value}}))}
                      style={{ width: "100%", padding: "0.8rem", borderRadius: 10, border: "1px solid #ddd", marginTop: 4 }}
                   />
                </div>
                <div style={{ flex: 1 }}>
                   <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "#6b7280", textTransform: "uppercase" }}>End Time</label>
                   <input 
                      type="time" 
                      value={settings.morning.end}
                      onChange={e => setSettings(s => ({...s, morning: {...s.morning, end: e.target.value}}))}
                      style={{ width: "100%", padding: "0.8rem", borderRadius: 10, border: "1px solid #ddd", marginTop: 4 }}
                   />
                </div>
             </div>
          </div>

          {/* Evening Slot */}
          <div style={{
            padding: "1.5rem",
            borderRadius: 20,
            background: settings.evening.enabled ? "#f5f3ff" : "#fafafa",
            border: `2px solid ${settings.evening.enabled ? "#ddd6fe" : "#f1f5f9"}`,
            position: "relative"
          }}>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
                <h4 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, color: "#5b21b6" }}>
                   🌙 Evening Slot
                </h4>
                <div 
                   onClick={() => setSettings(s => ({...s, evening: {...s.evening, enabled: !s.evening.enabled}}))}
                   style={{
                      padding: "4px 12px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 800, cursor: "pointer",
                      background: settings.evening.enabled ? "#8b5cf6" : "#e2e8f0",
                      color: "white"
                   }}
                >
                   {settings.evening.enabled ? "Active" : "Disabled"}
                </div>
             </div>
             
             <div style={{ display: "flex", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                   <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "#6b7280", textTransform: "uppercase" }}>Start Time</label>
                   <input 
                      type="time" 
                      value={settings.evening.start}
                      onChange={e => setSettings(s => ({...s, evening: {...s.evening, start: e.target.value}}))}
                      style={{ width: "100%", padding: "0.8rem", borderRadius: 10, border: "1px solid #ddd", marginTop: 4 }}
                   />
                </div>
                <div style={{ flex: 1 }}>
                   <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "#6b7280", textTransform: "uppercase" }}>End Time</label>
                   <input 
                      type="time" 
                      value={settings.evening.end}
                      onChange={e => setSettings(s => ({...s, evening: {...s.evening, end: e.target.value}}))}
                      style={{ width: "100%", padding: "0.8rem", borderRadius: 10, border: "1px solid #ddd", marginTop: 4 }}
                   />
                </div>
             </div>
          </div>

        </div>

        {/* Config Options */}
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", background: "#f8fafc", padding: "1.5rem", borderRadius: 20 }}>
           <div style={{ flex: 1, minWidth: 200 }}>
             <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "#6b7280", textTransform: "uppercase", marginBottom: 8, display: "block" }}>Slot Duration</label>
             <div style={{ display: "flex", gap: "0.5rem" }}>
                {DURATIONS.map(d => (
                  <button
                    key={d.value}
                    onClick={() => setSettings(s => ({...s, slotDuration: d.value}))}
                    style={{
                      flex: 1, padding: "0.6rem", borderRadius: 10, border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700,
                      background: settings.slotDuration === d.value ? "#2962ff" : "white",
                      color: settings.slotDuration === d.value ? "white" : "#64748b",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                    }}
                  >
                    {d.label}
                  </button>
                ))}
             </div>
           </div>

           <div style={{ flex: 1, minWidth: 200 }}>
             <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "#6b7280", textTransform: "uppercase", marginBottom: 8, display: "block" }}>Capacity / Slot</label>
             <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <input 
                  type="number" min="1" max="50"
                  value={settings.capacityPerSlot}
                  onChange={e => setSettings(s => ({...s, capacityPerSlot: parseInt(e.target.value) || 1}))}
                  style={{ width: 80, padding: "0.6rem", borderRadius: 10, border: "1px solid #ddd", fontWeight: 700, textAlign: "center" }}
                />
                <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Patients per time slot</span>
             </div>
           </div>
        </div>

        {/* Save Button */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}>
            <button 
               onClick={handleSave}
               disabled={saving}
               style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "1rem 3rem", 
                  borderRadius: 50, border: "none", cursor: saving ? "not-allowed" : "pointer", fontSize: "1.1rem", fontWeight: 800,
                  background: "linear-gradient(135deg, #1a237e, #2962ff)", color: "white",
                  boxShadow: "0 10px 25px rgba(41, 98, 255, 0.4)", transform: "scale(1)", transition: "transform 0.2s",
                  opacity: saving ? 0.7 : 1,
               }}
               onMouseEnter={e => { if (!saving) e.currentTarget.style.transform = "scale(1.05)"; }}
               onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
               <Save size={20} /> {saving ? "Saving..." : "Save Availability Settings"}
            </button>
        </div>

        {showSuccess && (
           <div style={{
              position: "fixed", bottom: 40, right: 40, background: "#10b981", color: "white",
              padding: "1rem 2rem", borderRadius: 15, display: "flex", alignItems: "center", gap: 10,
              boxShadow: "0 10px 30px rgba(16, 185, 129, 0.4)", animation: "slideUp 0.3s ease"
           }}>
              <CheckCircle size={20} /> Settings saved to database successfully!
           </div>
        )}

      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
