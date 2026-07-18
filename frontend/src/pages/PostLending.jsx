import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createListing } from "../api/borrow";
import { showToast } from "../hooks/useBorrow";
import { ArrowLeft, Upload, X, Camera } from "lucide-react";

export default function PostLending() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [itemType, setItemType] = useState("shirt");
  const [size, setSize] = useState("M");
  const [color, setColor] = useState("");
  const [maxBorrowDays, setMaxBorrowDays] = useState(3);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = React.useRef(null);
  const cameraInputRef = React.useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "image/jpeg" && file.type !== "image/png") {
      setError("Only JPEG and PNG images are allowed");
      return;
    }

    // Standard 5MB size limit
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !itemType || !size || !color || !maxBorrowDays) {
      setError("All fields except image are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("item_type", itemType);
      formData.append("size", size);
      formData.append("color", color.trim());
      formData.append("max_borrow_days", parseInt(maxBorrowDays));
      if (imageFile) {
        formData.append("image", imageFile);
      }

      await createListing(formData);
      showToast("Lending listing posted successfully");
      navigate("/borrow");
    } catch (err) {
      setError(err.message || "Failed to post listing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg font-sans flex flex-col">
      {/* Top Header */}
      <header className="bg-surface border-b border-border py-4 px-6 md:px-12 flex items-center gap-3">
        <Link
          to="/borrow"
          className="p-1.5 border border-border rounded-lg text-text-muted hover:text-text hover:bg-bg transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft size={16} />
        </Link>
        <span className="text-xl font-bold text-primary">Post Item to Lend</span>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-lg w-full mx-auto px-6 py-12 flex flex-col justify-center">
        <div className="bg-surface border border-border rounded-xl shadow-sm p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-primary">Listing Details</h2>
            <p className="text-sm text-text-muted mt-1">
              Describe the item you are lending to other students.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-error/20 text-error text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-text mb-1">
                Item Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Formal Black Blazer"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary-lt bg-surface text-text text-sm"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-text mb-1">
                Description
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the condition, occasion, washing rules..."
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary-lt bg-surface text-text text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Item Type */}
              <div>
                <label className="block text-sm font-semibold text-text mb-1">
                  Item Type
                </label>
                <select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-primary-lt bg-surface text-text text-sm"
                >
                  <option value="shirt">Shirt</option>
                  <option value="tshirt">T-Shirt</option>
                  <option value="jeans">Jeans</option>
                  <option value="trousers">Trousers</option>
                  <option value="jacket">Jacket</option>
                  <option value="saree">Saree</option>
                  <option value="kurta">Kurta</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Size */}
              <div>
                <label className="block text-sm font-semibold text-text mb-1">
                  Size
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-primary-lt bg-surface text-text text-sm"
                >
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                  <option value="Free">Free Size</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Color */}
              <div>
                <label className="block text-sm font-semibold text-text mb-1">
                  Color
                </label>
                <input
                  type="text"
                  required
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g. Navy Blue"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary-lt bg-surface text-text text-sm"
                />
              </div>

              {/* Max Borrow Days */}
              <div>
                <label className="block text-sm font-semibold text-text mb-1">
                  Max Borrow Days
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={30}
                  value={maxBorrowDays}
                  onChange={(e) => setMaxBorrowDays(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary-lt bg-surface text-text text-sm"
                />
              </div>
            </div>

            {/* Image Upload (Optional) */}
            <div>
              <label className="block text-sm font-semibold text-text mb-1">
                Item Image <span className="text-text-muted font-normal">(Optional)</span>
              </label>
              
              {!imagePreview ? (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current.click()}
                    className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg py-6 px-4 hover:bg-bg/50 hover:border-primary-lt transition-all duration-200 cursor-pointer"
                  >
                    <Camera className="text-text-muted mb-2" size={24} />
                    <span className="text-xs font-semibold text-text">Take Photo</span>
                    <span className="text-[10px] text-text-muted mt-1">Using Camera</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg py-6 px-4 hover:bg-bg/50 hover:border-primary-lt transition-all duration-200 cursor-pointer"
                  >
                    <Upload className="text-text-muted mb-2" size={24} />
                    <span className="text-xs font-semibold text-text">Upload File</span>
                    <span className="text-[10px] text-text-muted mt-1">From Device</span>
                  </button>

                  <input
                    type="file"
                    ref={cameraInputRef}
                    accept="image/png, image/jpeg"
                    capture="environment"
                    onChange={handleImageChange}
                    className="hidden"
                  />

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png, image/jpeg"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="relative border border-border rounded-lg overflow-hidden bg-bg">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1 bg-surface/90 border border-border rounded-full hover:bg-red-50 text-error hover:text-error active:scale-90 transition-all cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              {loading ? (
                <div className="space-y-2">
                  <div className="h-10 bg-border animate-pulse rounded-lg w-full"></div>
                  <p className="text-center text-xs text-text-muted animate-pulse">
                    Posting your listing...
                  </p>
                </div>
              ) : (
                <div className="flex gap-4">
                  <Link
                    to="/borrow"
                    className="w-1/2 text-center py-2.5 px-4 border border-border hover:bg-bg text-text font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 px-4 bg-primary hover:bg-primary-lt text-surface font-semibold rounded-lg shadow-sm transition-all duration-250 cursor-pointer"
                  >
                    Post Listing
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
