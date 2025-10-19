import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

const Amazon = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist } = useWishlist?.() || {};

  // Define concrete items so "Add to Cart" is not undefined
  const items = Array.from({ length: 12 }, (_, idx) => ({
    id: idx + 1,
    title: `Rect ${idx + 1}`,
    price: (idx + 1) * 10,
    image: `https://via.placeholder.com/300x200?text=${encodeURIComponent(
      `Rect ${idx + 1}`
    )}`,
  }));

  // Add to cart handler: persists to localStorage and shows "Added" feedback
  const handleAddToCart = async (item) => {
    try {
      await addToCart(item);
      navigate("/cart");
    } catch (e) {
      console.error("Failed to add to cart:", e);
    }
  };

  // Add to wishlist handler: adds and navigates to /wishlist
  const handleAddToWishlist = async (item) => {
    try {
      if (typeof addToWishlist === "function") {
        await addToWishlist(item);
      } else {
        // Fallback to localStorage if context is unavailable
        const WL_KEY = "wishlist";
        const safeParse = (s, fb) => { try { return JSON.parse(s); } catch { return fb; } };
        const keyOf = (it) => it?.productId ?? it?.id ?? it?._id;
        const entry = {
          id: keyOf(item) ?? item.id,
          title: item.title,
          price: item.price,
          image: item.image,
        };
        const items = safeParse(localStorage.getItem(WL_KEY), []);
        if (!items.find((it) => (it?.productId ?? it?.id) === entry.id)) {
          items.push(entry);
          localStorage.setItem(WL_KEY, JSON.stringify(items));
        }
      }
      navigate("/wishlist");
    } catch (e) {
      console.error("Failed to add to wishlist:", e);
      navigate("/wishlist");
    }
  };

  return (
    <>
      <div className="px-2 mt-3 py-4 sm:px-4 md:px-6 lg:px-8 space-y-8">
        {/* Search Bar */}
        <div className="flex justify-center">
          <input
            type="text"
            placeholder="Search..."
            className="w-full max-w-xs sm:max-w-md px-4 py-2 border rounded-full"
          />
        </div>

        {/* 8 Circle Images */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4 sm:gap-6 text-center">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx}>
              <img
                src="https://via.placeholder.com/100"
                alt={`Item ${idx + 1}`}
                className="w-24 h-24 rounded-full border mx-auto mb-2"
              />
              <p>Item {idx + 1}</p>
            </div>
          ))}
        </div>

        {/* Sidebar Toggle (Mobile Only) */}
        <div className="lg:hidden flex justify-between items-center">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="px-4 py-2 bg-gray-200 rounded-md w-full"
          >
            {isSidebarOpen ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        {/* Sidebar + Rectangular Images */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Sidebar */}
          <div
            className={`${
              isSidebarOpen ? "block" : "hidden"
            } lg:block w-full lg:w-1/4 xl:w-1/6 bg-gray-100 p-2 sm:p-4 rounded overflow-y-auto max-h-[100vh]`}
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <style>
              {`
              .sidebar-scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}
            </style>
            <div className="sidebar-scrollbar-hide">
              <h2 className="font-semibold mb-4">Filters</h2>

              {/* Category */}
              <div className="mb-4">
                <h3 className="font-medium">Category</h3>
                {[
                  "Residential",
                  "Commercial",
                  "Recreational",
                  "Institutional",
                  "Infrastructural",
                  "Agricultural",
                  "Mixed Use",
                  "Industrial",
                ].map((item) => (
                  <label key={item} className="block">
                    <input type="checkbox" /> {item}
                  </label>
                ))}
              </div>

              {/* Style */}
              <div className="mb-4">
                <h3 className="font-medium">Style</h3>
                {[
                  "Classical",
                  "Gothic",
                  "Renaissance",
                  "Baroque",
                  "Modernism",
                  "Bauhaus",
                  "Brutalism",
                  "Minimalism",
                  "Neo-Futurism",
                ].map((item) => (
                  <label key={item} className="block">
                    <input type="checkbox" /> {item}
                  </label>
                ))}
              </div>

              {/* Material Used */}
              <div className="mb-4">
                <h3 className="font-medium">Material Used</h3>
                {[
                  "Stone",
                  "Brick",
                  "Concrete",
                  "Steel",
                  "Glass",
                  "Wood",
                  "Bamboo",
                  "Aluminum",
                  "Copper",
                ].map((item) => (
                  <label key={item} className="block">
                    <input type="checkbox" /> {item}
                  </label>
                ))}
              </div>

              {/* Soil Type */}
              <div className="mb-4">
                <h3 className="font-medium">Soil Type</h3>
                {["Loose", "Soft", "Firm", "Stiff", "Dense", "Hard", "Sandy"].map(
                  (item) => (
                    <label key={item} className="block">
                      <input type="checkbox" /> {item}
                    </label>
                  )
                )}
              </div>

              {/* Terrain */}
              <div className="mb-4">
                <h3 className="font-medium">Terrain</h3>
                {["Flat", "Sloping", "Hilly", "Mountainous", "Coastal", "Waterfront"].map(
                  (item) => (
                    <label key={item} className="block">
                      <input type="checkbox" /> {item}
                    </label>
                  )
                )}
              </div>

              {/* Climate Adaptability */}
              <div className="mb-4">
                <h3 className="font-medium">Climate Adaptability</h3>
                {["Hot & Dry", "Hot & Humid", "Cold", "Temperate", "Tropical"].map(
                  (item) => (
                    <label key={item} className="block">
                      <input type="checkbox" /> {item}
                    </label>
                  )
                )}
              </div>

              {/* Roof Type */}
              <div className="mb-4">
                <h3 className="font-medium">Roof Type</h3>
                {[
                  "Flat",
                  "Gable",
                  "Hip",
                  "Shed",
                  "Mansard",
                  "Gambrel",
                  "Dome",
                  "Pyramid",
                  "Curved",
                ].map((item) => (
                  <label key={item} className="block">
                    <input type="checkbox" /> {item}
                  </label>
                ))}
              </div>

              {/* Interior Plan */}
              <div className="mb-4">
                <h3 className="font-medium">Interior Plan</h3>
                {["Open", "Closed", "Linear", "Centralized", "Radial", "Grid", "Cluster"].map(
                  (item) => (
                    <label key={item} className="block">
                      <input type="checkbox" /> {item}
                    </label>
                  )
                )}
              </div>

              {/* Sustainability */}
              <div className="mb-4">
                <h3 className="font-medium">Sustainability</h3>
                {[
                  "Passive Solar Design",
                  "Green Roofs",
                  "Rainwater Harvesting",
                  "Greywater Recycling",
                  "Natural Ventilation",
                  "Recycled Materials",
                  "Net-Zero Energy",
                  "Daylighting",
                  "Smart Glass",
                ].map((item) => (
                  <label key={item} className="block">
                    <input type="checkbox" /> {item}
                  </label>
                ))}
              </div>

              {/* Additional Features */}
              <div className="mb-4">
                <h3 className="font-medium">Additional Features</h3>
                {[
                  "Balconies",
                  "Verandas",
                  "Terraces",
                  "Patios",
                  "Pergolas",
                  "Courtyards",
                  "Skylights",
                  "Domes",
                ].map((item) => (
                  <label key={item} className="block">
                    <input type="checkbox" /> {item}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Rectangular Images */}
          <div className="w-full lg:w-3/4 xl:w-5/6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl h-48 relative shadow flex flex-col justify-between p-4"
              >
                <div className="mb-2 text-lg text-gray-900">{item.title}</div>
                {/* Optional item image */}
                {/* <img src={item.image} alt={item.title} className="w-full h-28 object-cover rounded-xl" /> */}
                {/* Buttons at bottom right */}
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <Link
                    to={`/Buy`}
                    state={{ item }}
                    className="px-3 py-1.5 bg-black/60 text-white rounded-2xl shadow hover:bg-gray-800 transition text-sm"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Buy
                  </Link>
                  <button
                    onClick={() => handleAddToWishlist(item)}
                    className="px-3 py-1.5 bg-pink-50 text-pink-700 rounded-2xl shadow hover:bg-pink-100 transition border border-pink-200 text-sm"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Wishlist
                  </button>
                  <button
                    onClick={() => handleAddToCart(item)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-900 rounded-2xl shadow hover:bg-gray-200 transition border border-gray-300 text-sm"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Amazon;