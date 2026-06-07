import { BASE_URL } from "./config";

const getHeaders = () => {
  const headers = {
    "Content-Type": "application/json",
  };
  const token = localStorage.getItem("token");
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

export const clerkLogin = async (clerkToken) => {
  const res = await fetch(`${BASE_URL}/auth/clerk-login`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ clerk_token: clerkToken }),
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

