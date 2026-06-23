import { NextResponse } from "next/server";
import { generateGeminiHybridIdentity } from "@/lib/ai/gemini";
import { generateMockHybridIdentity } from "@/lib/lyra/mock-mix";
import { getGeminiApiKey } from "@/lib/utils/env";
import type { Agent } from "@/types";

type MixRequestBody = {
  parentA?: Agent;
  parentB?: Agent;
};

export async function POST(request: Request) {
  let body: MixRequestBody;

  try {
    body = (await request.json()) as MixRequestBody;
  } catch {
    return NextResponse.json(
      { identity: null, source: "mock", error: "Invalid mix request." },
      { status: 200 },
    );
  }

  if (!body.parentA || !body.parentB) {
    return NextResponse.json(
      { identity: null, source: "mock", error: "Choose two parent agents." },
      { status: 200 },
    );
  }

  const fallback = generateMockHybridIdentity(body.parentA, body.parentB);
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    return NextResponse.json({ identity: fallback, source: "mock" });
  }

  try {
    const identity = await generateGeminiHybridIdentity({
      apiKey,
      parentA: body.parentA,
      parentB: body.parentB,
    });

    return NextResponse.json({ identity, source: "gemini" });
  } catch (error) {
    console.warn("[LYRA mix] Gemini failed, using fallback", error);
    return NextResponse.json({ identity: fallback, source: "mock-fallback" });
  }
}
