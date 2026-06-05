import React, { createContext, useState, useEffect, useContext } from "react";
import { getMe, logout as logoutApi } from "../api/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const initAuth = async () => {
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
      setUser(null);
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error("Failed to clear cookie session on backend:", error);
    } finally {
      setUser(null);
    }
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
