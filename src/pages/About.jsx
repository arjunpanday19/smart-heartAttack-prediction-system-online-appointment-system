import {
  HeartPulse, CalendarDays, Stethoscope, Bell,
  ShieldCheck, MessageCircle, Code2, Heart,
} from "lucide-react";

export default function About() {
  const features = [
    { icon: <HeartPulse size={32} strokeWidth={1.8} color="#e53935" />, title: "Heart Attack Prediction", desc: "Our AI-powered engine analyses key health parameters and provides real-time risk scores, helping you stay ahead of cardiac emergencies." },
    { icon: <CalendarDays size={32} strokeWidth={1.8} color="#0d47a1" />, title: "Online Appointment Booking", desc: "Book consultations with verified doctor in seconds — choose your preferred date, time, and specialist all from one place." },
    { icon: <Stethoscope size={32} strokeWidth={1.8} color="#2e7d32" />, title: "Verified Doctors", desc: "Every doctor on our platform goes through a strict admin verification process — licence checks, council registration, and government ID validation." },
    { icon: <Bell size={32} strokeWidth={1.8} color="#f59e0b" />, title: "Real-time Notifications", desc: "Stay updated with instant alerts for appointment confirmations, doctor responses, and admin communications delivered directly to your bell." },
    { icon: <ShieldCheck size={32} strokeWidth={1.8} color="#7c3aed" />, title: "Secure & Private", desc: "Your health data is yours. We store only what's necessary and never share your personal information with third parties." },
    { icon: <MessageCircle size={32} strokeWidth={1.8} color="#0891b2" />, title: "Feedback & Complaints", desc: "Tell us how we're doing. Our admin team reviews every complaint and feedback submission and responds promptly." },
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", color: "#111827" }}>

      {/* Hero */}
      <section style={{
        background: "linear-gradient(135deg,#0a0f2c 0%,#0d47a1 60%,#1a237e 100%)",
        padding: "5rem 1.5rem 4rem", textAlign: "center",
      }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
          <HeartPulse size={64} color="#ef4444" strokeWidth={1.6} />
        </div>
        <h1 style={{ color: "white", fontSize: "2.6rem", fontWeight: 800, margin: "0 0 1rem", lineHeight: 1.2 }}>
          Smart Heart Attack Prediction<br />& Appointment Booking System
        </h1>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "1.05rem", maxWidth: 640, margin: "0 auto", lineHeight: 1.7 }}>
          A next-generation healthcare platform that combines the power of artificial intelligence
          with seamless appointment scheduling — empowering patients and doctors alike.
        </p>
      </section>

      {/* Mission */}
      <section style={{ background: "#f5f7fa", padding: "4rem 1.5rem" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
          <span style={{ background: "#dbeafe", color: "#1d4ed8", padding: "4px 16px", borderRadius: 20, fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Our Mission</span>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#0d47a1", margin: "1rem 0 1.25rem" }}>
            Making cardiac care accessible, proactive & intelligent
          </h2>
          <p style={{ fontSize: "1rem", color: "#4b5563", lineHeight: 1.8, margin: 0 }}>
            Cardiovascular disease remains the leading cause of death worldwide. Yet most cases are preventable with early detection.
            Our platform bridges the gap between technology and healthcare by giving everyone — from rural patients to urban professionals —
            access to AI-driven heart risk analysis and qualified medical professionals at the click of a button.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: "4rem 1.5rem", background: "white" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: "1.9rem", fontWeight: 800, color: "#0d47a1", marginBottom: "2.5rem" }}>
            What We Offer
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
            {features.map(f => (
              <div key={f.title} style={{ background: "#f9fafb", borderRadius: 18, padding: "1.75rem", border: "1.5px solid #e5e7eb", transition: "box-shadow 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 28px rgba(13,71,161,0.12)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                <div style={{ marginBottom: "0.75rem" }}>{f.icon}</div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#1a237e", margin: "0 0 0.5rem" }}>{f.title}</h3>
                <p style={{ fontSize: "0.9rem", color: "#6b7280", margin: 0, lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ background: "linear-gradient(135deg,#f0f7ff,#e8edf5)", padding: "4rem 1.5rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "1.9rem", fontWeight: 800, color: "#0d47a1", marginBottom: "2.5rem" }}>How It Works</h2>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { step: "01", title: "Create Account", desc: "Register as a patient or apply as a verified doctor." },
              { step: "02", title: "Check Your Risk", desc: "Enter health parameters and get an instant AI-driven heart risk score." },
              { step: "03", title: "Book a Doctor", desc: "Browse verified specialists and book an appointment instantly." },
              { step: "04", title: "Get Consultation", desc: "Attend your consultation and receive personalised cardiac care." },
            ].map((s, i, arr) => (
              <div key={s.step} style={{ flex: "1 1 180px", minWidth: 0, position: "relative" }}>
                <div style={{ background: "white", borderRadius: 18, padding: "1.75rem 1.25rem", boxShadow: "0 4px 20px rgba(0,0,0,0.07)", height: "100%", boxSizing: "border-box" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#0d47a1,#1565c0)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: "0.9rem", margin: "0 auto 1rem" }}>{s.step}</div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#1a237e", margin: "0 0 0.4rem" }}>{s.title}</h3>
                  <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: 0 }}>{s.desc}</p>
                </div>
                {i < arr.length - 1 && <div style={{ position: "absolute", top: "50%", right: -18, transform: "translateY(-50%)", fontSize: "1.3rem", color: "#93c5fd", display: "none" }}>→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team / Creator */}
      <section style={{ background: "white", padding: "4rem 1.5rem", textAlign: "center" }}>
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#0d47a1,#e53935)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <Code2 size={38} color="white" strokeWidth={1.8} />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0d47a1", margin: "0 0 0.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            Built with <Heart size={20} color="#e53935" fill="#e53935" style={{ display: "inline", verticalAlign: "middle" }} /> by Our Team
          </h2>
          <p style={{ color: "#6b7280", fontSize: "0.95rem", lineHeight: 1.7, margin: "0 0 1.5rem" }}>
            A full-stack healthcare project combining React, Node.js, Express.js, MongoDB, AI prediction models, and a doctor management system
            — designed to make cardiac care smarter and more accessible for everyone.
          </p>
          <p style={{ color: "#9ca3af", fontSize: "0.82rem" }}>© 2026 Smart Heart Attack Prediction System, Inc. All rights reserved.</p>
        </div>
      </section>

    </div>
  );
}
