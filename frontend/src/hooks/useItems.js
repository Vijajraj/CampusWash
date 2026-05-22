import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { getLostItems, getFoundItems } from "../api/items";

export const showToast = (message) => {
  window.dispatchEvent(new CustomEvent("app-toast", { detail: { message } }));
};

export function useLostItems(filters, page) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLostItems(filters, page);
      const itemList = res.items || [];

      if (itemList.length > 0) {
        const userIds = [...new Set(itemList.map((item) => item.user_id))];
        const { data: userData, error: userErr } = await supabase
          .table("users")
          .select("id, name, email, phone")
          .in("id", userIds);

        if (!userErr && userData) {
          const userMap = {};
          userData.forEach((u) => {
            userMap[u.id] = u;
          });
          itemList.forEach((item) => {
            item.user_name = userMap[item.user_id]?.name || "Student";
            item.user_email = userMap[item.user_id]?.email || "";
            item.user_phone = userMap[item.user_id]?.phone || "";
          });
        }
      }

      setItems(itemList);
      setTotal(res.total);
      setTotalPages(res.total_pages);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load lost items");
    } finally {
      setLoading(false);
    }
  }, [filters.type, filters.color, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const channel = supabase
      .channel("lost_items_realtime_updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lost_items" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            showToast(`Lost item status updated to ${payload.new.status}`);
          } else if (payload.eventType === "INSERT") {
            showToast("A new lost item has been posted");
          }
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  return { items, total, totalPages, loading, error, refetch: fetchData };
}

export function useFoundItems(filters, page) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getFoundItems(filters, page);
      const itemList = res.items || [];

      if (itemList.length > 0) {
        const userIds = [...new Set(itemList.map((item) => item.user_id))];
        const { data: userData, error: userErr } = await supabase
          .table("users")
          .select("id, name, email, phone")
          .in("id", userIds);

        if (!userErr && userData) {
          const userMap = {};
          userData.forEach((u) => {
            userMap[u.id] = u;
          });
          itemList.forEach((item) => {
            item.user_name = userMap[item.user_id]?.name || "Student";
            item.user_email = userMap[item.user_id]?.email || "";
            item.user_phone = userMap[item.user_id]?.phone || "";
          });
        }
      }

      setItems(itemList);
      setTotal(res.total);
      setTotalPages(res.total_pages);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load found items");
    } finally {
      setLoading(false);
    }
  }, [filters.type, filters.color, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const channel = supabase
      .channel("found_items_realtime_updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "found_items" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            showToast(`Found item status updated to ${payload.new.status}`);
          } else if (payload.eventType === "INSERT") {
            showToast("A new found item has been posted");
          }
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  return { items, total, totalPages, loading, error, refetch: fetchData };
}
