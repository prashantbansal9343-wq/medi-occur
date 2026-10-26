/** Basic RFC-style email check */
export function isValidEmail(email) {
  const trimmed = (email || "").trim();
  if (!trimmed) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/** India mobile: 10 digits, starts with 6–9 (optional +91 / spaces) */
export function isValidIndianPhone(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(local);
}

/**
 * Standard password: min 8, upper, lower, digit, special char
 */
export function getPasswordErrors(password) {
  const errors = [];
  if (!password || password.length < 8) {
    errors.push("At least 8 characters");
  }
  if (!/[a-z]/.test(password || "")) {
    errors.push("One lowercase letter");
  }
  if (!/[A-Z]/.test(password || "")) {
    errors.push("One uppercase letter");
  }
  if (!/\d/.test(password || "")) {
    errors.push("One number");
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password || "")) {
    errors.push("One special character (!@#$…)");
  }
  return errors;
}

export function isStrongPassword(password) {
  return getPasswordErrors(password).length === 0;
}
