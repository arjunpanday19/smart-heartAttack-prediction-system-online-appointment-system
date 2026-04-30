import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { User, ShieldCheck, MapPin, Building, Star } from "lucide-react";
import '../styles/home.css';

export default function Home() {
  const navigate = useNavigate();
  const [verifiedDoctors, setVerifiedDoctors] = useState([]);

  useEffect(() => {
    // Load approved doctors from backend API
    const loadDoctors = async () => {
      try {
        const { default: api } = await import("../api");
        const res = await api.get("/users/doctors");
        const apiDoctors = res.data.data || [];
        // Map to simple shape for the slideshow cards
        const doctors = apiDoctors.map(doc => ({
          name: doc.user?.name || "Doctor",
          email: doc.user?.email || "",
          specialty: doc.specialty || "General Physician",
          address: doc.user?.address || "",
          profileImage: doc.user?.profileImage || "",
        }));
        // Triple the array for seamless infinite scrolling
        setVerifiedDoctors(doctors.length > 0 ? [...doctors, ...doctors, ...doctors] : []);
      } catch (err) {
        console.error("Failed to fetch doctors for slideshow:", err);
        setVerifiedDoctors([]);
      }
    };
    loadDoctors();
  }, []);

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="home-hero">
        <div className="hero-content">
          <h1 className="hero-title">Heart Health Analysis & Expert Care in One Place</h1>
          <p className="hero-subtitle">
           Your complete healthcare hub. Discover early heart risks with smart AI, or schedule appointments with specialists for any medical concern.
          </p>
          <div className="hero-buttons">
            <button className="primary-btn" onClick={() => navigate('/predict')}>
              Start Prediction
            </button>
            <button className="secondary-btn" onClick={() => navigate('/doctors')}>
              Find a Doctor
            </button>
          </div>
        </div>
        <div className="hero-image-placeholder">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" className="hero-svg-img" width="100%" style={{ height: "auto" }}>
            {/* Background minimal elements */}
            <circle cx="250" cy="200" r="180" fill="#0d47a1" opacity="0.1"/>
            <path d="M 120 150 Q 80 80 180 50 T 250 150" fill="none" stroke="#1b5e20" strokeWidth="4" strokeDasharray="8 8" opacity="0.3"/>
            
            {/* Doctor */}
            {/* Body */}
            <path d="M 180 350 C 180 280, 260 280, 260 350" fill="#1a237e"/>
            {/* Coat */}
            <path d="M 170 350 C 170 270, 270 270, 270 350" fill="#f5f5f5" opacity="0.95"/>
            <path d="M 220 280 L 220 350" stroke="#bdbdbd" strokeWidth="3"/>
            {/* Head */}
            <circle cx="220" cy="240" r="32" fill="#ffccbc"/>
            {/* Hair */}
            <path d="M 185 240 C 185 200, 255 200, 255 240 C 255 210, 185 210, 185 240" fill="#1b1b1b"/>
            {/* Stethoscope */}
            <path d="M 200 275 C 200 320, 240 320, 240 275" fill="none" stroke="#212121" strokeWidth="4"/>
            <path d="M 240 275 L 240 310" stroke="#212121" strokeWidth="4"/>
            <circle cx="240" cy="315" r="6" fill="#424242"/>

            {/* Patient */}
            {/* Body */}
            <path d="M 280 350 C 280 290, 360 290, 360 350" fill="#0d47a1"/>
            {/* Head */}
            <circle cx="320" cy="255" r="28" fill="#ffe0b2"/>
            {/* Hair */}
            <path d="M 290 255 C 290 220, 350 220, 350 255 C 340 230, 300 230, 290 255" fill="#3e2723"/>
            
            {/* Medical Clipboard */}
            <rect x="140" y="270" width="40" height="50" rx="4" fill="#607d8b"/>
            <rect x="150" y="265" width="20" height="8" rx="2" fill="#455a64"/>
            <line x1="148" y1="285" x2="172" y2="285" stroke="#ffffff" opacity="0.6" strokeWidth="2"/>
            <line x1="148" y1="295" x2="172" y2="295" stroke="#ffffff" opacity="0.6" strokeWidth="2"/>
            <line x1="148" y1="305" x2="160" y2="305" stroke="#ffffff" opacity="0.6" strokeWidth="2"/>

            {/* Heart Accent */}
            <path d="M380 150 C380 130 350 130 350 150 C350 130 320 130 320 150 C320 170 350 190 350 190 C350 190 380 170 380 150 Z" fill="#b71c1c" opacity="0.9"/>
            {/* Plus Accent */}
            <rect x="130" y="100" width="8" height="24" fill="#2e7d32" opacity="0.8"/>
            <rect x="122" y="108" width="24" height="8" fill="#2e7d32" opacity="0.8"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="home-features">
        <h2 className="section-title">Explore Our Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>AI Health Prediction</h3>
            <p>Use cutting-edge AI to predict heart attack risks with high accuracy based on your vitals.</p>
            <Link to="/predict" className="feature-link">Check Now &rarr;</Link>
          </div>
          <div className="feature-card">
            <h3>Expert Doctors</h3>
            <p>Browse our list of verified cardiologists and general physicians for professional consultation.</p>
            <Link to="/doctors" className="feature-link">View Doctors &rarr;</Link>
          </div>
          <div className="feature-card">
            <h3>Manage Appointments</h3>
            <p>View, book, and effortlessly manage your healthcare appointments instantly.</p>
            <Link to="/profile" className="feature-link">Go to Appointments &rarr;</Link>
          </div>
        </div>
      </section>

      {/* Verified Doctors Slideshow */}
      {verifiedDoctors.length > 0 && (
        <section className="home-doctors-slideshow" style={{ padding: "4rem 2rem", background: "#f8fafc", overflow: "hidden" }}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <h2 className="section-title" style={{ margin: "0 0 0.5rem" }}>Our Top Specialists</h2>
            <p style={{ color: "#6b7280", maxWidth: 600, margin: "0 auto", fontSize: "0.95rem" }}>
              Book an appointment with highly qualified, verified healthcare professionals.
            </p>
          </div>
          
          <div className="marquee-wrapper" style={{ position: "relative", width: "100%", maxWidth: 1200, margin: "0 auto", overflow: "hidden", display: "flex", padding: "1rem 0" }}>
            {/* Left and Right Fade Overlays */}
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "100px", background: "linear-gradient(to right, #f8fafc, transparent)", zIndex: 2 }}></div>
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "100px", background: "linear-gradient(to left, #f8fafc, transparent)", zIndex: 2 }}></div>
            
            <div className="marquee-content" style={{ display: "flex", gap: "1.5rem", animation: "scrollMarquee 40s linear infinite" }}>
              {verifiedDoctors.map((doc, idx) => (
                <div key={`${doc.email}-${idx}`} className="doctor-slide-card" style={{
                  background: "white", padding: "1.5rem", borderRadius: "20px", width: "280px", flexShrink: 0,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
                  transition: "transform 0.3s, box-shadow 0.3s"
                }}>
                  <div style={{ 
                    width: 70, height: 70, borderRadius: "50%", background: "#eff6ff", 
                    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem", color: "#1d4ed8" 
                  }}>
                    <User size={30} strokeWidth={2.5} />
                  </div>
                  <h3 style={{ margin: "0 0 0.3rem", fontSize: "1.1rem", color: "#1e293b", fontWeight: 800 }}>Dr. {doc.name.replace(/^Dr\.?\s*/i, '')}</h3>
                  <p style={{ margin: "0 0 0.8rem", color: "#0d47a1", fontWeight: 700, fontSize: "0.85rem", background: "#e0e7ff", padding: "4px 12px", borderRadius: "12px" }}>
                    {doc.specialty}
                  </p>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", marginBottom: "1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "#64748b", justifyContent: "center" }}>
                      <Building size={14} /> <span>{doc.address?.split(',')[0]}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                      {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="#fbbf24" color="#fbbf24" />)}
                      <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 700, marginLeft: 2 }}>5.0</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "#15803d", fontWeight: 700, justifyContent: "center", marginTop: 4 }}>
                      <ShieldCheck size={14} /> <span>Verified Expert</span>
                    </div>
                  </div>
                  
                  <button onClick={() => navigate('/doctors')} style={{ 
                    marginTop: "auto", width: "100%", padding: "10px", background: "white", 
                    color: "#0d47a1", border: "1.5px solid #0d47a1", borderRadius: "12px", 
                    fontWeight: 700, cursor: "pointer", transition: "all 0.2s" 
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#0d47a1"; e.currentTarget.style.color = "white"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#0d47a1"; }}>
                    Book Appointment
                  </button>
                </div>
              ))}
            </div>
            
            {/* Duplicate for seamless loop if needed, but array doubling does this above */}
          </div>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes scrollMarquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(calc(-280px * ${verifiedDoctors.length / 3} - 1.5rem * ${verifiedDoctors.length / 3})); }
            }
            .marquee-content:hover {
              animation-play-state: paused !important;
            }
            .doctor-slide-card:hover {
              transform: translateY(-8px) !important;
              box-shadow: 0 15px 40px rgba(0,0,0,0.1) !important;
            }
          `}} />
        </section>
      )}

      {/* How it Works Section */}
      <section className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Take the Test</h3>
            <p>Enter your health vitals securely into our AI-driven system for a rapid assessment.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Get Results</h3>
            <p>Receive your personalized heart risk prediction report instantly on your screen.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Consult a Doctor</h3>
            <p>Book an appointment with a verified cardiologist directly through our platform if needed.</p>
          </div>
        </div>
      </section>

      {/* About & Contact Sections */}
      <section className="home-info-sections">
        <div className="info-card about-card">
          <h2>About Us</h2>
          <p>
            We are dedicated to providing accessible, AI-driven healthcare solutions worldwide, bridging the gap between technology and medical expertise.
          </p>
          <Link to="/about" className="info-btn">Read More</Link>
        </div>
        <div className="info-card contact-card">
          <h2>Need Help?</h2>
          <p>
            Have questions about your prediction results or need help booking a doctor? Our support team is here.
          </p>
          <Link to="/contact" className="info-btn">Contact Us</Link>
        </div>
      </section>
    </div>
  );
}
