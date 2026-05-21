import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Import Pages
import Login from "./pages/Login";
import CompleteProfile from "./pages/CompleteProfile";
import Dashboard from "./pages/Dashboard";
import BorrowLend from "./pages/BorrowLend";
import PostLending from "./pages/PostLending";
import ItemRequests from "./pages/ItemRequests";
import PostRequest from "./pages/PostRequest";
import LostAndFound from "./pages/LostAndFound";
import PostItem from "./pages/PostItem";
import ModerationQueue from "./pages/admin/ModerationQueue";

// Route Guard for fully authenticated & profile-completed users
const ProtectedRoutes = () => {
  const { isAuthenticated, profileComplete, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-8 font-sans">
        <div className="w-full max-w-md space-y-4">
          <div className="h-8 bg-border animate-pulse rounded w-1/3"></div>
          <div className="h-4 bg-border animate-pulse rounded w-1/2"></div>
          <div className="h-32 bg-border animate-pulse rounded-lg w-full"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!profileComplete) {
    return <Navigate to="/complete-profile" replace />;
  }

  return <Outlet />;
};

// Route Guard for authenticated but incomplete-profile users
const UnverifiedRoutes = () => {
  const { isAuthenticated, profileComplete, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-8 font-sans">
        <div className="w-full max-w-md space-y-4">
          <div className="h-8 bg-border animate-pulse rounded w-1/3"></div>
          <div className="h-32 bg-border animate-pulse rounded-lg w-full"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (profileComplete) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

// Route Guard to prevent logged-in users from seeing the login screen again
const PublicOnlyRoute = () => {
  const { isAuthenticated, profileComplete, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-8 font-sans">
        <div className="w-full max-w-md space-y-4">
          <div className="h-32 bg-border animate-pulse rounded-lg w-full"></div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (profileComplete) {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/complete-profile" replace />;
    }
  }

  return <Outlet />;
};

function AppContent() {
  const [toast, setToast] = React.useState("");

  React.useEffect(() => {
    const handleToast = (e) => {
      setToast(e.detail.message);
    };
    window.addEventListener("app-toast", handleToast);
    return () => window.removeEventListener("app-toast", handleToast);
  }, []);

  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <div className="relative min-h-screen flex flex-col bg-bg">
      <BrowserRouter>
        <Routes>
          {/* Public only: login */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/" element={<Login />} />
          </Route>

          {/* Unverified only: complete profile */}
          <Route element={<UnverifiedRoutes />}>
            <Route path="/complete-profile" element={<CompleteProfile />} />
          </Route>

          {/* Protected: main app */}
          <Route element={<ProtectedRoutes />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/borrow" element={<BorrowLend />} />
            <Route path="/borrow/post" element={<PostLending />} />
            <Route path="/requests" element={<ItemRequests />} />
            <Route path="/requests/post" element={<PostRequest />} />
            <Route path="/lost-found" element={<LostAndFound />} />
            <Route path="/lost-found/post" element={<PostItem />} />
            <Route path="/admin" element={<ModerationQueue />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-surface px-5 py-3 rounded-lg shadow-lg text-sm font-semibold border border-border transition-all duration-300 animate-slide-up">
          {toast}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
