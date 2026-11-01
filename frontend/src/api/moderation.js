import { apiFetch } from "./config";

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

export const getReports = async (status = "", page = 1) => {
  const queryParams = new URLSearchParams();
  queryParams.append("page", page);
  if (status) queryParams.append("status", status);

  const res = await apiFetch(`/admin/reports?${queryParams.toString()}`, {
    method: "GET",
    headers: getHeaders(),
  });
  return handleResponse(res);
};

export const resolveReport = async (id, action) => {
  const res = await apiFetch(`/admin/reports/${id}/resolve`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ action }),
  });
  return handleResponse(res);
};

export const getUsersList = async (page = 1) => {
  const res = await apiFetch(`/admin/users?page=${page}`, {
    method: "GET",
    headers: getHeaders(),
  });
  return handleResponse(res);
};

export const updateUserRole = async (id, role) => {
  const res = await apiFetch(`/admin/users/${id}/role`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ role }),
  });
  return handleResponse(res);
};
