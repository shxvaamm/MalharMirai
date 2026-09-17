import { WORLD_COUNTRY_CODES } from "./country-codes";

/**
 * Disposable / Temporary Email Domains Blacklist
 */
export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "yopmail.com",
  "yopmail.net",
  "yopmail.fr",
  "tempmail.com",
  "temp-mail.org",
  "temp-mail.io",
  "tempmailo.com",
  "tempail.com",
  "mailinator.com",
  "mailinator2.com",
  "10minutemail.com",
  "10minutemail.net",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamailblock.com",
  "sharklasers.com",
  "grr.la",
  "trashmail.com",
  "trashmail.net",
  "trashmail.org",
  "dispostable.com",
  "fakeinbox.com",
  "burnermail.io",
  "crazymailing.com",
  "generator.email",
  "mytemp.email",
  "mohmal.com",
  "nada.ltd",
  "getnada.com",
  "inboxkitten.com",
  "emailondeck.com",
  "throwawaymail.com",
  "getairmail.com",
  "maildrop.cc",
  "fakemailgenerator.com",
  "dropmail.me",
  "harakirimail.com",
  "discard.email",
  "spamgourmet.com",
  "mintemail.com",
  "jetable.org",
  "tempinbox.com",
  "tempmailgen.com",
  "crazymail.com",
]);

/**
 * Validates email with strict format and disposable domain rejection
 */
export function validateEmail(emailInput: string): {
  valid: boolean;
  error?: string;
  normalizedEmail: string;
} {
  const email = (emailInput || "").trim().toLowerCase();

  if (!email) {
    return {
      valid: false,
      error: "Email address is required.",
      normalizedEmail: "",
    };
  }

  // Standard RFC-compliant email regex pattern
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return {
      valid: false,
      error: "Please enter a valid email address (e.g. name@example.com).",
      normalizedEmail: email,
    };
  }

  const parts = email.split("@");
  if (parts.length !== 2) {
    return {
      valid: false,
      error: "Invalid email structure.",
      normalizedEmail: email,
    };
  }

  const domain = parts[1].toLowerCase();

  // Check against disposable / temporary email domains
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return {
      valid: false,
      error:
        "Temporary/disposable email addresses are not permitted. Please use a trusted provider (Gmail, Outlook, Yahoo) or educational/work email.",
      normalizedEmail: email,
    };
  }

  // Check for common typo domains or invalid TLD
  if (domain.endsWith(".test") || domain.endsWith(".invalid") || domain.endsWith(".example")) {
    return {
      valid: false,
      error: "Please enter an active, reachable email address domain.",
      normalizedEmail: email,
    };
  }

  return {
    valid: true,
    normalizedEmail: email,
  };
}

/**
 * Validates phone number based on country code:
 * - India (+91): Exactly 10 digits starting with 6, 7, 8, or 9
 * - International (E.164): 4 to 15 digits
 */
export function validatePhoneNumber(
  phoneInput: string,
  countryDialCode: string = "+91"
): {
  valid: boolean;
  error?: string;
  formattedNumber: string;
  cleanedDigits: string;
} {
  const raw = (phoneInput || "").trim();

  if (!raw) {
    return {
      valid: false,
      error: "Phone number is required.",
      formattedNumber: "",
      cleanedDigits: "",
    };
  }

  // Remove whitespace, dashes, parens, and leading '+' if typed in
  let cleaned = raw.replace(/[\s\-()]/g, "");

  // If user included the dial code in the number input, strip it for validation
  const normalizedDialCode = countryDialCode.startsWith("+")
    ? countryDialCode
    : `+${countryDialCode}`;
  const dialDigits = normalizedDialCode.replace("+", "");

  if (cleaned.startsWith(normalizedDialCode)) {
    cleaned = cleaned.slice(normalizedDialCode.length);
  } else if (cleaned.startsWith(`00${dialDigits}`)) {
    cleaned = cleaned.slice((`00${dialDigits}`).length);
  } else if (cleaned.startsWith(dialDigits) && cleaned.length > 10 && normalizedDialCode === "+91") {
    cleaned = cleaned.slice(dialDigits.length);
  }

  // Remove any leading zero for local formats
  if (normalizedDialCode === "+91" && cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }

  const digitsOnly = cleaned.replace(/\D/g, "");

  // Rule 1: India (+91)
  if (normalizedDialCode === "+91") {
    if (digitsOnly.length !== 10) {
      return {
        valid: false,
        error: `Indian mobile number must be exactly 10 digits (currently ${digitsOnly.length} digits).`,
        formattedNumber: `${normalizedDialCode} ${digitsOnly}`,
        cleanedDigits: digitsOnly,
      };
    }

    if (!/^[6-9]/.test(digitsOnly)) {
      return {
        valid: false,
        error: "Indian mobile number must start with 6, 7, 8, or 9.",
        formattedNumber: `${normalizedDialCode} ${digitsOnly}`,
        cleanedDigits: digitsOnly,
      };
    }

    return {
      valid: true,
      formattedNumber: `+91 ${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5)}`,
      cleanedDigits: digitsOnly,
    };
  }

  // Rule 2: Other International Countries (E.164 standard: 4 to 15 digits)
  if (digitsOnly.length < 4 || digitsOnly.length > 15) {
    return {
      valid: false,
      error: `International phone number must contain 4–15 digits (currently ${digitsOnly.length} digits).`,
      formattedNumber: `${normalizedDialCode} ${digitsOnly}`,
      cleanedDigits: digitsOnly,
    };
  }

  return {
    valid: true,
    formattedNumber: `${normalizedDialCode} ${digitsOnly}`,
    cleanedDigits: digitsOnly,
  };
}
