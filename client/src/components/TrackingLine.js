import React from "react";

const STATUS_PROGRESS = {
  WAITING_WHOLESALER: 10,
  ACCEPTED: 25,
  PACKED: 40,
  PICKED: 60,
  OUT_FOR_DELIVERY: 80,
  DELIVERED: 100,
  CANCELLED: 0,
};

export default function TrackingLine({ status, eta }) {
  const progress = STATUS_PROGRESS[status] || 5;
  const etaLabel =
    eta?.etaLabel ||
    (status === "DELIVERED"
      ? "Delivered"
      : status === "CANCELLED"
      ? "Cancelled"
      : status === "OUT_FOR_DELIVERY"
      ? "En route"
      : "Preparing");

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs text-cyan-200/90 mb-1">
        <span>Route Progress</span>
        <span className="rounded-full px-2 py-0.5 bg-cyan-400/15 border border-cyan-300/30 animate-pulse">
          {etaLabel}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-800 border border-cyan-400/20 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500"
          style={{ width: `${progress}%`, transition: "width 600ms ease" }}
        />
      </div>
    </div>
  );
}
