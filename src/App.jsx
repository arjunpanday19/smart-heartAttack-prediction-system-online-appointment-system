import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Prediction from "./pages/Prediction";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Appointment from "./pages/Appointment";
import Profile from "./pages/Profile";
import DoctorAppointments from "./pages/DoctorAppointments";
import DoctorAvailability from "./pages/DoctorAvailability";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ContactUs from "./pages/ContactUs";
import About from "./pages/About";
import Doctors from "./pages/Doctors";
import DoctorLayout from "./components/DoctorLayout";

// Hides Navbar + Footer on /admin/* and for doctors on specific pages
function Layout({ children, user, setUser, profileImage }) {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");
  const isDoctor = user?.role === "doctor";
  
  const isDoctorPage = pathname === "/doctor-appointments" || pathname === "/doctor-availability" || isDoctor;
                       
  const hideNav = isAdmin || isDoctorPage;

  if (isDoctorPage) {
    return <DoctorLayout user={user} setUser={setUser}>{children}</DoctorLayout>;
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {!hideNav && <Navbar user={user} profileImage={profileImage} />}
      <div style={{ flex: 1 }}>{children}</div>
      {!hideNav && <Footer />}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  });
  const [profileImage, setProfileImage] = useState(() => {
    const img = localStorage.getItem("profileImage");
    if (img) return img;
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u).profileImage || null : null;
    } catch { return null; }
  });

  useEffect(() => {
    const syncAuth = () => {
      try {
        const uStr = localStorage.getItem("user");
        const parsedUser = uStr ? JSON.parse(uStr) : null;
        setUser(parsedUser);
        setProfileImage(localStorage.getItem("profileImage") || parsedUser?.profileImage || null);
      } catch { 
        setUser(null); 
        setProfileImage(null);
      }
    };
    window.addEventListener("storage", syncAuth);
    window.addEventListener("auth-change", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("auth-change", syncAuth);
    };
  }, []);

  return (
    //<GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
    <BrowserRouter>
      <Layout user={user} setUser={setUser} profileImage={profileImage}>
        <Routes>
          <Route path="/"                   element={<Home />} />
          <Route path="/predict"            element={<Prediction user={user} />} />
          <Route path="/login"              element={<Login />} />
          <Route path="/signup"             element={<Signup />} />
          <Route path="/appointment"        element={<Appointment />} />
          <Route path="/profile"            element={<Profile />} />
          <Route path="/doctor-appointments" element={<DoctorAppointments />} />
          <Route path="/doctor-availability" element={<DoctorAvailability />} />

          <Route path="/contact"             element={<ContactUs />} />
          <Route path="/about"               element={<About />} />
          <Route path="/doctors"             element={<Doctors />} />
          <Route path="/admin/login"        element={<AdminLogin />} />
          <Route path="/admin/dashboard"    element={<AdminDashboard />} />
        </Routes>
      </Layout>
    </BrowserRouter>
    //</GoogleOAuthProvider>
  );
}
