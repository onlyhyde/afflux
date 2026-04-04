import { describe, it, expect, vi, beforeEach } from "vitest";
import { exchangeCodeForToken, refreshAccessToken, getValidAccessToken } from "./tiktok-auth";

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock DB
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
vi.mock("@/lib/db", () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}));

describe("TikTok Auth Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("TIKTOK_APP_KEY", "test-app-key");
    vi.stubEnv("TIKTOK_APP_SECRET", "test-app-secret");
  });

  describe("exchangeCodeForToken", () => {
    it("should exchange auth code for access token", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              access_token: "at_123",
              refresh_token: "rt_456",
              access_token_expire_in: 86400,
            },
          }),
      });

      const result = await exchangeCodeForToken("auth_code_xyz");

      expect(result.accessToken).toBe("at_123");
      expect(result.refreshToken).toBe("rt_456");
      expect(result.expiresIn).toBe(86400);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("token/get"),
        expect.objectContaining({ method: "POST" })
      );
    });

    it("should throw on API error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: "Invalid code" }),
      });

      await expect(exchangeCodeForToken("bad_code")).rejects.toThrow();
    });
  });

  describe("refreshAccessToken", () => {
    it("should refresh an expired access token", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              access_token: "at_new",
              refresh_token: "rt_new",
              access_token_expire_in: 86400,
            },
          }),
      });

      const result = await refreshAccessToken("rt_old");

      expect(result.accessToken).toBe("at_new");
      expect(result.refreshToken).toBe("rt_new");
    });
  });

  describe("getValidAccessToken", () => {
    it("should return existing token if not expired", async () => {
      const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: "shop-1",
                accessToken: "at_valid",
                refreshToken: "rt_valid",
                tokenExpiresAt: futureDate,
              },
            ]),
          }),
        }),
      });

      const token = await getValidAccessToken("shop-1");
      expect(token).toBe("at_valid");
      expect(mockFetch).not.toHaveBeenCalled(); // No refresh needed
    });

    it("should refresh token if about to expire", async () => {
      const soonDate = new Date(Date.now() + 60000); // 1 min from now (within buffer)
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: "shop-1",
                accessToken: "at_old",
                refreshToken: "rt_old",
                tokenExpiresAt: soonDate,
              },
            ]),
          }),
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              access_token: "at_refreshed",
              refresh_token: "rt_refreshed",
              access_token_expire_in: 86400,
            },
          }),
      });

      mockUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{}]),
          }),
        }),
      });

      const token = await getValidAccessToken("shop-1");
      expect(token).toBe("at_refreshed");
      expect(mockFetch).toHaveBeenCalled();
    });
  });
});
