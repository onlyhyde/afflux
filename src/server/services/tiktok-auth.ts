import { db } from "@/lib/db";
import { shops } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const TIKTOK_AUTH_BASE = "https://auth.tiktok-shops.com/api/v2";
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Exchange OAuth authorization code for access/refresh tokens.
 */
export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const response = await fetch(`${TIKTOK_AUTH_BASE}/token/get`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_key: process.env.TIKTOK_APP_KEY,
      app_secret: process.env.TIKTOK_APP_SECRET,
      auth_code: code,
      grant_type: "authorized_code",
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`TikTok token exchange failed: ${err.message ?? response.status}`);
  }

  const data = await response.json();
  return {
    accessToken: data.data.access_token,
    refreshToken: data.data.refresh_token,
    expiresIn: data.data.access_token_expire_in,
  };
}

/**
 * Refresh an expired access token using the refresh token.
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const response = await fetch(`${TIKTOK_AUTH_BASE}/token/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_key: process.env.TIKTOK_APP_KEY,
      app_secret: process.env.TIKTOK_APP_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`TikTok token refresh failed: ${err.message ?? response.status}`);
  }

  const data = await response.json();
  return {
    accessToken: data.data.access_token,
    refreshToken: data.data.refresh_token,
    expiresIn: data.data.access_token_expire_in,
  };
}

/**
 * Get a valid access token for a shop. Automatically refreshes if expired.
 */
export async function getValidAccessToken(shopId: string): Promise<string> {
  const result = await db
    .select()
    .from(shops)
    .where(eq(shops.id, shopId))
    .limit(1);

  const shop = result[0];
  if (!shop) throw new Error(`Shop not found: ${shopId}`);
  if (!shop.accessToken) throw new Error(`Shop has no access token: ${shopId}`);

  // Check if token is still valid (with buffer)
  if (
    shop.tokenExpiresAt &&
    shop.tokenExpiresAt.getTime() - TOKEN_REFRESH_BUFFER_MS > Date.now()
  ) {
    return shop.accessToken;
  }

  // Token expired or about to expire — refresh it
  if (!shop.refreshToken) throw new Error(`Shop has no refresh token: ${shopId}`);

  const newTokens = await refreshAccessToken(shop.refreshToken);

  // Update DB
  await db
    .update(shops)
    .set({
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      tokenExpiresAt: new Date(Date.now() + newTokens.expiresIn * 1000),
      updatedAt: new Date(),
    })
    .where(eq(shops.id, shopId));

  return newTokens.accessToken;
}
