import { BASE_URL } from "./config";

const getHeaders = (isMultipart = false) => {
  const headers = {};
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
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

export const getListings = async (filters = {}, page = 1) => {
  const queryParams = new URLSearchParams();
  queryParams.append("page", page);
  if (filters.type) queryParams.append("type", filters.type);
  if (filters.size) queryParams.append("size", filters.size);

  const res = await fetch(`${BASE_URL}/borrow/listings?${queryParams.toString()}`, {
    credentials: "include",
  });
  return handleResponse(res);
};

export const createListing = async (formData) => {
  const res = await fetch(`${BASE_URL}/borrow/listings`, {
    method: "POST",
    headers: getHeaders(true),
    body: formData,
    credentials: "include",
  });
  return handleResponse(res);
};

export const deleteListing = async (id) => {
  const res = await fetch(`${BASE_URL}/borrow/listings/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
    credentials: "include",
  });
  return handleResponse(res);
};

export const getListing = async (id) => {
  const res = await fetch(`${BASE_URL}/borrow/listings/${id}`, {
    credentials: "include",
  });
  return handleResponse(res);
};

export const requestBorrow = async (listingId, reason, from, until) => {
  const res = await fetch(`${BASE_URL}/borrow/listings/${listingId}/request`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      reason,
      borrow_from: from,
      borrow_until: until,
    }),
    credentials: "include",
  });
  return handleResponse(res);
};

export const getMyRequests = async (page = 1) => {
  const res = await fetch(`${BASE_URL}/borrow/my-requests?page=${page}`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });
  return handleResponse(res);
};

export const getMyListingRequests = async (page = 1) => {
  const res = await fetch(`${BASE_URL}/borrow/my-listings-requests?page=${page}`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });
  return handleResponse(res);
};

export const approveRequest = async (id) => {
  const res = await fetch(`${BASE_URL}/borrow/requests/${id}/approve`, {
    method: "PATCH",
    headers: getHeaders(),
    credentials: "include",
  });
  return handleResponse(res);
};

export const rejectRequest = async (id) => {
  const res = await fetch(`${BASE_URL}/borrow/requests/${id}/reject`, {
    method: "PATCH",
    headers: getHeaders(),
    credentials: "include",
  });
  return handleResponse(res);
};

export const confirmReturn = async (id) => {
  const res = await fetch(`${BASE_URL}/borrow/requests/${id}/return`, {
    method: "PATCH",
    headers: getHeaders(),
    credentials: "include",
  });
  return handleResponse(res);
};
