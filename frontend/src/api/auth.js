import { BASE_URL } from "./config";

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

export const supabaseLogin = async (supabaseToken) => {
  const res = await fetch(`${BASE_URL}/auth/supabase-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ supabase_token: supabaseToken }),
  });
  return handleResponse(res);
};

export const googleLogin = async (credential) => {
  const res = await fetch(`${BASE_URL}/auth/google-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
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
