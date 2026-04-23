import { createHmac, timingSafeEqual } from "crypto";

export const ACCESS_COOKIE_NAME = "gdpr_auditor_access";
const ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getAccessSecret() {
  return (
    process.env.ACCESS_COOKIE_SECRET ??
    process.env.STRIPE_WEBHOOK_SECRET ??
    "local-dev-access-secret-change-me"
  );
}

function sign(value: string) {
  return createHmac("sha256", getAccessSecret()).update(value).digest("hex");
}

export function createAccessToken(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const expiresAt = Date.now() + ACCESS_MAX_AGE_SECONDS * 1000;
  const payload = `${normalizedEmail}:${expiresAt}`;
  const signature = sign(payload);
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export function hasValidAccessToken(token?: string) {
  if (!token) {
    return false;
  }

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [email, expiresAtText, providedSignature] = decoded.split(":");

    if (!email || !expiresAtText || !providedSignature) {
      return false;
    }

    const payload = `${email}:${expiresAtText}`;
    const expected = sign(payload);

    if (expected.length !== providedSignature.length) {
      return false;
    }

    const isValidSignature = timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(providedSignature)
    );

    if (!isValidSignature) {
      return false;
    }

    const expiresAt = Number(expiresAtText);
    if (Number.isNaN(expiresAt)) {
      return false;
    }

    return Date.now() < expiresAt;
  } catch {
    return false;
  }
}

export function getAccessMaxAgeSeconds() {
  return ACCESS_MAX_AGE_SECONDS;
}
