import React from "react";

function buildDirectionsEmbedUrl(originLat, originLng, destLat, destLng) {
  const oLat = Number.isFinite(originLat) ? originLat : 26.9124;
  const oLng = Number.isFinite(originLng) ? originLng : 75.7873;
  const dLat = Number.isFinite(destLat) ? destLat : oLat;
  const dLng = Number.isFinite(destLng) ? destLng : oLng;
  return `https://maps.google.com/maps?saddr=${oLat},${oLng}&daddr=${dLat},${dLng}&output=embed`;
}

function buildDirectionsLink(originLat, originLng, destLat, destLng) {
  const oLat = Number.isFinite(originLat) ? originLat : 26.9124;
  const oLng = Number.isFinite(originLng) ? originLng : 75.7873;
  const dLat = Number.isFinite(destLat) ? destLat : oLat;
  const dLng = Number.isFinite(destLng) ? destLng : oLng;
  return `https://www.google.com/maps/dir/?api=1&origin=${oLat},${oLng}&destination=${dLat},${dLng}&travelmode=driving`;
}

function buildPinEmbedUrl(lat, lng) {
  const safeLat = Number.isFinite(lat) ? lat : 26.9124;
  const safeLng = Number.isFinite(lng) ? lng : 75.7873;
  return `https://www.google.com/maps?q=${safeLat},${safeLng}&z=14&output=embed`;
}

export default function LiveMapPanel({
  title,
  lat,
  lng,
  subtitle,
  destLat,
  destLng,
  showNavigate = true,
  etaLabel,
  distanceKm,
}) {
  const hasRoute =
    Number.isFinite(destLat) &&
    Number.isFinite(destLng) &&
    Number.isFinite(lat) &&
    Number.isFinite(lng);

  const embedUrl = hasRoute
    ? buildDirectionsEmbedUrl(lat, lng, destLat, destLng)
    : buildPinEmbedUrl(lat, lng);

  const navigateUrl = hasRoute
    ? buildDirectionsLink(lat, lng, destLat, destLng)
    : buildDirectionsLink(lat, lng, lat, lng);

  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-2xl">
      <div className="px-5 py-3 border-b border-white/10 flex justify-between items-start gap-3">
        <div>
          <p className="text-cyan-300 text-xs uppercase tracking-widest font-semibold">{title}</p>
          {subtitle && <p className="text-slate-300 text-sm mt-1">{subtitle}</p>}
          {distanceKm != null && (
            <p className="text-emerald-300 text-sm mt-1">{distanceKm} km to go</p>
          )}
          {etaLabel && <p className="text-cyan-200 text-sm font-semibold mt-1">{etaLabel}</p>}
        </div>
        {showNavigate && (
          <a
            href={navigateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500"
          >
            Navigate ↗
          </a>
        )}
      </div>
      <iframe
        title={title}
        src={embedUrl}
        className="w-full h-64 border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

export { buildDirectionsLink };
