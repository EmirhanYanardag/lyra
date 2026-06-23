import type { IdentityFrame } from "@/lib/lyra/identity-frame";

export type IdentityConsistencyResult = {
  compared: number;
  averageSimilarity: number;
  tooSimilarPairs: Array<{
    left: string;
    right: string;
    similarity: number;
    reason: string;
  }>;
};

export function compareIdentityFrames(
  frames: Array<{ label: string; frame: IdentityFrame }>,
): IdentityConsistencyResult {
  const pairs: IdentityConsistencyResult["tooSimilarPairs"] = [];
  const similarities: number[] = [];

  for (let leftIndex = 0; leftIndex < frames.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < frames.length; rightIndex += 1) {
      const left = frames[leftIndex];
      const right = frames[rightIndex];
      const similarity = measureFrameSimilarity(left.frame, right.frame);

      similarities.push(similarity);

      if (similarity > 0.72) {
        pairs.push({
          left: left.label,
          right: right.label,
          similarity,
          reason: "Reasoning policy, opinion, or conversation plan may be collapsing toward the same answer.",
        });
      }
    }
  }

  return {
    compared: similarities.length,
    averageSimilarity:
      similarities.length > 0
        ? Number((similarities.reduce((sum, value) => sum + value, 0) / similarities.length).toFixed(3))
        : 0,
    tooSimilarPairs: pairs,
  };
}

export function measureFrameSimilarity(left: IdentityFrame, right: IdentityFrame) {
  const policyPenalty = left.reasoningPolicy.id === right.reasoningPolicy.id ? 0.25 : 0;
  const opinionSimilarity = tokenSimilarity(left.opinion, right.opinion);
  const perspectiveSimilarity = tokenSimilarity(left.perspective, right.perspective);
  const stepSimilarity = tokenSimilarity(
    left.reasoningPlan.steps.join(" "),
    right.reasoningPlan.steps.join(" "),
  );

  return Math.min(
    1,
    Number(
      (
        policyPenalty +
        opinionSimilarity * 0.35 +
        perspectiveSimilarity * 0.3 +
        stepSimilarity * 0.1
      ).toFixed(3),
    ),
  );
}

function tokenSimilarity(left: string, right: string) {
  const leftTokens = tokenize(left);
  const rightTokens = tokenize(right);

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }

  const overlap = Array.from(leftTokens).filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;

  return overlap / union;
}

function tokenize(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 3),
  );
}
