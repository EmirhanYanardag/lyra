import { NextResponse } from "next/server";
import { generateGeminiReply } from "@/lib/ai/gemini";
import {
  buildIdentityFrame,
  type IdentityFrame,
} from "@/lib/lyra/identity-frame";
import { generateMockAgentReply } from "@/lib/lyra/mock-chat";
import { getGeminiApiKey } from "@/lib/utils/env";
import type { Agent, ChatMessage } from "@/types";

type ChatRequestBody = {
  agent?: Agent;
  userMessage?: string;
  previousMessages?: ChatMessage[];
  identityFrame?: IdentityFrame;
};

export async function POST(request: Request) {
  let body: ChatRequestBody;

  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json(
      { reply: "I could not read that message. Try sending it again.", source: "mock" },
      { status: 200 },
    );
  }

  const validation = validateBody(body);

  if (validation) {
    return NextResponse.json({ reply: validation, source: "mock" }, { status: 200 });
  }

  const agent = body.agent as Agent;
  const userMessage = body.userMessage as string;
  const previousMessages = body.previousMessages ?? [];
  const identityFrame =
    body.identityFrame ??
    buildIdentityFrame({
      agent,
      userMessage,
      previousMessages,
    });
  const fallbackReply = generateMockAgentReply(
    agent,
    userMessage,
    previousMessages,
    identityFrame,
  );
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    return NextResponse.json({ reply: fallbackReply, source: "mock" });
  }

  try {
    const { reply } = await generateGeminiReply({
      apiKey,
      agent,
      userMessage,
      previousMessages,
      identityFrame,
    });

    if (!reply) {
      return NextResponse.json({ reply: fallbackReply, source: "mock-fallback" });
    }

    return NextResponse.json({ reply, source: "gemini" });
  } catch (error) {
    console.log("GEMINI ERROR", error);
    console.warn("[LYRA chat] Gemini failed, using fallback", error);

    return NextResponse.json({ reply: fallbackReply, source: "mock-fallback" });
  }
}

function validateBody(body: ChatRequestBody) {
  if (!body.agent || typeof body.agent !== "object") {
    return "I need an agent identity before I can answer.";
  }

  if (!body.userMessage || typeof body.userMessage !== "string") {
    return "Send me a concrete question or thought and I will respond from this agent's perspective.";
  }

  if (!body.userMessage.trim()) {
    return "Send me a concrete question or thought and I will respond from this agent's perspective.";
  }

  return null;
}
