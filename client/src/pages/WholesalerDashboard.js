import React, { useState, useEffect, useMemo, useRef } from "react";
import api, { mediaUrl } from "../utils/api";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { getSocket, disconnectSocket } from "../utils/socket";
import TrackingLine from "../components/TrackingLine";
import MedicineImage from "../components/MedicineImage";

function orderShortId(order) {
  const id = order?._id;
  if (!id) return "—";
  return String(id).slice(-6).toUpperCase();
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function WholesalerDashboard({ setUser, user }) {
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [stockQuery, setStockQuery] = useState("");
  const [medicineSearch, setMedicineSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMed, setSelectedMed] = useState(null);
  const [qtyDelta, setQtyDelta] = useState(1);
  const [expandedBill, setExpandedBill] = useState(null);
  const searchBoxRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
    const socket = getSocket();
    const onOrderEvent = () => fetchOrders();
    socket?.on("order:created", onOrderEvent);
    socket?.on("order:updated", onOrderEvent);
    return () => {
      socket?.off("order:created", onOrderEvent);
      socket?.off("order:updated", onOrderEvent);
    };
  }, []);

  useEffect(() => {
    if (activeTab === "inventory" || activeTab === "past") fetchInventory();
  }, [activeTab]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders");
      setOrders(res.data.orders || []);
    } catch {
      setOrders([]);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await api.get("/wholesalers/inventory");
      setInventory(res.data.inventory || []);
    } catch {
      setInventory([]);
    }
  };

  const searchMedicines = async () => {
    const q = medicineSearch.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/medicines/search?q=${encodeURIComponent(q)}`);
      setSearchResults(res.data.medicines || []);
    } catch {
      setSearchResults([]);
    }
  };

  const saveStock = async (medicineId, quantity, price) => {
    try {
      await api.post("/wholesalers/inventory", {
        medicineId,
        quantity: Math.max(0, Number(quantity) || 0),
        price: Math.max(1, Number(price) || 1),
      });
      setSelectedMed(null);
      setQtyDelta(1);
      setMedicineSearch("");
      setSearchResults([]);
      fetchInventory();
    } catch (err) {
      alert(err.response?.data?.message || "Inventory update failed");
    }
  };

  const adjustSelected = async (direction) => {
    if (!selectedMed) return;
    const existing = inventory.find(
      (i) => String(i.medicine?._id || i.medicine) === String(selectedMed.id)
    );
    const currentQty = existing ? Number(existing.quantity) : 0;
    const next = Math.max(0, currentQty + direction * Math.max(1, Number(qtyDelta) || 1));
    const price = existing?.price || selectedMed.price || 1;
    await saveStock(selectedMed.id, next, price);
  };

  const removeInventory = async (medicineId) => {
    if (!window.confirm("Remove this item from your inventory?")) return;
    try {
      await api.delete(`/wholesalers/inventory/${medicineId}`);
      fetchInventory();
    } catch (err) {
      alert(err.response?.data?.message || "Remove failed");
    }
  };

  const respondOrder = async (orderId, action) => {
    try {
      await api.post("/orders/respond", { orderId, action });
      alert(action === "accept" ? "Order accepted." : "Order rejected and rerouted.");
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || "Could not respond to order.");
    }
  };

  const packOrder = async (orderId) => {
    try {
      await api.post("/orders/pack", { orderId });
      fetchOrders();
      alert("Order marked as packed.");
    } catch (err) {
      alert(err.response?.data?.message || "Pack failed");
    }
  };

  const respondCancel = async (orderId, action) => {
    try {
      const res = await api.post("/orders/cancel-respond", { orderId, action });
      alert(res.data.message || "Updated");
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || "Could not respond to cancel request");
    }
  };

  const uploadChallan = async (orderId, file) => {
    if (!file) return;
    const body = new FormData();
    body.append("orderId", orderId);
    body.append("challanImage", file);
    try {
      await api.post("/orders/upload-challan", body);
      fetchOrders();
      alert("Offline challan uploaded.");
    } catch (err) {
      alert(err.response?.data?.message || "Challan upload failed");
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    disconnectSocket();
    setUser(null);
    navigate("/signin?portal=WHOLESALER", { replace: true });
  };

  const activeOrders = orders.filter(
    (o) => !["DELIVERED", "CANCELLED", "FAILED", "REJECTED"].includes(o.status)
  );
  const pastOrders = useMemo(() => {
    const list = orders.filter((o) =>
      ["DELIVERED", "CANCELLED", "FAILED", "REJECTED"].includes(o.status)
    );
    const byDate = {};
    for (const o of list) {
      const key = formatDate(o.deliveredAt || o.cancelledAt || o.createdAt);
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(o);
    }
    return byDate;
  }, [orders]);

  const filteredStock = inventory.filter((item) => {
    const name = (item.medicine?.name || "").toLowerCase();
    const company = (item.medicine?.company || "").toLowerCase();
    const q = stockQuery.trim().toLowerCase();
    if (!q) return true;
    return name.includes(q) || company.includes(q);
  });

  const placedCount = orders.filter(
    (o) => o.status === "PLACED" || o.status === "WAITING_WHOLESALER"
  ).length;

  return (
    <DashboardLayout
      user={user}
      setUser={setUser}
      pageTitle="Wholesaler"
      pageSubtitle=""
      onSignOut={handleSignOut}
      navItems={[
        { id: "orders", label: "Orders" },
        { id: "inventory", label: "Inventory" },
        { id: "past", label: "Past orders" },
      ]}
      activeNavId={activeTab}
      onNavSelect={setActiveTab}
    >
      {activeTab === "inventory" && (
        <div className="space-y-4 max-w-3xl">
          <div className="bg-slate-900/60 rounded-xl border border-cyan-300/15 p-4" ref={searchBoxRef}>
            <h2 className="text-sm font-semibold text-white mb-2">Add medicine to stock</h2>
            <div className="flex gap-2">
              <input
                className="flex-1 border border-cyan-300/20 bg-slate-950/80 text-white rounded-lg px-3 py-2 text-sm"
                placeholder="Search catalogue…"
                value={medicineSearch}
                onChange={(e) => setMedicineSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchMedicines()}
              />
              <button
                type="button"
                onClick={searchMedicines}
                className="px-3 py-2 rounded-lg bg-cyan-600 text-white text-xs font-semibold"
              >
                Search
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-700 bg-slate-950">
                {searchResults.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSelectedMed(m);
                      setSearchResults([]);
                      setMedicineSearch(m.name);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 border-b border-slate-800 last:border-0"
                  >
                    <span className="font-semibold text-white">{m.name}</span>
                    <span className="text-slate-500"> · {m.company}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedMed && (
              <div className="mt-3 flex items-center gap-3 border border-cyan-300/20 rounded-lg p-3 bg-slate-950/50">
                <MedicineImage
                  src={mediaUrl(selectedMed.imageUrl)}
                  alt={selectedMed.name}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{selectedMed.name}</p>
                  <p className="text-[11px] text-slate-400">{selectedMed.company}</p>
                </div>
                <input
                  type="number"
                  min="1"
                  value={qtyDelta}
                  onChange={(e) => setQtyDelta(e.target.value)}
                  className="w-14 border border-slate-700 bg-slate-900 text-white rounded px-2 py-1 text-xs"
                  title="Step"
                />
                <button
                  type="button"
                  onClick={() => adjustSelected(-1)}
                  className="w-8 h-8 rounded bg-slate-800 text-white font-bold"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() => adjustSelected(1)}
                  className="w-8 h-8 rounded bg-emerald-600 text-white font-bold"
                >
                  +
                </button>
              </div>
            )}
          </div>

          <div className="bg-slate-900/60 rounded-xl border border-cyan-300/15 p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-semibold text-white">Your stock</h2>
              <input
                className="border border-cyan-300/20 bg-slate-950/80 text-white rounded-lg px-3 py-1.5 text-xs w-44"
                placeholder="Filter stock…"
                value={stockQuery}
                onChange={(e) => setStockQuery(e.target.value)}
              />
            </div>
            {filteredStock.length === 0 && (
              <p className="text-xs text-slate-400">No matching stock. Search above to add medicines.</p>
            )}
            <div className="space-y-2">
              {filteredStock.map((item) => (
                <div
                  key={String(item.medicine?._id || item.medicine)}
                  className="flex justify-between items-center border border-cyan-300/15 rounded-lg px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {item.medicine?.name || "Medicine"}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {item.medicine?.company || "—"} · Qty {item.quantity} · ₹{item.price}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeInventory(item.medicine?._id || item.medicine)}
                    className="text-[11px] text-rose-400 font-semibold shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-slate-900/60 rounded-lg border border-cyan-300/15 p-3">
              <p className="text-[10px] font-semibold uppercase text-slate-400">Open</p>
              <p className="text-xl font-bold text-amber-400 mt-0.5">{placedCount}</p>
            </div>
            <div className="bg-slate-900/60 rounded-lg border border-cyan-300/15 p-3">
              <p className="text-[10px] font-semibold uppercase text-slate-400">Active</p>
              <p className="text-xl font-bold text-white mt-0.5">{activeOrders.length}</p>
            </div>
            <div className="bg-slate-900/60 rounded-lg border border-cyan-300/15 p-3">
              <p className="text-[10px] font-semibold uppercase text-slate-400">Hub</p>
              <p className="text-xs font-medium text-slate-200 mt-1 truncate">{user?.name}</p>
            </div>
          </div>

          <div className="bg-slate-900/60 rounded-xl border border-cyan-300/15 overflow-hidden">
            <div className="px-4 py-3 border-b border-cyan-300/10 flex justify-between">
              <h2 className="text-sm font-semibold text-white">Incoming orders</h2>
              <button type="button" onClick={fetchOrders} className="text-xs text-cyan-300">
                Refresh
              </button>
            </div>
            <div className="divide-y divide-cyan-300/10">
              {activeOrders.length === 0 && (
                <p className="px-4 py-10 text-center text-slate-400 text-sm">No active orders.</p>
              )}
              {activeOrders.map((order) => (
                <div
                  key={order._id}
                  className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div>
                    <p className="font-mono text-xs font-semibold text-slate-100">
                      #{orderShortId(order)} {order.billNumber ? `· ${order.billNumber}` : ""}
                    </p>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {order.retailer?.name || "Retailer"} · {order.status}
                    </p>
                    <TrackingLine status={order.status} eta={order.eta} />
                    {order.cancelRequest?.status === "PENDING" && (
                      <p className="text-xs text-amber-300 mt-1">Cancel request pending</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap items-center">
                    {["PLACED", "WAITING_WHOLESALER"].includes(order.status) && (
                      <>
                        <button
                          type="button"
                          onClick={() => respondOrder(order._id, "accept")}
                          className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-semibold"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => respondOrder(order._id, "reject")}
                          className="px-3 py-1.5 rounded-md bg-rose-600 text-white text-xs font-semibold"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {order.cancelRequest?.status === "PENDING" && (
                      <>
                        <button
                          type="button"
                          onClick={() => respondCancel(order._id, "approve")}
                          className="px-3 py-1.5 rounded-md bg-rose-700 text-white text-xs font-semibold"
                        >
                          Approve cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => respondCancel(order._id, "reject")}
                          className="px-3 py-1.5 rounded-md bg-slate-700 text-white text-xs font-semibold"
                        >
                          Keep order
                        </button>
                      </>
                    )}
                    {order.status === "ACCEPTED" && (
                      <button
                        type="button"
                        onClick={() => packOrder(order._id)}
                        className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-semibold"
                      >
                        Mark packed
                      </button>
                    )}
                    {["ACCEPTED", "PACKED", "PICKED", "OUT_FOR_DELIVERY"].includes(order.status) && (
                      <label className="px-3 py-1.5 rounded-md bg-slate-800 text-cyan-200 text-xs font-semibold cursor-pointer border border-cyan-400/20">
                        Challan
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => uploadChallan(order._id, e.target.files?.[0])}
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === "past" && (
        <div className="space-y-5">
          {Object.keys(pastOrders).length === 0 && (
            <p className="text-sm text-slate-400">No past orders yet.</p>
          )}
          {Object.entries(pastOrders).map(([date, list]) => (
            <div key={date}>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                {date}
              </h3>
              <div className="space-y-2">
                {list.map((order) => {
                  const open = expandedBill === order._id;
                  return (
                    <div
                      key={order._id}
                      className="border border-cyan-300/15 rounded-lg bg-slate-900/50 overflow-hidden"
                    >
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2.5 flex justify-between gap-2"
                        onClick={() => setExpandedBill(open ? null : order._id)}
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {order.billNumber || `#${orderShortId(order)}`}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {order.retailer?.name || "Retailer"} · ₹{order.totalAmount} · {order.status}
                          </p>
                        </div>
                        <span className="text-xs text-cyan-300">{open ? "Hide" : "Bill"}</span>
                      </button>
                      {open && (
                        <div className="px-3 pb-3 border-t border-slate-800 pt-2 space-y-1">
                          {(order.items || []).map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs text-slate-300">
                              <span>
                                {item.medicineName} × {item.quantity}
                              </span>
                              <span>₹{(item.price || 0) * (item.quantity || 0)}</span>
                            </div>
                          ))}
                          {order.offlineChallanImageUrl && (
                            <img
                              src={mediaUrl(order.offlineChallanImageUrl)}
                              alt="Challan"
                              className="mt-2 max-h-40 rounded border border-slate-700 object-contain"
                            />
                          )}
                          {order.deliveryPartner && (
                            <p className="text-[11px] text-slate-400 mt-2">
                              Delivery: {order.deliveryPartner.name} ({order.deliveryPartner.phone})
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
