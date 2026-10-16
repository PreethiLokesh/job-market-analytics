import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import Layout from "./components/Layout.jsx";
import Auth from "./pages/Auth.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Jobs from "./pages/Jobs.jsx";
import Recommend from "./pages/Recommend.jsx";
import Applications from "./pages/Applications.jsx";
import Profile from "./pages/Profile.jsx";
import Admin from "./pages/Admin.jsx";

function Protected({ children, admin }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== "ADMIN") return <Navigate to="/" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/login" element={<PublicOnly><Auth mode="login" /></PublicOnly>} />
              <Route path="/signup" element={<PublicOnly><Auth mode="signup" /></PublicOnly>} />
              <Route path="/" element={<Protected><Dashboard /></Protected>} />
              <Route path="/jobs" element={<Protected><Jobs /></Protected>} />
              <Route path="/recommend" element={<Protected><Recommend /></Protected>} />
              <Route path="/applications" element={<Protected><Applications /></Protected>} />
              <Route path="/profile" element={<Protected><Profile /></Protected>} />
              <Route path="/admin" element={<Protected admin><Admin /></Protected>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
