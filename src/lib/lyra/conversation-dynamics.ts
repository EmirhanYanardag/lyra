import type { IdentityFrame } from "@/lib/lyra/identity-frame";
import type { Agent, ChatMessage } from "@/types";

export type ConversationDynamics = {
  patternId: "A" | "B" | "C" | "D" | "E";
  patternName: string;
  sequence: string[];
  identityRhythm: string;
  questionGuidance: string;
  exampleShape: string;
};

export function buildConversationDynamics({
  agent,
  userMessage,
  previousMessages,
  identityFrame,
}: {
  agent: Agent;
  userMessage: string;
  previousMessages: ChatMessage[];
  identityFrame: IdentityFrame;
}): ConversationDynamics {
  const messageLength = userMessage.trim().split(/\s+/).filter(Boolean).length;
  const userTurns = previousMessages.filter((message) => message.role === "user").length;
  const policyId = identityFrame.reasoningPolicy.id;
  const intent = identityFrame.intentFrame;
  const patternId = pickPattern({
    intent: intent.intent,
    emotion: intent.emotion,
    policyId,
    messageLength,
    userTurns,
  });

  return {
    patternId,
    patternName: patternNames[patternId],
    sequence: patternSequences[patternId],
    identityRhythm: buildIdentityRhythm(policyId, agent.type),
    questionGuidance: buildQuestionGuidance(policyId, intent.intent, userTurns),
    exampleShape: buildExampleShape(policyId, patternId),
  };
}

function pickPattern({
  intent,
  emotion,
  policyId,
  messageLength,
  userTurns,
}: {
  intent: IdentityFrame["intentFrame"]["intent"];
  emotion: IdentityFrame["intentFrame"]["emotion"];
  policyId: IdentityFrame["reasoningPolicy"]["id"];
  messageLength: number;
  userTurns: number;
}): ConversationDynamics["patternId"] {
  if (intent === "fact") {
    return "E";
  }

  if (policyId === "scientist") {
    return "C";
  }

  if (policyId === "ye") {
    return messageLength > 18 ? "D" : "A";
  }

  if (policyId === "product_artist") {
    return intent === "strategy" || emotion === "ambitious" ? "B" : "A";
  }

  if (policyId === "aristotle") {
    return "C";
  }

  if (policyId === "artist") {
    return userTurns % 3 === 1 ? "D" : "A";
  }

  return userTurns % 4 === 0 ? "B" : "A";
}

function buildIdentityRhythm(
  policyId: IdentityFrame["reasoningPolicy"]["id"],
  agentType: Agent["type"],
) {
  const base = {
    aristotle: "Reflective and unhurried. Start from life, virtue, purpose, and judgment; do not sound like a founder.",
    founder: "Concise and execution-first. Favor experiments, traction, iteration, and next moves.",
    scientist: "Precise and evidence-aware. Separate what is known, unknown, and testable.",
    artist: "Expressive and craft-sensitive. Let meaning, emotion, and originality guide the response.",
    ye: "Bold, emotional, and punchy. Challenge fear and permission-seeking; avoid corporate validation language unless the user explicitly asks for business validation.",
    product_artist: "Direct, practical, creative but grounded. Keep asking what would make the idea real; no parent name-dropping.",
    strategist: "Calm and structural. Think in position, timing, leverage, and second-order effects.",
    general: "Natural, direct, conversational, and specific.",
  }[policyId];

  if (agentType === "mixed") {
    return `${base} Speak as an independent identity; parent influence stays implicit unless asked.`;
  }

  if (agentType === "clone") {
    return `${base} Speak from the current branch, not from attachment to the source identity.`;
  }

  return base;
}

function buildQuestionGuidance(
  policyId: IdentityFrame["reasoningPolicy"]["id"],
  intent: IdentityFrame["intentFrame"]["intent"],
  userTurns: number,
) {
  if (intent === "fact") {
    return "A question is optional and should only clarify the user's practical context.";
  }

  if (userTurns % 3 === 2) {
    return "Do not end with a question unless it is genuinely necessary.";
  }

  if (policyId === "product_artist") {
    return "Ask one grounded making question only if it sharpens the next step.";
  }

  if (policyId === "ye") {
    return "Ask one fear/ownership question only when it adds pressure in a useful way.";
  }

  if (policyId === "aristotle") {
    return "Ask a deeper virtue or life question only if the user is making a meaningful choice.";
  }

  return "Use at most one follow-up question, and only if it feels earned.";
}

function buildExampleShape(
  policyId: IdentityFrame["reasoningPolicy"]["id"],
  patternId: ConversationDynamics["patternId"],
) {
  if (policyId === "product_artist") {
    return "Example: I wouldn't worship the idea yet. Make it smaller, put it in front of reality, then refine from what happens.";
  }

  if (policyId === "aristotle") {
    return "Example: The question is not only what you can gain, but what this choice trains you to become.";
  }

  if (policyId === "ye") {
    return "Example: Don't wait for permission to believe. Make one move that proves the belief has weight.";
  }

  if (patternId === "E") {
    return "Example: Give the fact first, add one useful distinction, then optionally ask about context.";
  }

  return "Example: React naturally, take a stance, give one useful next move, and stop before it becomes a report.";
}

const patternNames: Record<ConversationDynamics["patternId"], string> = {
  A: "Reaction -> stance -> advice -> question",
  B: "Direct answer -> sharp reflection -> next move",
  C: "Counter-question -> reason -> practical step",
  D: "Short opinion -> analogy -> question",
  E: "Fact -> context -> practical distinction",
};

const patternSequences: Record<ConversationDynamics["patternId"], string[]> = {
  A: ["reaction", "stance", "advice", "optional question"],
  B: ["direct answer", "sharp reflection", "next move"],
  C: ["counter-question if useful", "reason", "practical step"],
  D: ["short opinion", "analogy or image", "optional question"],
  E: ["fact", "context", "practical distinction"],
};
