import { useState, useEffect } from "react"
import { getWrongDeliveries } from "../api/wrongDeliveries"
import { supabase } from "../lib/supabase"

export const useWrongDeliveries = (filters = {}, page = 1) => {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true)
        const data = await getWrongDeliveries(filters, page)
        setItems(data.items)
        setTotal(data.total)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetch()

    const channel = supabase
      .channel("wrong_deliveries_updates")
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "wrong_deliveries" },
        (payload) => {
          setItems(prev =>
            prev.map(item =>
              item.id === payload.new.id ? payload.new : item
            )
          )
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [page, JSON.stringify(filters)])

  return { items, total, loading, error }
}
