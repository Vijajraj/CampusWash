import { BASE_URL } from "./config";

const getHeaders = () => {
  return {
    "Content-Type": "application/json",
  };
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
    headers: getHeaders(),
    body: JSON.stringify({ supabase_token: supabaseToken }),
    credentials: "include",
  });
  return handleResponse(res);
};

export const googleLogin = async (code) => {
  const res = await fetch(`${BASE_URL}/auth/google-login`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ code }),
    credentials: "include",
  });
  return handleResponse(res);
};

export const logout = async () => {
  const res = await fetch(`${BASE_URL}/auth/logout`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
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
    credentials: "include",
  });
  return handleResponse(res);
};

export const getMe = async () => {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });
  return handleResponse(res);
};
