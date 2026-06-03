import React, { createContext, useState, useEffect, useContext } from "react";
import { getMe, logout as logoutApi } from "../api/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const initAuth = async () => {
    try {
      const userData = await getMe();
      setUser(userData);
    } catch (error) {
      if (error && error.error === "INCOMPLETE_PROFILE") {
        setUser({
          id: error.user_id,
          email: error.email,
          profile_complete: false,
        });
      } else {
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
