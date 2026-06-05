import React, { createContext, useState, useEffect, useContext } from "react";
import { getMe } from "../api/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const initAuth = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("[Auth] No local token found. Initializing idle state.");
      setUser(null);
      setInitializing(false);
      return;
    }

    try {
      console.log("[Auth] Initializing — calling getMe()...");
      const userData = await getMe();
      console.log("[Auth] getMe() succeeded:", userData);
      setUser(userData);
    } catch (error) {
      if (error && error.error === "INCOMPLETE_PROFILE") {
        console.log("[Auth] User has incomplete profile:", error.email);
        setUser({
          id: error.user_id,
          email: error.email,
          profile_complete: false,
        });
      } else {
        console.log("[Auth] Not authenticated:", error);
        localStorage.removeItem("token");
        setUser(null);
      }
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const refreshUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      return null;
    }

    try {
      console.log("[Auth] Refreshing user...");
      const userData = await getMe();
      console.log("[Auth] refreshUser succeeded:", userData);
      setUser(userData);
      return userData;
    } catch (error) {
      if (error && error.error === "INCOMPLETE_PROFILE") {
        console.log("[Auth] refreshUser — incomplete profile:", error.email);
        const partialUser = {
          id: error.user_id,
          email: error.email,
          profile_complete: false,
        };
        setUser(partialUser);
        return partialUser;
      }
      console.log("[Auth] refreshUser failed:", error);
      localStorage.removeItem("token");
      setUser(null);
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const isAuthenticated = !!user;
  const profileComplete = user ? !!user.profile_complete : false;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: initializing,
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

