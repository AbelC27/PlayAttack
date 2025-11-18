import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Navigate } from "react-router-dom";
import MainPage from "./pages/MainPage";
import AdminDashboard from "./pages/AdminDashboard";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import UserDashboard from "./pages/UserDashboard";
import UserProfile from "./pages/UserProfile";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute, AdminRoute, PublicRoute } from "./components/ProtectedRoute";
import RoleBasedRedirect from "./components/RoleBasedRedirect";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import { useEffect } from "react";
import { handleSupabaseRedirect } from "./authMiddleware";

function AppContent() {
  const location = useLocation();
  const hideNavbar = ['/admin'].includes(location.pathname);
  
  useEffect(() => {
    // Skip redirect handling for password recovery routes
    const isRecoveryRoute = 
      location.pathname.includes('reset-password') || 
      location.pathname.includes('forgot-password');
    
    if (!isRecoveryRoute) {
      handleSupabaseRedirect();
    }
  }, [location]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!hideNavbar && <Navbar />}
      <div style={{ backgroundColor: '#000000', flex: '1' }}>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } 
          />  
        <Route path="/reset" element={<ForgotPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/auth/confirm"
          element={<Navigate to="/reset-password" replace />}
        />
          <Route          
            path="/signup" 
            element={
              <PublicRoute>
                <SignupPage />
              </PublicRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          {/* Smart redirect route for logged-in users */}
          <Route path="/home" element={<RoleBasedRedirect />} />
        </Routes>
      </div>
      {!hideNavbar && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <div style={{ backgroundColor: '#000000', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Router>
          <AppContent />
        </Router>
      </div>
    </AuthProvider>
  );
}

export default App;
