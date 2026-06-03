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

export const getReports = async (status = "", page = 1) => {
  const queryParams = new URLSearchParams();
  queryParams.append("page", page);
  if (status) queryParams.append("status", status);

  const res = await fetch(`${BASE_URL}/admin/reports?${queryParams.toString()}`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });
  return handleResponse(res);
};

export const resolveReport = async (id, action) => {
  const res = await fetch(`${BASE_URL}/admin/reports/${id}/resolve`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ action }),
    credentials: "include",
  });
  return handleResponse(res);
};

export const getUsersList = async (page = 1) => {
  const res = await fetch(`${BASE_URL}/admin/users?page=${page}`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });
  return handleResponse(res);
};

export const updateUserRole = async (id, role) => {
  const res = await fetch(`${BASE_URL}/admin/users/${id}/role`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ role }),
    credentials: "include",
  });
  return handleResponse(res);
};
