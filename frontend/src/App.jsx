import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";

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
  const missingVars = [];
  if (!import.meta.env.VITE_SUPABASE_URL) missingVars.push("VITE_SUPABASE_URL");
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) missingVars.push("VITE_SUPABASE_ANON_KEY");
  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) missingVars.push("VITE_GOOGLE_CLIENT_ID");

  if (missingVars.length > 0) {
    throw new Error(`Missing Environment Variables: ${missingVars.join(", ")}. Please add them to your environment configuration (or Vercel Project Settings -> Environment Variables) and rebuild the application.`);
  }

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

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-8 font-sans">
          <div className="w-full max-w-lg bg-surface border border-error/20 p-8 rounded-xl shadow-sm text-center">
            <h1 className="text-2xl font-bold text-error mb-4">Application Error</h1>
            <p className="text-xs text-text-muted mb-6">
              An unexpected error occurred. Please verify your client configuration and environment variables.
            </p>
            <pre className="text-left bg-bg border border-border p-4 rounded-lg text-xs overflow-x-auto font-mono text-error">
              {this.state.error?.toString()}
              {"\n"}
              {this.state.error?.stack}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={clientId}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}
