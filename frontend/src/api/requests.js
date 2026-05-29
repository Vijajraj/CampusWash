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

export const getRequests = async (filters = {}, page = 1) => {
  const queryParams = new URLSearchParams();
  queryParams.append("page", page);
  if (filters.type) queryParams.append("type", filters.type);
  if (filters.size) queryParams.append("size", filters.size);

  const res = await fetch(`${BASE_URL}/requests?${queryParams.toString()}`);
  return handleResponse(res);
};

export const createRequest = async (data) => {
  const res = await fetch(`${BASE_URL}/requests`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const deleteRequest = async (id) => {
  const res = await fetch(`${BASE_URL}/requests/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(res);
};

export const respondToRequest = async (requestId, message) => {
  const res = await fetch(`${BASE_URL}/requests/${requestId}/respond`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ message }),
  });
  return handleResponse(res);
};

export const getResponses = async (requestId) => {
  const res = await fetch(`${BASE_URL}/requests/${requestId}/responses`, {
    method: "GET",
    headers: getHeaders(),
  });
  return handleResponse(res);
};

export const fulfillRequest = async (requestId) => {
  const res = await fetch(`${BASE_URL}/requests/${requestId}/fulfill`, {
    method: "PATCH",
    headers: getHeaders(),
  });
  return handleResponse(res);
};
