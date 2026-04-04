/**
 * AI Message Generator
 *
 * Generates personalized outreach messages for creators based on
 * their profile, the product, and the target locale.
 *
 * In production, this calls an LLM (Claude API). For now, it uses
 * template-based generation as a fallback.
 */

export interface MessageGenerationInput {
  creatorName: string;
  creatorCategory: string;
  creatorUsername: string;
  productName: string;
  productDescription: string;
  commissionRate: number;
  brandName: string;
  locale: string;
  tone: "formal" | "casual" | "friendly";
  channel: "tiktok_dm" | "email" | "tiktok_invite";
}

export interface GeneratedMessage {
  subject?: string;
  body: string;
  locale: string;
  characterCount: number;
}

const TEMPLATES: Record<string, Record<string, { subject?: string; body: string }>> = {
  en: {
    tiktok_dm: {
      body: `Hi {{creatorName}}! 👋

I've been following your {{creatorCategory}} content and love what you create. We're {{brandName}} and we think {{productName}} would be a perfect fit for your audience.

We're offering {{commissionRate}}% commission on every sale. Would you be interested in a collaboration?

Let me know and I'll send over the details! 🎉`,
    },
    email: {
      subject: "Partnership opportunity with {{brandName}} — {{commissionRate}}% commission",
      body: `Hi {{creatorName}},

I'm reaching out from {{brandName}}. I've been impressed by your {{creatorCategory}} content on TikTok (@{{creatorUsername}}) and believe our {{productName}} would resonate well with your audience.

Here's what we're offering:
• {{commissionRate}}% commission on every sale
• Free product samples
• Creative freedom on content

{{productDescription}}

Would you be open to discussing a collaboration? I'd love to share more details.

Best regards,
{{brandName}} Team`,
    },
    tiktok_invite: {
      body: `Hi {{creatorName}}! We'd love to collaborate with you on {{productName}}. {{commissionRate}}% commission per sale. Check it out! 🚀`,
    },
  },
  ko: {
    tiktok_dm: {
      body: `안녕하세요 {{creatorName}}님! 👋

{{creatorCategory}} 콘텐츠를 잘 보고 있습니다. 저희 {{brandName}}의 {{productName}}이(가) 크리에이터님의 팔로워분들에게 잘 맞을 것 같아 연락드렸습니다.

판매 수수료 {{commissionRate}}%를 제공합니다. 협업에 관심이 있으신가요?

자세한 내용을 보내드리겠습니다! 🎉`,
    },
    email: {
      subject: "{{brandName}} 협업 제안 — {{commissionRate}}% 수수료",
      body: `안녕하세요 {{creatorName}}님,

{{brandName}}에서 연락드립니다. 틱톡에서 {{creatorCategory}} 분야의 콘텐츠를 인상 깊게 보았습니다 (@{{creatorUsername}}).

저희 {{productName}}이(가) 크리에이터님의 콘텐츠와 잘 어울릴 것 같습니다.

제안 조건:
• 판매당 {{commissionRate}}% 수수료
• 무료 샘플 제공
• 콘텐츠 자유 제작

{{productDescription}}

협업에 대해 이야기 나눠보실 수 있을까요?

감사합니다,
{{brandName}} 팀`,
    },
    tiktok_invite: {
      body: `안녕하세요 {{creatorName}}님! {{productName}} 협업을 제안드립니다. 판매당 {{commissionRate}}% 수수료를 드립니다. 확인해 주세요! 🚀`,
    },
  },
};

export function generateMessage(input: MessageGenerationInput): GeneratedMessage {
  const locale = input.locale in TEMPLATES ? input.locale : "en";
  const template = TEMPLATES[locale][input.channel] ?? TEMPLATES.en.tiktok_dm;

  function replaceVars(text: string): string {
    return text
      .replace(/\{\{creatorName\}\}/g, input.creatorName)
      .replace(/\{\{creatorCategory\}\}/g, input.creatorCategory)
      .replace(/\{\{creatorUsername\}\}/g, input.creatorUsername)
      .replace(/\{\{productName\}\}/g, input.productName)
      .replace(/\{\{productDescription\}\}/g, input.productDescription)
      .replace(/\{\{commissionRate\}\}/g, String(input.commissionRate))
      .replace(/\{\{brandName\}\}/g, input.brandName);
  }

  const body = replaceVars(template.body);
  const subject = template.subject ? replaceVars(template.subject) : undefined;

  return {
    subject,
    body,
    locale,
    characterCount: body.length,
  };
}
