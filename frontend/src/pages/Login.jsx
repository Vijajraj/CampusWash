import React, { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { googleLogin } from "../api/auth";

export default function Login() {
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [errorMsg, setErrorMsg] = useState("");

  const login = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      setStatus("loading");
      try {
        const data = await googleLogin(codeResponse.code);
        localStorage.setItem("token", data.access_token);
        // Hard redirect — avoids all React state timing issues
        window.location.href = data.profile_complete ? "/dashboard" : "/complete-profile";
      } catch (err) {
        setErrorMsg(
          err.error === "INVALID_COLLEGE_EMAIL"
            ? "Only @citchennai.net accounts are allowed."
            : err.message || "Sign in failed. Please try again."
        );
        setStatus("error");
      }
    },
    onError: (error) => {
      console.error("Google Login Failed:", error);
      setErrorMsg("Google Sign-In failed. Please try again.");
      setStatus("error");
    },
    flow: "auth-code",
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg font-sans px-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl shadow-sm p-8 text-center animate-fade-in">
        
        <div className="mb-8">
          <div className="text-5xl mb-4">👕</div>
          <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">CampusWash</h1>
          <p className="text-sm text-text-muted">CIT Chennai's clothing share platform.</p>
        </div>

        {status === "error" && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg text-left">
            <p className="font-semibold">Sign in failed</p>
            <p className="mt-1">{errorMsg}</p>
          </div>
        )}

        {status === "loading" ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-text-muted font-medium">Signing you in...</p>
          </div>
        ) : (
          <button
            onClick={() => login()}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-50 transition-all font-medium text-gray-700 cursor-pointer duration-200"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        )}

        <p className="mt-6 text-xs text-text-muted">Only @citchennai.net accounts are permitted.</p>
      </div>
    </div>
  );
}
