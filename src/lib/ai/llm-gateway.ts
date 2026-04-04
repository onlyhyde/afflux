import { db } from "@/lib/db";
import { aiUsageLogs } from "@/lib/db/schema";

export interface LLMRequest {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  tenantId: string;
  userId?: string;
  feature: string;
}

export interface LLMResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  durationMs: number;
}

/**
 * AI Gateway — calls Claude API and logs usage.
 * Centralizes all LLM calls for cost tracking and monitoring.
 */
export async function generateWithLLM(request: LLMRequest): Promise<LLMResponse> {
  const model = request.model ?? "claude-sonnet-4-20250514";
  const startTime = Date.now();

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: request.maxTokens ?? 1024,
      temperature: request.temperature ?? 0.7,
      system: request.systemPrompt,
      messages: [{ role: "user", content: request.prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message ?? `LLM API error: ${response.status}`);
  }

  const data = await response.json();
  const durationMs = Date.now() - startTime;

  const result: LLMResponse = {
    text: data.content[0]?.text ?? "",
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
    model,
    durationMs,
  };

  // Log usage to database (fire and forget)
  db.insert(aiUsageLogs)
    .values({
      tenantId: request.tenantId,
      userId: request.userId,
      feature: request.feature,
      model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      durationMs,
    })
    .catch((err) => console.error("Failed to log AI usage:", err));

  return result;
}
