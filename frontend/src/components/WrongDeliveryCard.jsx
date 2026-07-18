import { useState } from "react"
import StatusBadge from "./StatusBadge"

export default function WrongDeliveryCard({ item, onClaim }) {
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(item.status === "claimed")

  const handleClaim = async () => {
    try {
      setClaiming(true)
      await onClaim(item.id)
      setClaimed(true)
    } catch (err) {
      alert(err.message || "Could not claim item")
    } finally {
      setClaiming(false)
    }
  }

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)]
                    rounded-lg p-4">
      <div className="flex gap-4">
        {item.image_url && (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-[var(--color-text)] truncate">
              {item.title}
            </h3>
            <StatusBadge status={item.status} />
          </div>
          <p className="text-sm text-[var(--color-text-muted)] mt-1 line-clamp-2">
            {item.description}
          </p>
          <div className="flex gap-3 mt-2 text-xs text-[var(--color-text-muted)]">
            {item.item_type && <span>Type: {item.item_type}</span>}
            {item.color && <span>Color: {item.color}</span>}
            {item.any_marks && <span>Marks: {item.any_marks}</span>}
          </div>
          {!claimed && (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="mt-3 px-3 py-1 border border-[var(--color-primary)]
                         text-[var(--color-primary)] rounded text-xs
                         font-medium disabled:opacity-50"
            >
              {claiming ? "Claiming..." : "This is mine"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
