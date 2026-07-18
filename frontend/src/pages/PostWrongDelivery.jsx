import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { postWrongDelivery } from "../api/wrongDeliveries"

const ITEM_TYPES = ["shirt","trouser","towel","bedsheet","blazer","other"]

export default function PostWrongDelivery() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(null)
  const [form, setForm] = useState({
    title: "", description: "", item_type: "",
    color: "", any_marks: "", image: null
  })

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setForm(f => ({ ...f, image: file }))
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.item_type || !form.image) {
      setError("Title, description, type, and image are required")
      return
    }
    try {
      setLoading(true)
      setError(null)
      const fd = new FormData()
      fd.append("title", form.title)
      fd.append("description", form.description)
      fd.append("item_type", form.item_type)
      if (form.color) fd.append("color", form.color)
      if (form.any_marks) fd.append("any_marks", form.any_marks)
      fd.append("image", form.image)
      await postWrongDelivery(fd)
      navigate("/wrong-deliveries")
    } catch (err) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold text-[var(--color-text)] mb-1">
        Post Wrong Delivery
      </h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        Describe the item that came to you by mistake so the owner can identify it.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            className="w-full border border-[var(--color-border)]
                       rounded-lg px-3 py-2 text-sm"
            placeholder="e.g. Blue shirt found in my laundry bag"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Description (required)
          </label>
          <textarea
            className="w-full border border-[var(--color-border)]
                       rounded-lg px-3 py-2 text-sm h-24"
            placeholder="Describe the item in detail — size, brand, any unique features"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Item Type</label>
          <select
            className="w-full border border-[var(--color-border)]
                       rounded-lg px-3 py-2 text-sm"
            value={form.item_type}
            onChange={e => setForm(f => ({ ...f, item_type: e.target.value }))}
          >
            <option value="">Select type</option>
            {ITEM_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <input
              className="w-full border border-[var(--color-border)]
                         rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. Blue"
              value={form.color}
              onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Identifying marks
            </label>
            <input
              className="w-full border border-[var(--color-border)]
                         rounded-lg px-3 py-2 text-sm"
              placeholder="Name tag, tear, pattern"
              value={form.any_marks}
              onChange={e => setForm(f => ({ ...f, any_marks: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Photo (required)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleImage}
            className="text-sm"
          />
          {preview && (
            <img
              src={preview}
              alt="preview"
              className="mt-2 h-40 object-cover rounded-lg
                         border border-[var(--color-border)]"
            />
          )}
        </div>

        {error && (
          <p className="text-sm text-[var(--color-error)]">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-2 bg-[var(--color-primary)] text-white
                     rounded-lg font-medium text-sm disabled:opacity-50"
        >
          {loading ? "Posting..." : "Post Wrong Delivery"}
        </button>
      </div>
    </div>
  )
}
