import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function AuthLayout({ children, authMode }) {
  const location = useLocation();
  const isRegister = authMode === "register";
  const params = new URLSearchParams(location.search);
  const selectedRole = params.get("role") || params.get("portal");
  const signinLink = selectedRole ? `/signin?portal=${selectedRole}` : "/signin";
  const registerLink = selectedRole ? `/register?role=${selectedRole}` : "/register";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#06b6d4_0%,_#0f172a_35%,_#020617_100%)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-cyan-200/90 hover:text-white text-sm font-medium mb-6 transition"
          >
            ← Back to home
          </Link>
          <div>
            <div className="inline-flex w-14 h-14 rounded-2xl bg-white/10 backdrop-blur border border-white/20 items-center justify-center text-white font-bold text-xl mb-4 shadow-lg">
              M
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Medifield
            </h1>
            <p className="text-cyan-100/90 text-sm mt-2">
              Pharmaceutical supply chain platform
            </p>
          </div>
        </div>

        <div className="flex rounded-xl bg-white/10 backdrop-blur border border-white/10 p-1 mb-6 max-w-md mx-auto">
          <Link
            to={signinLink}
            className={`flex-1 text-center py-2.5 text-sm font-semibold rounded-lg transition ${
              !isRegister
                ? "bg-white text-blue-900 shadow-md"
                : "text-white/80 hover:text-white"
            }`}
          >
            Login
          </Link>
          <Link
            to={registerLink}
            className={`flex-1 text-center py-2 text-sm font-semibold rounded-lg transition ${
              isRegister
                ? "bg-white text-blue-900 shadow-md"
                : "text-white/80 hover:text-white"
            }`}
          >
            Register
          </Link>
        </div>

        {location.state?.registered && !isRegister && (
          <div
            className="mb-4 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 text-sm px-4 py-3"
            role="status"
          >
            Account created successfully. Please sign in with your phone (or email) and
            password.
          </div>
        )}

        <div className="bg-white/95 rounded-3xl shadow-2xl shadow-black/30 p-6 sm:p-8 border border-cyan-100">
          {children}
        </div>
      </div>
    </div>
  );
}
