import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { postLostItem, postFoundItem } from "../api/items";
import { showToast } from "../hooks/useItems";
import { ArrowLeft, Upload, X, HelpCircle, Camera } from "lucide-react";

export default function PostItem() {
  const navigate = useNavigate();
  const [postType, setPostType] = useState("lost"); // "lost" or "found"
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [itemType, setItemType] = useState("shirt");
  const [color, setColor] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
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
    if (!title || !itemType || !color || !location || !date) {
      setError("All fields marked with * are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("item_type", itemType);
      formData.append("description", description.trim());
      formData.append("color", color.trim());

      if (postType === "lost") {
        formData.append("location_lost", location.trim());
        formData.append("date_lost", date);
      } else {
        formData.append("location_found", location.trim());
        formData.append("date_found", date);
      }

      if (imageFile) {
        formData.append("image", imageFile);
      }

      if (postType === "lost") {
        await postLostItem(formData);
        showToast("Lost item report posted successfully");
      } else {
        await postFoundItem(formData);
        showToast("Found item listing posted successfully");
      }

      navigate("/lost-found");
    } catch (err) {
      setError(err.message || "Failed to submit post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg font-sans flex flex-col">
      {/* Top Header */}
      <header className="bg-surface border-b border-border py-4 px-6 md:px-12 flex items-center gap-3">
        <Link
          to="/lost-found"
          className="p-1.5 border border-border rounded-lg text-text-muted hover:text-text hover:bg-bg transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft size={16} />
        </Link>
        <span className="text-xl font-bold text-primary">Post Lost/Found Item</span>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-lg w-full mx-auto px-6 py-12 flex flex-col justify-center">
        <div className="bg-surface border border-border rounded-xl shadow-sm p-8">
          
          {/* Post Type Selector Tabs */}
          <div className="flex border border-border rounded-lg overflow-hidden mb-6 p-0.5 bg-bg/50">
            <button
              type="button"
              onClick={() => {
                setPostType("lost");
                setLocation("");
                setDate("");
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer font-sans ${
                postType === "lost"
                  ? "bg-primary text-surface shadow-sm"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Report Lost Item
            </button>
            <button
              type="button"
              onClick={() => {
                setPostType("found");
                setLocation("");
                setDate("");
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer font-sans ${
                postType === "found"
                  ? "bg-primary text-surface shadow-sm"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Report Found Item
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-primary">
              {postType === "lost" ? "Lost Item Details" : "Found Item Details"}
            </h2>
            <p className="text-sm text-text-muted mt-1">
              {postType === "lost"
                ? "Describe your lost clothing so other campus members can help locate it."
                : "Provide information about the clothing item you found to help return it to its owner."}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-error/20 text-error text-sm rounded-lg font-sans">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-text mb-1">
                Item Name / Title <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={postType === "lost" ? "e.g. Blue CIT Hoodie" : "e.g. Black Jockey Jacket"}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary-lt bg-surface text-text text-sm font-sans"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-text mb-1">
                Description <span className="text-text-muted font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  postType === "lost"
                    ? "Mention specific brand, tags, condition, zipper styles or unique markings..."
                    : "Describe the item's condition, size marks, or branding. Keep location specifics general so owners can verify..."
                }
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary-lt bg-surface text-text text-sm resize-none font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Item Type */}
              <div>
                <label className="block text-sm font-semibold text-text mb-1">
                  Item Type <span className="text-error">*</span>
                </label>
                <select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-primary-lt bg-surface text-text text-sm font-sans"
                >
                  <option value="shirt">Shirt</option>
                  <option value="trouser">Trouser</option>
                  <option value="towel">Towel</option>
                  <option value="bedsheet">Bedsheet</option>
                  <option value="blazer">Blazer</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-semibold text-text mb-1">
                  Color <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g. Navy Blue"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary-lt bg-surface text-text text-sm font-sans"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-text mb-1">
                  {postType === "lost" ? "Location Lost" : "Location Found"} <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={postType === "lost" ? "e.g. Main Hostel Block B" : "e.g. Ground Floor Gym"}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary-lt bg-surface text-text text-sm font-sans"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-text mb-1">
                  {postType === "lost" ? "Date Lost" : "Date Found"} <span className="text-error">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]} // Cannot be in future
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary-lt bg-surface text-text text-sm font-sans"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-text mb-1">
                Item Photo <span className="text-text-muted font-normal">(Optional)</span>
              </label>
              
              {!imagePreview ? (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current.click()}
                    className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg py-6 px-4 hover:bg-bg/50 hover:border-primary-lt transition-all duration-200 cursor-pointer"
                  >
                    <Camera className="text-text-muted mb-2" size={24} />
                    <span className="text-xs font-semibold text-text font-sans">Take Photo</span>
                    <span className="text-[10px] text-text-muted mt-1 font-sans">Using Camera</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg py-6 px-4 hover:bg-bg/50 hover:border-primary-lt transition-all duration-200 cursor-pointer"
                  >
                    <Upload className="text-text-muted mb-2" size={24} />
                    <span className="text-xs font-semibold text-text font-sans">Upload File</span>
                    <span className="text-[10px] text-text-muted mt-1 font-sans">From Device</span>
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
                  <p className="text-center text-xs text-text-muted animate-pulse font-sans">
                    Posting listing details...
                  </p>
                </div>
              ) : (
                <div className="flex gap-4">
                  <Link
                    to="/lost-found"
                    className="w-1/2 text-center py-2.5 px-4 border border-border hover:bg-bg text-text font-semibold rounded-lg transition-all cursor-pointer font-sans"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 px-4 bg-primary hover:bg-primary-lt text-surface font-semibold rounded-lg shadow-sm transition-all duration-250 cursor-pointer font-sans"
                  >
                    {postType === "lost" ? "Report Lost" : "Report Found"}
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
