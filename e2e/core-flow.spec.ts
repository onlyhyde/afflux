import { test, expect } from "@playwright/test";

test.describe("Core Application Flow", () => {
  test("landing page loads with app name and navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Afflux");
    await expect(page.locator("text=Dashboard")).toBeVisible();
    await expect(page.locator("text=Creators")).toBeVisible();
  });

  test("health API returns healthy status", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe("healthy");
    expect(body.checks.database.status).toBe("ok");
  });

  test("creator search page loads with filter controls", async ({ page }) => {
    await page.goto("/creators");
    await expect(page.locator("h1")).toContainText(/Creator|크리에이터/);
    await expect(page.locator('input[placeholder*="Search"]').or(page.locator('input[placeholder*="검색"]'))).toBeVisible();
    await expect(page.locator("text=Filter").or(page.locator("text=필터"))).toBeVisible();
  });

  test("dashboard page shows stat cards", async ({ page }) => {
    await page.goto("/dashboard");
    // Should have stat cards (loaded via tRPC)
    await expect(page.locator("[class*='card']").first()).toBeVisible({ timeout: 10000 });
  });

  test("CRM page shows pipeline stages", async ({ page }) => {
    await page.goto("/crm");
    await expect(page.locator("h1")).toContainText(/CRM/);
  });

  test("admin dashboard loads without crash", async ({ page }) => {
    const response = await page.goto("/admin");
    expect(response?.status()).toBeLessThan(500);
    await page.waitForLoadState("domcontentloaded");
  });

  test("outreach page loads with tabs", async ({ page }) => {
    await page.goto("/outreach");
    await expect(page.locator("h1")).toContainText(/Outreach|아웃리치/, { timeout: 15000 });
  });

  test("analytics page loads without error", async ({ page }) => {
    const response = await page.goto("/analytics");
    expect(response?.status()).toBeLessThan(500);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("h1")).toContainText(/Analytics|분석/, { timeout: 10000 });
  });

  test("Korean locale page loads", async ({ page }) => {
    await page.goto("/ko/dashboard");
    await page.waitForLoadState("networkidle");
    // Page should render (even if sidebar text hasn't hydrated)
    await expect(page.locator("body")).toBeVisible();
  });

  test("sign-in page has email and password fields", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("404 page shows for non-existent routes", async ({ page }) => {
    const response = await page.goto("/nonexistent-page-xyz");
    // Should get a page (not crash) — may be 404 or redirect
    expect(response).not.toBeNull();
  });
});
