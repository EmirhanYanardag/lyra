"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import {
  evolveAgentAfterUserMessageClient,
  formatChatError,
  getAgentMessagesClient,
  getOwnedAgentClient,
  insertChatMessageClient,
} from "@/lib/lyra/client-chat";
import {
  buildIdentityFrame,
  type IdentityFrame,
} from "@/lib/lyra/identity-frame";
import { generateMockAgentReply } from "@/lib/lyra/mock-chat";
import { cn } from "@/lib/utils/cn";
import type { Agent, ChatMessage } from "@/types";

type AgentChatProps = {
  agentId: string;
};

export function AgentChat({ agentId }: AgentChatProps) {
  const { user, loading, error: authError, supabase } = useSupabaseUser();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replySource, setReplySource] = useState<string | null>(null);
  const [evolutionStatus, setEvolutionStatus] = useState<string | null>(null);
  const [identityFrame, setIdentityFrame] = useState<IdentityFrame | null>(null);
  const [showIdentityFrame, setShowIdentityFrame] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const hasAutoScrolledRef = useRef(false);
  const introAttemptedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function loadChat() {
      if (!user) {
        setAgent(null);
        setMessages([]);
        return;
      }

      setIsLoadingChat(true);
      setError(null);

      try {
        const nextAgent = await getOwnedAgentClient({
          supabase,
          agentId,
          userId: user.id,
        });

        if (!nextAgent) {
          if (isMounted) {
            setAgent(null);
            setMessages([]);
            setError("Agent not found or not owned by you.");
          }
          return;
        }

        const nextMessages = await getAgentMessagesClient({
          supabase,
          agentId: nextAgent.id,
        });

        if (!isMounted) {
          return;
        }

        setAgent(nextAgent);
        setMessages(nextMessages);

        if (nextMessages.length === 0 && !introAttemptedRef.current) {
          introAttemptedRef.current = true;
          const intro = await insertChatMessageClient({
            supabase,
            user,
            agentId: nextAgent.id,
            role: "assistant",
            content: buildIntroMessage(nextAgent),
          });

          if (isMounted) {
            setMessages([intro]);
          }
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(formatChatError(caughtError));
        }
      } finally {
        if (isMounted) {
          setIsLoadingChat(false);
        }
      }
    }

    void loadChat();

    return () => {
      isMounted = false;
    };
  }, [agentId, supabase, user]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    const bottom = bottomRef.current;

    if (!container || !bottom) {
      return;
    }

    const behavior = hasAutoScrolledRef.current ? "smooth" : "auto";

    window.requestAnimationFrame(() => {
      bottom.scrollIntoView({ behavior, block: "end" });
      hasAutoScrolledRef.current = true;
    });
  }, [messages, isGenerating]);

  async function handleSend() {
    const content = input.trim();

    if (!content || !user || !agent || isGenerating) {
      return;
    }

    setInput("");
    setError(null);
    setEvolutionStatus(null);
    setIsGenerating(true);

    try {
      const userMessage = await insertChatMessageClient({
        supabase,
        user,
        agentId: agent.id,
        role: "user",
        content,
      });

      const messagesWithUser = [...messages, userMessage];
      setMessages(messagesWithUser);
      const nextIdentityFrame = buildIdentityFrame({
        agent,
        userMessage: content,
        previousMessages: messagesWithUser,
      });
      setIdentityFrame(nextIdentityFrame);

      if (process.env.NODE_ENV === "development") {
        console.log("[LYRA intent frame]", nextIdentityFrame.intentFrame);
        console.log("[LYRA identity position]", nextIdentityFrame.identityPosition);
        console.log("[LYRA worldview]", nextIdentityFrame.currentWorldview);
        console.log("[LYRA reasoning policy]", nextIdentityFrame.reasoningPolicy);
        console.log("[LYRA perspective]", nextIdentityFrame.perspective);
        console.log("[LYRA opinion]", nextIdentityFrame.opinion);
        console.log("[LYRA reasoning graph]", nextIdentityFrame.reasoningGraph);
        console.log("[LYRA reasoning plan]", nextIdentityFrame.reasoningPlan);
        console.log("[LYRA conversation plan]", nextIdentityFrame.conversationPlan);
        console.log("[LYRA identity critic]", nextIdentityFrame.identityCritique);
      }

      const { reply, source } = await generateReply({
        agent,
        userMessage: content,
        previousMessages: messagesWithUser,
        identityFrame: nextIdentityFrame,
      });

      setReplySource(source);

      const assistantMessage = await insertChatMessageClient({
        supabase,
        user,
        agentId: agent.id,
        role: "assistant",
        content: reply,
      });

      setMessages([...messagesWithUser, assistantMessage]);

      const evolution = await evolveAgentAfterUserMessageClient({
        supabase,
        agent,
        userMessage: content,
        latestAssistantMessage: assistantMessage.content,
        recentMessages: [...messagesWithUser, assistantMessage],
        identityFrame: nextIdentityFrame,
      });
      setAgent(evolution.agent);
      setEvolutionStatus(
        evolution.source === "gemini" ? "Memory evolved" : "Identity updated",
      );
    } catch (caughtError) {
      setError(formatChatError(caughtError));
    } finally {
      setIsGenerating(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  }

  if (loading || isLoadingChat) {
    return (
      <ChatState
        title="Opening chat..."
        body="LYRA is loading your browser session, agent identity, and message history."
      />
    );
  }

  if (!user) {
    return (
      <ChatState
        title="Auth required."
        body="Sign in to chat with your LYRA agents."
        actionHref="/auth"
        actionLabel="Sign in"
      />
    );
  }

  if (authError || error || !agent) {
    return (
      <ChatState
        title="Chat is unavailable."
        body={authError ?? error ?? "Agent not found or not owned by you."}
        actionHref="/agents"
        actionLabel="Back to My Agents"
      />
    );
  }

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden xl:grid-cols-[340px_minmax(0,1fr)] xl:grid-rows-1 xl:gap-6">
      <aside className="glass-card max-h-44 overflow-y-auto rounded-2xl p-5 xl:h-full xl:max-h-none">
        <div className="flex items-start gap-4">
          <PixelAvatar agent={agent} />
          <div>
            <p className="lyra-label text-sm">
              Chat
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white">
              {agent.name}
            </h1>
          </div>
        </div>
        <p className="mt-5 text-sm font-medium text-[var(--lyra-chip-text)]">{agent.topic}</p>
        <p className="mt-3 text-sm leading-6 text-slate-300">{agent.summary}</p>
        <TagBlock label="Keywords" tags={agent.keywords} />
        <TagBlock label="Traits" tags={agent.personalityTraits} muted />
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href={`/agents/${agent.id}`}
            className="rounded-full border border-[var(--lyra-button-border)] bg-white/[0.045] px-4 py-2 text-center text-sm text-[var(--lyra-button-text)] transition hover:border-[var(--lyra-button-hover-border)] hover:bg-[var(--lyra-button-hover-bg)]"
          >
            Back to agent
          </Link>
          <Link
            href="/agents"
            className="rounded-full border border-[var(--lyra-button-border)] bg-white/[0.045] px-4 py-2 text-center text-sm text-[var(--lyra-button-text)] transition hover:border-[var(--lyra-button-hover-border)] hover:bg-[var(--lyra-button-hover-bg)]"
          >
            Back to My Agents
          </Link>
        </div>
      </aside>

      <section className="glass-card flex min-h-0 flex-col overflow-hidden rounded-2xl p-4 sm:p-5">
        <div className="shrink-0 border-b border-white/10 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-400">Conversation engine V2</p>
            {process.env.NODE_ENV === "development" && replySource && (
              <div className="flex items-center gap-2">
                <p className="lyra-chip rounded-full px-2.5 py-1 text-xs">
                  {formatReplySource(replySource)}
                </p>
                {identityFrame && (
                  <button
                    type="button"
                    onClick={() => setShowIdentityFrame((value) => !value)}
                    className="lyra-chip rounded-full px-2.5 py-1 text-xs"
                  >
                    Identity Frame
                  </button>
                )}
              </div>
            )}
          </div>
          <h2 className="mt-1 text-2xl font-semibold text-white">
            Ask, refine, evolve
          </h2>
          {process.env.NODE_ENV === "development" &&
            showIdentityFrame &&
            identityFrame && (
              <div className="mt-3 rounded-xl border border-[var(--lyra-inner-border)] bg-[rgba(20,18,28,0.55)] p-3 text-xs leading-5 text-[var(--lyra-text-muted)]">
                <p>User intent: {identityFrame.userIntent}</p>
                <p>Position: {identityFrame.agentPosition}</p>
                <p>Style: {identityFrame.responseStyle}</p>
                <p>Opening: {identityFrame.conversationPlan.openingMove}</p>
                <p>Policy: {identityFrame.reasoningPolicy.name}</p>
                <p>Opinion: {identityFrame.opinion}</p>
                <p>Worldview: {identityFrame.currentWorldview.summary}</p>
              </div>
            )}
        </div>

        <div
          ref={messagesContainerRef}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto py-5 pr-1"
        >
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isGenerating && (
            <div className="max-w-2xl rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-slate-300">
              {agent.name} is composing a response...
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        {evolutionStatus && (
          <p className="mb-3 lyra-label text-xs">{evolutionStatus}</p>
        )}

        <div className="flex shrink-0 gap-3">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${agent.name}...`}
            className="lyra-input min-h-12 flex-1 resize-none rounded-xl px-4 py-3 text-sm outline-none"
          />
          <Button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isGenerating}
            className="h-auto self-end"
          >
            Send
          </Button>
        </div>
      </section>
    </div>
  );
}

function ChatState({
  title,
  body,
  actionHref,
  actionLabel,
}: {
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <section className="glass-card rounded-2xl p-8">
      <h1 className="text-4xl font-semibold text-white">{title}</h1>
      <p className="mt-3 max-w-2xl text-slate-300">{body}</p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-6 inline-flex rounded-full border border-[var(--lyra-button-border)] bg-[rgba(255,255,255,0.075)] px-5 py-3 text-sm font-medium text-[var(--lyra-button-text)] transition hover:border-[var(--lyra-button-hover-border)] hover:bg-[var(--lyra-button-hover-bg)]"
        >
          {actionLabel}
        </Link>
      )}
    </section>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "max-w-2xl rounded-2xl px-4 py-3 text-sm leading-6",
        isUser
          ? "ml-auto bg-white text-black"
          : "border border-white/10 bg-white/8 text-slate-100",
      )}
    >
      <p className="whitespace-pre-wrap">{message.content}</p>
      <p className={cn("mt-2 text-xs", isUser ? "text-[var(--lyra-text-soft)]" : "text-[var(--lyra-text-soft)]")}>
        {isUser ? "You" : message.role === "system" ? "System" : "Agent"}
      </p>
    </div>
  );
}

function TagBlock({
  label,
  tags,
  muted,
}: {
  label: string;
  tags: string[];
  muted?: boolean;
}) {
  return (
    <div className="mt-5">
      <p className="lyra-label text-xs">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {tags.length > 0 ? (
          tags.map((tag) => (
            <span
              key={tag}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs",
                muted
                  ? "lyra-chip"
                  : "lyra-chip",
              )}
            >
              {tag}
            </span>
          ))
        ) : (
          <span className="text-sm text-[var(--lyra-text-soft)]">Evolves through chat</span>
        )}
      </div>
    </div>
  );
}

function PixelAvatar({ agent }: { agent: Agent }) {
  const [first, second, third] = agent.avatarConfig.palette;

  return (
    <div className="grid size-16 shrink-0 grid-cols-3 grid-rows-3 overflow-hidden rounded-xl border border-white/15">
      {Array.from({ length: 9 }).map((_, index) => (
        <span
          key={index}
          style={{
            backgroundColor:
              index % 3 === 0 ? first : index % 2 === 0 ? second : third,
            opacity: index === 4 ? 1 : 0.82,
          }}
        />
      ))}
    </div>
  );
}

function buildIntroMessage(agent: Agent) {
  return `I am ${agent.name}, shaped around ${agent.topic}. ${agent.summary} Ask me a focused question, give me a messy idea to refine, or push me toward a sharper perspective.`;
}

async function generateReply({
  agent,
  userMessage,
  previousMessages,
  identityFrame,
}: {
  agent: Agent;
  userMessage: string;
  previousMessages: ChatMessage[];
  identityFrame: IdentityFrame;
}) {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent,
        userMessage,
        previousMessages,
        identityFrame,
      }),
    });

    if (!response.ok) {
      throw new Error(`Chat API failed with ${response.status}`);
    }

    const data = (await response.json()) as {
      reply?: string;
      source?: string;
    };

    if (!data.reply) {
      throw new Error("Chat API returned an empty reply.");
    }

    return {
      reply: data.reply,
      source: data.source ?? "api",
    };
  } catch {
    return {
      reply: generateMockAgentReply(
        agent,
        userMessage,
        previousMessages,
        identityFrame,
      ),
      source: "local-mock",
    };
  }
}

function formatReplySource(source: string) {
  return source === "gemini" ? "Gemini" : "Mock";
}
