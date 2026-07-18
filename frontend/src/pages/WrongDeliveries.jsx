import { useState } from "react"
import { useWrongDeliveries } from "../hooks/useWrongDeliveries"
import { claimWrongDelivery } from "../api/wrongDeliveries"
import WrongDeliveryCard from "../components/WrongDeliveryCard"
import { Link } from "react-router-dom"

export default function WrongDeliveries() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({})
  const { items, total, loading, error } = useWrongDeliveries(filters, page)

  if (loading) return (
    <div className="space-y-4 p-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
      ))}
    </div>
  )

  if (error) return (
    <div className="p-4 text-[var(--color-error)]">
      Something went wrong. Please refresh.
    </div>
  )

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-[var(--color-text)]">
          Wrong Deliveries
        </h1>
        <Link
          to="/wrong-deliveries/post"
          className="px-4 py-2 bg-[var(--color-primary)] text-white
                     rounded-lg text-sm font-medium"
        >
          Post Wrong Delivery
        </Link>
      </div>

      <p className="text-sm text-[var(--color-text-muted)] mb-4">
        Received clothes that are not yours? Post here so the owner can find them.
      </p>

      {(items || []).length === 0 ? (
        <p className="text-center text-[var(--color-text-muted)] py-12">
          No wrong deliveries posted yet.
        </p>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <WrongDeliveryCard
              key={item.id}
              item={item}
              onClaim={claimWrongDelivery}
            />
          ))}
        </div>
      )}

      {total > 20 && (
        <div className="flex justify-between mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-[var(--color-border)]
                       rounded-lg text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-[var(--color-text-muted)] self-center">
            Page {page}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page * 20 >= total}
            className="px-4 py-2 border border-[var(--color-border)]
                       rounded-lg text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
