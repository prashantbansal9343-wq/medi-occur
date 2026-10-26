import React, { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";

const PORTAL_LABELS = {
  RETAILER: "Retailer",
  WHOLESALER: "Wholesaler",
  DELIVERY: "Delivery partner",
  ADMIN: "Admin",
};

export default function PortalEntry() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "RETAILER";
  const label = useMemo(() => PORTAL_LABELS[role] || "Portal", [role]);

  return (
    <AuthLayout authMode="signin">
      <h2 className="text-xl font-bold text-slate-900 mb-1">{label}</h2>
      <p className="text-sm text-slate-500 mb-5">Login with an existing account or register as {label.toLowerCase()}.</p>
      <div className="space-y-2.5">
        <Link
          to={`/signin?portal=${role}`}
          className="block w-full text-center bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 rounded-lg transition text-sm"
        >
          Login
        </Link>
        <Link
          to={`/register?role=${role}`}
          className="block w-full text-center border border-slate-300 text-slate-800 hover:bg-slate-50 font-semibold py-2.5 rounded-lg transition text-sm"
        >
          Register
        </Link>
        <Link to="/" className="block text-center text-xs text-slate-500 hover:text-slate-800 pt-1">
          ← All portals
        </Link>
      </div>
    </AuthLayout>
  );
}
