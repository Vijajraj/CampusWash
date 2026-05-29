const BASE_URL = import.meta.env.VITE_API_BASE_URL || (typeof window !== "undefined" && window.location.hostname === "localhost" ? "http://localhost:8000/api/v1" : "/api/v1");

const getHeaders = () => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    let errData;
    try {
      errData = await response.json();
    } catch {
      throw { error: "SERVER_ERROR", message: "An unexpected error occurred" };
    }
    const detail = errData.detail || errData;
    throw {
      error: detail.error || "UNKNOWN_ERROR",
      message: detail.message || "An unknown error occurred",
    };
  }
  return response.json();
};

export const firebaseLogin = async (firebaseToken) => {
  const res = await fetch(`${BASE_URL}/auth/firebase-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ firebase_token: firebaseToken }),
  });
  return handleResponse(res);
};

export const completeProfile = async (name, registerNumber, dept, batchYear, phone) => {
  const res = await fetch(`${BASE_URL}/auth/complete-profile`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      name,
      register_number: registerNumber,
      department: dept,
      batch_year: batchYear,
      phone,
    }),
  });
  return handleResponse(res);
};

export const getMe = async () => {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    method: "GET",
    headers: getHeaders(),
  });
  return handleResponse(res);
};
