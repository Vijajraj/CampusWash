import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { getRequests } from "../api/requests";
import useAuth from "./useAuth";

export function useRequests(filters, page) {
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRequests(filters, page);
      const items = res.items || [];

      if (items.length > 0) {
        const requesterIds = [...new Set(items.map((item) => item.requester_id))];
        const { data: userData, error: userErr } = await supabase
          .table("users")
          .select("id, name")
          .in("id", requesterIds);

        if (!userErr && userData) {
          const userMap = {};
          userData.forEach((u) => {
            userMap[u.id] = u.name;
          });
          items.forEach((item) => {
            item.requester_name = userMap[item.requester_id] || "Student";
          });
        }
      }

      setRequests(items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { requests, total, totalPages, loading, error, refetch: fetchData };
}

export function useMyRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .table("item_requests")
        .select("*")
        .eq("requester_id", user.id)
        .order("created_at", { ascending: false });

      if (err) throw err;

      const items = (data || []).map((item) => ({
        ...item,
        requester_name: user.name || "Me",
      }));

      setRequests(items);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load your requests");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { requests, loading, error, refetch: fetchData };
}
