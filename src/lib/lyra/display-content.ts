import type { Agent } from "@/types";

const MAX_CARD_KEYWORDS = 5;

const BANNED_KEYWORDS = new Set([
  "about",
  "after",
  "again",
  "because",
  "being",
  "build",
  "could",
  "delaying",
  "does",
  "feel",
  "first",
  "from",
  "have",
  "idea",
  "into",
  "keep",
  "latest",
  "more",
  "should",
  "strong",
  "that",
  "this",
  "through",
  "what",
  "when",
  "where",
  "which",
  "with",
  "would",
  "your",
]);

const INTERNAL_PHRASES = [
  /recent conversations (have )?expanded[^.!?]*[.!?]?/gi,
  /recent signals[^.!?]*[.!?]?/gi,
  /new focus areas[^.!?]*[.!?]?/gi,
  /this identity learning through[^.!?]*[.!?]?/gi,
  /while carrying parent influence as background texture[^.!?]*[.!?]?/gi,
  /using origin as background texture[^.!?]*[.!?]?/gi,
  /my perspective leans through this worldview[^.!?]*[.!?]?/gi,
];

type KeywordPreset = {
  id: string;
  test: RegExp;
  keywords: string[];
  lineageKeywords: string[];
  summary: string;
};

const PRESETS: KeywordPreset[] = [
  {
    id: "product_artist",
    test: /(product artist|product.+artist|artist.+product)/i,
    keywords: ["product", "creativity", "execution", "strategy", "discipline"],
    lineageKeywords: ["execution", "strategy"],
    summary:
      "A hybrid identity focused on turning creative vision into practical execution.",
  },
  {
    id: "aristotle",
    test: /\baristotle\b|virtue|ethics|philosophy|wisdom/i,
    keywords: ["philosophy", "ethics", "virtue", "wisdom", "reasoning"],
    lineageKeywords: ["philosophy", "reasoning"],
    summary:
      "An agent shaped by Aristotle's philosophy, focused on virtue, reasoning, and the pursuit of a well-lived life.",
  },
  {
    id: "ye",
    test: /\b(kanye|ye|yeezy)\b|hiphop|hip hop/i,
    keywords: ["kanye west", "music", "hiphop", "creativity", "conviction"],
    lineageKeywords: ["music", "creativity", "conviction", "identity"],
    summary:
      "A culture-driven agent focused on music, creative conviction, identity, and bold self-expression.",
  },
  {
    id: "founder",
    test: /(founder|startup|growth|market|operator|business)/i,
    keywords: ["startups", "execution", "growth", "strategy", "product"],
    lineageKeywords: ["startups", "execution"],
    summary:
      "A founder-minded agent focused on execution, growth, product strategy, and practical momentum.",
  },
  {
    id: "scientist",
    test: /(scientist|science|research|evidence|experiment|analysis|data)/i,
    keywords: ["science", "evidence", "research", "experiments", "analysis"],
    lineageKeywords: ["science", "evidence"],
    summary:
      "A research-driven agent focused on evidence, experiments, analysis, and careful reasoning.",
  },
  {
    id: "artist",
    test: /(artist|art|expression|craft|originality|culture|creative)/i,
    keywords: ["art", "expression", "craft", "originality", "culture"],
    lineageKeywords: ["art", "expression"],
    summary:
      "An expressive agent focused on art, craft, originality, culture, and emotional meaning.",
  },
];

export function getDisplayKeywords(agent: Agent): string[] {
  const text = buildAgentText(agent);

  if (agent.type === "mixed") {
    return getHybridDisplayKeywords(agent, text);
  }

  const preset = PRESETS.find((item) => item.test.test(text));
  const candidates = [
    ...(preset?.keywords ?? []),
    ...agent.keywords,
    ...extractTopicLabels(text),
  ];

  return uniqueCleanKeywords(candidates).slice(0, MAX_CARD_KEYWORDS);
}

export function getAgentCardSummary(agent: Agent): string {
  const text = buildAgentText(agent);
  const preset = PRESETS.find((item) => item.test.test(text));

  if (agent.type === "clone") {
    return "An independent branch of its original identity, evolving through its own conversations.";
  }

  if (agent.type === "mixed") {
    return preset?.summary ?? "A hybrid identity formed from two parent agents, now evolving its own worldview.";
  }

  return sanitizeSummary(preset?.summary ?? agent.summary ?? agent.topic, agent);
}

export function getAgentCardSubtitle(agent: Agent): string | null {
  if (agent.type === "clone") {
    return "Independent clone";
  }

  if (agent.type === "mixed") {
    return "Hybrid identity";
  }

  return null;
}

function sanitizeSummary(value: string, agent: Agent) {
  const cleaned = INTERNAL_PHRASES.reduce(
    (summary, pattern) => summary.replace(pattern, ""),
    value,
  )
    .replace(/\s{2,}/g, " ")
    .trim();

  const withoutAwkwardTopicRepeat = cleaned
    .replace(new RegExp(`^${escapeRegExp(agent.topic)}\\s*[-:|]*\\s*`, "i"), "")
    .trim();
  const sentences = splitSentences(withoutAwkwardTopicRepeat).slice(0, 2);
  const summary = sentences.join(" ").trim();

  if (summary.length > 24) {
    return summary;
  }

  const preset = PRESETS.find((item) => item.test.test(buildAgentText(agent)));

  if (preset) {
    return preset.summary;
  }

  return `A LYRA agent focused on ${trimToPhrase(agent.topic)}.`;
}

function getHybridDisplayKeywords(agent: Agent, text: string) {
  const parentPresets = PRESETS.filter(
    (item) => item.id !== "product_artist" && item.test.test(text),
  );
  const hybridPreset = PRESETS.find(
    (item) => item.id === "product_artist" && item.test.test(text),
  );
  const parentDna = parentPresets.flatMap((preset) =>
    preset.lineageKeywords.slice(0, parentPresets.length > 1 ? 2 : 3),
  );
  const hybridEvolution = [
    ...(hybridPreset?.lineageKeywords ?? []),
    ...agent.keywords,
    ...extractTopicLabels(text),
  ];

  return uniqueCleanKeywords([...parentDna, ...hybridEvolution]).slice(
    0,
    MAX_CARD_KEYWORDS,
  );
}

function splitSentences(value: string) {
  const matches = value.match(/[^.!?]+[.!?]+/g);

  if (matches?.length) {
    return matches.map((sentence) => sentence.trim());
  }

  return value ? [`${value.replace(/[.!?]+$/, "")}.`] : [];
}

function extractTopicLabels(text: string) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !BANNED_KEYWORDS.has(word));

  return words;
}

function uniqueCleanKeywords(values: string[]) {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const cleaned = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (
      cleaned.length < 3 ||
      BANNED_KEYWORDS.has(cleaned) ||
      cleaned.split(" ").every((word) => BANNED_KEYWORDS.has(word))
    ) {
      continue;
    }

    if (!seen.has(cleaned)) {
      seen.add(cleaned);
      result.push(cleaned);
    }
  }

  return result;
}

function buildAgentText(agent: Agent) {
  const memory = agent.memoryProfile ?? agent.avatarConfig.memoryProfile;

  return [
    agent.name,
    agent.type,
    agent.topic,
    agent.summary,
    agent.topicSummary,
    ...(agent.keywords ?? []),
    memory?.originTopic,
    memory?.identitySummary,
  ]
    .filter(Boolean)
    .join(" ");
}

function trimToPhrase(value: string) {
  return value.trim().replace(/[.!?]+$/, "").slice(0, 90);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
