import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateWithLLM, type LLMRequest } from "./llm-gateway";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock AI usage logging
const mockInsert = vi.fn().mockReturnValue({
  values: vi.fn().mockResolvedValue([]),
});
vi.mock("@/lib/db", () => ({
  db: { insert: (...args: unknown[]) => mockInsert(...args) },
}));

describe("LLM Gateway", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
  });

  it("should call Claude API and return generated text", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          content: [{ type: "text", text: "Hi Sarah! Love your content..." }],
          usage: { input_tokens: 150, output_tokens: 50 },
        }),
    });

    const request: LLMRequest = {
      prompt: "Generate an outreach message",
      model: "claude-sonnet-4-20250514",
      maxTokens: 300,
      tenantId: "t1",
      feature: "outreach_message",
    };

    const result = await generateWithLLM(request);

    expect(result.text).toBe("Hi Sarah! Love your content...");
    expect(result.inputTokens).toBe(150);
    expect(result.outputTokens).toBe(50);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.anthropic.com/v1/messages",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "x-api-key": "test-key",
        }),
      })
    );
  });

  it("should log AI usage to database", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          content: [{ type: "text", text: "Generated text" }],
          usage: { input_tokens: 100, output_tokens: 30 },
        }),
    });

    await generateWithLLM({
      prompt: "Test",
      model: "claude-sonnet-4-20250514",
      maxTokens: 100,
      tenantId: "t1",
      feature: "test_feature",
    });

    expect(mockInsert).toHaveBeenCalled();
  });

  it("should throw on API error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error: { message: "Rate limited" } }),
    });

    await expect(
      generateWithLLM({
        prompt: "Test",
        model: "claude-sonnet-4-20250514",
        maxTokens: 100,
        tenantId: "t1",
        feature: "test",
      })
    ).rejects.toThrow("Rate limited");
  });
});
