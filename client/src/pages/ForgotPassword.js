import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { isValidEmail, isValidIndianPhone, getPasswordErrors } from "../utils/validation";
import { API_BASE } from "../utils/api";

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const portal = searchParams.get("portal");
  const navigate = useNavigate();

  const [channel, setChannel] = useState("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1);
  const [devOtp, setDevOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (channel === "phone" && !isValidIndianPhone(phone)) {
      setError("Enter a valid 10-digit mobile");
      return;
    }
    if (channel === "email" && !isValidEmail(email)) {
      setError("Enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const payload =
        channel === "phone"
          ? { channel: "phone", phone }
          : { channel: "email", email: email.trim().toLowerCase() };
      const res = await axios.post(`${API_BASE}/auth/forgot-password`, payload);
      setDevOtp(res.data.devOtp || "");
      setMessage(res.data.message || "OTP sent");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Could not send OTP");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError("");
    const pwErrors = getPasswordErrors(newPassword);
    if (pwErrors.length) {
      setError(pwErrors[0]);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        channel,
        otp,
        newPassword,
        ...(channel === "phone"
          ? { phone }
          : { email: email.trim().toLowerCase() }),
      };
      await axios.post(`${API_BASE}/auth/reset-password`, payload);
      navigate(portal ? `/signin?portal=${portal}` : "/signin", {
        replace: true,
        state: { registered: false },
      });
      alert("Password updated. Please sign in.");
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout authMode="signin">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Forgot password</h2>
      <p className="text-sm text-slate-500 mb-6">
        Reset via OTP on your phone or email.
      </p>

      <div className="flex rounded-xl bg-slate-100 p-1 mb-4">
        <button
          type="button"
          onClick={() => setChannel("phone")}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg ${
            channel === "phone" ? "bg-white shadow text-slate-900" : "text-slate-500"
          }`}
        >
          Phone OTP
        </button>
        <button
          type="button"
          onClick={() => setChannel("email")}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg ${
            channel === "email" ? "bg-white shadow text-slate-900" : "text-slate-500"
          }`}
        >
          Email OTP
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2 border border-red-200">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-800 text-sm px-3 py-2 border border-emerald-100">
          {message}
          {devOtp && (
            <span className="block mt-1 font-mono text-xs">Dev OTP: {devOtp}</span>
          )}
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={sendOtp} className="space-y-4">
          {channel === "phone" ? (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile</label>
              <input
                type="tel"
                className="w-full border border-slate-200 rounded-xl px-4 py-3"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                maxLength={10}
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
              <input
                type="email"
                className="w-full border border-slate-200 rounded-xl px-4 py-3"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-3.5 rounded-xl disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send OTP"}
          </button>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">OTP</label>
            <input
              type="text"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 tracking-widest"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">New password</label>
            <input
              type="password"
              className="w-full border border-slate-200 rounded-xl px-4 py-3"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Confirm password</label>
            <input
              type="password"
              className="w-full border border-slate-200 rounded-xl px-4 py-3"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-3.5 rounded-xl disabled:opacity-60"
          >
            {loading ? "Updating…" : "Update password"}
          </button>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full text-sm text-slate-500 hover:text-slate-800"
          >
            Resend OTP
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link
          to={portal ? `/signin?portal=${portal}` : "/signin"}
          className="font-semibold text-cyan-700 hover:text-cyan-900"
        >
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
