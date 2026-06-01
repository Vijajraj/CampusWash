import React, { createContext, useState, useEffect, useContext } from "react";
import { googleLogin, getMe } from "../api/auth";

const AuthContext = createContext(null);

const decodeToken = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const initAuth = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const userData = await getMe();
        setUser(userData);
      } catch (error) {
        if (error && error.error === "INCOMPLETE_PROFILE") {
          const decoded = decodeToken(token);
          if (decoded && decoded.sub) {
            setUser({ id: decoded.sub, profile_complete: false });
          } else {
            localStorage.removeItem("token");
            setUser(null);
          }
        } else {
          console.error("Auth initialization failed:", error);
          localStorage.removeItem("token");
          setUser(null);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (googleCredential) => {
    setLoading(true);
    try {
      const data = await googleLogin(googleCredential);
      localStorage.setItem("token", data.access_token);
      
      if (data.profile_complete) {
        const userData = await getMe();
        setUser(userData);
        return userData;
      } else {
        const userObj = {
          id: data.user_id,
          profile_complete: false,
          department: data.parsed?.department,
          batch_year: data.parsed?.batch_year,
        };
        setUser(userObj);
        return userObj;
      }
    } catch (error) {
      localStorage.removeItem("token");
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const isAuthenticated = !!user;
  const profileComplete = user ? !!user.profile_complete : false;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
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
