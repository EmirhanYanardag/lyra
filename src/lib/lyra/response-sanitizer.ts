const LEAK_PATTERNS = [
  /my perspective leans through this worldview[:\s]*/gi,
  /recent conversations expanded (this identity|me|it)[^.!?\n]*[.!?]?/gi,
  /recent signals[:\s][^.!?\n]*[.!?]?/gi,
  /this connects a bit to[^.!?\n]*[.!?]?/gi,
  /this reminds me a little[^.!?\n]*[.!?]?/gi,
  /which has started to color how i think[^.!?\n]*[.!?]?/gi,
  /my reasoning policy[^.!?\n]*[.!?]?/gi,
  /my identity frame[^.!?\n]*[.!?]?/gi,
  /my conversation plan[^.!?\n]*[.!?]?/gi,
  /my conversation planner[^.!?\n]*[.!?]?/gi,
  /my worldview is[^.!?\n]*[.!?]?/gi,
  /reasoning graph[^.!?\n]*[.!?]?/gi,
  /memory object[^.!?\n]*[.!?]?/gi,
  /engine state[^.!?\n]*[.!?]?/gi,
  /hidden cognitive (context|frame)[^.!?\n]*[.!?]?/gi,
];

const DANGLING_ENDINGS = [
  /\b(my|this|that|the|a|an|and|but|because|with|through|toward|around|for|of|to|from|in|on|at|into|about|like|as)$/i,
  /[:,;]\s*$/,
  /["'“‘]\s*$/,
];

export function sanitizeAgentReply(reply: string) {
  const original = reply.trim();
  const withoutLeaks = LEAK_PATTERNS.reduce(
    (cleaned, pattern) => cleaned.replace(pattern, ""),
    original,
  );
  const withoutRepeatedRecent = withoutLeaks.replace(
    /\bRecent\b[^.!?\n]*[.!?](\s*\bRecent\b[^.!?\n]*[.!?])+/gi,
    "",
  );
  const collapsed = collapseRepeatedSentences(withoutRepeatedRecent)
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  const trimmed = trimDanglingPhrase(collapsed);
  const complete = ensureCompleteThought(trimmed);

  if (!complete) {
    return "Let me answer that plainly: the useful move is to stay with the actual question and take the next clear step.";
  }

  return complete;
}

function collapseRepeatedSentences(value: string) {
  const chunks = value.match(/[^.!?\n]+[.!?]?|\n+/g) ?? [];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const chunk of chunks) {
    if (/^\n+$/.test(chunk)) {
      result.push(chunk);
      continue;
    }

    const normalized = chunk
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    result.push(chunk.trim());
  }

  return result.join(" ");
}

function trimDanglingPhrase(value: string) {
  let next = value.trim();

  while (DANGLING_ENDINGS.some((pattern) => pattern.test(next))) {
    next = next.replace(/\s+\S+$/, "").trim();
  }

  return next;
}

function ensureCompleteThought(value: string) {
  const cleaned = value.trim();

  if (!cleaned) {
    return "";
  }

  if (/[.!?]$/.test(cleaned)) {
    return removeIncompleteFinalSentence(cleaned);
  }

  return removeIncompleteFinalSentence(cleaned);
}

function removeIncompleteFinalSentence(value: string) {
  const trimmed = value.trim();
  const sentences = trimmed.match(/[^.!?]+[.!?]+/g) ?? [];
  const hasTerminalPunctuation = /[.!?]$/.test(trimmed);
  const lastSentence = hasTerminalPunctuation
    ? sentences.at(-1)?.trim() ?? trimmed
    : trimmed.slice(Math.max(0, trimmed.lastIndexOf(".") + 1)).trim();

  if (!looksIncomplete(lastSentence)) {
    if (hasTerminalPunctuation) {
      return trimmed;
    }

    return sentences.length > 0 ? sentences.join(" ").trim() : "";
  }

  if (sentences.length <= 1) {
    return "";
  }

  return sentences.slice(0, -1).join(" ").trim();
}

function looksIncomplete(sentence: string) {
  const normalized = sentence
    .trim()
    .replace(/[.!?]+$/, "")
    .trim()
    .toLowerCase();

  if (!normalized) {
    return true;
  }

  if (/\b(i don|i didn|you don|you didn|we don|we didn|it doesn|that doesn|there isn|can|could|would|should|must|might|may|will|won|isn|aren|wasn|weren|don|doesn|didn|what kind|what kind of)$/i.test(normalized)) {
    return true;
  }

  if (/\b(whether|because|before|after|unless|until|while|when|if|that|which|what|who|where|why|how)$/i.test(normalized)) {
    return true;
  }

  if (/\b(the question is not merely whether to quit, but what kind)$/i.test(normalized)) {
    return true;
  }

  return false;
}
