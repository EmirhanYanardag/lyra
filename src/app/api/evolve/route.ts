import { NextResponse } from "next/server";
import { generateGeminiMemoryEvolution } from "@/lib/ai/gemini";
import type { IdentityFrame } from "@/lib/lyra/identity-frame";
import { evolveMemoryProfile } from "@/lib/lyra/memory";
import type { Agent, ChatMessage } from "@/types";

type EvolveRequestBody = {
  agent?: Agent;
  latestUserMessage?: string;
  latestAssistantMessage?: string;
  recentMessages?: ChatMessage[];
  identityFrame?: IdentityFrame;
};

export async function POST(request: Request) {
  let body: EvolveRequestBody;

  try {
    body = (await request.json()) as EvolveRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const { agent, latestUserMessage, latestAssistantMessage } = body;
  const identityFrame = body.identityFrame;
  const recentMessages = Array.isArray(body.recentMessages)
    ? body.recentMessages.slice(-10)
    : [];

  if (!agent || !latestUserMessage || !latestAssistantMessage) {
    return NextResponse.json(
      { error: "agent, latestUserMessage, and latestAssistantMessage are required." },
      { status: 400 },
    );
  }

  const fallbackMemoryProfile = evolveMemoryProfile({
    agent,
    userMessage: latestUserMessage,
    assistantMessage: latestAssistantMessage,
    recentMessages,
    identityFrame,
  });

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      memoryProfile: fallbackMemoryProfile,
      source: "mock",
      evolutionNote: fallbackMemoryProfile.evolutionLog[0] ?? "Identity updated.",
    });
  }

  try {
    const { memoryProfile, evolutionNote } = await generateGeminiMemoryEvolution({
      apiKey,
      agent,
      latestUserMessage,
      latestAssistantMessage,
      recentMessages,
      identityFrame,
    });

    return NextResponse.json({
      memoryProfile,
      source: "gemini",
      evolutionNote,
    });
  } catch (error) {
    console.error("Gemini evolution failed", error);

    return NextResponse.json({
      memoryProfile: fallbackMemoryProfile,
      source: "mock-fallback",
      evolutionNote: fallbackMemoryProfile.evolutionLog[0] ?? "Identity updated.",
    });
  }
}
