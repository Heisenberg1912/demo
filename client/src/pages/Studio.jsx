import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { HiOutlineSearch, HiOutlineSparkles } from "react-icons/hi";
import {
  HiOutlineSquares2X2,
  HiOutlineHomeModern,
  HiOutlineBuildingOffice2,
  HiOutlineBuildingOffice,
  HiOutlineBuildingLibrary,
  HiOutlineCog6Tooth,
  HiOutlineSun,
  HiOutlineGlobeAlt,
  HiOutlineBuildingStorefront,
} from "react-icons/hi2";
import RegistrStrip from "../components/registrstrip";
import Footer from "../components/Footer";
import { marketplaceFeatures } from "../data/marketplace.js";
import { fetchStudios } from "../services/marketplace.js";
import { analyzeImage } from "../utils/imageSearch.js";
import {
  applyFallback,
  getStudioFallback,
  getStudioImageUrl,
} from "../utils/imageFallbacks.js";

const MotionLink = motion.create(Link);

const DEFAULT_CATEGORY_ICON = HiOutlineBuildingOffice2;
const CATEGORY_ICON_MAP = {
  All: HiOutlineSquares2X2,
  "All Categories": HiOutlineSquares2X2,
  Residential: HiOutlineHomeModern,
  Commercial: HiOutlineBuildingOffice2,
  "Mixed-Use": HiOutlineBuildingOffice,
  Mixed: HiOutlineBuildingOffice,
  Institutional: HiOutlineBuildingLibrary,
  Civic: HiOutlineBuildingLibrary,
  Industrial: HiOutlineCog6Tooth,
  Manufacturing: HiOutlineCog6Tooth,
  Agricultural: HiOutlineSun,
  "Agri-Tech": HiOutlineSun,
  Recreational: HiOutlineSparkles,
  Hospitality: HiOutlineBuildingStorefront,
  Retail: HiOutlineBuildingStorefront,
  Infrastructure: HiOutlineGlobeAlt,
  Urbanism: HiOutlineGlobeAlt,
};

const CATEGORY_DISPLAY_ORDER = [
  "All",
  "Residential",
  "Commercial",
  "Mixed-Use",
  "Institutional",
  "Industrial",
  "Agricultural",
  "Recreational",
  "Infrastructure",
];

const BASE_CATEGORIES = [
  "Residential",
  "Commercial",
  "Mixed-Use",
  "Institutional",
  "Industrial",
  "Agricultural",
  "Recreational",
  "Infrastructure",
];

const Studio = () => {
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState(() => location.state?.category || "All");
  const [selectedStyle, setSelectedStyle] = useState("All");
  const [query, setQuery] = useState(() => location.state?.search || "");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [studios, setStudios] = useState([]);
  const [meta, setMeta] = useState({
    facets: { categories: [], styles: [] },
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageKeywords, setImageKeywords] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageStatus, setImageStatus] = useState("");
  const [imageSearching, setImageSearching] = useState(false);
  const imageInputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const { category: incomingCategory, search: incomingSearch } = location.state || {};
    if (incomingCategory) {
      setSelectedCategory(incomingCategory);
    }
    if (incomingSearch) {
      setQuery(incomingSearch);
    }
  }, [location.state]);

  useEffect(() => {
    let cancelled = false;
    async function loadStudios() {
      setLoading(true);
      setError(null);
      try {
        const params = {};
        if (selectedCategory !== "All") params.category = selectedCategory;
        if (selectedStyle !== "All") params.style = selectedStyle;
        if (debouncedQuery) params.search = debouncedQuery;
        const { items, meta } = await fetchStudios(params);
        if (!cancelled) {
          setStudios(items);
          setMeta(meta);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Unable to load studios right now.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    loadStudios();
    return () => {
      cancelled = true;
    };
  }, [selectedCategory, selectedStyle, debouncedQuery]);

  const categories = useMemo(() => {
    const unique = new Set(BASE_CATEGORIES);
    (meta?.facets?.categories || []).forEach((facet) => unique.add(facet.name));
    studios.forEach((studio) => {
      (studio.categories || []).forEach((category) => unique.add(category));
    });
    return ["All", ...unique];
  }, [meta, studios]);

  const categoryOptions = useMemo(
    () =>
      categories.map((name) => {
        const label = name === "All" ? "All Categories" : name;
        const IconComponent =
          CATEGORY_ICON_MAP[name] ||
          CATEGORY_ICON_MAP[label] ||
          DEFAULT_CATEGORY_ICON;
        return {
          value: name,
          label,
          Icon: IconComponent,
        };
      }),
    [categories],
  );

  const orderedCategoryOptions = useMemo(() => {
    const priority = new Map(
      CATEGORY_DISPLAY_ORDER.map((name, index) => [name, index]),
    );
    const baseIndex = priority.size;
    return categoryOptions
      .map((option, index) => ({ option, index }))
      .sort((a, b) => {
        const aIndex = priority.has(a.option.value)
          ? priority.get(a.option.value)
          : baseIndex + a.index;
        const bIndex = priority.has(b.option.value)
          ? priority.get(b.option.value)
          : baseIndex + b.index;
        if (aIndex !== bIndex) return aIndex - bIndex;
        return a.option.label.localeCompare(b.option.label);
      })
      .map(({ option }) => option);
  }, [categoryOptions]);

  const styles = useMemo(() => {
    const unique = new Set(
      (meta?.facets?.styles || []).map((facet) => facet.name)
    );
    studios.forEach((studio) => {
      if (studio.style) unique.add(studio.style);
      studio.firm?.styles?.forEach((style) => unique.add(style));
    });
    return ["All", ...unique];
  }, [meta, studios]);

  const filteredByStyle = useMemo(() => {
    if (selectedStyle === "All") return studios;
    const target = selectedStyle.toLowerCase();
    return studios.filter((studio) => {
      const byProductStyle = studio.style?.toLowerCase() === target;
      const byFirmStyle = studio.firm?.styles?.some(
        (style) => style.toLowerCase() === target
      );
      return byProductStyle || byFirmStyle;
    });
  }, [studios, selectedStyle]);

  const displayStudios = useMemo(() => {
    if (!imageKeywords.length) return filteredByStyle;
    const needles = imageKeywords.map((kw) => kw.toLowerCase());
    return filteredByStyle.filter((studio) => {
      const haystackParts = [
        studio.title,
        studio.summary,
        studio.description,
        studio.style,
        ...(studio.categories || []),
        ...(studio.tags || []),
        studio.firm?.name,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());
      return needles.some((needle) =>
        haystackParts.some((part) => part.includes(needle))
      );
    });
  }, [filteredByStyle, imageKeywords]);

  const handleReverseSearchClick = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };

  const handleImageSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageSearching(true);
    setImageStatus("Analysing image...");
    try {
      const result = await analyzeImage(file);
      setImagePreview(result.dataUrl);
      setImageKeywords(result.keywords);
      setImageStatus(
        `Reverse search matched keywords: ${result.keywords.join(", ")}`
      );
    } catch (err) {
      console.error("Reverse image search failed", err);
      setImageStatus(err?.message || "Could not analyse the image.");
      setImageKeywords([]);
      setImagePreview(null);
    } finally {
      setImageSearching(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const clearImageSearch = () => {
    setImageKeywords([]);
    setImagePreview(null);
    setImageStatus("");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <RegistrStrip />

      <main className="flex-1 max-w-6xl mx-auto px-4 py-10 space-y-10 w-full">
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-stretch gap-6 overflow-x-auto px-4 py-5 sm:px-6">
            {orderedCategoryOptions.map(({ value, label, Icon }) => {
              const isActive = selectedCategory === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedCategory(value)}
                  aria-pressed={isActive}
                  className={`group flex min-w-[96px] flex-col items-center gap-2 px-2 py-1 text-sm font-medium transition ${
                    isActive
                      ? "text-slate-900"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Icon
                    className={`h-8 w-8 transition ${
                      isActive
                        ? "text-slate-900"
                        : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  <span className="whitespace-nowrap text-xs font-medium tracking-tight">
                    {label}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`block h-0.5 w-8 rounded-full transition ${
                      isActive ? "bg-slate-900" : "bg-transparent"
                    }`}
                  />
                </button>
              );
            })}
          </div>
          <div className="border-t border-slate-100">
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-center">
              <div className="w-full lg:w-56">
                <label htmlFor="studio-style-select" className="sr-only">
                  Filter by style
                </label>
                <select
                  id="studio-style-select"
                  value={selectedStyle}
                  onChange={(event) => setSelectedStyle(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  {styles.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <HiOutlineSearch className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search for studios, locations, or deliverables"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-700 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReverseSearchClick}
                    disabled={imageSearching}
                    className="whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {imageSearching ? "Scanning..." : "Reverse image"}
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelected}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {(imageStatus || imagePreview || imageKeywords.length > 0) && (
          <section className="bg-white border border-slate-200 rounded-xl px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm">
            <div className="space-y-1">
              <p className="font-semibold text-slate-700">
                Reverse image search
              </p>
              <p className="text-slate-500">
                {imageStatus ||
                  "Upload a reference to discover similar catalogue items."}
              </p>
              {imageKeywords.length > 0 && (
                <p className="text-slate-400 text-xs uppercase tracking-wide">
                  Matched keywords: {imageKeywords.join(", ")}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Reverse search preview"
                  className="w-16 h-16 rounded-lg border border-slate-200 object-cover"
                />
              )}
              {imageKeywords.length > 0 && (
                <button
                  type="button"
                  onClick={clearImageSearch}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:border-slate-300"
                >
                  Clear
                </button>
              )}
            </div>
          </section>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
            Loading studio catalog...
          </div>
        )}

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {!loading &&
            displayStudios.map((studio) => {
              const href = studio.slug
                ? `/studio/${studio.slug}`
                : `/studio/${encodeURIComponent(studio.id)}`;
              const priceLabel =
                studio.priceSqft ??
                studio.pricing?.basePrice ??
                studio.price ??
                null;
              const currency = studio.currency || studio.pricing?.currency || "USD";
              const summarySource =
                studio.summary ||
                studio.description ||
                "Explore the full catalogue to review deliverables, pricing, and project precedents.";
              const summaryPreview =
                summarySource.length > 180
                  ? `${summarySource.slice(0, 177)}...`
                  : summarySource;
              const locationLabel =
                [studio.location?.city, studio.location?.country]
                  .filter(Boolean)
                  .join(", ") ||
                [studio.firm?.location?.city, studio.firm?.location?.country]
                  .filter(Boolean)
                  .join(", ");
              const firmLogo = studio.logo || studio.firm?.logo;
              const stylesList = [
                studio.style,
                ...(studio.styles || []),
                ...(studio.firm?.styles || []),
              ]
                .flat()
                .filter(Boolean);
              const uniqueStyles = Array.from(new Set(stylesList.map(String)));
              const styleLabel = uniqueStyles.slice(0, 3).join(", ");
              const priceUnit =
                studio.pricing?.unit ||
                studio.pricing?.unitLabel ||
                studio.unit ||
                "sq. ft";
              const formattedPrice =
                priceLabel != null && Number.isFinite(Number(priceLabel))
                  ? Number(priceLabel).toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })
                  : priceLabel;
              const heroImage = getStudioImageUrl(studio);
              const heroFallback = getStudioFallback(studio);

              return (
                <MotionLink
                  key={studio._id || studio.slug}
                  to={href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-300"
                >
                  <div className="flex items-start justify-between gap-4 px-6 pt-6">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 transition group-hover:text-slate-700">
                        {studio.title}
                      </h2>
                      <p className="text-sm text-slate-500">
                        {locationLabel || "Verified studio"}
                      </p>
                    </div>
                    {firmLogo ? (
                      <img
                        src={firmLogo}
                        alt={`${studio.firm?.name || studio.title} logo`}
                        className="h-12 w-12 flex-shrink-0 object-contain"
                        loading="lazy"
                      />
                    ) : null}
                  </div>

                  <div className="m-6 mt-4 overflow-hidden rounded-xl border border-slate-100">
                    <img
                      src={heroImage}
                      alt={studio.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                      onError={(event) => applyFallback(event, heroFallback)}
                    />
                  </div>
                  <div className="flex flex-1 flex-col space-y-3 px-6 pb-6">
                    {priceLabel && (
                      <p className="text-sm font-semibold text-slate-900">
                        {currency} {formattedPrice} per {priceUnit}
                      </p>
                    )}

                    {styleLabel && (
                      <p className="text-sm text-slate-500">
                        {styleLabel}
                      </p>
                    )}

                    <p className="text-sm text-slate-600">{summaryPreview}</p>

                    <div className="pt-2 text-sm font-semibold text-slate-900 transition group-hover:text-slate-700">
                      View details <span aria-hidden="true">{"\u2192"}</span>
                    </div>
                  </div>
                </MotionLink>
              );
            })}
        </section>

        {!loading && displayStudios.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
            No studios match these filters. Try adjusting the typology, style, or
            search keywords.
          </div>
        )}

        <section className="bg-white border border-slate-200 rounded-2xl p-8">
          <div className="grid md:grid-cols-3 gap-8">
            {marketplaceFeatures.map((feature) => (
              <div key={feature.title}>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Studio;

