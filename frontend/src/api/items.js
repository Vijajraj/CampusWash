const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const getHeaders = (isMultipart = false) => {
  const token = localStorage.getItem("token");
  const headers = {};
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
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

export const getLostItems = async (filters = {}, page = 1) => {
  const queryParams = new URLSearchParams();
  queryParams.append("page", page);
  if (filters.type) queryParams.append("type", filters.type);
  if (filters.color) queryParams.append("color", filters.color);

  const res = await fetch(`${BASE_URL}/items/lost?${queryParams.toString()}`);
  return handleResponse(res);
};

export const getFoundItems = async (filters = {}, page = 1) => {
  const queryParams = new URLSearchParams();
  queryParams.append("page", page);
  if (filters.type) queryParams.append("type", filters.type);
  if (filters.color) queryParams.append("color", filters.color);

  const res = await fetch(`${BASE_URL}/items/found?${queryParams.toString()}`);
  return handleResponse(res);
};

export const postLostItem = async (formData) => {
  const res = await fetch(`${BASE_URL}/items/lost`, {
    method: "POST",
    headers: getHeaders(true),
    body: formData,
  });
  return handleResponse(res);
};

export const postFoundItem = async (formData) => {
  const res = await fetch(`${BASE_URL}/items/found`, {
    method: "POST",
    headers: getHeaders(true),
    body: formData,
  });
  return handleResponse(res);
};

export const closeLostItem = async (id) => {
  const res = await fetch(`${BASE_URL}/items/lost/${id}/close`, {
    method: "PATCH",
    headers: getHeaders(),
  });
  return handleResponse(res);
};

export const claimFoundItem = async (id) => {
  const res = await fetch(`${BASE_URL}/items/found/${id}/claim`, {
    method: "PATCH",
    headers: getHeaders(),
  });
  return handleResponse(res);
};

export const reportItem = async (targetType, targetId, reason) => {
  const res = await fetch(`${BASE_URL}/items/report`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      target_type: targetType,
      target_id: targetId,
      reason,
    }),
  });
  return handleResponse(res);
};
