import React, { useState, useMemo } from "react";
import axios from "axios";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { isValidEmail, isValidIndianPhone } from "../utils/validation";
import { disconnectSocket } from "../utils/socket";
import { API_BASE } from "../utils/api";

const PORTAL_LABELS = {
  RETAILER: "Retailer",
  WHOLESALER: "Wholesaler",
  DELIVERY: "Delivery",
  ADMIN: "Admin",
};

export default function Login({ setUser }) {
  const [mode, setMode] = useState("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const portalParam = searchParams.get("portal");
  const justRegistered = Boolean(location.state?.registered);
  const askLocation = Boolean(location.state?.askLocation);

  const portalHint = useMemo(() => {
    if (!portalParam || !PORTAL_LABELS[portalParam]) return null;
    return PORTAL_LABELS[portalParam];
  }, [portalParam]);

  const finishLogin = (res) => {
    const user = res.data.user;
    localStorage.setItem("token", res.data.token);
    if (res.data.refreshToken) {
      localStorage.setItem("refreshToken", res.data.refreshToken);
    }
    localStorage.setItem("user", JSON.stringify(user));
    disconnectSocket();
    setUser(user);

    if (user.role === "RETAILER") navigate("/retailer", { replace: true });
    else if (user.role === "WHOLESALER") navigate("/wholesaler", { replace: true });
    else if (user.role === "DELIVERY") navigate("/delivery", { replace: true });
    else if (user.role === "ADMIN") navigate("/admin", { replace: true });
    else navigate("/retailer", { replace: true });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setFormError("");
    setPhoneError("");
    setEmailError("");
    setPasswordError("");

    if (!password) {
      setPasswordError("Required");
      return;
    }

    setLoading(true);
    try {
      let res;
      if (mode === "phone") {
        if (!isValidIndianPhone(phone)) {
          setPhoneError("Enter a valid 10-digit mobile");
          setLoading(false);
          return;
        }
        res = await axios.post(`${API_BASE}/auth/login`, { phone, password });
      } else {
        const trimmed = email.trim().toLowerCase();
        if (!isValidEmail(trimmed)) {
          setEmailError("Invalid email");
          setLoading(false);
          return;
        }
        res = await axios.post(`${API_BASE}/auth/login`, { email: trimmed, password });
      }
      finishLogin(res);
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const forgotLink = portalParam
    ? `/forgot-password?portal=${portalParam}`
    : "/forgot-password";

  return (
    <AuthLayout authMode="signin">
    <div className="relative">
      <h2 className="text-xl font-bold text-slate-900 mb-5">Login</h2>
      {justRegistered && (
        <div className="mb-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-900 text-xs px-3 py-2">
          Account created.
          {askLocation
            ? " After login, allow location so we can match nearby wholesalers."
            : " Login after admin approval."}
        </div>
      )}
      {portalHint && (
        <div className="mb-3 rounded-lg bg-cyan-50 border border-cyan-100 text-cyan-900 text-xs px-3 py-2">
          {portalHint} portal
        </div>
      )}

      <div className="flex rounded-lg bg-slate-100 p-0.5 mb-4">
        <button
          type="button"
          onClick={() => setMode("phone")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md ${
            mode === "phone" ? "bg-white text-slate-900 shadow" : "text-slate-500"
          }`}
        >
          Phone
        </button>
        <button
          type="button"
          onClick={() => setMode("email")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md ${
            mode === "email" ? "bg-white text-slate-900 shadow" : "text-slate-500"
          }`}
        >
          Email
        </button>
      </div>

      <form onSubmit={handleLogin} className="space-y-3 relative" noValidate>
        {formError && (
          <div className="rounded-lg bg-red-50 text-red-700 text-xs px-3 py-2 border border-red-200">
            {formError}
          </div>
        )}

        {mode === "phone" ? (
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Mobile number</label>
            <input
              type="tel"
              className={`w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                phoneError ? "border-red-400 bg-red-50/50" : "border-slate-200"
              }`}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                setPhoneError("");
                setFormError("");
              }}
              maxLength={10}
              autoComplete="tel"
            />
            {phoneError && <p className="text-xs text-red-600 mt-1">{phoneError}</p>}
          </div>
        ) : (
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email</label>
            <input
              type="email"
              className={`w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                emailError ? "border-red-400 bg-red-50/50" : "border-slate-200"
              }`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
                setFormError("");
              }}
              autoComplete="email"
            />
            {emailError && <p className="text-xs text-red-600 mt-1">{emailError}</p>}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-semibold text-slate-600">Password</label>
            <Link to={forgotLink} className="text-[11px] font-semibold text-cyan-700 hover:text-cyan-900">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            className={`w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
              passwordError ? "border-red-400 bg-red-50/50" : "border-slate-200"
            }`}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError("");
              setFormError("");
            }}
            autoComplete="current-password"
          />
          {passwordError && <p className="text-xs text-red-600 mt-1">{passwordError}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition text-sm"
        >
          {loading ? "Logging in…" : "Login"}
        </button>
      </form>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/75 rounded-xl">
          <div className="flex flex-col items-center gap-2">
            <span className="w-9 h-9 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-600 font-medium">Logging in…</p>
          </div>
        </div>
      )}
    </div>
    </AuthLayout>
  );
}
