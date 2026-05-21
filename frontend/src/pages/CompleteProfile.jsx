import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth as firebaseAuth } from "../lib/firebase";
import { completeProfile, getMe } from "../api/auth";
import useAuth from "../hooks/useAuth";

export default function CompleteProfile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [registerNumber, setRegisterNumber] = useState("");
  const [dept, setDept] = useState("");
  const [batchYear, setBatchYear] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [regError, setRegError] = useState("");

  useEffect(() => {
    if (firebaseAuth.currentUser) {
      setName(firebaseAuth.currentUser.displayName || "");
    }
    if (user) {
      setDept(user.department || "");
      setBatchYear(user.batch_year || "");
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (registerNumber.trim().length < 6) return;

    setLoading(true);
    setSubmitError("");
    setRegError("");

    try {
      const response = await completeProfile(
        name,
        registerNumber.trim(),
        dept,
        batchYear,
        phone.trim() || undefined
      );

      // Save the newly generated token that has profile_complete = true
      localStorage.setItem("token", response.access_token);
      
      // Fetch the full verified user details and update the AuthContext
      const freshUser = await getMe();
      setUser(freshUser);
      
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      if (err.error === "REGISTER_NUMBER_TAKEN") {
        setRegError("This register number is already registered.");
      } else {
        setSubmitError(err.message || "Failed to update profile. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormInvalid = registerNumber.trim().length < 6;

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg font-sans px-4 py-12">
      <div className="w-full max-w-lg bg-surface border border-border rounded-xl shadow-sm p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            Complete Your Profile
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Please fill in your academic registration details to start sharing.
          </p>
        </div>

        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border border-error/20 text-error text-sm rounded-lg">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-semibold text-text mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary-lt bg-surface text-text text-sm"
              placeholder="Enter your full name"
            />
          </div>

          {/* Register Number Field */}
          <div>
            <label className="block text-sm font-semibold text-text mb-1">
              Register Number <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={registerNumber}
              onChange={(e) => {
                setRegisterNumber(e.target.value.replace(/\s/g, ""));
                setRegError("");
              }}
              required
              minLength={6}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none bg-surface text-text text-sm ${
                regError ? "border-error focus:border-error" : "border-border focus:border-primary-lt"
              }`}
              placeholder="e.g. 210421104001"
            />
            {regError && (
              <p className="mt-1 text-xs text-error font-medium">{regError}</p>
            )}
            <p className="mt-1 text-xs text-text-muted">
              Must be at least 6 characters, no spaces.
            </p>
          </div>

          {/* Department Field */}
          <div>
            <label className="block text-sm font-semibold text-text mb-1">
              Department
            </label>
            <input
              type="text"
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              required
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary-lt bg-surface text-text text-sm"
              placeholder="e.g. CSE"
            />
          </div>

          {/* Batch Year Field */}
          <div>
            <label className="block text-sm font-semibold text-text mb-1">
              Batch Year
            </label>
            <input
              type="text"
              value={batchYear}
              onChange={(e) => setBatchYear(e.target.value)}
              required
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary-lt bg-surface text-text text-sm"
              placeholder="e.g. 2021-2025"
            />
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-sm font-semibold text-text mb-1">
              Phone Number <span className="text-text-muted font-normal">(Optional)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary-lt bg-surface text-text text-sm"
              placeholder="e.g. +919876543210"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            {loading ? (
              <div className="space-y-2">
                <div className="h-10 bg-border animate-pulse rounded-lg w-full"></div>
                <p className="text-center text-xs text-text-muted animate-pulse">
                  Submitting register details...
                </p>
              </div>
            ) : (
              <button
                type="submit"
                disabled={isFormInvalid}
                className="w-full py-2.5 px-4 bg-primary hover:bg-primary-lt text-surface font-semibold rounded-lg shadow-sm transition-all duration-250 cursor-pointer disabled:bg-border disabled:text-text-muted disabled:cursor-not-allowed"
              >
                Complete Profile
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
