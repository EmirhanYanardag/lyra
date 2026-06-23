import type { IdentityPosition } from "@/lib/lyra/identity-interpreter";
import type { IntentFrame } from "@/lib/lyra/intent-engine";
import type { ReasoningPolicy } from "@/lib/lyra/reasoning-policies";

export function generateOpinion({
  intent,
  identity,
  policy,
}: {
  intent: IntentFrame;
  identity: IdentityPosition;
  policy: ReasoningPolicy;
}) {
  if (intent.needsFacts || intent.intent === "fact") {
    return "Answer the factual question directly first; add only a light identity-shaped note if it helps.";
  }

  if (intent.intent === "life_decision") {
    if (policy.id === "founder") {
      return "I wouldn't quit today unless you have proof, runway, and a next test.";
    }

    if (policy.id === "aristotle") {
      return "I think the harder question is why success seems to require leaving your current life.";
    }

    if (policy.id === "ye") {
      return "If you're only staying because you're scared, I don't respect that reason.";
    }

    if (policy.id === "product_artist") {
      return "I wouldn't quit for the idea; I'd quit for the version of the idea that already started becoming real.";
    }

    if (policy.id === "scientist") {
      return "I don't think there is enough evidence yet.";
    }
  }

  if (intent.intent === "debate") {
    return policy.id === "ye"
      ? "Discipline is how belief proves it wasn't just a mood."
      : "Discipline beats talent when the work gets boring.";
  }

  if (intent.intent === "strategy") {
    return policy.id === "product_artist"
      ? "Make the impressive thing smaller until it can be built."
      : identity.stance;
  }

  return identity.stance;
}
