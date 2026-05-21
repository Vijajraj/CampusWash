import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { getListings, getMyRequests, getMyListingRequests } from "../api/borrow";

export const showToast = (message) => {
  window.dispatchEvent(new CustomEvent("app-toast", { detail: { message } }));
};

export function useListings(filters, page) {
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getListings(filters, page);
      setListings(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const channel = supabase
      .channel("listings_borrow_updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "borrow_requests" },
        (payload) => {
          showToast(`Borrow request status changed to ${payload.new.status}`);
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  return { listings, total, totalPages, loading, error, refetch: fetchData };
}

export function useMyRequests(page) {
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyRequests(page);
      setRequests(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load borrow requests");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const channel = supabase
      .channel("my_requests_updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "borrow_requests" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            showToast(`Your request status updated to ${payload.new.status}`);
          }
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  return { requests, total, totalPages, loading, error, refetch: fetchData };
}

export function useMyListingRequests(page) {
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyListingRequests(page);
      setRequests(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load listing requests");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const channel = supabase
      .channel("my_listings_requests_updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "borrow_requests" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            showToast("You received a new borrow request on your listing");
          } else if (payload.eventType === "UPDATE") {
            showToast(`Request status updated to ${payload.new.status}`);
          }
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  return { requests, total, totalPages, loading, error, refetch: fetchData };
}
