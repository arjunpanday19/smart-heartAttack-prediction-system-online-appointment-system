import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck, CreditCard, Building2, FileText, Search,
  Pencil, Camera, Loader2, CheckCircle, MapPin, Save,
  XCircle, Clock, LogOut, Stethoscope, User,
  CalendarDays, ClipboardList, Inbox, CalendarClock,
  IndianRupee, AlertCircle,
} from "lucide-react";
import api from "../api";

// ── helper to persist user changes ──────────────────────────────────────────
function saveUser(updated) {
    localStorage.setItem("user", JSON.stringify(updated));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("auth-change"));
}

// ── Fullscreen doc viewer ────────────────────────────────────────────────────
function FullscreenDocViewer({ src, label, onClose }) {
    if (!src) return null;
    const isPdf = src.startsWith("data:application/pdf");
    return (
        <div onClick={onClose} style={{
            position: "fixed", inset: 0, zIndex: 99999,
            background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "1rem",
        }}>
            <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 900, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <span style={{ color: "white", fontWeight: 700 }}>{label}</span>
                    <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
                {isPdf
                    ? <iframe src={src} title={label} style={{ width: "100%", height: "80vh", borderRadius: 12, border: "none" }} />
                    : <img src={src} alt={label} style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: 12 }} />
                }
            </div>
        </div>
    );
}

// ── VerificationCard (doctor profile — verification details) ─────────────────
function VerificationCard({ user }) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [docView, setDocView] = useState(null); // { src, label }

    const hasDocs = user.govtIdNumber || user.medicalCouncil || user.medicalLicense || user.registrationCert;
    if (!hasDocs) return null;

    const idLabel = user.govtIdType === "pan" ? "PAN Card" : "Aadhaar Card";

    const Thumb = ({ src, label }) => {
        if (!src) return <span style={{ color: "#9ca3af", fontSize: "0.82rem" }}>—</span>;
        const isPdf = src.startsWith("data:application/pdf");
        return (
            <button onClick={() => setDocView({ src, label })} style={{
                background: "none", border: "1.5px solid #e5e7eb", borderRadius: 10,
                padding: "6px 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
            }}>
                {isPdf
                    ? <FileText size={22} color="#7c3aed" strokeWidth={1.8} />
                    : <img src={src} alt={label} style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 8 }} />
                }
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.8rem", color: "#1d4ed8", fontWeight: 600 }}>
                    <Search size={13} strokeWidth={2.5} /> View Fullscreen
                </span>
            </button>
        );
    };

    return (
        <>
            {docView && <FullscreenDocViewer src={docView.src} label={docView.label} onClose={() => setDocView(null)} />}
            <div style={{ background: "white", borderRadius: "20px", boxShadow: "0 10px 40px rgba(0,0,0,0.08)", padding: "2rem", marginBottom: "2rem" }}>
                <h2 style={{ margin: "0 0 1.5rem", color: "#1a237e", fontSize: "1.3rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <ShieldCheck size={22} color="#1a237e" strokeWidth={2} /> Verification Documents
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "1.25rem" }}>

                    {/* Govt ID */}
                    {user.govtIdNumber && (
                        <div style={{ background: "#f0f7ff", borderRadius: 14, padding: "1rem 1.25rem", border: "1.5px solid #dbeafe" }}>
                            <p style={{ margin: "0 0 6px", fontWeight: 800, color: "#0d47a1", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.4px", display: "flex", alignItems: "center", gap: 6 }}>
                                <CreditCard size={14} strokeWidth={2.5} /> Government ID
                            </p>
                            <p style={{ margin: "0 0 2px", fontSize: "0.88rem", color: "#374151" }}><b>Type:</b> {idLabel}</p>
                            <p style={{ margin: "0 0 10px", fontSize: "0.88rem", color: "#374151" }}><b>Number:</b> {user.govtIdNumber}</p>
                            {user.govtIdPhoto && <Thumb src={user.govtIdPhoto} label="Govt ID Photo" />}
                        </div>
                    )}

                    {/* Medical Council */}
                    {user.medicalCouncil && (
                        <div style={{ background: "#f0fdf4", borderRadius: 14, padding: "1rem 1.25rem", border: "1.5px solid #86efac" }}>
                            <p style={{ margin: "0 0 6px", fontWeight: 800, color: "#15803d", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.4px", display: "flex", alignItems: "center", gap: 6 }}>
                                <Building2 size={14} strokeWidth={2.5} /> Medical Council
                            </p>
                            <p style={{ margin: "0 0 2px", fontSize: "0.88rem", color: "#374151" }}><b>Council:</b> {user.medicalCouncil}</p>
                            <p style={{ margin: "0 0 2px", fontSize: "0.88rem", color: "#374151" }}><b>Year:</b> {user.regYear}</p>
                            <p style={{ margin: 0, fontSize: "0.88rem", color: "#374151" }}><b>Reg. No:</b> {user.medicalRegNumber}</p>
                        </div>
                    )}

                    {/* Documents */}
                    {(user.medicalLicense || user.registrationCert) && (
                        <div style={{ background: "#faf5ff", borderRadius: 14, padding: "1rem 1.25rem", border: "1.5px solid #d8b4fe" }}>
                            <p style={{ margin: "0 0 10px", fontWeight: 800, color: "#7c3aed", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.4px", display: "flex", alignItems: "center", gap: 6 }}>
                                <FileText size={14} strokeWidth={2.5} /> Uploaded Documents
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {user.medicalLicense && (
                                    <div>
                                        <p style={{ margin: "0 0 4px", fontSize: "0.8rem", color: "#6b7280", fontWeight: 600 }}>Medical License</p>
                                        <Thumb src={user.medicalLicense} label="Medical License" />
                                    </div>
                                )}
                                {user.registrationCert && (
                                    <div>
                                        <p style={{ margin: "0 0 4px", fontSize: "0.8rem", color: "#6b7280", fontWeight: 600 }}>Registration Certificate</p>
                                        <Thumb src={user.registrationCert} label="Registration Certificate" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

// ── Edit Profile Modal (doctors only) ───────────────────────────────────────
function EditProfileModal({ user, profileImage, onSave, onClose }) {
    const [address, setAddress]   = useState(user.address   || "");
    const [pincode, setPincode]   = useState(user.pincode   || "");
    const [mobile,  setMobile]    = useState(user.mobileNo  || "");
    const [fee,     setFee]       = useState(user.consultingFee ?? "");
    const [imgPreview, setImgPreview] = useState(profileImage || null);
    const [imgFile,    setImgFile]    = useState(null); // actual File object for FormData upload
    const [locationStatus, setLocationStatus] = useState("idle");
    const [locationCoords, setLocationCoords] = useState(user.locationCoords || null);
    const [errors, setErrors] = useState({});
    const fileRef = useRef();

    // ── Timing state ──────────────────────────────────────────────────────────
    const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const [activeDays, setActiveDays] = useState(user.timing?.days || ["Mon", "Tue", "Wed", "Thu", "Fri"]);
    const [startTime,  setStartTime]  = useState(user.timing?.startTime || "09:00");
    const [endTime,    setEndTime]    = useState(user.timing?.endTime   || "17:00");
    const [timingError, setTimingError] = useState("");
    const toggleDay = (day) =>
        setActiveDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );

    const handleImage = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImgFile(file); // store File object for FormData upload
        // Show preview via FileReader
        const reader = new FileReader();
        reader.onloadend = () => setImgPreview(reader.result);
        reader.readAsDataURL(file);
    };

    const autoDetect = () => {
        if (!navigator.geolocation) { alert("Geolocation not supported"); return; }
        setLocationStatus("detecting");
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const { latitude, longitude } = pos.coords;
                setLocationCoords({ latitude, longitude });
                const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`, { headers: { "Accept-Language": "en" } });
                const data = await res.json();
                const a = data.address || {};
                const parts = [a.road || a.pedestrian || "", a.neighbourhood || a.suburb || "", a.city || a.town || a.village || "", a.state || ""].filter(Boolean);
                setAddress(parts.join(", "));
                if (a.postcode) setPincode(a.postcode);
                setLocationStatus("done");
            } catch { setLocationStatus("error"); }
        }, () => setLocationStatus("error"), { timeout: 8000 });
    };

    const validate = () => {
        const e = {};
        if (!address.trim() || address.trim().length < 10) e.address = "Please enter a complete address (min 10 chars)";
        if (!/^[1-9][0-9]{5}$/.test(pincode)) e.pincode = "Enter a valid 6-digit pincode";
        if (!/^[6-9][0-9]{9}$/.test(mobile)) e.mobile = "Enter a valid 10-digit mobile number starting with 6–9";
        if (fee !== "" && (isNaN(Number(fee)) || Number(fee) < 0)) e.fee = "Fee must be a positive number";
        if (activeDays.length === 0) { setTimingError("Select at least one day."); return false; }
        if (startTime >= endTime) { setTimingError("Start time must be before end time."); return false; }
        setTimingError("");
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;
        onSave({
            address, pincode, mobileNo: mobile,
            consultingFee: fee === "" ? null : Number(fee),
            timing: { days: activeDays, startTime, endTime },
            ...(locationCoords ? { locationCoords } : {}),
        }, imgFile); // pass File object (not base64)
    };

    const inp = { width: "100%", padding: "10px 13px", borderRadius: "10px", border: "1.5px solid #e0e0e0", fontSize: "0.92rem", boxSizing: "border-box", fontFamily: "inherit", outline: "none", transition: "border-color 0.18s" };
    const errStyle = { color: "#e53935", fontSize: "0.78rem", marginTop: "3px" };
    const lbl = { display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "5px" };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
            <div style={{ background: "white", borderRadius: "20px", width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
                {/* Modal Header */}
                <div style={{ background: "linear-gradient(135deg,#0d47a1,#1565c0)", padding: "1.25rem 1.75rem", borderRadius: "20px 20px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ color: "white", margin: 0, fontSize: "1.15rem", display: "flex", alignItems: "center", gap: 8 }}>
                        <Pencil size={18} strokeWidth={2.5} /> Edit Profile
                    </h3>
                    <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", borderRadius: "50%", width: 32, height: 32, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>

                <div style={{ padding: "1.5rem 1.75rem", display: "flex", flexDirection: "column", gap: "1.1rem" }}>

                    {/* Profile Image */}
                    <div style={{ textAlign: "center" }}>
                        <label style={{ ...lbl, textAlign: "left" }}>Profile Photo</label>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", border: "3px solid #c7d2fe", flexShrink: 0 }}>
                                {imgPreview
                                    ? <img src={imgPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#ff4d4d,#0d47a1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", color: "white", fontWeight: "bold" }}>{user?.name ? user.name.charAt(0).toUpperCase() : "U"}</div>
                                }
                            </div>
                            <button type="button" onClick={() => fileRef.current.click()} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 18px", border: "1.5px solid #a5b4fc", borderRadius: "20px", background: "#eef2ff", color: "#4338ca", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}>
                                <Camera size={15} strokeWidth={2.5} /> Change Photo
                            </button>
                            <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display: "none" }} />
                        </div>
                    </div>

                    {/* Mobile */}
                    <div>
                        <label style={lbl}>Mobile Number *</label>
                        <input style={{ ...inp, borderColor: errors.mobile ? "#e53935" : "#e0e0e0" }} type="tel" maxLength={10} placeholder="10-digit mobile" value={mobile} onChange={e => setMobile(e.target.value)} />
                        {errors.mobile && <p style={errStyle}>{errors.mobile}</p>}
                    </div>

                    {/* Address */}
                    <div>
                        <label style={lbl}>Clinic / Hospital Address *</label>
                        <button type="button" onClick={autoDetect} disabled={locationStatus === "detecting"} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", padding: "6px 13px", background: locationStatus === "done" ? "#dcfce7" : "#eef2ff", color: locationStatus === "done" ? "#15803d" : "#4338ca", border: `1.5px solid ${locationStatus === "done" ? "#86efac" : "#a5b4fc"}`, borderRadius: "20px", cursor: locationStatus === "detecting" ? "not-allowed" : "pointer", fontSize: "0.8rem", fontWeight: 600, transition: "all 0.2s" }}>
                            {locationStatus === "detecting"
                                ? <><Loader2 size={13} strokeWidth={2.5} style={{ animation: "spin 1s linear infinite" }} /> Detecting...</>
                                : locationStatus === "done"
                                ? <><CheckCircle size={13} strokeWidth={2.5} /> Detected</>
                                : <><MapPin size={13} strokeWidth={2.5} /> Auto-detect location</>}
                        </button>
                        <textarea rows={3} style={{ ...inp, resize: "vertical", borderColor: errors.address ? "#e53935" : "#e0e0e0" }} placeholder="Street, area, city, state" value={address} onChange={e => setAddress(e.target.value)} />
                        {errors.address && <p style={errStyle}>{errors.address}</p>}
                    </div>

                    {/* Pincode */}
                    <div>
                        <label style={lbl}>Pincode *</label>
                        <input style={{ ...inp, borderColor: errors.pincode ? "#e53935" : "#e0e0e0" }} type="text" maxLength={6} placeholder="6-digit pincode" value={pincode} onChange={e => setPincode(e.target.value)} />
                        {errors.pincode && <p style={errStyle}>{errors.pincode}</p>}
                    </div>

                    {/* Consulting Fee */}
                    <div>
                        <label style={lbl}>Consulting Fee (₹)</label>
                        <div style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontWeight: 700 }}>₹</span>
                            <input style={{ ...inp, paddingLeft: 28, borderColor: errors.fee ? "#e53935" : "#e0e0e0" }} type="number" min="0" placeholder="e.g. 500  (leave blank if not set)" value={fee} onChange={e => setFee(e.target.value)} />
                        </div>
                        {errors.fee && <p style={errStyle}>{errors.fee}</p>}
                        <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: "4px 0 0" }}>Leave blank to keep fee as "Not set"</p>
                    </div>

                    {/* ── Active Timing ── */}
                    <div style={{ background: "#f0f9ff", border: "1.5px solid #bae6fd", borderRadius: 14, padding: "1rem 1.25rem" }}>
                        <p style={{ margin: "0 0 10px", fontWeight: 800, color: "#0369a1", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.4px" }}>⏰ Active Consultation Timing</p>

                        {/* Day toggles */}
                        <p style={{ margin: "0 0 8px", fontSize: "0.8rem", fontWeight: 700, color: "#374151" }}>Available Days <span style={{ color: "#e53935" }}>*</span></p>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
                            {ALL_DAYS.map(day => (
                                <button key={day} type="button" onClick={() => toggleDay(day)} style={{
                                    padding: "5px 12px", borderRadius: 20, fontSize: "0.8rem", fontWeight: 700,
                                    border: "1.5px solid",
                                    borderColor: activeDays.includes(day) ? "#0284c7" : "#cbd5e1",
                                    background: activeDays.includes(day) ? "#0284c7" : "white",
                                    color: activeDays.includes(day) ? "white" : "#64748b",
                                    cursor: "pointer", transition: "all 0.15s",
                                }}>{day}</button>
                            ))}
                        </div>
                        {timingError && <p style={{ color: "#e53935", fontSize: "0.78rem", margin: "0 0 8px" }}>{timingError}</p>}

                        {/* Time range */}
                        <p style={{ margin: "0 0 8px", fontSize: "0.8rem", fontWeight: 700, color: "#374151" }}>Consultation Hours <span style={{ color: "#e53935" }}>*</span></p>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <label style={{ fontSize: "0.72rem", color: "#6b7280", fontWeight: 600 }}>From</label>
                                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                                    style={{ padding: "8px 10px", borderRadius: 10, border: "1.5px solid #bae6fd", fontSize: "0.9rem", outline: "none", fontFamily: "inherit" }} />
                            </div>
                            <span style={{ fontSize: "1.1rem", color: "#94a3b8", marginTop: 18 }}>→</span>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <label style={{ fontSize: "0.72rem", color: "#6b7280", fontWeight: 600 }}>To</label>
                                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                                    style={{ padding: "8px 10px", borderRadius: 10, border: "1.5px solid #bae6fd", fontSize: "0.9rem", outline: "none", fontFamily: "inherit" }} />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", paddingTop: "0.5rem" }}>
                        <button onClick={onClose} style={{ padding: "10px 22px", border: "1.5px solid #e0e0e0", borderRadius: "12px", background: "white", color: "#555", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}>Cancel</button>
                        <button onClick={handleSave} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 26px", border: "none", borderRadius: "12px", background: "linear-gradient(135deg,#0d47a1,#1565c0)", color: "white", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem", boxShadow: "0 4px 12px rgba(13,71,161,0.3)" }}>
                            <Save size={16} strokeWidth={2.5} /> Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main Profile Page ────────────────────────────────────────────────────────
export default function Profile() {
    const [user, setUser]                   = useState(null);
    const [profileImage, setProfileImage]   = useState(null);
    const [myAppointments, setMyAppointments] = useState([]);
    const [showEdit, setShowEdit]           = useState(false);
    const [saved, setSaved]                 = useState(false);
    const navigate = useNavigate();

    const refreshUser = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) return; // Don't fetch if no token (prevents 401 on logout)

        try {
            const resp = await api.get("/users/current-user");
            const freshUser = resp.data.data;
            setUser(freshUser);
            localStorage.setItem("user", JSON.stringify(freshUser));
            
            if (freshUser.role === "patient") {
                try {
                    const aptResp = await api.get("/appointments/patient");
                    setMyAppointments(aptResp.data.data);
                } catch (e) {
                    console.error("Failed to fetch patient appointments:", e);
                }
            }
        } catch (error) {
            console.error("Failed to fetch fresh user profile:", error);
            const userStr = localStorage.getItem("user");
            if (userStr) {
                setUser(JSON.parse(userStr));
            } else {
                navigate("/login");
            }
        }
        
        try {
            const u = JSON.parse(localStorage.getItem("user") || "{}");
            const savedImage = localStorage.getItem("profileImage") || u.profileImage;
            if (savedImage) setProfileImage(savedImage);
        } catch {
            const savedImage = localStorage.getItem("profileImage");
            if (savedImage) setProfileImage(savedImage);
        }
    }, [navigate]);

    useEffect(() => {
        refreshUser();
        window.addEventListener("storage", refreshUser);
        return () => window.removeEventListener("storage", refreshUser);
    }, [refreshUser]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Optimistic preview immediately
        const reader = new FileReader();
        reader.onloadend = () => {
            setProfileImage(reader.result);
            localStorage.setItem("profileImage", reader.result);
            window.dispatchEvent(new Event("storage"));
        };
        reader.readAsDataURL(file);

        // Upload to server → multer → cloudinary → save URL in DB
        try {
            const formData = new FormData();
            formData.append("profileImage", file);
            const res = await api.patch("/users/update-profile", formData);
            const updatedUser = res.data.data;
            // Update stored user with Cloudinary URL
            saveUser(updatedUser);
            setUser(updatedUser);
            // Also store the Cloudinary URL as the profile image (replaces base64)
            if (updatedUser.profileImage) {
                setProfileImage(updatedUser.profileImage);
                localStorage.setItem("profileImage", updatedUser.profileImage);
                window.dispatchEvent(new Event("storage"));
            }
        } catch (err) {
            console.error("Profile image upload failed:", err);
        }
    };

    const handleEditSave = async (fields, imgFile) => {
        try {
            const formData = new FormData();
            // Append all text fields
            Object.entries(fields).forEach(([k, v]) => {
                if (v !== null && v !== undefined) {
                    formData.append(k, typeof v === "object" ? JSON.stringify(v) : v);
                }
            });
            // Append image file if provided
            if (imgFile instanceof File) {
                formData.append("profileImage", imgFile);
            }

            const res = await api.patch("/users/update-profile", formData);
            const updatedUser = res.data.data;

            // Update state and localStorage
            setUser(updatedUser);
            saveUser(updatedUser);

            // If a new Cloudinary URL came back, update the displayed image
            if (updatedUser.profileImage) {
                setProfileImage(updatedUser.profileImage);
                localStorage.setItem("profileImage", updatedUser.profileImage);
                window.dispatchEvent(new Event("storage"));
            }

            setShowEdit(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error("Profile update failed:", err);
            alert("Failed to save profile. Please try again.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("profileImage");
        localStorage.removeItem("token");
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("auth-change"));
        navigate("/");
    };

    const getStatusBadge = (status) => {
        const s = (status || "").toLowerCase();
        if (s === "confirmed" || s === "accepted") return { icon: <CheckCircle size={13} strokeWidth={2.5} />, label: "Confirmed", color: "#1b5e20", bg: "#e8f5e9", border: "#4caf50" };
        if (s === "completed") return { icon: <CheckCircle size={13} strokeWidth={2.5} />, label: "Completed", color: "#0d47a1", bg: "#e3f2fd", border: "#2196f3" };
        if (s === "rejected" || s === "cancelled") return { icon: <XCircle size={13} strokeWidth={2.5} />,    label: "Rejected", color: "#b71c1c", bg: "#ffebee", border: "#ef5350" };
        return { icon: <Clock size={13} strokeWidth={2.5} />, label: "Pending", color: "#e65100", bg: "#fff3e0", border: "#ff9800" };
    };

    if (!user) return <div>Loading...</div>;

    // ── Doctor pending/rejected: show full-page blocker ───────────────────────
    const docStatus = user.doctorProfile?.status || "pending";
    if (user.role === "doctor" && docStatus !== "approved") {
        const isRejected = docStatus === "rejected";
        return (
            <div style={{
                minHeight: "100vh", background: "linear-gradient(135deg,#e3f2fd,#f1f8e9)",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "1rem", fontFamily: "'Segoe UI',sans-serif",
            }}>
                <div style={{
                    background: "white", borderRadius: "24px", padding: "3rem 2.5rem",
                    maxWidth: "460px", width: "100%", textAlign: "center",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
                    animation: "slideDown 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                }}>
                    {/* Icon circle */}
                    <div style={{
                        width: 80, height: 80, borderRadius: "50%", margin: "0 auto 1.5rem",
                        background: isRejected ? "#fee2e2" : "#fef9c3",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: `0 4px 20px ${isRejected ? "rgba(239,68,68,0.25)" : "rgba(234,179,8,0.25)"}`,
                    }}>
                        {isRejected
                            ? <XCircle size={40} color="#ef4444" strokeWidth={1.7} />
                            : <Clock size={40} color="#f59e0b" strokeWidth={1.7} />}
                    </div>

                    <h2 style={{ margin: "0 0 0.75rem", color: "#111827", fontSize: "1.6rem", fontWeight: 800 }}>
                        {isRejected ? "Profile Rejected" : "Approval Pending"}
                    </h2>

                    <p style={{ color: "#4b5563", lineHeight: 1.7, margin: "0 0 1.25rem", fontSize: "0.95rem" }}>
                        Your <strong style={{ color: "#0d47a1" }}>Doctor</strong> account has been registered.{" "}
                        {isRejected
                            ? "Unfortunately your profile was rejected by the admin. Please contact support or re-register with updated information."
                            : <>Please wait for the <strong style={{ color: "#0d47a1" }}>Aurelyf Care Admin</strong> to review and approve your profile before you can access the dashboard.</>
                        }
                    </p>

                    {!isRejected && (
                        <div style={{
                            background: "#f8fafc", borderRadius: "12px", padding: "0.9rem 1.25rem",
                            color: "#6b7280", fontSize: "0.85rem", marginBottom: "1.75rem",
                            display: "flex", alignItems: "center", gap: "8px", justifyContent: "center",
                            border: "1px solid #e5e7eb",
                        }}>
                            <AlertCircle size={15} color="#f59e0b" strokeWidth={2} />
                            Approval usually takes a few hours during working hours.
                        </div>
                    )}

                    <button
                        onClick={handleLogout}
                        style={{
                            padding: "11px 32px", background: "none", border: "1.5px solid #d1d5db",
                            borderRadius: "25px", color: "#374151", fontWeight: 700, fontSize: "0.95rem",
                            cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px",
                            transition: "all 0.18s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#f3f4f6"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
                    >
                        <LogOut size={16} strokeWidth={2.5} /> Logout
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ width: "100%", minHeight: "100vh", background: "linear-gradient(135deg, #f5f7fa 0%, #e8edf5 100%)", padding: "2rem 1rem", fontFamily: "'Segoe UI', sans-serif", boxSizing: "border-box" }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%" }}>

                {/* Saved banner */}
                {saved && (
                    <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: "12px", padding: "12px 20px", marginBottom: "1rem", color: "#15803d", fontWeight: 600, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        <CheckCircle size={17} strokeWidth={2.5} /> Profile updated successfully!
                    </div>
                )}

                {/* Edit Modal */}
                {showEdit && (
                    <EditProfileModal
                        user={user}
                        profileImage={profileImage}
                        onSave={handleEditSave}
                        onClose={() => setShowEdit(false)}
                    />
                )}

                {/* Profile Card */}
                <div style={{ background: "white", borderRadius: "20px", boxShadow: "0 10px 40px rgba(0,0,0,0.12)", overflow: "hidden", marginBottom: "2rem" }}>
                    {/* Header Banner */}
                    <div style={{ background: "linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #e53935 100%)", height: "120px", position: "relative" }}>
                        <div style={{ position: "absolute", bottom: "-50px", left: "50%", transform: "translateX(-50%)" }}>
                            <div style={{ position: "relative", display: "inline-block" }}>
                                {profileImage
                                    ? <img src={profileImage} alt="Profile" style={{ width: "100px", height: "100px", borderRadius: "50%", objectFit: "cover", border: "4px solid white", boxShadow: "0 4px 15px rgba(0,0,0,0.2)" }} />
                                    : <div style={{ width: "100px", height: "100px", borderRadius: "50%", background: "linear-gradient(135deg, #ff4d4d, #0d47a1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", color: "white", fontWeight: "bold", border: "4px solid white", boxShadow: "0 4px 15px rgba(0,0,0,0.2)" }}>{user?.name ? user.name.charAt(0).toUpperCase() : "U"}</div>
                                }
                                {/* Camera button (quick image change) */}
                                <label htmlFor="profile-upload" style={{ position: "absolute", bottom: "4px", right: "4px", background: "white", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
                                    <Camera size={14} color="#374151" strokeWidth={2} />
                                </label>
                                <input type="file" id="profile-upload" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                            </div>
                        </div>
                    </div>

                    {/* Profile Info */}
                    <div style={{ paddingTop: "70px", paddingBottom: "2rem", paddingLeft: "2rem", paddingRight: "2rem", textAlign: "center" }}>
                        <h1 style={{ margin: "0 0 0.25rem", fontSize: "1.8rem", color: "#1a237e" }}>{user.name}</h1>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 16px", borderRadius: "20px", background: user.role === "doctor" ? "#e3f2fd" : "#fce4ec", color: user.role === "doctor" ? "#0d47a1" : "#c62828", fontWeight: "600", fontSize: "0.85rem", textTransform: "capitalize" }}>
                            {user.role === "doctor"
                                ? <><Stethoscope size={14} strokeWidth={2.5} /> Doctor</>
                                : <><User size={14} strokeWidth={2.5} /> Patient</>}
                        </span>

                        {/* ── Doctor approval status banner ── */}
                        {user.role === "doctor" && (
                            docStatus === "approved" ? (
                                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "0.9rem", padding: "7px 18px", background: "#dcfce7", border: "1px solid #86efac", borderRadius: "20px", color: "#15803d", fontWeight: 700, fontSize: "0.85rem" }}>
                                    <CheckCircle size={15} strokeWidth={2.5} /> Profile Approved — You can receive appointments
                                </div>
                            ) : docStatus === "rejected" ? (
                                <div style={{ marginTop: "1rem", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "14px", padding: "1rem 1.25rem", textAlign: "left" }}>
                                    <p style={{ color: "#b91c1c", fontWeight: 800, margin: "0 0 4px", fontSize: "1rem", display: "flex", alignItems: "center", gap: 6 }}>
                                        <XCircle size={16} strokeWidth={2.5} /> Profile Rejected
                                    </p>
                                    <p style={{ color: "#7f1d1d", margin: 0, fontSize: "0.88rem", lineHeight: 1.6 }}>Your profile has been rejected by the admin. Please contact support or re-register with updated information.</p>
                                </div>
                            ) : (
                                <div style={{ marginTop: "1rem", background: "#fef9c3", border: "1px solid #fde047", borderRadius: "14px", padding: "1rem 1.25rem", textAlign: "left" }}>
                                    <p style={{ color: "#92400e", fontWeight: 800, margin: "0 0 6px", fontSize: "1rem", display: "flex", alignItems: "center", gap: 6 }}>
                                        <Clock size={16} strokeWidth={2.5} /> Pending Admin Approval
                                    </p>
                                    <p style={{ color: "#78350f", margin: "0 0 4px", fontSize: "0.88rem", lineHeight: 1.6 }}>
                                        Please wait for the admin to review and approve your profile before you can access the dashboard.
                                    </p>
                                    <p style={{ color: "#92400e", margin: 0, fontSize: "0.82rem", fontStyle: "italic", display: "flex", alignItems: "center", gap: 5 }}>
                                        <AlertCircle size={13} strokeWidth={2} /> Approval usually takes a few hours during working hours.
                                    </p>
                                </div>
                            )
                        )}

                        {/* Info Row */}
                        <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
                            <div style={{ textAlign: "left" }}>
                                <p style={{ color: "#888", fontSize: "0.8rem", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Email</p>
                                <p style={{ color: "#333", fontWeight: "600", margin: 0 }}>{user.email}</p>
                            </div>
                            {user.role === "doctor" && user.specialty && (
                                <div style={{ textAlign: "left" }}>
                                    <p style={{ color: "#888", fontSize: "0.8rem", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Specialty</p>
                                    <p style={{ color: "#333", fontWeight: "600", margin: 0 }}>{user.specialty}</p>
                                </div>
                            )}
                            {user.mobileNo && (
                                <div style={{ textAlign: "left" }}>
                                    <p style={{ color: "#888", fontSize: "0.8rem", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Mobile</p>
                                    <p style={{ color: "#333", fontWeight: "600", margin: 0 }}>{user.mobileNo}</p>
                                </div>
                            )}
                        </div>

                        {/* Doctor-only info blocks */}
                        {user.role === "doctor" && (
                            <div style={{ display: "flex", gap: "1rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
                                {/* Address block */}
                                <div style={{ flex: 2, minWidth: "200px", background: "#f0f4ff", borderRadius: "14px", padding: "1rem 1.25rem", textAlign: "left", border: "1px solid #c7d2fe" }}>
                                    <p style={{ color: "#4338ca", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 5 }}>
                                        <MapPin size={13} strokeWidth={2.5} /> Clinic / Hospital Address
                                    </p>
                                    {user.address
                                        ? <><p style={{ color: "#1e1b4b", fontWeight: 600, margin: 0, lineHeight: 1.5 }}>{user.address}</p>
                                            {user.pincode && <p style={{ color: "#6366f1", fontSize: "0.85rem", margin: "4px 0 0", fontWeight: 600 }}>Pincode: {user.pincode}</p>}</>
                                        : <p style={{ color: "#9ca3af", margin: 0, fontStyle: "italic", fontSize: "0.88rem" }}>No address set — click Edit Profile to add</p>
                                    }
                                </div>

                                {/* Consulting Fee block */}
                                <div style={{ flex: 1, minWidth: "140px", background: user.consultingFee != null ? "#f0fdf4" : "#fafafa", borderRadius: "14px", padding: "1rem 1.25rem", textAlign: "left", border: `1px solid ${user.consultingFee != null ? "#86efac" : "#e5e7eb"}` }}>
                                    <p style={{ color: user.consultingFee != null ? "#15803d" : "#9ca3af", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 5 }}>
                                        <IndianRupee size={13} strokeWidth={2.5} /> Consulting Fee
                                    </p>
                                    {user.consultingFee != null
                                        ? <p style={{ color: "#15803d", fontWeight: 800, margin: 0, fontSize: "1.4rem" }}>₹{user.consultingFee}</p>
                                        : <p style={{ color: "#9ca3af", margin: 0, fontStyle: "italic", fontSize: "0.88rem" }}>Not set</p>
                                    }
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "1.5rem", flexWrap: "wrap" }}>
                            {/* Edit Profile — doctors only */}
                            {user.role === "doctor" && (
                                <button onClick={() => setShowEdit(true)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 24px", background: "linear-gradient(135deg,#4338ca,#6366f1)", color: "white", border: "none", borderRadius: "25px", fontWeight: "600", fontSize: "0.9rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.35)" }}>
                                    <Pencil size={15} strokeWidth={2.5} /> Edit Profile
                                </button>
                            )}
                            {user.role === "patient" && (
                                <Link to="/doctors" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 24px", background: "linear-gradient(135deg, #0d47a1, #1565c0)", color: "white", borderRadius: "25px", textDecoration: "none", fontWeight: "600", fontSize: "0.9rem", boxShadow: "0 4px 12px rgba(13,71,161,0.3)" }}>
                                    <CalendarDays size={15} strokeWidth={2.5} /> Book Appointment
                                </Link>
                            )}
                            <button onClick={handleLogout} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 24px", background: "linear-gradient(135deg, #e53935, #c62828)", color: "white", border: "none", borderRadius: "25px", fontWeight: "600", fontSize: "0.9rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(229,57,53,0.3)" }}>
                                <LogOut size={15} strokeWidth={2.5} /> Logout
                            </button>
                        </div>
                    </div>
                </div>

                {/* Verification Card — approved doctors only */}
                {user.role === "doctor" && user.status === "approved" && (
                    <VerificationCard user={user} />
                )}

                {/* My Appointments Section - Patients Only */}
                {user.role === "patient" && (
                    <div style={{ background: "white", borderRadius: "20px", boxShadow: "0 10px 40px rgba(0,0,0,0.08)", padding: "2rem" }}>
                        <h2 style={{ margin: "0 0 1.5rem", color: "#1a237e", fontSize: "1.4rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                            <ClipboardList size={22} color="#1a237e" strokeWidth={2} /> My Appointments
                            <span style={{ background: "#e8eaf6", color: "#3949ab", borderRadius: "20px", padding: "2px 12px", fontSize: "0.85rem", fontWeight: "600" }}>
                                {myAppointments.length}
                            </span>
                        </h2>

                        {myAppointments.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "3rem", color: "#bbb" }}>
                                <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                                    <Inbox size={56} color="#d1d5db" strokeWidth={1.4} />
                                </div>
                                <p style={{ fontSize: "1.1rem", margin: 0 }}>No appointments booked yet.</p>
                                <Link to="/appointment" style={{ display: "inline-block", marginTop: "1rem", padding: "10px 24px", background: "linear-gradient(135deg, #0d47a1, #1565c0)", color: "white", borderRadius: "25px", textDecoration: "none", fontWeight: "600" }}>
                                    Book Your First Appointment
                                </Link>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                {myAppointments.map((apt) => {
                                    const badge = getStatusBadge(apt.status);
                                    
                                    const assignedDoctor = apt.doctorId || {};
                                    const doctorData = assignedDoctor.user || {};
                                    
                                    // Format the doctor's timing
                                    let docTiming = "Not specified";
                                    if (assignedDoctor.timing && assignedDoctor.timing.days?.length > 0) {
                                      const { startTime, endTime, days } = assignedDoctor.timing;
                                      const fmt = (t24) => {
                                        if (!t24) return "";
                                        const [h, m] = t24.split(":").map(Number);
                                        const hr = h % 12 || 12;
                                        return `${hr}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
                                      };
                                      docTiming = `${days.join(", ")}  ${fmt(startTime)} – ${fmt(endTime)}`;
                                    }

                                    return (
                                        <div key={apt._id} style={{ border: `1px solid ${badge.border}`, borderLeft: `5px solid ${badge.border}`, borderRadius: "12px", padding: "1.4rem", background: badge.bg, display: "flex", flexDirection: "column", gap: "1rem" }}>
                                            {/* Header: Date + Status */}
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                    <div style={{ 
                                                        background: "linear-gradient(135deg, #1e3a8a, #0f172a)", color: "white", width: 44, height: 44, 
                                                        borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", 
                                                        justifyContent: "center", fontSize: "1rem", fontWeight: 800,
                                                        boxShadow: "0 4px 10px rgba(30, 58, 138, 0.25)", flexShrink: 0
                                                    }}>
                                                        <span style={{ fontSize: "0.55rem", opacity: 0.8, marginBottom: "-2px", textTransform: "uppercase", letterSpacing: "1px" }}>Token</span>
                                                        {apt.tokenNumber || "-"}
                                                    </div>
                                                    <div>
                                                        <p style={{ margin: 0, fontWeight: "700", color: "#1a237e", fontSize: "1.05rem" }}>{apt.date} at {apt.time}</p>
                                                        <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "#666" }}>
                                                            Booked on {new Date(apt.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 16px", borderRadius: "20px", background: "white", color: badge.color, fontWeight: "700", fontSize: "0.85rem", border: `1px solid ${badge.border}`, boxShadow: "0 2px 6px rgba(0,0,0,0.06)" }}>
                                                        {badge.icon}{badge.label}
                                                    </span>
                                                    {(apt.status || "").toLowerCase() === "rejected" && <p style={{ margin: "6px 0 0", fontSize: "0.8rem", color: "#c62828" }}>Try a different slot</p>}
                                                    {(apt.status || "").toLowerCase() === "confirmed" && <p style={{ margin: "6px 0 0", fontSize: "0.8rem", color: "#2e7d32" }}>See you soon! ✨</p>}
                                                    {(apt.status || "").toLowerCase() === "completed" && <p style={{ margin: "6px 0 0", fontSize: "0.8rem", color: "#1565c0" }}>Visit complete ✅</p>}
                                                </div>
                                            </div>

                                            {/* Doctor & Appointment Details */}
                                            <div style={{ background: "rgba(255,255,255,0.6)", borderRadius: "8px", padding: "1rem", border: "1px solid rgba(0,0,0,0.05)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                                                
                                                {/* Doctor Info */}
                                                {(doctorData.name) && (
                                                    <div style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
                                                        <Stethoscope size={16} color="#4338ca" strokeWidth={2} style={{ marginTop: 2, flexShrink: 0 }} />
                                                        <div>
                                                            <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>Doctor</p>
                                                            <p style={{ margin: "2px 0 0", fontSize: "0.95rem", color: "#111827", fontWeight: 600 }}>Dr. {doctorData.name}</p>
                                                            <p style={{ margin: "1px 0 0", fontSize: "0.8rem", color: "#4f46e5", fontWeight: 600 }}>{assignedDoctor.specialty || "Specialist"}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Doctor Location */}
                                                {assignedDoctor.address && (
                                                    <div style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
                                                        <MapPin size={16} color="#15803d" strokeWidth={2} style={{ marginTop: 2, flexShrink: 0 }} />
                                                        <div>
                                                            <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>Clinic Location</p>
                                                            <p style={{ margin: "2px 0 0", fontSize: "0.88rem", color: "#374151" }}>{assignedDoctor.address}{assignedDoctor.pincode ? `, ${assignedDoctor.pincode}` : ""}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Doctor Timing */}
                                                {(doctorData.name) && (
                                                    <div style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
                                                        <Clock size={16} color="#0284c7" strokeWidth={2} style={{ marginTop: 2, flexShrink: 0 }} />
                                                        <div>
                                                            <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>Active Hours</p>
                                                            <p style={{ margin: "2px 0 0", fontSize: "0.88rem", color: "#374151" }}>{docTiming}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Reason */}
                                                <div style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
                                                    <FileText size={16} color="#d97706" strokeWidth={2} style={{ marginTop: 2, flexShrink: 0 }} />
                                                    <div>
                                                        <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>Reason for Visit</p>
                                                        <p style={{ margin: "2px 0 0", fontSize: "0.88rem", color: "#374151" }}>{apt.reason}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
