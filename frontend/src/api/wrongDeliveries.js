import { BASE_URL } from "./config"

const headers = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`
})

export const getWrongDeliveries = async (filters = {}, page = 1) => {
  const params = new URLSearchParams({ page, ...filters })
  const res = await fetch(`${BASE_URL}/wrong-deliveries?${params}`)
  const data = await res.json()
  if (!res.ok) throw data
  return data
}

export const postWrongDelivery = async (formData) => {
  const res = await fetch(`${BASE_URL}/wrong-deliveries`, {
    method: "POST",
    headers: headers(),
    body: formData
  })
  const data = await res.json()
  if (!res.ok) throw data
  return data
}

export const claimWrongDelivery = async (id) => {
  const res = await fetch(`${BASE_URL}/wrong-deliveries/${id}/claim`, {
    method: "PATCH",
    headers: headers()
  })
  const data = await res.json()
  if (!res.ok) throw data
  return data
}

export const deleteWrongDelivery = async (id) => {
  const res = await fetch(`${BASE_URL}/wrong-deliveries/${id}`, {
    method: "DELETE",
    headers: headers()
  })
  const data = await res.json()
  if (!res.ok) throw data
  return data
}

export const reportWrongDelivery = async (id, reason) => {
  const form = new FormData()
  form.append("reason", reason)
  const res = await fetch(`${BASE_URL}/wrong-deliveries/${id}/report`, {
    method: "POST",
    headers: headers(),
    body: form
  })
  const data = await res.json()
  if (!res.ok) throw data
  return data
}
