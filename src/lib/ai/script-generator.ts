import { generateWithLLM } from "./llm-gateway";

export interface ScriptRequest {
  productName: string;
  productDescription: string;
  category: string;
  targetAudience: string;
  contentStyle: string; // review, tutorial, unboxing, grwm, etc.
  duration: number; // seconds (15, 30, 60)
  tenantId: string;
  locale: string;
}

export interface ScriptResult {
  script: string;
  locale: string;
  estimatedDuration: number;
}

const STYLE_DESCRIPTIONS: Record<string, string> = {
  review: "honest product review with personal experience",
  tutorial: "step-by-step how-to guide showing the product in use",
  unboxing: "first impressions unboxing and trying the product",
  grwm: "Get Ready With Me format incorporating the product naturally",
  comparison: "comparing this product against alternatives",
  "before-after": "showing transformation results from using the product",
  haul: "shopping haul featuring multiple products including this one",
  vlog: "day-in-the-life vlog naturally featuring the product",
};

export async function generateScript(request: ScriptRequest): Promise<ScriptResult> {
  const styleDesc = STYLE_DESCRIPTIONS[request.contentStyle] ?? request.contentStyle;
  const langInstruction =
    request.locale === "ko"
      ? "Write the script entirely in natural Korean (한국어)."
      : request.locale === "ja"
        ? "Write the script entirely in natural Japanese (日本語)."
        : "Write the script in natural English.";

  const prompt = `Generate a TikTok/Shorts UGC video script for the following product:

Product: ${request.productName}
Description: ${request.productDescription}
Category: ${request.category}
Target Audience: ${request.targetAudience}
Content Style: ${styleDesc}
Duration: ${request.duration} seconds

${langInstruction}

Structure the script with:
- Hook (first 3 seconds — grab attention)
- Body (main content — show/demo the product)
- CTA (call to action — direct to purchase)

Include visual/action directions in [brackets].
Keep it natural and conversational, not scripted-sounding.`;

  const result = await generateWithLLM({
    prompt,
    systemPrompt:
      "You are an expert UGC content strategist who creates viral TikTok scripts. Your scripts feel authentic and drive conversions.",
    maxTokens: 1024,
    temperature: 0.8,
    tenantId: request.tenantId,
    feature: "script_generation",
  });

  return {
    script: result.text,
    locale: request.locale,
    estimatedDuration: request.duration,
  };
}
