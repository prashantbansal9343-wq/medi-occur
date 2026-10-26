import React, { useState, useEffect, useRef } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import LiveMapPanel, { buildDirectionsLink } from "../components/LiveMapPanel";
import { getSocket, disconnectSocket } from "../utils/socket";
import TrackingLine from "../components/TrackingLine";

const ACTIVE_STATUSES = ["ACCEPTED", "PACKED", "PICKED", "OUT_FOR_DELIVERY"];

export default function DeliveryDashboard({ setUser, user }) {
  const [otp, setOtp] = useState("");
  const [orders, setOrders] = useState([]);
  const watchIdRef = useRef(null);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders");
      setOrders(res.data.orders || []);
    } catch {
      setOrders([]);
    }
  };

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

  const activeOrder = orders.find((o) => ACTIVE_STATUSES.includes(o.status));

  const pushLocation = async (lat, lng) => {
    if (!activeOrder) return;
    await api.post("/orders/update-status", {
      orderId: activeOrder._id,
      lat,
      lng,
    });
    fetchOrders();
  };

  useEffect(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    const shouldTrack =
      activeOrder && ["PICKED", "OUT_FOR_DELIVERY"].includes(activeOrder.status);

    if (!shouldTrack || !navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        pushLocation(pos.coords.latitude, pos.coords.longitude).catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [activeOrder?._id, activeOrder?.status]);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    disconnectSocket();
    setUser(null);
    navigate("/signin?portal=DELIVERY", { replace: true });
  };

  const updateStatus = async (status, requiresOtp = false) => {
    if (!activeOrder) return;
    if (requiresOtp && !otp) {
      alert("Enter OTP shared by retailer.");
      return;
    }
    try {
      let lat = activeOrder.deliveryTracking?.currentLat;
      let lng = activeOrder.deliveryTracking?.currentLng;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 4000,
            })
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch {
          /* keep last known */
        }
      }
      await api.post("/orders/update-status", {
        orderId: activeOrder._id,
        status,
        otp: requiresOtp ? otp : undefined,
        lat,
        lng,
      });
      fetchOrders();
      alert(`Order moved to ${status}`);
    } catch (err) {
      alert(err.response?.data?.message || "Status update failed");
    }
  };

  const tracking = activeOrder?.deliveryTracking;
  const eta = activeOrder?.eta;
  const destLat = tracking?.retailerLat;
  const destLng = tracking?.retailerLng;
  const navUrl =
    tracking?.currentLat != null
      ? buildDirectionsLink(tracking.currentLat, tracking.currentLng, destLat, destLng)
      : null;

  return (
    <DashboardLayout
      user={user}
      setUser={setUser}
      pageTitle="Delivery partner"
      pageSubtitle="Live GPS tracking, route navigation, and OTP verification."
      onSignOut={handleSignOut}
    >
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-slate-900/60 rounded-xl border border-cyan-300/20 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Current assignment</h2>
          <div className="rounded-xl border border-dashed border-cyan-300/20 bg-slate-950/60 py-8 px-6">
            {!activeOrder ? (
              <p className="text-center text-slate-400 text-sm">
                Orders accepted by wholesalers will appear here for delivery.
              </p>
            ) : (
              <>
                <p className="text-slate-100 font-semibold mb-2">
                  Order #{activeOrder._id.slice(-6).toUpperCase()}
                </p>
                <p className="text-sm text-slate-300">Status: {activeOrder.status}</p>
                <TrackingLine status={activeOrder.status} eta={eta} />
                {eta && (
                  <p className="text-sm text-emerald-300 mt-2">
                    {eta.distanceKm} km remaining · {eta.etaLabel}
                  </p>
                )}
                <p className="text-sm text-slate-300 mt-2">
                  Retailer: {activeOrder.retailer?.phone || "N/A"}
                </p>
                <p className="text-sm text-slate-300">OTP: {activeOrder.deliveryOtp || "—"}</p>
                {["PICKED", "OUT_FOR_DELIVERY"].includes(activeOrder.status) && (
                  <p className="text-xs text-cyan-300 mt-2">GPS auto-tracking active</p>
                )}
                {navUrl && (
                  <a
                    href={navUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-4 px-5 py-2.5 rounded-lg bg-cyan-600 text-white font-semibold hover:bg-cyan-500"
                  >
                    Open in Google Maps
                  </a>
                )}
                {tracking?.currentLat != null && (
                  <div className="mt-4">
                    <LiveMapPanel
                      title="Route to retailer"
                      subtitle="Live rider position → destination"
                      lat={tracking.currentLat}
                      lng={tracking.currentLng}
                      destLat={destLat}
                      destLng={destLng}
                      etaLabel={eta?.etaLabel}
                      distanceKm={eta?.distanceKm}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="bg-slate-900/60 rounded-xl border border-cyan-300/20 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-white mb-2">OTP verification</h2>
          <label className="block text-xs font-semibold text-slate-300 mb-2">One-time password</label>
          <input
            type="text"
            inputMode="numeric"
            className="w-full border border-cyan-300/20 bg-slate-950/80 text-white rounded-lg px-4 py-3 text-lg tracking-[0.35em] font-mono focus:ring-2 focus:ring-cyan-500 mb-6"
            placeholder="• • • • • •"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => updateStatus("PICKED")}
              className="flex-1 py-3 rounded-lg bg-amber-500 text-white font-semibold"
            >
              Confirm pickup
            </button>
            <button
              type="button"
              onClick={() => updateStatus("OUT_FOR_DELIVERY")}
              className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-semibold"
            >
              Start route
            </button>
            <button
              type="button"
              onClick={() => updateStatus("DELIVERED", true)}
              className="flex-1 py-3 rounded-lg bg-emerald-600 text-white font-semibold"
            >
              Confirm delivery
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
