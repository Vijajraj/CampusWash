const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

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

export const getReports = async (status = "", page = 1) => {
  const queryParams = new URLSearchParams();
  queryParams.append("page", page);
  if (status) queryParams.append("status", status);

  const res = await fetch(`${BASE_URL}/admin/reports?${queryParams.toString()}`, {
    method: "GET",
    headers: getHeaders(),
  });
  return handleResponse(res);
};

export const resolveReport = async (id, action) => {
  const res = await fetch(`${BASE_URL}/admin/reports/${id}/resolve`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ action }),
  });
  return handleResponse(res);
};

export const getUsersList = async (page = 1) => {
  const res = await fetch(`${BASE_URL}/admin/users?page=${page}`, {
    method: "GET",
    headers: getHeaders(),
  });
  return handleResponse(res);
};

export const updateUserRole = async (id, role) => {
  const res = await fetch(`${BASE_URL}/admin/users/${id}/role`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ role }),
  });
  return handleResponse(res);
};
