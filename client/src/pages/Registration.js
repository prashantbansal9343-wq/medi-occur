import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import {
  isValidEmail,
  isValidIndianPhone,
  getPasswordErrors,
} from "../utils/validation";
import { API_BASE } from "../utils/api";

const VALID_ROLES = ["RETAILER", "WHOLESALER", "DELIVERY", "ADMIN"];
const ROLE_LABELS = {
  RETAILER: "Retailer",
  WHOLESALER: "Wholesaler",
  DELIVERY: "Delivery partner",
  ADMIN: "Admin",
};

const CITIES = [
  "Jaipur",
  "Delhi",
  "Mumbai",
  "Ahmedabad",
  "Pune",
  "Bengaluru",
  "Hyderabad",
  "Lucknow",
];

function formatAadhaar(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 12);
  const parts = [];
  if (digits.length > 0) parts.push(digits.slice(0, 4));
  if (digits.length > 4) parts.push(digits.slice(4, 8));
  if (digits.length > 8) parts.push(digits.slice(8, 12));
  return parts.join(" ");
}

function aadhaarDigits(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 12);
}

function formatLicense(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9/-]/g, "")
    .slice(0, 24);
}

function isValidLicense(value) {
  return /^[A-Z0-9][A-Z0-9/-]{4,23}$/.test(value);
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export default function Registration() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "RETAILER",
    phone: "",
    otp: "",
    aadhaarNumber: "",
    shopName: "",
    shopAddress: "",
    licenseNumber: "",
    vehicleType: "",
    vehicleNumber: "",
    drivingLicenseNumber: "",
    city: "",
    adminCode: "",
  });
  const [aadhaarImage, setAadhaarImage] = useState(null);
  const [shopLicenseImage, setShopLicenseImage] = useState(null);
  const [aadhaarPreview, setAadhaarPreview] = useState("");
  const [licensePreview, setLicensePreview] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleFromQuery = searchParams.get("role");
  const roleLocked = roleFromQuery && VALID_ROLES.includes(roleFromQuery);
  const needsPhoneOtp = formData.role !== "ADMIN";
  const needsDocs = formData.role === "RETAILER" || formData.role === "WHOLESALER";

  useEffect(() => {
    const r = searchParams.get("role");
    if (r && VALID_ROLES.includes(r)) {
      setFormData((prev) => ({ ...prev, role: r }));
    }
  }, [searchParams]);

  const setField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    setSubmitError("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "aadhaarNumber") {
      setField(name, formatAadhaar(value));
      return;
    }
    if (name === "licenseNumber") {
      setField(name, formatLicense(value));
      return;
    }
    if (name === "phone") {
      setField(name, value.replace(/\D/g, "").slice(0, 10));
      setOtpSent(false);
      setDevOtp("");
      return;
    }
    if (name === "otp") {
      setField(name, value.replace(/\D/g, "").slice(0, 6));
      return;
    }
    setField(name, value);
  };

  const onFile = (kind, file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFieldErrors((prev) => ({ ...prev, [kind]: "Upload an image file" }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((prev) => ({ ...prev, [kind]: "Max size 5 MB" }));
      return;
    }
    const preview = URL.createObjectURL(file);
    if (kind === "aadhaarImage") {
      setAadhaarImage(file);
      setAadhaarPreview(preview);
    } else {
      setShopLicenseImage(file);
      setLicensePreview(preview);
    }
    setFieldErrors((prev) => ({ ...prev, [kind]: "" }));
  };

  const sendOtp = async () => {
    setSubmitError("");
    if (!isValidIndianPhone(formData.phone)) {
      setFieldErrors((prev) => ({ ...prev, phone: "Invalid 10-digit mobile" }));
      return;
    }
    setOtpLoading(true);
    try {
      const check = await axios.post(`${API_BASE}/auth/check-phone`, { phone: formData.phone });
      if (check.data.exists) {
        setSubmitError("This phone is already registered. Please sign in.");
        return;
      }
      const res = await axios.post(`${API_BASE}/auth/otp/send`, {
        phone: formData.phone,
        purpose: "register",
      });
      setOtpSent(true);
      setDevOtp(res.data.devOtp || "");
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Could not send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const validate = () => {
    const next = {};
    if (!formData.name.trim()) next.name = "Required";
    if (!isValidEmail(formData.email)) next.email = "Invalid email";
    if (!isValidIndianPhone(formData.phone)) next.phone = "Invalid 10-digit mobile";
    const pwErrors = getPasswordErrors(formData.password);
    if (pwErrors.length) next.password = pwErrors[0];
    if (formData.password !== formData.confirmPassword) {
      next.confirmPassword = "Passwords do not match";
    }
    if (needsPhoneOtp && formData.otp.length !== 6) next.otp = "Enter 6-digit OTP";

    if (needsDocs) {
      if (aadhaarDigits(formData.aadhaarNumber).length !== 12) {
        next.aadhaarNumber = "Must be 12 digits (XXXX XXXX XXXX)";
      }
      if (!formData.shopName.trim()) next.shopName = "Required";
      if (!formData.shopAddress.trim()) next.shopAddress = "Required";
      if (!isValidLicense(formData.licenseNumber)) {
        next.licenseNumber = "Use format like 20B/1234/2024";
      }
      if (!formData.city) next.city = "Select a city";
      if (!aadhaarImage) next.aadhaarImage = "Aadhaar card photo is required";
      if (!shopLicenseImage) next.shopLicenseImage = "Shop licence photo is required";
    }

    if (formData.role === "DELIVERY") {
      if (!formData.vehicleType.trim()) next.vehicleType = "Required";
      if (!formData.vehicleNumber.trim()) next.vehicleNumber = "Required";
      if (!formData.drivingLicenseNumber.trim()) next.drivingLicenseNumber = "Required";
      if (!formData.city) next.city = "Select a city";
    }

    if (formData.role === "ADMIN" && !formData.adminCode.trim()) {
      next.adminCode = "Required";
    }

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const profile = {
        aadhaarNumber: aadhaarDigits(formData.aadhaarNumber),
        shopName: formData.shopName.trim(),
        shopAddress: formData.shopAddress.trim(),
        licenseNumber: formData.licenseNumber.trim(),
        vehicleType: formData.vehicleType.trim(),
        vehicleNumber: formData.vehicleNumber.trim().toUpperCase(),
        drivingLicenseNumber: formData.drivingLicenseNumber.trim().toUpperCase(),
        city: formData.city,
        adminCode: formData.adminCode.trim(),
      };

      const body = new FormData();
      body.append("name", formData.name.trim());
      body.append("email", formData.email.trim().toLowerCase());
      body.append("password", formData.password);
      body.append("role", formData.role);
      body.append("phone", formData.phone);
      if (needsPhoneOtp) body.append("otp", formData.otp);
      body.append("profile", JSON.stringify(profile));
      if (aadhaarImage) body.append("aadhaarImage", aadhaarImage);
      if (shopLicenseImage) body.append("shopLicenseImage", shopLicenseImage);

      await axios.post(`${API_BASE}/auth/register`, body);
      navigate(`/signin?portal=${formData.role}`, {
        replace: true,
        state: {
          registered: true,
          askLocation: formData.role === "RETAILER" || formData.role === "WHOLESALER",
        },
      });
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (name) =>
    `w-full border rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
      fieldErrors[name] ? "border-red-400 bg-red-50/50" : "border-slate-200"
    }`;

  const citySelect = (
    <Field label="City" error={fieldErrors.city}>
      <select name="city" className={inputClass("city")} value={formData.city} onChange={handleChange}>
        <option value="">Select city</option>
        {CITIES.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </Field>
  );

  return (
    <AuthLayout authMode="register">
      <h2 className="text-xl font-bold text-slate-900 mb-5">Register</h2>
      {roleLocked && (
        <div className="mb-4 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-900 text-sm px-4 py-2">
          {ROLE_LABELS[formData.role]}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {submitError && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2 border border-red-200">
            {submitError}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full name" error={fieldErrors.name}>
            <input type="text" name="name" className={inputClass("name")} value={formData.name} onChange={handleChange} />
          </Field>
          <Field label="Email" error={fieldErrors.email}>
            <input type="email" name="email" className={inputClass("email")} value={formData.email} onChange={handleChange} />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Mobile" error={fieldErrors.phone}>
            <input type="tel" name="phone" className={inputClass("phone")} value={formData.phone} onChange={handleChange} maxLength={10} />
          </Field>
          {!roleLocked ? (
            <Field label="Account type" error={fieldErrors.role}>
              <select name="role" className={inputClass("role")} value={formData.role} onChange={handleChange}>
                <option value="RETAILER">Retailer</option>
                <option value="WHOLESALER">Wholesaler</option>
                <option value="DELIVERY">Delivery</option>
                <option value="ADMIN">Admin</option>
              </select>
            </Field>
          ) : (
            <div />
          )}
        </div>

        {needsPhoneOtp && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[140px]">
                <Field label="Phone OTP" error={fieldErrors.otp}>
                  <input
                    type="text"
                    name="otp"
                    className={inputClass("otp")}
                    value={formData.otp}
                    onChange={handleChange}
                    maxLength={6}
                    placeholder="6-digit code"
                  />
                </Field>
              </div>
              <button
                type="button"
                onClick={sendOtp}
                disabled={otpLoading}
                className="px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-50"
              >
                {otpLoading ? "Sending…" : otpSent ? "Resend OTP" : "Send OTP"}
              </button>
            </div>
            {devOtp && (
              <p className="text-xs text-emerald-700 font-mono">Dev OTP: {devOtp}</p>
            )}
            <p className="text-xs text-slate-500">
              We verify your mobile before creating the account. In development the OTP is shown here.
            </p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Password" error={fieldErrors.password}>
            <input type="password" name="password" className={inputClass("password")} value={formData.password} onChange={handleChange} autoComplete="new-password" />
          </Field>
          <Field label="Confirm password" error={fieldErrors.confirmPassword}>
            <input type="password" name="confirmPassword" className={inputClass("confirmPassword")} value={formData.confirmPassword} onChange={handleChange} autoComplete="new-password" />
          </Field>
        </div>

        {needsDocs && (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Aadhaar (XXXX XXXX XXXX)" error={fieldErrors.aadhaarNumber}>
                <input
                  type="text"
                  name="aadhaarNumber"
                  inputMode="numeric"
                  className={inputClass("aadhaarNumber")}
                  value={formData.aadhaarNumber}
                  onChange={handleChange}
                  maxLength={14}
                />
              </Field>
              <Field label="Registered shop name" error={fieldErrors.shopName}>
                <input type="text" name="shopName" className={inputClass("shopName")} value={formData.shopName} onChange={handleChange} />
              </Field>
            </div>

            <Field label="Shop address" error={fieldErrors.shopAddress}>
              <input type="text" name="shopAddress" className={inputClass("shopAddress")} value={formData.shopAddress} onChange={handleChange} />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Drug licence (e.g. 20B/1234/2024)" error={fieldErrors.licenseNumber}>
                <input type="text" name="licenseNumber" className={inputClass("licenseNumber")} value={formData.licenseNumber} onChange={handleChange} />
              </Field>
              {citySelect}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Aadhaar card photo" error={fieldErrors.aadhaarImage}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="w-full text-sm text-slate-600"
                  onChange={(e) => onFile("aadhaarImage", e.target.files?.[0])}
                />
                {aadhaarPreview && (
                  <img src={aadhaarPreview} alt="Aadhaar preview" className="mt-2 h-24 rounded-lg object-cover border" />
                )}
              </Field>
              <Field label="Shop licence photo" error={fieldErrors.shopLicenseImage}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="w-full text-sm text-slate-600"
                  onChange={(e) => onFile("shopLicenseImage", e.target.files?.[0])}
                />
                {licensePreview && (
                  <img src={licensePreview} alt="Licence preview" className="mt-2 h-24 rounded-lg object-cover border" />
                )}
              </Field>
            </div>
          </>
        )}

        {formData.role === "DELIVERY" && (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Vehicle type" error={fieldErrors.vehicleType}>
                <input type="text" name="vehicleType" className={inputClass("vehicleType")} value={formData.vehicleType} onChange={handleChange} />
              </Field>
              <Field label="Vehicle number" error={fieldErrors.vehicleNumber}>
                <input type="text" name="vehicleNumber" className={inputClass("vehicleNumber")} value={formData.vehicleNumber} onChange={handleChange} />
              </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Driving licence" error={fieldErrors.drivingLicenseNumber}>
                <input type="text" name="drivingLicenseNumber" className={inputClass("drivingLicenseNumber")} value={formData.drivingLicenseNumber} onChange={handleChange} />
              </Field>
              {citySelect}
            </div>
          </>
        )}

        {formData.role === "ADMIN" && (
          <Field label="Admin code" error={fieldErrors.adminCode}>
            <input type="password" name="adminCode" className={inputClass("adminCode")} value={formData.adminCode} onChange={handleChange} />
          </Field>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition shadow-md"
        >
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
