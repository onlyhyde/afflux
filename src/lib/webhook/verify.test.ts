import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { verifyTikTokSignature, verifyStripeSignature } from "./verify";

describe("verifyTikTokSignature", () => {
  const secret = "test-tiktok-secret";

  it("should return true for valid signature", () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const body = '{"type":"ORDER_STATUS_CHANGE","data":{}}';
    const expected = crypto
      .createHmac("sha256", secret)
      .update(timestamp + body)
      .digest("hex");

    expect(verifyTikTokSignature(body, expected, timestamp, secret)).toBe(true);
  });

  it("should return false for invalid signature", () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const body = '{"type":"ORDER_STATUS_CHANGE"}';
    expect(verifyTikTokSignature(body, "invalid-sig", timestamp, secret)).toBe(false);
  });

  it("should return false for expired timestamp (>5 minutes)", () => {
    const oldTimestamp = String(Math.floor(Date.now() / 1000) - 600); // 10 min ago
    const body = '{}';
    const sig = crypto
      .createHmac("sha256", secret)
      .update(oldTimestamp + body)
      .digest("hex");

    expect(verifyTikTokSignature(body, sig, oldTimestamp, secret)).toBe(false);
  });
});

describe("verifyStripeSignature", () => {
  const secret = "whsec_test_stripe_secret";

  it("should return true for valid Stripe signature", () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const body = '{"id":"evt_123","type":"payment_intent.succeeded"}';
    const signedPayload = `${timestamp}.${body}`;
    const sig = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");
    const header = `t=${timestamp},v1=${sig}`;

    expect(verifyStripeSignature(body, header, secret)).toBe(true);
  });

  it("should return false for invalid signature", () => {
    expect(verifyStripeSignature("{}", "t=123,v1=invalid", secret)).toBe(false);
  });

  it("should return false for expired timestamp", () => {
    const oldTimestamp = String(Math.floor(Date.now() / 1000) - 600);
    const body = '{}';
    const signedPayload = `${oldTimestamp}.${body}`;
    const sig = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");
    const header = `t=${oldTimestamp},v1=${sig}`;

    expect(verifyStripeSignature(body, header, secret)).toBe(false);
  });
});
