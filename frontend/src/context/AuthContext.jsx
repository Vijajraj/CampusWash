import React, { createContext, useState, useEffect, useContext } from "react";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { getMe, clerkLogin } from "../api/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const { isLoaded, isSignedIn, getToken, signOut: clerkSignOut } = useClerkAuth();

  useEffect(() => {
    if (!isLoaded) return;

    const syncAuth = async () => {
      const token = localStorage.getItem("token");
      
      if (isSignedIn) {
        if (token) {
          try {
            console.log("[Auth] Found local token, checking profile validity...");
            const userData = await getMe();
            console.log("[Auth] Profile verified successfully:", userData);
            setUser(userData);
          } catch (error) {
            if (error && error.error === "INCOMPLETE_PROFILE") {
              console.log("[Auth] User profile is incomplete.");
              setUser({
                id: error.user_id,
                email: error.email,
                profile_complete: false,
              });
            } else {
              console.log("[Auth] Token invalid or expired. Re-exchanging Clerk token...");
              await exchangeClerkToken();
            }
          } finally {
            setInitializing(false);
          }
        } else {
          await exchangeClerkToken();
        }
      } else {
        console.log("[Auth] User is signed out of Clerk. Clearing local token.");
        localStorage.removeItem("token");
        setUser(null);
        setInitializing(false);
      }
    };

    const exchangeClerkToken = async () => {
      try {
        console.log("[Auth] Exchanging Clerk token with backend...");
        const clerkToken = await getToken();
        if (!clerkToken) {
          throw new Error("No Clerk session token available");
        }
        const data = await clerkLogin(clerkToken);
        localStorage.setItem("token", data.access_token);
        
        const partialUser = {
          id: data.user_id,
          email: data.parsed.email || "",
          profile_complete: data.profile_complete,
        };
        setUser(partialUser);
        
        if (data.profile_complete) {
          const userData = await getMe();
          setUser(userData);
        }
      } catch (err) {
        console.error("[Auth] Token exchange failed:", err);
        localStorage.removeItem("token");
        setUser(null);
        try {
          await clerkSignOut();
        } catch (signOutErr) {
          console.error("[Auth] Failed to sign out from Clerk:", signOutErr);
        }
        let message = "Sign in failed. Please try again.";
        if (err && err.error === "INVALID_COLLEGE_EMAIL") {
          message = "Only @citchennai.net emails are allowed.";
        } else if (err && err.message) {
          message = err.message;
        }
        window.dispatchEvent(new CustomEvent("app-toast", { detail: { message } }));
      } finally {
        setInitializing(false);
      }
    };

    syncAuth();
  }, [isLoaded, isSignedIn]);

  const refreshUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      return null;
    }

    try {
      console.log("[Auth] Refreshing user...");
      const userData = await getMe();
      setUser(userData);
      return userData;
    } catch (error) {
      if (error && error.error === "INCOMPLETE_PROFILE") {
        const partialUser = {
          id: error.user_id,
          email: error.email,
          profile_complete: false,
        };
        setUser(partialUser);
        return partialUser;
      }
      localStorage.removeItem("token");
      setUser(null);
      return null;
    }
  };

  const logout = async () => {
    localStorage.removeItem("token");
    setUser(null);
    await clerkSignOut();
  };

  const isAuthenticated = !!user;
  const profileComplete = user ? !!user.profile_complete : false;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: initializing || !isLoaded,
        refreshUser,
        logout,
        isAuthenticated,
        profileComplete,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

