import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import { Toaster, toast } from "react-hot-toast";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProductList from "./pages/ProductList";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Studio from "./pages/Studio";
import Warehouse from "./pages/Warehouse";
import WarehouseDetail from "./pages/WarehouseDetail";
import Firms from "./pages/Firms";
import CartPage from "./pages/CartPage";
import Associates from "./pages/Associates";
import FirmPortfolio from "./pages/FirmPortfolio";
import Ai from "./pages/Ai";
import Matters from "./pages/Matters";
import CurrencyConverter from "./pages/CurrencyConverter";
import OrderHistory from "./pages/OrderHistory";
import SupportChatWidget from "./components/SupportChatWidget";

// Dashboard pages
import SuperAdminDashboard from "./pages/dashboard/SuperAdminDashboard";
import UserDashboard from "./pages/dashboard/UserDashboard";
import AssociateDashboard from "./pages/dashboard/AssociateDashboard";
import FirmDashboard from "./pages/dashboard/FirmDashboard";
import ClientDashboard from "./pages/dashboard/ClientDashboard";
import VendorDashboard from "./pages/dashboard/SaleDashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import StudioDetail from "./pages/StudioDetail";
import RegistrStrip from "./components/registrstrip";
import { roleDashboardPath } from "./constants/roles.js";
import { isValidSecretCode } from "./constants/secretCodes";

const LOI_ROLE_OPTIONS = [
  "Architect / Firm",
  "Architectural Student / Graduate",
  "Land Owner / Consumer",
  "Vendor",
  "Builder / Real Estate Agency",
];


const App = () => {
  const [hasAccess, setHasAccess] = useState(false);
  const [codeAccepted, setCodeAccepted] = useState(false);
  const [acceptedCode, setAcceptedCode] = useState('');
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");

  const createEmptyProfile = () => ({
    name: "",
    email: "",
    phone: "",
    city: "",
    country: "",
    role: LOI_ROLE_OPTIONS[0],
    isContributor: true,
  });
  const [profileForm, setProfileForm] = useState(() => createEmptyProfile());
  const [profileError, setProfileError] = useState("");
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

  const handleSecretSubmit = (event) => {
    event.preventDefault();
    const candidate = codeInput.trim();
    if (isValidSecretCode(candidate)) {
      setAcceptedCode(candidate);
      setCodeAccepted(true);
      setCodeInput("");
      setCodeError("");
      setProfileError("");
      setProfileForm(createEmptyProfile());
    } else {
      setCodeError("Invalid code. Please try again.");
    }
  };

  const handleProfileChange = (field) => (event) => {
    const value = event.target.value;
    setProfileForm((prev) => ({ ...prev, [field]: value }));
    if (profileError) setProfileError("");
  };

  const handleProfileCheckbox = (field) => (event) => {
    const checked = event.target.checked;
    setProfileForm((prev) => ({ ...prev, [field]: checked }));
    if (profileError) setProfileError("");
  };

  const handleResetSecret = () => {
    setCodeAccepted(false);
    setAcceptedCode("");
    setProfileForm(createEmptyProfile());
    setProfileError("");
    setCodeInput("");
    setCodeError("");
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileError("");

    if (!codeAccepted || !isValidSecretCode(acceptedCode)) {
      setProfileError("Please enter a valid invitation code first.");
      setCodeAccepted(false);
      return;
    }

    const trimmed = {
      name: profileForm.name.trim(),
      email: profileForm.email.trim(),
      phone: profileForm.phone.trim(),
      city: profileForm.city.trim(),
      country: profileForm.country.trim(),
      role: profileForm.role,
      isContributor: Boolean(profileForm.isContributor),
    };

    const missing = [];
    if (!trimmed.name) missing.push('name');
    if (!trimmed.email) missing.push('email');
    if (!trimmed.phone) missing.push('phone number');
    if (!trimmed.city) missing.push('city');
    if (!trimmed.country) missing.push('country');
    if (!trimmed.role) missing.push('role');
    if (missing.length) {
      setProfileError(`Please complete your ${missing.join(', ')}.`);
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmed.email)) {
      setProfileError('Please enter a valid email address.');
      return;
    }

    const phoneDigits = trimmed.phone.replace(/[^0-9]/g, '');
    if (phoneDigits.length < 6) {
      setProfileError('Please enter a valid phone number with country code.');
      return;
    }

    if (!LOI_ROLE_OPTIONS.includes(trimmed.role)) {
      setProfileError('Please select a valid role.');
      return;
    }

    const submission = {
      ...trimmed,
      secretCode: acceptedCode.trim(),
    };

    setIsSubmittingProfile(true);
    try {
      const response = await fetch('/api/access-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });

      if (!response.ok) {
        let message = 'Unable to save your details. Please try again.';
        try {
          const details = await response.json();
          if (details?.message) message = details.message;
        } catch {}
        throw new Error(message);
      }

      setHasAccess(true);
      setProfileForm(createEmptyProfile());
      setProfileError("");
      setTimeout(() => {
        try { toast.success('Access granted. Welcome!'); } catch {}
      }, 120);
    } catch (error) {
      setProfileError(error?.message || 'Unable to save your details. Please try again.');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  // Single source of auth truth (kept if used by other parts of the app)
  const [auth, setAuth] = useState({ token: null, role: null, loaded: false });

  const getDashboardPath = (role) => roleDashboardPath[role] || "/login";

  // Called by Login component after successful authentication
  const handleLoginSuccess = ({ token, role }) => {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("role", role);
    setAuth({ token, role, loaded: true });
    toast.success("Login successful");
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("role");
    setAuth({ token: null, role: null, loaded: true });
    toast.success("Logged out");
  };

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const role = localStorage.getItem("role");
    setAuth({ token, role, loaded: true });
  }, []);

  // ---- Global currency store (selection + rates) ----
  const [currencyCode, setCurrencyCode] = useState(() => {
    try { return localStorage.getItem("fx_to") || "INR"; } catch { return "INR"; }
  });
  const [fxBase, setFxBase] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fx_rates_cache") || "null")?.base || "USD"; } catch { return "USD"; }
  });
  const [fxRates, setFxRates] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fx_rates_cache") || "null")?.rates || {}; } catch { return {}; }
  });

  // Convert using USD-based rates (open.er-api.com)
  const getRate = (code) => {
    if (!code) return 1;
    if (code === fxBase) return 1;
    const r = fxRates?.[code];
    return typeof r === "number" && isFinite(r) ? r : 1;
  };
  // Convert amt from 'fromCode' to 'toCode'
  const convert = (amt, fromCode = fxBase, toCode = currencyCode) => {
    const a = Number(amt);
    if (!isFinite(a)) return 0;
    if (fromCode === toCode) return a;
    // all stored rates are relative to fxBase (usually USD)
    const rFrom = fromCode === fxBase ? 1 : getRate(fromCode);
    const rTo = toCode === fxBase ? 1 : getRate(toCode);
    if (!rFrom || !rTo) return 0;
    // base -> from -> to: amount in base = a / rFrom; then * rTo
    return (a / rFrom) * rTo;
  };
  // Format helper
  const format = (amt, fromCode = fxBase, toCode = currencyCode) => {
    const v = convert(amt, fromCode, toCode);
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: toCode, maximumFractionDigits: 2 }).format(v);
    } catch {
      return `${v.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${toCode}`;
    }
  };

  // Keep a global API on window for any component to use without extra imports
  useEffect(() => {
    try {
      window.currency = {
        get code() { return currencyCode; },
        setCode: (code) => setCurrencyCode(code),
        base: fxBase,
        rates: fxRates,
        convert,
        format,
        // notify listeners manually if needed
        emit: (detail = {}) => window.dispatchEvent(new CustomEvent("currency:change", { detail: { code: currencyCode, base: fxBase, rates: fxRates, ...detail } })),
      };
    } catch {}
  }, [currencyCode, fxBase, fxRates]);

  // Listen for Navbar updates and update state
  useEffect(() => {
    const onChange = (e) => {
      const { code, base, rates } = e?.detail || {};
      if (code) setCurrencyCode(code);
      if (base) setFxBase(base);
      if (rates) setFxRates(rates);
    };
    window.addEventListener("currency:change", onChange);
    // announce ready with current values
    window.dispatchEvent(new CustomEvent("currency:ready", { detail: { code: currencyCode, base: fxBase, rates: fxRates } }));
    return () => window.removeEventListener("currency:change", onChange);
  }, []); // run once

  if (!hasAccess) {
    const showProfileForm = codeAccepted;

    return (
      <div className="secret-gate">
        <div className="secret-gate__panel">
          <h1>Invite-Only Access</h1>
          <p className="secret-gate__subtitle">
            {showProfileForm
              ? "Almost there. We just need a few details from you."
              : "Enter your invitation code to continue."}
          </p>

          {!showProfileForm ? (
            <form onSubmit={handleSecretSubmit} className="secret-gate__form">
              <input
                type="text"
                value={codeInput}
                onChange={(event) => {
                  setCodeInput(event.target.value);
                  if (codeError) setCodeError("");
                }}
                placeholder="Enter invitation code"
                className="secret-gate__input secret-gate__input--code"
                autoFocus
              />
              {codeError && <p className="secret-gate__error">{codeError}</p>}
              <button type="submit" className="secret-gate__button">
                Continue
              </button>
            </form>
          ) : (
            <>
              <div className="secret-gate__chip">
                Invitation Code <span>{acceptedCode}</span>
              </div>
              <form onSubmit={handleProfileSubmit} className="secret-gate__form secret-gate__form--details">
                <div className="secret-gate__grid">
                  <label className="secret-gate__field secret-gate__field--full">
                    <span>Name</span>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={handleProfileChange('name')}
                      className="secret-gate__input"
                      placeholder="Your full name"
                      autoComplete="name"
                    />
                  </label>
                  <label className="secret-gate__field">
                    <span>Email</span>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={handleProfileChange('email')}
                      className="secret-gate__input"
                      placeholder="name@example.com"
                      autoComplete="email"
                    />
                  </label>
                  <label className="secret-gate__field">
                    <span>Phone Number</span>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={handleProfileChange('phone')}
                      className="secret-gate__input"
                      placeholder="+1 555 123 4567"
                      autoComplete="tel"
                    />
                  </label>
                  <label className="secret-gate__field">
                    <span>City</span>
                    <input
                      type="text"
                      value={profileForm.city}
                      onChange={handleProfileChange('city')}
                      className="secret-gate__input"
                      placeholder="City"
                      autoComplete="address-level2"
                    />
                  </label>
                  <label className="secret-gate__field">
                    <span>Country</span>
                    <input
                      type="text"
                      value={profileForm.country}
                      onChange={handleProfileChange('country')}
                      className="secret-gate__input"
                      placeholder="Country"
                      autoComplete="country-name"
                    />
                  </label>
                  <label className="secret-gate__field secret-gate__field--full">
                    <span>Role</span>
                    <select
                      value={profileForm.role}
                      onChange={handleProfileChange('role')}
                      className="secret-gate__input secret-gate__select"
                    >
                      {LOI_ROLE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="secret-gate__document secret-gate__field--full">
                    <span className="secret-gate__section-title">Letter of Intent</span>
                    <p className="secret-gate__document-text">Please review the Builtattic Demo Agreement before proceeding.</p>
                    <a
                      className="secret-gate__document-link"
                      href="/api/documents/builtattic-demo-agreement"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open Agreement
                    </a>
                  </div>

                  <label className="secret-gate__checkbox secret-gate__field--full">
                    <input
                      type="checkbox"
                      checked={profileForm.isContributor}
                      onChange={handleProfileCheckbox('isContributor')}
                    />
                    <span>I would like to be an LOI contributor</span>
                  </label>
                </div>

                {profileError && <p className="secret-gate__error">{profileError}</p>}
                <button type="submit" className="secret-gate__button" disabled={isSubmittingProfile}>
                  {isSubmittingProfile ? 'Submitting...' : 'Enter'}
                </button>
                <button type="button" className="secret-gate__link-button" onClick={handleResetSecret}>
                  Use a different code
                </button>
              </form>
            </>
          )}

          <p className="secret-gate__hint">
            {showProfileForm
              ? "Your details stay private and help us tailor the experience."
              : "Only invited guests can access this experience."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <CartProvider>
      <WishlistProvider>
        <>
          <Navbar />
          <Toaster position="top-right" gutter={8} toastOptions={{ duration: 3000 }} />
          
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login onLogin={handleLoginSuccess} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/cartpage" element={<CartPage />} />
            {/* AI routes */}
            <Route path="/ai" element={<Ai />} />
            <Route path="/aisetting" element={<Ai />} />
            <Route path="/matters" element={<Matters />} />
            {/* Studio (formerly Amazon) */}
            <Route path="/studio" element={<Studio />} />
            {/* Warehouse (formerly Blinkit) */}
            <Route path="/warehouse" element={<Warehouse />} />
            <Route path="/warehouse/:id" element={<WarehouseDetail />} />
            {/* Firms (formerly Urban) */}
            <Route path="/firms" element={<Firms />} />
            {/* NEW: Associates and portfolio routes */}
            <Route path="/associates" element={<Associates />} />
            <Route path="/firmportfolio" element={<FirmPortfolio />} />
            <Route path="/associateportfolio" element={<FirmPortfolio />} />
            {/* Currency converter page route */}
            <Route path="/currencyconver" element={<CurrencyConverter />} />
            {/* Backward-compatible redirects */}
            <Route path="/amazon" element={<Navigate to="/studio" replace />} />
            <Route path="/blinkit" element={<Navigate to="/warehouse" replace />} />
            <Route path="/urban" element={<Navigate to="/firms" replace />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/orders" element={<OrderHistory />} />
            {/* Dashboard routes */}
            <Route path="/dashboard/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/dashboard/user" element={<UserDashboard />} />
            <Route path="/dashboard/associate" element={<AssociateDashboard />} />
            <Route path="/dashboard/firm" element={<FirmDashboard />} />
            <Route path="/dashboard/client" element={<ClientDashboard />} />
            <Route path="/dashboard/vendor" element={<VendorDashboard />} />
            {/*  */}
            <Route path="/studioDetail" element={<StudioDetail />} />
            <Route path="/studio/:id" element={<StudioDetail />} />

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />


            {/*  */}
            <Route path="/registrstrip" element={<RegistrStrip />} />
          </Routes>
          <SupportChatWidget />
        </>
      </WishlistProvider>
    </CartProvider>
  );
};

export default App;


