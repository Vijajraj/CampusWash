import { useState, useRef, useCallback, useEffect } from "react"
import { X, SwitchCamera, Aperture } from "lucide-react"

/**
 * CameraCapture — full-screen camera overlay.
 *
 * Props:
 *   open       Boolean  — show / hide the overlay
 *   onClose    ()=>void — close without capturing
 *   onCapture  (file: File) => void — delivers a JPEG File to the parent
 */
export default function CameraCapture({ open, onClose, onCapture }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [facingMode, setFacingMode] = useState("environment") // rear camera
  const [error, setError] = useState(null)

  /* ---------- start / restart camera ---------- */
  const startCamera = useCallback(async (facing) => {
    // stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setError(null)
    } catch (err) {
      console.error("Camera access error:", err)
      if (err.name === "NotAllowedError") {
        setError("Camera access was denied. Please allow camera permissions in your browser settings.")
      } else if (err.name === "NotFoundError") {
        setError("No camera found on this device.")
      } else {
        setError("Could not access camera. " + (err.message || ""))
      }
    }
  }, [])

  /* ---------- lifecycle ---------- */
  useEffect(() => {
    if (open) {
      startCamera(facingMode)
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    }
  }, [open, facingMode, startCamera])

  /* ---------- capture frame ---------- */
  const handleCapture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    ctx.drawImage(video, 0, 0)

    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" })
        // stop the camera before delivering the file
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop())
          streamRef.current = null
        }
        onCapture(file)
      },
      "image/jpeg",
      0.9
    )
  }

  /* ---------- flip camera ---------- */
  const flipCamera = () => {
    setFacingMode(prev => (prev === "environment" ? "user" : "environment"))
  }

  /* ---------- close & cleanup ---------- */
  const handleClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <button
          onClick={handleClose}
          className="p-2 text-white rounded-full hover:bg-white/10 transition-colors"
        >
          <X size={24} />
        </button>
        <span className="text-white text-sm font-medium">Take Photo</span>
        <button
          onClick={flipCamera}
          className="p-2 text-white rounded-full hover:bg-white/10 transition-colors"
        >
          <SwitchCamera size={22} />
        </button>
      </div>

      {/* Camera feed */}
      <div className="flex-1 flex items-center justify-center bg-black overflow-hidden relative">
        {error ? (
          <div className="text-center px-6">
            <p className="text-white/80 text-sm mb-4">{error}</p>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-white/20 text-white rounded-lg text-sm"
            >
              Go Back
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Capture button */}
      {!error && (
        <div className="flex items-center justify-center py-6 bg-black/80">
          <button
            onClick={handleCapture}
            className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center
                       hover:scale-105 active:scale-95 transition-transform"
          >
            <Aperture size={32} className="text-white" />
          </button>
        </div>
      )}

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
