import { describe, it, expect } from "vitest";

/**
 * TDD: outreach-view should use toast notifications
 * instead of window.alert() for campaign start success/error feedback.
 */

describe("outreach-view toast notifications", () => {
  it("should not contain alert() calls in outreach-view source", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync(
      "src/components/outreach/outreach-view.tsx",
      "utf-8"
    );
    expect(source).not.toMatch(/\balert\s*\(/);
  });

  it("should import toast from sonner in outreach-view", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync(
      "src/components/outreach/outreach-view.tsx",
      "utf-8"
    );
    expect(source).toMatch(/from\s+["']sonner["']/);
  });

  it("should call toast.success for campaign start", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync(
      "src/components/outreach/outreach-view.tsx",
      "utf-8"
    );
    expect(source).toMatch(/toast\.success\(/);
  });

  it("should call toast.error for campaign start failure", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync(
      "src/components/outreach/outreach-view.tsx",
      "utf-8"
    );
    expect(source).toMatch(/toast\.error\(/);
  });

  it("should have Toaster component in a layout file", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync(
      "src/app/[locale]/(dashboard)/layout.tsx",
      "utf-8"
    );
    expect(source).toMatch(/Toaster/);
  });
});
