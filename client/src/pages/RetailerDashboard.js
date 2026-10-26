import React, { useState, useEffect, useCallback, useMemo } from "react";
import api, { mediaUrl } from "../utils/api";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import LiveMapPanel from "../components/LiveMapPanel";
import { getSocket, disconnectSocket } from "../utils/socket";
import TrackingLine from "../components/TrackingLine";
import MedicineImage from "../components/MedicineImage";

const CART_KEY = "medifield_retailer_cart";
const FREE_CANCEL = ["PLACED", "WAITING_WHOLESALER"];
const REQUEST_CANCEL = ["ACCEPTED", "PACKED"];

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function QtyControl({ quantity, onDec, onInc, onRemove }) {
  return (
    <div className="inline-flex items-center rounded-lg border border-emerald-400/40 bg-emerald-950/40 overflow-hidden">
      <button
        type="button"
        onClick={quantity <= 1 ? onRemove : onDec}
        className="w-8 h-8 text-emerald-200 font-bold hover:bg-emerald-800/50"
        aria-label={quantity <= 1 ? "Remove" : "Decrease"}
      >
        −
      </button>
      <span className="w-8 text-center text-sm font-semibold text-white">{quantity}</span>
      <button
        type="button"
        onClick={onInc}
        className="w-8 h-8 text-emerald-200 font-bold hover:bg-emerald-800/50"
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}

export default function RetailerDashboard({ setUser, user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("shop");
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [cart, setCart] = useState(loadCart);
  const [medicines, setMedicines] = useState([]);
  const [orders, setOrders] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [deliverySlot, setDeliverySlot] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderPlacedFlash, setOrderPlacedFlash] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    shopAddress: "",
    city: "",
    pinCode: "",
    lat: "",
    lng: "",
    gstNumber: "",
    profileImageUrl: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const fetchSlot = useCallback(async () => {
    try {
      const res = await api.get("/orders/delivery-slot");
      setDeliverySlot(res.data.deliverySlot || null);
    } catch {
      setDeliverySlot(null);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get("/orders");
      const active = (res.data.orders || []).filter(
        (o) => !["DELIVERED", "CANCELLED", "FAILED", "REJECTED"].includes(o.status)
      );
      setOrders(active);
    } catch {
      setOrders([]);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.get("/retailers/orders/history?status=ALL&limit=30");
      setHistory(res.data.history || []);
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchSlot();
    const socket = getSocket();
    const onOrderEvent = () => {
      fetchOrders();
      if (activeTab === "history") fetchHistory();
    };
    socket?.on("order:created", onOrderEvent);
    socket?.on("order:updated", onOrderEvent);
    return () => {
      socket?.off("order:created", onOrderEvent);
      socket?.off("order:updated", onOrderEvent);
    };
  }, [activeTab, fetchOrders, fetchHistory, fetchSlot]);

  useEffect(() => {
    if (activeTab === "profile") fetchProfile();
    if (activeTab === "history") fetchHistory();
    if (activeTab === "shop") {
      fetchSlot();
      (async () => {
        setFeaturedLoading(true);
        try {
          const res = await api.get("/medicines/suggest?limit=8");
          setFeatured(res.data.medicines || []);
          setCatalogError("");
        } catch (err) {
          setFeatured([]);
          setCatalogError(
            err.response?.data?.message ||
              "Could not load medicines. Check that you are signed in and the server is running."
          );
        } finally {
          setFeaturedLoading(false);
        }
      })();
    }
  }, [activeTab, fetchHistory, fetchSlot]);

  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) {
      setSuggestions([]);
      return undefined;
    }
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/medicines/search?q=${encodeURIComponent(searchTerm.trim())}`);
        setSuggestions((res.data.medicines || []).slice(0, 6));
        setCatalogError("");
      } catch (err) {
        setSuggestions([]);
        setCatalogError(err.response?.data?.message || "Search failed. Try again.");
      }
    }, 250);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/retailers/profile");
      const u = res.data.user;
      setProfileForm({
        name: u.name || "",
        phone: u.phone || "",
        shopAddress: u.profile?.shopAddress || "",
        city: u.profile?.city || "",
        pinCode: u.profile?.pinCode || "",
        lat: u.profile?.lat ?? "",
        lng: u.profile?.lng ?? "",
        gstNumber: u.profile?.gstNumber || "",
        profileImageUrl: u.profile?.profileImageUrl || "",
      });
    } catch {
      /* keep form */
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await api.put("/retailers/profile", {
        name: profileForm.name,
        phone: profileForm.phone,
        profile: {
          shopAddress: profileForm.shopAddress,
          city: profileForm.city,
          pinCode: profileForm.pinCode,
          lat: Number(profileForm.lat),
          lng: Number(profileForm.lng),
          gstNumber: profileForm.gstNumber,
          profileImageUrl: profileForm.profileImageUrl || undefined,
        },
      });
      const updated = res.data.user;
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      alert("Profile updated successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Profile update failed");
    } finally {
      setProfileSaving(false);
    }
  };

  const openBill = async (orderId) => {
    try {
      const res = await api.get(`/retailers/orders/history/${orderId}`);
      setSelectedBill(res.data.bill);
    } catch (err) {
      alert(err.response?.data?.message || "Could not load bill");
    }
  };

  const handleSearch = async (term = searchTerm) => {
    const q = String(term || "").trim();
    if (!q) return;
    setSearching(true);
    setSuggestions([]);
    try {
      const res = await api.get(`/medicines/search?q=${encodeURIComponent(q)}`);
      const list = res.data.medicines || [];
      setMedicines(list);
      setSearchTerm(q);
      setCatalogError(list.length === 0 ? `No medicines found for "${q}".` : "");
    } catch (err) {
      setMedicines([]);
      setCatalogError(err.response?.data?.message || "Search failed. Try again.");
    } finally {
      setSearching(false);
    }
  };

  const cartQty = useCallback(
    (id) => cart.find((c) => c.id === id)?.quantity || 0,
    [cart]
  );

  const setItemQty = (medicine, quantity) => {
    if (!medicine?.id) return;
    setCart((prev) => {
      const rest = prev.filter((i) => i.id !== medicine.id);
      if (quantity <= 0) return rest;
      return [...rest, { ...medicine, quantity }];
    });
  };

  const addToCart = (medicine) => {
    if (!medicine.available) return;
    setItemQty(medicine, cartQty(medicine.id) + 1);
  };

  const placeOrder = async () => {
    if (cart.length === 0 || placing || orderPlacedFlash) return;
    setPlacing(true);
    try {
      const res = await api.post("/orders/create", {
        items: cart.map((i) => ({ medicineId: i.id, quantity: i.quantity })),
      });
      // Clear cart immediately so ADD buttons reset and navbar count drops
      setCart([]);
      localStorage.removeItem(CART_KEY);
      setOrderPlacedFlash(true);
      setCartOpen(true);
      fetchOrders();
      fetchSlot();

      const slotInfo = res.data.deliverySlot;
      const slotMsg = slotInfo
        ? `${slotInfo.deliveryDateLabel} · ${slotInfo.windowLabel}`
        : "";

      // Keep "Order placed" dim button visible briefly, then go to Orders
      setTimeout(() => {
        setOrderPlacedFlash(false);
        setCartOpen(false);
        setActiveTab("tracking");
        if (slotMsg) {
          // soft status only — no blocking alert
        }
      }, 1600);
    } catch (err) {
      alert("Order failed: " + (err.response?.data?.message || err.message));
    } finally {
      setPlacing(false);
    }
  };

  const cancelOrder = async (order) => {
    const isFree = FREE_CANCEL.includes(order.status);
    const msg = isFree
      ? "Cancel this order? It has not been accepted yet."
      : "Wholesaler already accepted. Send a cancel request? They must approve it.";
    if (!window.confirm(msg)) return;
    try {
      const res = await api.post("/orders/cancel", { orderId: order._id });
      alert(res.data.message || "Updated");
      fetchOrders();
      if (res.data.mode === "cancelled") fetchHistory();
    } catch (err) {
      alert(err.response?.data?.message || "Cancellation failed");
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    disconnectSocket();
    setUser(null);
    navigate("/signin?portal=RETAILER", { replace: true });
  };

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );
  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );
  const canPlaceOrders = !user?.verificationStatus || user.verificationStatus === "APPROVED";

  const tabs = [
    { id: "shop", label: "Shop" },
    { id: "tracking", label: "Orders" },
    { id: "history", label: "Past orders" },
    { id: "profile", label: "Profile" },
  ];

  return (
    <DashboardLayout
      user={user}
      setUser={setUser}
      pageTitle="Retailer"
      pageSubtitle=""
      onSignOut={handleSignOut}
      cartCount={cartCount}
      onCartClick={() => {
        setActiveTab("shop");
        setCartOpen(true);
      }}
      navItems={[
        { id: "shop", label: "Home" },
        { id: "tracking", label: "Orders" },
        { id: "history", label: "Past orders" },
        { id: "profile", label: "Profile" },
      ]}
      activeNavId={activeTab}
      onNavSelect={setActiveTab}
    >
      {/* mobile tabs removed — use navbar */}
      <div className="hidden">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "shop" && (
        <div className="space-y-4 pb-28">
          {user?.verificationStatus && user.verificationStatus !== "APPROVED" && (
            <div className="rounded-xl border border-amber-400/30 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
              <p className="font-semibold">Account pending admin approval</p>
              <p className="text-amber-200/90 mt-1">
                You can browse and search medicines. Placing orders unlocks after an admin approves your shop.
              </p>
            </div>
          )}

          {catalogError && (
            <div className="rounded-xl border border-rose-400/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">
              {catalogError}
            </div>
          )}

          {deliverySlot && (
            <div className="rounded-xl border border-amber-400/30 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
              <p className="font-semibold">
                Delivery slot · {deliverySlot.deliveryDateLabel} · {deliverySlot.windowLabel}
              </p>
              <p className="text-amber-200/90 mt-1">{deliverySlot.notice}</p>
            </div>
          )}

          <div className="bg-slate-900/60 rounded-xl border border-cyan-400/20 p-4 relative">
            <div className="flex gap-2">
              <input
                className="flex-1 border border-cyan-300/20 bg-slate-950/80 text-white rounded-lg px-3 py-2 text-sm"
                placeholder="Search medicines (e.g. Paracetamol)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
              />
              <button
                type="button"
                onClick={() => handleSearch()}
                className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold"
              >
                {searching ? "…" : "Search"}
              </button>
            </div>

            {suggestions.length > 0 && (
              <div className="absolute left-4 right-4 z-10 mt-1 rounded-lg border border-slate-700 bg-slate-950 shadow-xl overflow-hidden">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2.5"
                    onClick={() => handleSearch(s.name)}
                  >
                    <MedicineImage
                      src={mediaUrl(s.imageUrl)}
                      alt={s.name}
                      className="w-9 h-9 rounded-md object-cover shrink-0 border border-slate-700"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block truncate font-medium text-slate-100">{s.name}</span>
                      <span className="block truncate text-slate-500">{s.company}</span>
                    </span>
                    <span className="text-emerald-400 font-semibold shrink-0">₹{s.price}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                Suggested for you
              </h3>
              {featuredLoading && (
                <div className="flex items-center gap-2 text-slate-400 text-xs py-4">
                  <span className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  Loading suggestions…
                </div>
              )}
              {!featuredLoading && featured.length === 0 && !catalogError && (
                <p className="text-slate-500 text-xs py-2">No suggestions yet. Try searching above.</p>
              )}
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {featured.map((med) => {
                  const qty = cartQty(med.id);
                  return (
                    <div
                      key={`feat-${med.id}`}
                      className="shrink-0 w-36 border border-cyan-300/15 rounded-lg p-2 bg-slate-950/50"
                    >
                      <MedicineImage
                        src={mediaUrl(med.imageUrl)}
                        alt={med.name}
                        className="w-full h-20 rounded-md object-cover mb-1.5"
                      />
                      <p className="text-xs font-semibold text-white truncate">{med.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{med.company}</p>
                      <p className="text-xs font-bold text-emerald-400 mt-1">₹{med.price}</p>
                      <div className="mt-1.5">
                        {qty > 0 ? (
                          <QtyControl
                            quantity={qty}
                            onInc={() => setItemQty(med, qty + 1)}
                            onDec={() => setItemQty(med, qty - 1)}
                            onRemove={() => setItemQty(med, 0)}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => addToCart(med)}
                            disabled={!med.available}
                            className="w-full py-1 rounded-md bg-emerald-600 text-white text-[10px] font-semibold disabled:opacity-40"
                          >
                            ADD
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">
              {medicines.length > 0 && (
                <p className="col-span-full text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Search results
                </p>
              )}
              {medicines.length === 0 && !searching && (
                <p className="col-span-full text-slate-500 text-xs">
                  Type a medicine name and press Enter for full results.
                </p>
              )}
              {searching && (
                <div className="col-span-full flex items-center gap-3 text-slate-300 text-sm py-6 justify-center">
                  <span className="inline-block w-7 h-7 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  Searching…
                </div>
              )}
              {medicines.map((med) => {
                const qty = cartQty(med.id);
                return (
                  <div key={med.id} className="border border-cyan-300/20 rounded-lg p-2.5 bg-slate-950/60 flex gap-2.5">
                    <MedicineImage
                      src={mediaUrl(med.imageUrl)}
                      alt={med.name}
                      className="w-16 h-16 rounded-md object-cover border border-cyan-300/10 shrink-0"
                    />
                    <div className="min-w-0 flex-1 flex flex-col">
                      <h3 className="font-semibold text-slate-100 text-xs truncate">{med.name}</h3>
                      <p className="text-[10px] text-slate-400 truncate">{med.company}</p>
                      <p className="text-sm font-bold text-emerald-400 mt-auto">₹{med.price}</p>
                      <div className="mt-1.5">
                        {qty > 0 ? (
                          <QtyControl
                            quantity={qty}
                            onInc={() => setItemQty(med, qty + 1)}
                            onDec={() => setItemQty(med, qty - 1)}
                            onRemove={() => setItemQty(med, 0)}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => addToCart(med)}
                            disabled={!med.available}
                            className="px-2.5 py-1 rounded-md bg-emerald-600 text-white text-[10px] font-semibold disabled:opacity-40"
                          >
                            {med.available ? "ADD" : "Out of stock"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {cartCount > 0 && (
            <div className="fixed bottom-4 left-4 right-4 z-30 max-w-7xl mx-auto pointer-events-none">
              <div className="pointer-events-auto ml-auto max-w-md rounded-2xl bg-emerald-600 text-white shadow-2xl shadow-emerald-950/50 flex overflow-hidden">
                <button
                  type="button"
                  className="flex-1 text-left px-4 py-3"
                  onClick={() => setCartOpen(true)}
                >
                  <p className="text-sm font-bold">
                    {cartCount} item{cartCount > 1 ? "s" : ""} · ₹{cartTotal}
                  </p>
                  <p className="text-xs text-emerald-100">
                    {deliverySlot
                      ? `${deliverySlot.windowLabel} · ${deliverySlot.deliveryDateLabel}`
                      : "View cart"}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setCartOpen(true)}
                  className="px-4 py-3 bg-emerald-700 font-semibold text-sm"
                >
                  View cart
                </button>
              </div>
            </div>
          )}

          {cartOpen && (
            <div className="fixed inset-0 z-40 flex justify-end bg-black/50" onClick={() => setCartOpen(false)}>
              <div
                className="w-full max-w-md bg-slate-950 h-full border-l border-cyan-400/20 p-5 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Cart · ₹{cartTotal}</h2>
                  <button type="button" className="text-slate-400 hover:text-white" onClick={() => setCartOpen(false)}>
                    Close
                  </button>
                </div>
                {deliverySlot && (
                  <div className="mb-4 rounded-lg bg-amber-950/50 border border-amber-400/20 px-3 py-2 text-xs text-amber-100">
                    {deliverySlot.notice}
                  </div>
                )}
                <div className="space-y-3 mb-6">
                  {cart.length === 0 && !orderPlacedFlash && (
                    <p className="text-sm text-slate-500">Your cart is empty.</p>
                  )}
                  {orderPlacedFlash && cart.length === 0 && (
                    <p className="text-sm text-emerald-300/90 text-center py-6">
                      Cart cleared. Your order is waiting for wholesaler acceptance.
                    </p>
                  )}
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-3 items-center border border-slate-800 rounded-lg p-3">
                      <MedicineImage
                        src={mediaUrl(item.imageUrl)}
                        alt={item.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{item.name}</p>
                        <p className="text-xs text-slate-400">₹{item.price}</p>
                      </div>
                      <QtyControl
                        quantity={item.quantity}
                        onInc={() => setItemQty(item, item.quantity + 1)}
                        onDec={() => setItemQty(item, item.quantity - 1)}
                        onRemove={() => setItemQty(item, 0)}
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={placing || orderPlacedFlash || cart.length === 0 || !canPlaceOrders}
                  onClick={placeOrder}
                  className={`w-full py-3 rounded-xl font-semibold transition ${
                    orderPlacedFlash
                      ? "bg-emerald-800/50 text-emerald-200/80 shadow-[0_0_24px_rgba(16,185,129,0.35)] cursor-default"
                      : "bg-emerald-500 text-white disabled:opacity-50"
                  }`}
                >
                  {!canPlaceOrders
                    ? "Awaiting admin approval"
                    : orderPlacedFlash
                      ? "Order placed"
                      : placing
                        ? "Placing…"
                        : "Place order"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "tracking" && (
        <div className="bg-slate-900/60 rounded-xl border border-cyan-400/20 p-5">
          <h2 className="text-lg font-semibold text-white mb-1">Active orders</h2>
          <p className="text-sm text-slate-400 mb-4">
            Tracking appears here after you place an order.
          </p>
          {orders.length === 0 && <p className="text-sm text-slate-400">No active orders.</p>}
          <div className="space-y-4">
            {orders.map((order) => {
              const pendingAccept = order.status === "WAITING_WHOLESALER" || order.status === "PLACED";
              const cancelPending = order.cancelRequest?.status === "PENDING";
              return (
                <div key={order._id} className="border border-cyan-300/20 rounded-lg p-4">
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="font-semibold text-slate-100">
                      {order.billNumber || `Order #${String(order._id).slice(-6).toUpperCase()}`}
                    </p>
                    <span className="text-xs px-2 py-1 rounded bg-slate-800 text-cyan-200">
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    Slot: {order.slotWindowLabel || order.slot}
                    {order.deliveryDateLabel ? ` · ${order.deliveryDateLabel}` : ""}
                  </p>
                  <p className="text-sm text-slate-300">Amount: ₹{order.totalAmount}</p>

                  {pendingAccept && (
                    <div className="mt-3 flex items-center gap-3 text-sm text-amber-200">
                      <span className="inline-block w-6 h-6 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                      Waiting for wholesaler to accept…
                    </div>
                  )}

                  {!pendingAccept && <TrackingLine status={order.status} eta={order.eta} />}

                  {order.deliveryPartner && (
                    <div className="mt-3 rounded-lg bg-slate-950/60 border border-slate-700 p-3 text-sm">
                      <p className="text-slate-400 text-xs uppercase tracking-wide">Delivery partner</p>
                      <p className="text-white font-semibold">{order.deliveryPartner.name}</p>
                      <p className="text-slate-300">{order.deliveryPartner.phone}</p>
                    </div>
                  )}

                  {cancelPending && (
                    <p className="mt-2 text-sm text-amber-300">Cancel request pending wholesaler approval.</p>
                  )}

                  {(FREE_CANCEL.includes(order.status) ||
                    (REQUEST_CANCEL.includes(order.status) && !cancelPending)) && (
                    <button
                      type="button"
                      onClick={() => cancelOrder(order)}
                      className="mt-3 text-sm text-rose-400 font-semibold hover:text-rose-300"
                    >
                      {FREE_CANCEL.includes(order.status) ? "Cancel order" : "Request cancellation"}
                    </button>
                  )}

                  {order.status !== "WAITING_WHOLESALER" &&
                    order.status !== "PLACED" &&
                    order.deliveryTracking?.currentLat && (
                      <div className="mt-4">
                        <LiveMapPanel
                          title="Delivery location"
                          subtitle="Background location used for routing"
                          lat={order.deliveryTracking.currentLat}
                          lng={order.deliveryTracking.currentLng}
                          destLat={order.deliveryTracking.retailerLat}
                          destLng={order.deliveryTracking.retailerLng}
                          etaLabel={order.eta?.etaLabel}
                          distanceKm={order.eta?.distanceKm}
                        />
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 rounded-xl border border-cyan-400/20 p-5">
            <h2 className="text-lg font-semibold text-white mb-1">Past orders & bills</h2>
            <p className="text-sm text-slate-400 mb-4">Online bill + offline challan when uploaded</p>
            {history.length === 0 && <p className="text-sm text-slate-400">No past orders yet.</p>}
            <div className="space-y-3">
              {history.map((bill) => (
                <button
                  key={bill.orderId}
                  type="button"
                  onClick={() => openBill(bill.orderId)}
                  className="w-full text-left border border-cyan-300/20 rounded-lg p-4 hover:bg-slate-800/60 transition"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="font-semibold text-white">{bill.billNumber || "Bill"}</p>
                      <p className="text-sm text-slate-400">
                        {bill.itemCount} items · ₹{bill.totalAmount}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Ordered {formatDateTime(bill.orderedAt)}
                      </p>
                    </div>
                    <span className="inline-block px-2 py-1 rounded bg-slate-800 text-cyan-200 text-xs font-semibold">
                      {bill.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/60 rounded-xl border border-cyan-400/20 p-5">
            <h2 className="text-lg font-semibold text-white mb-4">Bill details</h2>
            {!selectedBill && (
              <p className="text-sm text-slate-400">Select an order to view the online bill.</p>
            )}
            {selectedBill && (
              <div className="space-y-4">
                <div>
                  <p className="text-cyan-300 font-mono text-sm">{selectedBill.billNumber}</p>
                  <p className="text-2xl font-bold text-white mt-1">₹{selectedBill.totalAmount}</p>
                  <p className="text-sm text-slate-400">
                    {selectedBill.slotWindowLabel || selectedBill.slot}
                    {selectedBill.deliveryDateLabel ? ` · ${selectedBill.deliveryDateLabel}` : ""}
                  </p>
                </div>

                <div className="border-t border-slate-700 pt-4 space-y-2">
                  {selectedBill.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm text-slate-200">
                      <span>{item.name} × {item.quantity}</span>
                      <span>₹{item.lineTotal}</span>
                    </div>
                  ))}
                </div>

                {selectedBill.offlineChallanImageUrl && (
                  <div className="border-t border-slate-700 pt-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Offline challan</p>
                    <img
                      src={mediaUrl(selectedBill.offlineChallanImageUrl)}
                      alt="Offline challan"
                      className="w-full max-h-64 object-contain rounded-lg border border-slate-700 bg-slate-950"
                    />
                  </div>
                )}

                <div className="border-t border-slate-700 pt-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Timeline</p>
                  <div className="space-y-3">
                    {(selectedBill.timeline || []).map((step, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="w-2 h-2 mt-1.5 rounded-full bg-cyan-400 shrink-0" />
                        <div>
                          <p className="text-sm text-white">{step.label}</p>
                          <p className="text-xs text-slate-500">{formatDateTime(step.at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "profile" && (
        <div className="max-w-2xl bg-slate-900/60 rounded-xl border border-cyan-400/20 p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Shop profile</h2>
          <form onSubmit={saveProfile} className="space-y-4">
            {[
              ["name", "Full name"],
              ["phone", "Phone"],
              ["shopAddress", "Shop address"],
              ["city", "City"],
              ["pinCode", "PIN code"],
              ["gstNumber", "GST number"],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-slate-400 mb-1">{label}</label>
                <input
                  className="w-full border border-cyan-300/20 bg-slate-950/80 text-white rounded-lg px-3 py-2"
                  value={profileForm[key]}
                  onChange={(e) => setProfileForm({ ...profileForm, [key]: e.target.value })}
                />
              </div>
            ))}
            <div className="rounded-lg border border-cyan-300/20 bg-slate-950/60 p-4">
              <p className="text-sm text-slate-300">
                Location (used in background to match nearest wholesaler):{" "}
                {profileForm.lat && profileForm.lng
                  ? `${Number(profileForm.lat).toFixed(4)}, ${Number(profileForm.lng).toFixed(4)}`
                  : "Not set"}
              </p>
              <button
                type="button"
                className="mt-3 px-4 py-2 rounded-lg bg-slate-800 text-cyan-200 text-sm font-semibold"
                onClick={() => {
                  if (!navigator.geolocation) {
                    alert("Location not supported");
                    return;
                  }
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setProfileForm((prev) => ({
                        ...prev,
                        lat: String(pos.coords.latitude),
                        lng: String(pos.coords.longitude),
                      }));
                    },
                    () => alert("Allow location access to update shop position")
                  );
                }}
              >
                Use live location
              </button>
            </div>
            <button
              type="submit"
              disabled={profileSaving}
              className="px-6 py-2.5 rounded-lg bg-cyan-500 text-white font-semibold disabled:opacity-50"
            >
              {profileSaving ? "Saving…" : "Save profile"}
            </button>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
