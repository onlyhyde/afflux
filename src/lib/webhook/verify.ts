import crypto from "crypto";

const MAX_TIMESTAMP_AGE_SECONDS = 300; // 5 minutes

/**
 * Verify TikTok Shop webhook signature.
 * Signature = HMAC-SHA256(secret, timestamp + body)
 */
export function verifyTikTokSignature(
  body: string,
  signature: string,
  timestamp: string,
  secret: string
): boolean {
  // Check timestamp freshness
  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp);
  if (age > MAX_TIMESTAMP_AGE_SECONDS) return false;

  // Compute expected signature
  const expected = crypto
    .createHmac("sha256", secret)
    .update(timestamp + body)
    .digest("hex");

  // Timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Verify Stripe webhook signature.
 * Header format: t=timestamp,v1=signature
 * Signature = HMAC-SHA256(secret, timestamp.body)
 */
export function verifyStripeSignature(
  body: string,
  header: string,
  secret: string
): boolean {
  // Parse header
  const parts = header.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
  const sig = parts.find((p) => p.startsWith("v1="))?.slice(3);

  if (!timestamp || !sig) return false;

  // Check timestamp freshness
  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp);
  if (age > MAX_TIMESTAMP_AGE_SECONDS) return false;

  // Compute expected signature
  const signedPayload = `${timestamp}.${body}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  // Timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(sig, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}
