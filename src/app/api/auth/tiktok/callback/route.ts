import { db } from "@/lib/db";
import { shops } from "@/lib/db/schema";
import { exchangeCodeForToken } from "@/server/services/tiktok-auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // Contains tenantId

  if (!code || !state) {
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=missing_params`
    );
  }

  try {
    const tokens = await exchangeCodeForToken(code);

    // Create or update shop with TikTok tokens
    await db.insert(shops).values({
      tenantId: state, // state param carries tenantId
      name: "TikTok Shop", // Will be updated on first sync
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
    });

    return Response.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?tiktok=connected`
    );
  } catch (error) {
    console.error("TikTok OAuth callback error:", error);
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=tiktok_auth_failed`
    );
  }
}
