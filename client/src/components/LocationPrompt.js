import React, { useEffect, useState } from "react";
import api from "../utils/api";

const CITY_FALLBACK = {
  Jaipur: { lat: 26.9124, lng: 75.7873 },
  Delhi: { lat: 28.6139, lng: 77.209 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Lucknow: { lat: 26.8467, lng: 80.9462 },
};

async function saveLocation(role, lat, lng) {
  if (role === "RETAILER") {
    const res = await api.get("/retailers/profile");
    const u = res.data.user;
    await api.put("/retailers/profile", {
      name: u.name,
      phone: u.phone,
      profile: { ...(u.profile || {}), lat, lng },
    });
    return { ...(u.profile || {}), lat, lng };
  }
  if (role === "WHOLESALER") {
    await api.put("/wholesalers/profile", { lat, lng });
    return { lat, lng };
  }
  return { lat, lng };
}

/** Soft corner toast — location is a background matching signal, not the main screen */
export default function LocationPrompt({ user, setUser }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const needsLocation =
    user &&
    (user.role === "RETAILER" || user.role === "WHOLESALER") &&
    !(Number.isFinite(Number(user.profile?.lat)) && Number.isFinite(Number(user.profile?.lng)));

  useEffect(() => {
    if (needsLocation && !done) setOpen(true);
  }, [needsLocation, done]);

  if (!open || !needsLocation) return null;

  const finish = async (lat, lng) => {
    setBusy(true);
    setError("");
    try {
      const profile = await saveLocation(user.role, lat, lng);
      const updated = { ...user, profile: { ...(user.profile || {}), ...profile } };
      localStorage.setItem("user", JSON.stringify(updated));
      if (setUser) setUser(updated);
      setDone(true);
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save location");
    } finally {
      setBusy(false);
    }
  };

  const requestLiveLocation = () => {
    setError("");
    if (!navigator.geolocation) {
      setError("Location not supported.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => finish(pos.coords.latitude, pos.coords.longitude),
      () => {
        setBusy(false);
        setError("Permission denied — use city centre, or Allow location.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const useCityCentre = () => {
    const city = user.profile?.city || "Jaipur";
    const coords = CITY_FALLBACK[city] || CITY_FALLBACK.Jaipur;
    finish(coords.lat, coords.lng);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(100%-2rem,20rem)] rounded-xl bg-slate-900 border border-cyan-400/25 shadow-2xl p-3.5">
      <p className="text-xs font-semibold text-white">Enable location for matching</p>
      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
        Used in the background to find the nearest wholesaler when you place an order — not shown as live tracking on Home.
      </p>
      {error && <p className="mt-2 text-[11px] text-rose-300">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={requestLiveLocation}
          className="flex-1 py-1.5 rounded-lg bg-cyan-500 text-white text-[11px] font-semibold disabled:opacity-50"
        >
          {busy ? "…" : "Allow"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={useCityCentre}
          className="flex-1 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-[11px] font-semibold disabled:opacity-50"
        >
          City centre
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-2 py-1.5 rounded-lg text-slate-500 text-[11px] hover:text-white"
        >
          Later
        </button>
      </div>
    </div>
  );
}
