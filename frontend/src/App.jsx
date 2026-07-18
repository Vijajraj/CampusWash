import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Import Pages
import Login from "./pages/Login";
import CompleteProfile from "./pages/CompleteProfile";
import Dashboard from "./pages/Dashboard";
import BorrowLend from "./pages/BorrowLend";
import PostLending from "./pages/PostLending";
import WrongDeliveries from "./pages/WrongDeliveries";
import PostWrongDelivery from "./pages/PostWrongDelivery";
import LostAndFound from "./pages/LostAndFound";
import PostItem from "./pages/PostItem";
import ModerationQueue from "./pages/admin/ModerationQueue";

// Branded loading screen — replaces grey skeleton boxes
const LoadingScreen = () => (
  <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-8 font-sans gap-5">
    <div className="flex flex-col items-center gap-3 animate-fade-in">
      <div className="text-5xl animate-bounce" style={{ animationDuration: '1.5s' }}>👕</div>
      <h1 className="text-xl font-bold tracking-tight text-primary">CampusWash</h1>
    </div>
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></span>
      <span className="w-2 h-2 bg-primary-lt rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></span>
      <span className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></span>
    </div>
    <p className="text-sm text-text-muted">Loading your session...</p>
  </div>
);

// Route Guard for fully authenticated & profile-completed users
const ProtectedRoutes = () => {
  const { isAuthenticated, profileComplete, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
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
    return <LoadingScreen />;
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
    return <LoadingScreen />;
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
  if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) missingVars.push("VITE_CLERK_PUBLISHABLE_KEY");

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
            <Route path="/wrong-deliveries" element={<WrongDeliveries />} />
            <Route path="/wrong-deliveries/post" element={<PostWrongDelivery />} />
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
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
