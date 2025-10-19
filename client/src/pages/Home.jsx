import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "../components/Footer";
import hero_img from "/src/assets/home/hero_img.jpg";
import banner1 from "/src/assets/home/banner1.jpg";
import banner2 from "/src/assets/home/banner2.jpg";
import banner3 from "/src/assets/home/banner3.png";
import banner4 from "/src/assets/home/banner4.png";
// import circle images
import RegistrStrip from "../components/registrstrip";
import ultratech_cement from "/src/assets/home/ultratech_cement.webp";
import redbricks from "/src/assets/home/redbricks.jpg";
import riversand from "/src/assets/home/riversand.jpeg";
import tmt_steelbar from "/src/assets/home/tmt_steelbar.jpeg";
import ceramic_floor_tile from "/src/assets/home/ceramic_floor_tile.jpeg";
import paints from "/src/assets/home/paints.webp";
import timber_plank from "/src/assets/home/timber_plank.jpeg";
import tempered_glass from "/src/assets/home/tempered_glass.jpeg";

const SEARCH_MAPPINGS = [
  {
    keywords: ["house", "home", "residential", "villa", "bungalow"],
    to: "/studio",
    state: { category: "Residential" },
  },
  {
    keywords: ["mall", "shop", "retail", "commercial", "office", "workspace"],
    to: "/studio",
    state: { category: "Commercial" },
  },
  {
    keywords: ["mixed-use", "mixed use", "urban mix", "hybrid"],
    to: "/studio",
    state: { category: "Mixed-Use" },
  },
  {
    keywords: ["institution", "institutional", "school", "college", "university"],
    to: "/studio",
    state: { category: "Institutional" },
  },
  {
    keywords: ["industrial", "factory", "plant", "manufacturing"],
    to: "/studio",
    state: { category: "Industrial" },
  },
  {
    keywords: ["agricultural", "farm", "barn", "agri"],
    to: "/studio",
    state: { category: "Agricultural" },
  },
  {
    keywords: ["recreational", "park", "play", "leisure", "stadium"],
    to: "/studio",
    state: { category: "Recreational" },
  },
  {
    keywords: ["infrastructure", "bridge", "transit", "transport"],
    to: "/studio",
    state: { category: "Infrastructure" },
  },
  {
    keywords: ["material", "cement", "steel", "sand", "warehouse"],
    to: "/warehouse",
  },
  {
    keywords: ["associate", "skill", "freelancer", "talent"],
    to: "/associates",
  },
  {
    keywords: ["firm", "vendor", "partner"],
    to: "/firms",
  },
  {
    keywords: ["order", "history", "ops"],
    to: "/matters",
  },
  {
    keywords: ["ai", "assistant", "vitruvi", "vitruviai"],
    to: "/ai",
  },
  {
    keywords: ["buy", "shop", "product", "catalog"],
    to: "/buy",
  },
];

const HomePage = () => {
  const scrollRef = useRef(null);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const scrollLeft = () => {
    scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
  };

  // Animation variants for reusability
  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.6 } },
  };

const circleMaterials = useMemo(
    () => [
      {
        name: "Cement",
        images: [
          ultratech_cement,
          "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=200&q=60",
          "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=200&q=60",
        ],
      },
      {
        name: "Bricks",
        images: [
          redbricks,
          "https://images.unsplash.com/photo-1600607687920-4e2a9c24c2e9?auto=format&fit=crop&w=200&q=60",
          "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=200&q=60",
        ],
      },
      {
        name: "Steel",
        images: [
          tmt_steelbar,
          "https://images.unsplash.com/photo-1582719478250-6c8f9b89e0ee?auto=format&fit=crop&w=200&q=60",
          "https://images.unsplash.com/photo-1503387762-a6f0b2f60772?auto=format&fit=crop&w=200&q=60",
        ],
      },
      {
        name: "Tiles",
        images: [
          ceramic_floor_tile,
          "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=200&q=60",
          "https://images.unsplash.com/photo-1523419409543-0c1df022bdd1?auto=format&fit=crop&w=200&q=60",
        ],
      },
      {
        name: "Wood",
        images: [
          timber_plank,
          "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=200&q=60",
          "https://images.unsplash.com/photo-1582719478250-53999edee20e?auto=format&fit=crop&w=200&q=60",
        ],
      },
      {
        name: "Paints",
        images: [
          paints,
          "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=200&q=60",
          "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=200&q=60",
        ],
      },
      {
        name: "Glass",
        images: [
          tempered_glass,
          "https://images.unsplash.com/photo-1503387762-a6f0b2f60772?auto=format&fit=crop&w=200&q=60",
          "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=200&q=60",
        ],
      },
      {
        name: "Sand",
        images: [
          riversand,
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=200&q=60",
          "https://images.unsplash.com/photo-1455218873509-8097305ee378?auto=format&fit=crop&w=200&q=60",
        ],
      },
    ],
    []
  );


  const resolveSearchDestination = useCallback(
    (rawValue) => {
      const trimmed = rawValue.trim();
      if (!trimmed) return null;
      const normalized = trimmed.toLowerCase();
      const match = SEARCH_MAPPINGS.find(({ keywords }) =>
        keywords.some((keyword) => normalized.includes(keyword)),
      );
      if (match) {
        return {
          to: match.to,
          state: match.state ? { ...match.state, search: trimmed } : { search: trimmed },
        };
      }
      return { to: "/studio", state: { search: trimmed } };
    },
    [],
  );

  const handleSearch = useCallback(
    (value) => {
      const destination = resolveSearchDestination(value ?? searchQuery);
      if (!destination) return;
      navigate(destination.to, { state: destination.state });
      setSearchQuery("");
    },
    [navigate, resolveSearchDestination, searchQuery],
  );

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      handleSearch();
    },
    [handleSearch],
  );

  return (
    <>
      <RegistrStrip />
      <div className="bg-white text-gray-900 overflow-x-hidden">
        {/* Hero Section with home image */}
        <motion.section
          initial="hidden"
          animate="show"
          variants={fadeUp}
          style={{
            position: "relative",
            width: "100%",
            paddingTop: "56.25%", // keeps aspect ratio like 16:9
          }}
        >
          {/* Image */}
          <motion.img
            src={hero_img}
            alt="Preview"
            variants={scaleIn}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              border: "none",
            }}
          />

          {/* Text Overlay */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-start text-center text-white pt-20 sm:pt-24 md:pt-28 lg:pt-32 gap-6"
          >
            <div className="px-4">
              <h1 className="text-3xl sm:text-4xl md:text-4xl font-extrabold tracking-tight">
                Journey Begins
              </h1>
              <p className="mt-4 text-base sm:text-lg md:text-xl font-semibold text-white/90">
                The journey starts this very minute.<br></br>Know what it is about.
              </p>
            </div>
            <button className="bg-white text-gray-800 px-6 sm:px-8 py-2 sm:py-3 rounded-full shadow-md font-bold transition-all duration-300">
              Watch the film
            </button>
          </motion.div>
        </motion.section>

        <div className="border-t-8 border-white"></div>

        {/* GIF + Search Section */}
        <div className="relative w-full h-screen flex items-center justify-center px-4 text-center">
          {/* GIF Background with reduced opacity */}
          <div
            className="absolute inset-0 bg-center bg-cover"
            style={{
              backgroundImage: `url('https://media.giphy.com/media/UzVAgtxx7DBra/giphy.gif')`,
            }}
          >
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/40"></div>
          </div>

          {/* Content */}
          <div className="relative bg-black/60 p-8 rounded-xl shadow-lg max-w-3xl w-full">
            {/* Heading */}
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-100 mb-4">
              What are you looking for?
            </h2>

            {/* Description */}
            <p className="text-gray-200 text-lg mb-6 max-w-md mx-auto">
              Discover everything you need from top-quality materials to
              trending products, all in one place.
            </p>

            {/* Search Bar */}
            <div className="flex justify-center mb-6 w-full max-w-md mx-auto">
              <form onSubmit={handleSubmit} className="relative w-full flex items-center">
                <label htmlFor="hero-search" className="sr-only">
                  Search for products or categories
                </label>
                <input
                  id="hero-search"
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search for products, categories..."
                  className="w-full border text-white border-gray-300 rounded-full px-5 py-3 pr-12 shadow-md bg-black/40 placeholder:text-gray-300 focus:bg-black/50 focus:ring-2 focus:ring-blue-400 outline-none"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  aria-label="Submit search"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z"
                    />
                  </svg>
                </button>
              </form>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-3 justify-center">
              {["House", "Mall", "Shop", "Office", "Park", "Institution"].map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleSearch(item)}
                    className="px-4 py-2 text-sm font-medium bg-white/90 border border-gray-200 rounded-full shadow transition"
                  >
                    {item}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>

        {/* Banner Section */}
        <section className="min-h-screen w-full flex flex-col gap-3 bg-white">
          {/* Top Row (2 banners) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Banner 1 */}
            <div className="relative h-[60vh] md:h-[70vh] overflow-hidden shadow-lg group">
              <img
                src={banner1}
                alt="Banner 1"
                className="w-full h-full object-cover transition duration-500"
              />
              <div className="absolute top-3 inset-x-0 flex flex-col items-center text-center p-6">
                <h3 className="text-white text-3xl font-bold">
                  Architecture Capital
                </h3>
                <p className="text-white text-lg mb-3">
                  Designs from Copenhagen
                </p>
                <div className="flex gap-3">
                  <button className="px-5 py-2 text-sm bg-white text-gray-900 rounded-full font-semibold">
                    Read more
                  </button>
                  <button className="px-5 py-2 text-sm border border-white text-white rounded-full font-semibold">
                    Buy
                  </button>
                </div>
              </div>
            </div>

            {/* Banner 2 */}
            <div className="relative h-[60vh] md:h-[70vh] overflow-hidden shadow-lg group">
              <img
                src={banner2}
                alt="Banner 2"
                className="w-full h-full object-cover transition duration-500"
              />
              <div className="absolute top-3 inset-x-0 flex flex-col items-center text-center p-6">
                <h3 className="text-white text-3xl font-bold">Sky High</h3>
                <p className="text-white text-lg mb-3">
                  Towering Heights and Cloudy Views
                </p>
                <div className="flex gap-3">
                  <button className="px-5 py-2 text-sm bg-white text-gray-900 rounded-full font-semibold">
                    Read more
                  </button>
                  <button className="px-5 py-2 text-sm border border-white text-white rounded-full font-semibold">
                    Buy
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row (2 banners) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Banner 3 */}
            <div className="relative h-[60vh] md:h-[70vh] overflow-hidden shadow-lg group">
              <img
                src={banner3}
                alt="Banner 3"
                className="w-full h-full object-cover transition duration-500"
              />
              <div className="absolute top-3 inset-x-0 flex flex-col items-center text-center p-6">
                <h4 className="text-white text-lg font-bold underline">
                  Firm of the Day
                </h4>
                <h3 className="text-white text-3xl font-bold">Studio Mosby</h3>
                <p className="text-white text-lg mb-3">
                  10% off on all designs
                </p>
                <div className="flex gap-3">
                  <button className="px-5 py-2 text-sm bg-white text-gray-900 rounded-full font-semibold">
                    Read more
                  </button>
                  <button className="px-5 py-2 text-sm border border-white text-white rounded-full font-semibold">
                    Buy
                  </button>
                </div>
              </div>
            </div>

            {/* Banner 4 */}
            <div className="relative h-[60vh] md:h-[70vh] overflow-hidden shadow-lg group">
              <img
                src={banner4}
                alt="Banner 4"
                className="w-full h-full object-cover transition duration-500"
              />
              <div className="absolute top-3 inset-x-0 flex flex-col items-center text-center p-6">
                <h4 className="text-white text-lg font-bold underline">
                  Firm of the Week
                </h4>
                <h3 className="text-white text-3xl font-bold">
                  Hammer & Nails
                </h3>
                <p className="text-white text-lg mb-3">New Fall Collection</p>
                <div className="flex gap-3">
                  <button className="px-5 py-2 text-sm bg-white text-gray-900 rounded-full font-semibold">
                    Read more
                  </button>
                  <button className="px-5 py-2 text-sm border border-white text-white rounded-full font-semibold">
                    Buy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="border-t-8 border-white"></div>

        {/* Browse Materials */}
        <section className="py-14 bg-black text-white">
          {/* Heading */}
          <div className="max-w-7xl mx-auto px-4 mb-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Browse Materials
            </h2>
            <p className="mt-2 text-white/70 text-sm">
              Popular categories to get you started
            </p>
          </div>

          {/* Grid */}
          <motion.div
            className="max-w-7xl mx-auto px-4"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.15 } } }}
          >
            <div className="flex flex-nowrap items-start justify-center gap-3 sm:gap-5 overflow-x-auto pb-2">
              {circleMaterials.slice(0, 6).map((item) => (
                <CircleItem key={item.name} item={item} />
              ))}
            </div>
          </motion.div>

        </section>

        {/* Footer with fade in */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <Footer />
        </motion.div>
      </div>
    </>
  );
};

export default HomePage;


const CircleItem = ({ item }) => {
  const { name, images } = item;
  const image = images?.[0];

  return (
    <motion.div className="flex flex-col items-center text-center gap-1">
      {/* Portrait rounded-rectangle instead of circle */}
      <div
        className="w-45 aspect-[3/4] rounded-2xl overflow-hidden shadow-md mb-2 bg-white flex items-center justify-center"
      >
        {image ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : null}
      </div>
      <span className="text-sm font-medium text-white">{name}</span>
    </motion.div>
  );
};
