import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";

const WL_KEY = "wishlist";
const CART_KEY = "cart";
const safeParse = (s, fb) => { try { return JSON.parse(s); } catch { return fb; } };
const readWL = () => safeParse(localStorage.getItem(WL_KEY), []);
const writeWL = (items) => localStorage.setItem(WL_KEY, JSON.stringify(items || []));
const readCart = () => safeParse(localStorage.getItem(CART_KEY), []);
const writeCart = (items) => localStorage.setItem(CART_KEY, JSON.stringify(items || []));
const keyOf = (it) => it?.productId ?? it?.id ?? it?._id;
const normCart = (it) => ({
  id: keyOf(it),
  title: it?.title ?? it?.name ?? "Untitled",
  price: Number(it?.price ?? 0),
  image: it?.image ?? it?.img ?? "",
  quantity: Number(it?.quantity ?? 1),
});

const WishlistPage = () => {
  const navigate = useNavigate();

  // Contexts (optional)
  const wlCtx = (typeof useWishlist === "function" ? useWishlist() : null) || {};
  const cartCtx = (typeof useCart === "function" ? useCart() : null) || {};

  const hasWLCtx = Array.isArray(wlCtx.wishlistItems);
  const [items, setItems] = useState(() => {
    const initial = hasWLCtx ? wlCtx.wishlistItems : readWL();
    return Array.isArray(initial) ? initial : [];
  });

  useEffect(() => {
    // Keep items always as array
    const next = hasWLCtx ? wlCtx.wishlistItems : readWL();
    setItems(Array.isArray(next) ? next : []);
  }, [hasWLCtx, wlCtx.wishlistItems]);

  const removeItem = async (item) => {
    try {
      const payload = {
        productId: keyOf(item),
        source: item?.source || "Studio",
        name: item?.title ?? item?.name ?? "Untitled",
        image: item?.image ?? item?.img ?? "",
        price: Number(item?.price ?? 0),
      };
      if (typeof wlCtx.removeFromWishlist === "function") {
        await wlCtx.removeFromWishlist(payload);
      } else {
        const current = Array.isArray(items) ? items : [];
        const next = current.filter((it) => keyOf(it) !== payload.productId);
        writeWL(next);
        setItems(next);
      }
      toast.success("Removed from wishlist");
    } catch {
      toast.error("Failed to remove item");
    }
  };

  const addToCart = async (item) => {
    try {
      const payload = {
        productId: keyOf(item),
        source: item?.source || "Studio",
        name: item?.title ?? item?.name ?? "Untitled",
        title: item?.title ?? item?.name ?? "Untitled",
        image: item?.image ?? item?.img ?? "",
        price: Number(item?.price ?? 0),
        quantity: 1,
      };
      if (typeof cartCtx.addToCart === "function") {
        await cartCtx.addToCart(payload);
      } else {
        const next = readCart();
        const n = normCart(payload);
        const idx = next.findIndex((it) => keyOf(it) === n.id);
        if (idx >= 0) next[idx].quantity = Number(next[idx].quantity || 1) + 1;
        else next.push(n);
        writeCart(next);
      }
      toast.success("Added to cart");
    } catch {
      toast.error("Failed to add to cart");
    }
  };

  const openDetailWindow = (item) => {
    if (item.category === "Firm") {
      // Open firm detail page
      const params = new URLSearchParams({
        cover: item.image || item.gallery?.[0] || "",
        title: item.title || "",
        studio: item.studio || "",
        plotSize: item.area || "",
        style: item.style || "",
        rooms: item.bedrooms || "",
        floors: Math.ceil((item.bedrooms || 1) / 2),
        location: "Location Not Specified",
        price: String(item.price || "").replace(/[$,]/g, "") || "0",
        description: item.description || "",
        features: Array.isArray(item.features) ? item.features.join(", ") : item.features || "",
        amenities: "Standard Amenities",
      });
      window.open(`/firm-portfolio?${params.toString()}`, '_blank');
    } else if (item.category === "Studio" || !item.category || item.category === "Residential" || item.category === "Commercial" || item.category === "Mixed-Use") {
      // Open studio detail window with complete item data
      const w = window.open("", "_blank");
      if (!w) return;

      const galleryHtml = (item.gallery || [item.image]).map(src => 
        `<img src="${src}" style="width:100%;height:auto;border-radius:6px;margin-bottom:8px;object-fit:cover" />`
      ).join("");
      
      const featuresHtml = (Array.isArray(item.features) ? item.features : [item.features])
        .filter(Boolean)
        .map(f => `<li style="margin-bottom:6px;padding-left:6px">${f}</li>`)
        .join("");

      const specsHtml = `
        <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:12px">
          <div style="min-width:120px"><div style="font-size:12px;color:#6b7280">Bedrooms</div><div style="font-weight:600">${item.bedrooms ?? "-"}</div></div>
          <div style="min-width:120px"><div style="font-size:12px;color:#6b7280">Bathrooms</div><div style="font-weight:600">${item.bathrooms ?? "-"}</div></div>
          <div style="min-width:120px"><div style="font-size:12px;color:#6b7280">Area</div><div style="font-weight:600">${item.area ? item.area + " sq.ft" : "-"}</div></div>
          <div style="min-width:120px"><div style="font-size:12px;color:#6b7280">Material</div><div style="font-weight:600">${item.material || "-"}</div></div>
          <div style="min-width:120px"><div style="font-size:12px;color:#6b7280">Style</div><div style="font-weight:600">${item.style || "-"}</div></div>
        </div>`;

      const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${item.title} — Wishlist Details</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root{--accent:#4f46e5;--muted:#6b7280;--bg:#f8fafc}
    html,body{height:100%;margin:0;font-family:'Montserrat',sans-serif;color:#0f172a;background:var(--bg)}
    .wrap{max-width:1100px;margin:20px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 8px 30px rgba(2,6,23,0.06)}
    .hero{width:100%;height:44vh;background:#000;position:relative;display:block}
    .hero img{width:100%;height:100%;object-fit:cover;display:block}
    .logo{position:absolute;left:20px;top:20px;background:rgba(255,255,255,0.9);padding:8px;border-radius:8px}
    .meta{padding:20px}
    h1{margin:0;font-size:24px}
    .muted{color:var(--muted);margin-top:6px}
    .quick{display:flex;gap:12px;align-items:center;margin-top:12px;flex-wrap:wrap}
    .badge{background:#eef2ff;color:#3730a3;padding:6px 10px;border-radius:999px;font-size:13px}
    .content{display:grid;grid-template-columns:1fr 320px;gap:20px;padding:20px;border-top:1px solid #eef2f6}
    .left{}
    .right{border-left:1px solid #f1f5f9;padding-left:16px}
    .features{margin-top:12px}
    .specs{margin-top:12px}
    .actions{display:flex;gap:8px;margin-top:16px;flex-wrap:wrap}
    .btn{padding:10px 14px;border-radius:8px;text-decoration:none;font-size:14px;border:none;cursor:pointer}
    .btn-primary{background:var(--accent);color:#fff}
    .btn-muted{background:#fff;border:1px solid #e6edf3;color:#374151}
    .btn:hover{opacity:0.9}
    @media(max-width:900px){ .content{grid-template-columns:1fr} .right{border-left:none;padding-left:0} .logo{left:12px;top:12px} }
  </style>
</head>
<body>
  <div class="wrap" role="main">
    <div class="hero">
      <img src="${item.image || item.gallery?.[0] || ''}" alt="${item.title}" />
      <div class="logo"><img src="${item.logo || ''}" alt="logo" style="height:36px;width:36px;object-fit:contain" /></div>
    </div>

    <div class="meta">
      <h1>${item.title}</h1>
      <div class="muted">${item.studio || ""}</div>
      <div class="quick">
        <div class="badge">${item.price || ""}</div>
        <div class="badge">${item.category || ""}</div>
      </div>
      ${specsHtml}
    </div>

    <div class="content">
      <div class="left">
        <h3 style="margin:0 0 8px 0">Overview</h3>
        <p style="margin:0;color:#334155;line-height:1.5">${(item.description || "").replace(/\n/g, "<br/>")}</p>

        ${featuresHtml ? `<div class="features"><h4 style="margin-top:16px;margin-bottom:8px">Key Features</h4><ul style="padding-left:18px;margin:0;color:#334155">${featuresHtml}</ul></div>` : ''}

        ${galleryHtml ? `<div style="margin-top:18px"><h4 style="margin-bottom:8px">Gallery</h4>${galleryHtml}</div>` : ''}
      </div>

      <aside class="right" aria-label="Details">
        <div style="font-weight:600;margin-bottom:8px">Quick details</div>
        <div style="font-size:14px;color:#374151">
          <div style="margin-bottom:8px"><strong>Price:</strong> ${item.price || "-"}</div>
          <div style="margin-bottom:8px"><strong>Bedrooms:</strong> ${item.bedrooms ?? "-"}</div>
          <div style="margin-bottom:8px"><strong>Bathrooms:</strong> ${item.bathrooms ?? "-"}</div>
          <div style="margin-bottom:8px"><strong>Area:</strong> ${item.area ? item.area + " sq.ft" : "-"}</div>
          <div style="margin-bottom:8px"><strong>Material:</strong> ${item.material || "-"}</div>
          <div style="margin-bottom:8px"><strong>Style:</strong> ${item.style || "-"}</div>
        </div>

        <div class="actions">
          <button class="btn btn-primary" onclick="window.print();return false">Print</button>
          <button class="btn btn-muted" onclick="window.close()">Close</button>
        </div>
      </aside>
    </div>
  </div>
</body>
</html>`;

      w.document.open();
      w.document.write(html);
      w.document.close();
    } else {
      // Fallback for other item types
       const w = window.open("", "_blank");
       if (!w) return;

       const html = `<!doctype html>
<html>
<head>
   <meta charset="utf-8" />
   <meta name="viewport" content="width=device-width,initial-scale=1" />
   <title>${item.title} — Wishlist Details</title>
   <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
   <style>
     body{font-family:'Montserrat',sans-serif;margin:0;background:#f8fafc;color:#0f172a;padding:20px}
     .wrap{max-width:1000px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.1)}
     .hero{width:100%;height:40vh;background:#000;position:relative}
     .hero img{width:100%;height:100%;object-fit:cover}
     .content{padding:24px}
     h1{margin:0 0 8px 0;font-size:28px;font-weight:700}
     .muted{color:#6b7280;margin-bottom:16px}
     .badge{background:#eef2ff;color:#3730a3;padding:6px 12px;border-radius:20px;font-size:12px;display:inline-block;margin-right:8px}
     .specs{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:16px;margin:20px 0;padding:16px;background:#f8fafc;border-radius:8px}
     .spec{text-align:center}
     .spec-label{font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px}
     .spec-value{font-size:16px;font-weight:600;color:#111827;margin-top:4px}
     .description{margin:20px 0;line-height:1.6;color:#374151}
     .features{margin:20px 0}
     .features ul{padding-left:20px;margin:0}
     .gallery{margin:20px 0}
     .btn{padding:12px 24px;border-radius:8px;border:none;cursor:pointer;font-family:inherit;font-weight:500;transition:all 0.2s}
     .btn-primary{background:#4f46e5;color:white}
     .btn-secondary{background:#10b981;color:white}
     .btn:hover{opacity:0.9;transform:translateY(-1px)}
     @media(max-width:768px){.hero{height:30vh} .specs{grid-template-columns:repeat(2,1fr)}}
   </style>
</head>
<body>
   <div class="wrap">
     <div class="hero">
       <img src="${item.image || item.gallery?.[0] || ''}" alt="${item.title}" />
     </div>
     <div class="content">
       <h1>${item.title}</h1>
       <div class="muted">${item.studio || 'Studio Not Specified'}</div>
      
      <div>
        <span class="badge">${item.price || 'Price N/A'}</span>
        <span class="badge">${item.category || 'Category N/A'}</span>
      </div>

      <div class="specs">
        <div class="spec">
          <div class="spec-label">Bedrooms</div>
          <div class="spec-value">${item.bedrooms || '-'}</div>
        </div>
        <div class="spec">
          <div class="spec-label">Bathrooms</div>
          <div class="spec-value">${item.bathrooms || '-'}</div>
        </div>
        <div class="spec">
          <div class="spec-label">Area</div>
          <div class="spec-value">${item.area ? item.area + ' sq.ft' : '-'}</div>
        </div>
        <div class="spec">
          <div class="spec-label">Style</div>
          <div class="spec-value">${item.style || '-'}</div>
        </div>
      </div>

      ${item.description ? `<div class="description">${item.description}</div>` : ''}

      ${featuresHtml ? `<div class="features"><h3>Features</h3><ul>${featuresHtml}</ul></div>` : ''}

      ${galleryHtml ? `<div class="gallery"><h3>Gallery</h3>${galleryHtml}</div>` : ''}

      <div style="margin-top:24px;display:flex;gap:12px;flex-wrap:wrap">
        <button class="btn btn-secondary" onclick="window.print()">Print Details</button>
        <button class="btn btn-primary" onclick="window.close()">Close</button>
      </div>
     </div>
   </div>
 </body>
</html>`;

      w.document.open();
      w.document.write(html);
      w.document.close();
    }
  };

  // Safe list for rendering
  const list = Array.isArray(items) ? items : [];

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Wishlist</h1>

        {list.length > 0 ? (
          <>
            <div className="divide-y divide-gray-200">
              {list.map((item, idx) => (
                <div key={keyOf(item) ?? idx} className="flex justify-between items-center py-6">
                  <div className="flex items-center gap-6">
                    <img
                      src={item?.image || "https://placehold.co/120"}
                      alt={item?.title || item?.name || "Item"}
                      className="w-24 h-24 rounded-xl object-cover border border-gray-200"
                    />
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">
                        {item?.title || item?.name || "Item"}
                      </h2>
                      <p className="text-gray-600 text-sm">Price: ₹{Number(item?.price ?? 0)}</p>
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => addToCart(item)}
                          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition text-sm"
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={() => removeItem(item)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/cart")}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Go to Cart
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-lg text-center py-20">Your wishlist is empty 💖</p>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
