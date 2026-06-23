export type IntentFrame = {
  intent:
    | "fact"
    | "life_decision"
    | "strategy"
    | "creative"
    | "self_definition"
    | "debate"
    | "reflection"
    | "general";
  domain:
    | "career"
    | "startup"
    | "history"
    | "identity"
    | "creativity"
    | "philosophy"
    | "technology"
    | "relationships"
    | "general";
  emotion:
    | "uncertain"
    | "curious"
    | "ambitious"
    | "anxious"
    | "conflicted"
    | "neutral";
  urgency: "low" | "medium" | "high";
  decisionType: "none" | "personal" | "strategic" | "creative" | "factual";
  needsOpinion: boolean;
  needsFacts: boolean;
  needsReflection: boolean;
  needsPlanning: boolean;
  needsCreativity: boolean;
  needsDebate: boolean;
  confidence: number;
};

export function buildIntentFrame(userMessage: string): IntentFrame {
  const lower = userMessage.toLowerCase();

  if (/(quit|job|resign|leave my job|career)/.test(lower)) {
    return {
      intent: "life_decision",
      domain: "career",
      emotion: "uncertain",
      urgency: /(today|now|immediately|asap)/.test(lower) ? "high" : "medium",
      decisionType: "personal",
      needsOpinion: true,
      needsFacts: false,
      needsReflection: true,
      needsPlanning: false,
      needsCreativity: false,
      needsDebate: false,
      confidence: 0.92,
    };
  }

  if (/(startup|company|build a business|founder|product)/.test(lower)) {
    return {
      intent: "strategy",
      domain: "startup",
      emotion: "ambitious",
      urgency: "medium",
      decisionType: "strategic",
      needsOpinion: true,
      needsFacts: false,
      needsReflection: false,
      needsPlanning: true,
      needsCreativity: /(idea|creative|brand|story)/.test(lower),
      needsDebate: false,
      confidence: 0.9,
    };
  }

  if (/^(who|what|when|where|which|how)\b/.test(lower)) {
    const selfDefinition = /(describe yourself|who are you|what are you)/.test(lower);

    return {
      intent: selfDefinition ? "self_definition" : "fact",
      domain: /(tesla|founded|history|album|born|created)/.test(lower)
        ? "history"
        : /(ai|software|computer|agent|technology|code)/.test(lower)
          ? "technology"
        : /(yourself|who are you|identity)/.test(lower)
          ? "identity"
          : "general",
      emotion: "curious",
      urgency: "low",
      decisionType: "factual",
      needsOpinion: false,
      needsFacts: !selfDefinition,
      needsReflection: selfDefinition || /^why\b/.test(lower),
      needsPlanning: false,
      needsCreativity: false,
      needsDebate: false,
      confidence: 0.84,
    };
  }

  if (/(discipline|talent|better|more important|versus| vs |should)/.test(lower)) {
    return {
      intent: "debate",
      domain: /(discipline|talent|virtue|purpose)/.test(lower)
        ? "philosophy"
        : "general",
      emotion: "conflicted",
      urgency: "low",
      decisionType: "personal",
      needsOpinion: true,
      needsFacts: false,
      needsReflection: true,
      needsPlanning: false,
      needsCreativity: false,
      needsDebate: true,
      confidence: 0.78,
    };
  }

  if (/(create|write|imagine|design|story|music|brand)/.test(lower)) {
    return {
      intent: "creative",
      domain: "creativity",
      emotion: "ambitious",
      urgency: "low",
      decisionType: "creative",
      needsOpinion: true,
      needsFacts: false,
      needsReflection: false,
      needsPlanning: false,
      needsCreativity: true,
      needsDebate: false,
      confidence: 0.8,
    };
  }

  return {
    intent: "general",
    domain: "general",
    emotion: "neutral",
    urgency: "low",
    decisionType: "none",
    needsOpinion: true,
    needsFacts: false,
    needsReflection: true,
    needsPlanning: false,
    needsCreativity: false,
    needsDebate: false,
    confidence: 0.58,
  };
}
