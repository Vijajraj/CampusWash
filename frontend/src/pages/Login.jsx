import React, { useState, useEffect } from "react";
import { googleLogin } from "../api/auth";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Login() {
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [errorMsg, setErrorMsg] = useState("");

  // Load Google GSI script and initialize/render button once ready
  useEffect(() => {
    const scriptId = "google-gsi-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const waitForGoogle = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(waitForGoogle);
        try {
          window.google.accounts.id.initialize({
            client_id: CLIENT_ID,
            callback: onCredential,
            ux_mode: "popup",
          });

          const btnContainer = document.getElementById("google-signin-button");
          if (btnContainer) {
            window.google.accounts.id.renderButton(btnContainer, {
              theme: "outline",
              size: "large",
              width: 320,
              text: "continue_with",
              shape: "rectangular",
            });
          }
        } catch (err) {
          console.error("Failed to initialize Google Sign-In:", err);
          setErrorMsg("Failed to initialize Google Sign-In. Please reload the page.");
          setStatus("error");
        }
      }
    }, 100);

    return () => clearInterval(waitForGoogle);
  }, []);

  const onCredential = async ({ credential }) => {
    setStatus("loading");
    try {
      const data = await googleLogin(credential);
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
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg font-sans px-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl shadow-sm p-8 text-center">
        
        <div className="mb-8">
          <div className="text-5xl mb-4">👕</div>
          <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">CampusWash</h1>
          <p className="text-sm text-text-muted">CIT Chennai's clothing share platform.</p>
        </div>

        {status === "error" && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg text-left animate-fade-in">
            <p className="font-semibold">Sign in failed</p>
            <p className="mt-1">{errorMsg}</p>
          </div>
        )}

        {status === "loading" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-text-muted font-medium">Signing you in...</p>
          </div>
        )}

        {/* We use standard styling to hide it without unmounting */}
        <div 
          className="flex justify-center my-4"
          style={{ display: status === "loading" ? "none" : "flex" }}
        >
          <div id="google-signin-button"></div>
        </div>

        <p className="mt-6 text-xs text-text-muted">Only @citchennai.net accounts are permitted.</p>
      </div>
    </div>
  );
}
