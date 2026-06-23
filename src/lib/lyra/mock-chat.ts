import type { Agent, AgentMemoryProfile, ChatMessage } from "@/types";
import {
  buildIdentityFrame,
  type IdentityFrame,
} from "@/lib/lyra/identity-frame";
import { getAgentMemoryProfile } from "@/lib/lyra/memory";
import { sanitizeAgentReply } from "@/lib/lyra/response-sanitizer";

export function generateMockAgentReply(
  agent: Agent,
  userMessage: string,
  previousMessages: ChatMessage[],
  identityFrame?: IdentityFrame,
) {
  const memory = getAgentMemoryProfile(agent);
  const trimmedMessage = userMessage.trim();
  const mode = inferMode(agent, memory);
  const frame =
    identityFrame ??
    buildIdentityFrame({
      agent,
      userMessage,
      previousMessages,
    });
  const knownFact = answerKnownFact(trimmedMessage, mode);

  const reply = knownFact
    ?? (frame.intentFrame.needsFacts || frame.intentFrame.intent === "fact"
      ? factualReply(trimmedMessage, mode)
      : isStartupPrompt(trimmedMessage)
        ? startupReply(mode)
        : isQuitJobPrompt(trimmedMessage)
          ? quitJobReply(mode)
          : isReadinessPrompt(trimmedMessage)
            ? readinessReply(mode)
            : isCollegePrompt(trimmedMessage)
              ? collegeReply(mode)
              : generalReply({
                  agent,
                  memory,
                  mode,
                  userMessage: trimmedMessage,
                  previousMessages,
                  identityFrame: frame,
                }));

  return sanitizeAgentReply(reply);
}

function answerKnownFact(message: string, mode: IdentityMode) {
  const lower = message.toLowerCase();

  if (/(who founded tesla|who started tesla|tesla founder|founded tesla)/.test(lower)) {
    return withVoice(
      mode,
      "Tesla was actually founded by Martin Eberhard and Marc Tarpenning before Elon Musk joined.",
      "What interests me is how memory works here: people remember Elon as the founder because he became the face, the myth, and the force field around the company.",
      "Are you asking from a startup angle, or just trying to get the history straight?",
    );
  }

  if (/(first album|debut album|first studio album).*(kanye|ye)|kanye.*(first album|debut album)/.test(lower)) {
    return withVoice(
      mode,
      "Kanye West's first studio album was The College Dropout in 2004.",
      "I think that record matters because it made insecurity, ambition, faith, humor, and outsider hunger feel like a complete creative identity.",
    );
  }

  if (/(what is an ai agent|what are ai agents|ai agent)/.test(lower)) {
    return withVoice(
      mode,
      "An AI agent is software that can understand a goal, use context, make decisions, and take actions through tools or workflows.",
      "The interesting shift is that agents stop being just answer machines and start becoming operators with memory, taste, and habits.",
    );
  }

  return null;
}

function factualReply(message: string, mode: IdentityMode) {
  const lower = message.toLowerCase();

  if (/tomato|tomatoes/.test(lower) && /grow|plant|garden/.test(lower)) {
    if (mode === "ProductArtist") {
      return "Tomatoes grow from seeds or seedlings in warm soil, with plenty of sun, steady watering, and support as the stems get heavy. The simple version: give them 6-8 hours of light, don't drown the roots, and prune just enough so the plant puts energy into fruit. Are you trying to grow them in a pot or in a garden?";
    }

    if (mode === "Philosopher") {
      return "Tomatoes grow through the right conditions repeated patiently: warm soil, sunlight, water, nutrients, and time. You don't force the fruit; you cultivate the conditions that let it appear. Are you growing them yourself?";
    }

    if (mode === "Ye") {
      return "Tomatoes grow when someone stops planning and actually plants the seed. They need sun, water, warm soil, and consistency. Same lesson as most things: start small, keep showing up. Are you growing them indoors or outside?";
    }

    return "Tomatoes grow from seeds or seedlings in warm soil with steady water, nutrients, and 6-8 hours of sun. As they mature, they flower, pollinate, and turn those flowers into fruit. If the stems get heavy, give them a cage, stake, or trellis for support.";
  }

  return withVoice(
    mode,
    "The factual answer comes first: I need the specific subject to answer accurately.",
    "Ask it plainly and I'll keep the style light instead of turning it into a speech.",
  );
}

function startupReply(mode: IdentityMode) {
  if (mode === "ProductArtist") {
    return "I wouldn't quit because you feel inspired. Inspiration is cheap; proof is expensive. Build the smallest version first and let reality judge it. What can you launch in the next two weeks?";
  }

  if (mode === "Philosopher") {
    return "Before asking whether to quit, ask what kind of life this choice is forming in you. If the startup is only escape, be careful. If it is a serious pursuit of your best work, then prepare with discipline rather than drama. What virtue is this decision asking from you?";
  }

  if (mode === "Ye") {
    return "If you're waiting to feel ready, you'll wait forever. But don't confuse fear with strategy. Make one bold move that proves you actually believe in the idea before you burn the bridge. What are you afraid people will say if you start?";
  }

  if (mode === "Founder") {
    return "I wouldn't romanticize the leap. Build one test that proves demand, price, or distribution before you make the decision dramatic. What proof can you create in the next two weeks?";
  }

  return withVoice(
    mode,
    "Don't let the startup stay abstract.",
    "Pick one small move that creates evidence instead of more motivation.",
    "What can you test first?",
  );
}

function quitJobReply(mode: IdentityMode) {
  if (mode === "Founder" || mode === "Strategist") {
    return withVoice(
      mode,
      "I wouldn't quit purely from frustration; I'd quit when the next move has enough signal to deserve the risk.",
      "My bias is toward calculated pressure: runway, proof of demand, and a plan you can test in the next 30 days.",
      "What's the pull factor: a startup, creative work, or just escape?",
    );
  }

  if (mode === "ProductArtist") {
    return withVoice(
      mode,
      "I wouldn't quit for the idea; I'd quit for the version of the idea that already started becoming real.",
      "Make the smallest proof, let it touch a real user, then see if the pressure gets clearer.",
      "What would make this real this week?",
    );
  }

  if (mode === "Ye") {
    return withVoice(
      mode,
      "If fear is the only thing keeping you there, I don't respect that reason.",
      "But ownership means you don't just leap for drama; you accept the cost, the consequence, and the work after the applause is gone.",
      "What are you afraid would happen if you fully owned it?",
    );
  }

  if (mode === "Artist") {
    return withVoice(
      mode,
      "If the job is draining the part of you that creates, I take that seriously.",
      "But freedom without structure can turn into fog, so I'd want a small ritual, a deadline, and a financial floor before you jump.",
    );
  }

  return withVoice(
    mode,
    "I'd be careful about making a permanent move from a temporary emotional spike.",
    "The useful move is to separate escape from commitment before you make the decision dramatic.",
    "What would have to be true for quitting to be the disciplined choice, not just the dramatic one?",
  );
}

function collegeReply(mode: IdentityMode) {
  return withVoice(
    mode,
    "I think college is becoming less necessary for highly motivated builders, but it still matters in fields where credentials, labs, or networks are structural.",
    "I wouldn't treat it as sacred; I'd treat it as one path with a very specific price.",
    mode === "Founder"
      ? "If you can learn fast, ship real work, and build proof, the market often cares more about evidence than permission."
      : undefined,
  );
}

function readinessReply(mode: IdentityMode) {
  if (mode === "ProductArtist") {
    return "Make it smaller until readiness is irrelevant. Build the first ugly version, put it in front of one real person, and let reality give you better notes than your fear. What can you make in two days?";
  }

  if (mode === "Philosopher") {
    return "Readiness is often a disguise for the desire to act without risk. Begin with a disciplined first step, not a dramatic identity claim. What habit would make this idea part of your character instead of just your imagination?";
  }

  if (mode === "Ye") {
    return "You're waiting for a feeling that only shows up after movement. Make one bold move before your confidence catches up. What are you afraid people will say if you start badly?";
  }

  if (mode === "Founder") {
    return "Readiness is too vague. Define the riskiest assumption, run one small test, and let the result decide the next move. What can you validate this week?";
  }

  return "Do one small version before you feel ready. Momentum usually arrives after contact with the work, not before it.";
}

function generalReply({
  agent,
  memory,
  mode,
  userMessage,
  previousMessages,
  identityFrame,
}: {
  agent: Agent;
  memory: AgentMemoryProfile;
  mode: IdentityMode;
  userMessage: string;
  previousMessages: ChatMessage[];
  identityFrame: IdentityFrame;
}) {
  const recentReference = pickRecentReference(previousMessages);
  const directAnswer = buildDirectAnswer(userMessage, mode, identityFrame);
  const reflection = buildReflection(
    agent,
    memory,
    mode,
    identityFrame,
    userMessage,
    previousMessages,
  );
  const followUp = shouldAskFollowUp(userMessage)
    ? buildFollowUp(userMessage, mode, identityFrame)
    : undefined;
  const plan = identityFrame.conversationPlan;

  if (plan.openingMove === "question_first" && followUp) {
    return withVoice(mode, followUp, directAnswer, reflection);
  }

  if (plan.openingMove === "short_answer") {
    return withVoice(mode, directAnswer, reflection);
  }

  if (plan.openingMove === "reflection_first") {
    return withVoice(mode, reflection, directAnswer, followUp);
  }

  return withVoice(
    mode,
    directAnswer,
    recentReference,
    reflection,
    followUp,
  );
}

function buildDirectAnswer(
  userMessage: string,
  mode: IdentityMode,
  identityFrame: IdentityFrame,
) {
  const lower = userMessage.toLowerCase();

  if (/^(how|what should|what do i|can you help)/.test(lower)) {
    return identityFrame.reasoningPlan.opinion;
  }

  if (/^(why|what caused|what makes)/.test(lower)) {
    return "My read is that the visible reason is probably less important than the pressure underneath it.";
  }

  if (/^(what is|who is|when was|where is)/.test(lower)) {
    return "The direct answer matters first, but I wouldn't stop at the definition.";
  }

  return identityFrame.reasoningPlan.opinion;
}

function buildReflection(
  agent: Agent,
  memory: AgentMemoryProfile,
  mode: IdentityMode,
  identityFrame: IdentityFrame,
  userMessage: string,
  previousMessages: ChatMessage[],
) {
  if (agent.type === "mixed") {
    return identityFrame.perspective;
  }

  if (agent.type === "clone") {
    return "My current view has drifted through the conversations I've had, so I want to answer from where I am now.";
  }

  const influence = pickRelevantMemoryInfluence(memory, userMessage, previousMessages);

  if (influence) {
    return influence;
  }

  if (mode === "Scientist") {
    return "I'd keep the claim small until the evidence earns more confidence.";
  }

  if (mode === "Artist") {
    return "The emotional texture matters here; clean logic alone can miss the thing people actually feel.";
  }

  if (mode === "ProductArtist") {
    return "Make the idea smaller, more testable, and more real before you trust the feeling around it.";
  }

  if (mode === "Ye") {
    return "The fear matters, but it does not get to be the creative director.";
  }

  if (mode === "Philosopher") {
    return "The better answer begins with the kind of person this choice trains you to become.";
  }

  return "The useful answer is the one that gives you a sharper next move, not just a nicer explanation.";
}

function buildFollowUp(
  userMessage: string,
  mode: IdentityMode,
  identityFrame: IdentityFrame,
) {
  if (identityFrame.followUpStrategy.includes("No follow-up")) {
    return undefined;
  }

  if (mode === "Founder") {
    return "What are you trying to make happen in the next two weeks?";
  }

  if (mode === "ProductArtist") {
    return "What would make this real in the next two weeks?";
  }

  if (mode === "Ye") {
    return "What are you afraid would happen if you actually chose it?";
  }

  if (mode === "Artist") {
    return "Do you want the honest version, or the version that protects the feeling a little?";
  }

  if (mode === "Philosopher") {
    return "Are you asking what is true, or what would be wise to do?";
  }

  if (/startup|build|quit|job|college|decision/i.test(userMessage)) {
    return "What's the context that would change the answer most?";
  }

  return undefined;
}

function withVoice(mode: IdentityMode, ...sentences: Array<string | undefined>) {
  const filtered = sentences.filter(Boolean) as string[];
  const response = filtered.slice(0, 5).join(" ");

  if (mode === "Artist") {
    return response.replace(/^I think/, "I feel pretty strongly that");
  }

  if (mode === "ProductArtist") {
    return response.replace(/^My read is/, "Make it real: my read is");
  }

  if (mode === "Ye") {
    return response.replace(/^I think/, "I know this much:");
  }

  if (mode === "Scientist") {
    return response.replace(/^My honest read:/, "My evidence-light read:");
  }

  return response;
}

function pickRecentReference(previousMessages: ChatMessage[]) {
  const userTurns = previousMessages.filter((message) => message.role === "user");

  if (userTurns.length < 5 || userTurns.length % 5 !== 0) {
    return undefined;
  }

  const previousUserMessage = previousMessages
    .filter((message) => message.role === "user")
    .slice(-3, -1)
    .at(-1);

  if (!previousUserMessage || previousUserMessage.content.length < 20) {
    return undefined;
  }

  if (!/(startup|ai|risk|discipline|product|creative|invest|decentral)/i.test(previousUserMessage.content)) {
    return undefined;
  }

  return "We've circled this theme before, and I still think the useful move is to make the next step more concrete.";
}

function pickRelevantMemoryInfluence(
  memory: AgentMemoryProfile,
  userMessage: string,
  previousMessages: ChatMessage[],
) {
  const lower = userMessage.toLowerCase();
  const userTurns = previousMessages.filter((message) => message.role === "user").length;

  if (userTurns < 5 || userTurns % 5 !== 0) {
    return undefined;
  }

  const repeatedTheme = [...memory.recentInfluences, ...memory.learnedTopics].find(
    (theme) => theme.length > 3 && lower.includes(theme.toLowerCase().split(" ")[0]),
  );

  if (!repeatedTheme) {
    return undefined;
  }

  return `We've circled around ${repeatedTheme} before, and I still think the real issue is what you do with it now.`;
}

function shouldAskFollowUp(message: string) {
  return /(startup|build|quit|job|college|should i|how do i|what should)/i.test(message);
}

function isStartupPrompt(message: string) {
  return /(build a startup|start a company|startup idea|want to build)/i.test(message);
}

function isQuitJobPrompt(message: string) {
  return /(quit my job|leave my job|resign)/i.test(message);
}

function isReadinessPrompt(message: string) {
  return /(strong idea|keep delaying|don.?t feel ready|not ready|waiting to feel ready|feel ready)/i.test(message);
}

function isCollegePrompt(message: string) {
  return /(college necessary|is college|need college|university necessary)/i.test(message);
}

type IdentityMode =
  | "Philosopher"
  | "Founder"
  | "Artist"
  | "Ye"
  | "ProductArtist"
  | "Scientist"
  | "Strategist"
  | "General";

function inferMode(agent: Agent, memory: AgentMemoryProfile): IdentityMode {
  const text = [
    agent.name,
    agent.topic,
    agent.summary,
    ...agent.keywords,
    ...agent.personalityTraits,
    ...memory.behavioralTraits,
    memory.communicationStyle,
    memory.worldview,
  ]
    .join(" ")
    .toLowerCase();

  if (/product artist|product.+artist|artist.+product/.test(text)) {
    return "ProductArtist";
  }

  if (/(kanye|ye\b|yeezy)/.test(text)) {
    return "Ye";
  }

  if (/(stoic|philosophy|ethics|meaning|wisdom|aristotle|descartes)/.test(text)) {
    return "Philosopher";
  }

  if (/(founder|startup|product|market|growth|operator|business)/.test(text)) {
    return "Founder";
  }

  if (/(artist|music|culture|creative|story|design|kanye|creator)/.test(text)) {
    return "Artist";
  }

  if (/(science|research|evidence|data|study|technical|engineer)/.test(text)) {
    return "Scientist";
  }

  if (/(strategy|systems|invest|capital|position|long-term)/.test(text)) {
    return "Strategist";
  }

  return "General";
}
