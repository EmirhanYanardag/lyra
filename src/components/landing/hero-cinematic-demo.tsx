"use client";

import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

type TimelineScene =
  | "create0g"
  | "chat0g"
  | "profile0g"
  | "createThales"
  | "chatThales"
  | "profileThales"
  | "mixClick"
  | "emptyPause"
  | "hybridReveal";

type DemoMessage = {
  role: "agent" | "user";
  text: string;
  delay: number;
  speed: number;
};

const timeline: Array<{ scene: TimelineScene; duration: number }> = [
  { scene: "create0g", duration: 5800 },
  { scene: "chat0g", duration: 18100 },
  { scene: "profile0g", duration: 3600 },
  { scene: "createThales", duration: 7600 },
  { scene: "chatThales", duration: 13500 },
  { scene: "profileThales", duration: 3600 },
  { scene: "mixClick", duration: 2800 },
  { scene: "emptyPause", duration: 300 },
  { scene: "hybridReveal", duration: 12000 },
];

function useSceneElapsed(scene: TimelineScene) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startedAt = performance.now();
    const interval = window.setInterval(() => {
      setElapsed(performance.now() - startedAt);
    }, 100);

    return () => window.clearInterval(interval);
  }, [scene]);

  return elapsed;
}

const ogMessages = [
  {
    role: "agent",
    text: "AI can generate knowledge. But without memory, it cannot preserve identity.",
    delay: 500,
    speed: 34,
  },
  {
    role: "user",
    text: "Why isn't ordinary storage enough?",
    delay: 3400,
    speed: 30,
  },
  {
    role: "agent",
    text: "Because identity is more than data. Every decision, every memory, and every evolution must remain verifiable.",
    delay: 5900,
    speed: 34,
  },
  {
    role: "user",
    text: "And where should that identity live?",
    delay: 9700,
    speed: 30,
  },
  {
    role: "agent",
    text: "On infrastructure built for permanence. 0G allows identities to carry memory beyond a single application, making evolution portable instead of disposable.",
    delay: 11800,
    speed: 34,
  },
] satisfies DemoMessage[];

const thalesMessages = [
  {
    role: "agent",
    text: "Everything begins by asking what remains true.",
    delay: 500,
    speed: 34,
  },
  {
    role: "user",
    text: "If an AI changes every day, does it remain the same identity?",
    delay: 2500,
    speed: 30,
  },
  {
    role: "agent",
    text: "Only if its journey can be remembered. A mind without continuity becomes a different mind every moment.",
    delay: 4500,
    speed: 34,
  },
  {
    role: "user",
    text: "So memory gives identity?",
    delay: 7200,
    speed: 30,
  },
  {
    role: "agent",
    text: "Memory preserves identity. Reflection transforms it. Together, they create wisdom.",
    delay: 9500,
    speed: 34,
  },
] satisfies DemoMessage[];

function useReducedMotion() {
  return useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      query.addEventListener("change", notify);
      return () => query.removeEventListener("change", notify);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

function Typewriter({
  text,
  delay = 0,
  speed = 36,
  cursor = false,
}: {
  text: string;
  delay?: number;
  speed?: number;
  cursor?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const [visibleLength, setVisibleLength] = useState(0);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    let interval: number | undefined;
    const startTimer = window.setTimeout(() => {
      let index = 0;
      interval = window.setInterval(() => {
        index += 1;
        setVisibleLength(index);

        if (index >= text.length && interval) {
          window.clearInterval(interval);
        }
      }, speed);
    }, delay);

    return () => {
      window.clearTimeout(startTimer);
      if (interval) {
        window.clearInterval(interval);
      }
    };
  }, [delay, reducedMotion, speed, text]);

  return (
    <span>
      {reducedMotion ? text : text.slice(0, visibleLength)}
      {cursor && !reducedMotion && visibleLength < text.length ? (
        <span className="lyra-cursor ml-0.5 inline-block h-4 w-px translate-y-0.5 bg-sky-200" />
      ) : null}
    </span>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-sky-300/25 bg-sky-300/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-sky-100">
      {children}
    </span>
  );
}

function Keyword({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[11px] text-slate-300">
      {children}
    </span>
  );
}

function IdentityFlowFrame({
  children,
  className = "",
  fading = false,
  mode = "dual",
  pulsing = false,
}: {
  children: React.ReactNode;
  className?: string;
  fading?: boolean;
  mode?: "single" | "dual";
  pulsing?: boolean;
}) {
  return (
    <div
      className={`lyra-outer-frame ${
        mode === "single" ? "hero-single-panel-frame" : "w-full"
      } relative h-full min-w-0 overflow-hidden rounded-[2rem] border border-white/12 bg-black/20 p-3 shadow-[0_24px_90px_rgba(0,0,0,0.38)] backdrop-blur-2xl ${
        fading ? "lyra-frame-fade-out" : ""
      } ${pulsing ? "lyra-frame-pulse" : ""} ${className}`}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-2 pb-3">
        <div className="flex gap-1.5">
          <span className="size-2 rounded-full bg-white/25" />
          <span className="size-2 rounded-full bg-white/18" />
          <span className="size-2 rounded-full bg-white/12" />
        </div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">
          LYRA Live Identity Flow
        </p>
      </div>

      <div className="relative grid min-h-[540px] place-items-center p-3 sm:min-h-[590px] sm:p-5">
        <div key={String(children)} className="lyra-panel-enter w-full">
          {children}
        </div>
      </div>

      <div className="border-t border-white/10 px-2 pt-3 text-center text-[11px] uppercase tracking-[0.22em] text-slate-500">
        Create - Chat - Mix - Preserve
      </div>
    </div>
  );
}

function CreateView({
  topic,
  description,
}: {
  topic: string;
  description: string;
}) {
  return (
    <div className="lyra-create-card glass-card rounded-3xl p-4">
      <p className="text-sm font-medium text-white">Create Identity</p>
      <div className="lyra-create-field mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
          Topic
        </p>
        <p className="mt-3 min-h-20 text-left text-base leading-7 text-white">
          <Typewriter key={topic} text={topic} delay={180} speed={46} cursor />
        </p>
      </div>
      <p className="lyra-create-description mt-4 min-h-16 text-sm leading-6 text-slate-300">
        <Typewriter
          key={description}
          text={description}
          delay={1850}
          speed={30}
        />
      </p>
      <div className="lyra-create-action mt-5 flex justify-end">
        <button className="lyra-create-click relative overflow-hidden rounded-full border border-violet-300/40 bg-white px-5 py-2.5 text-sm font-medium text-black">
          Create
        </button>
      </div>
    </div>
  );
}

function ChatBubble({
  message,
  completed = false,
}: {
  message: DemoMessage;
  completed?: boolean;
}) {
  return (
    <div
      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`lyra-chat-bubble w-fit max-w-[88%] rounded-2xl border px-3.5 py-2.5 text-left text-sm leading-5 [direction:ltr] ${
          message.role === "user"
            ? "border-violet-300/25 bg-violet-300/12 text-violet-50"
            : "border-white/10 bg-white/8 text-slate-200"
        }`}
      >
        {completed ? (
          message.text
        ) : (
          <span className="grid text-left [direction:ltr]">
            <span className="invisible col-start-1 row-start-1 whitespace-pre-wrap">
              {message.text}
            </span>
            <span className="col-start-1 row-start-1 text-left [direction:ltr]">
              <Typewriter
                key={message.text}
                text={message.text}
                delay={120}
                speed={message.speed}
              />
            </span>
          </span>
        )}
      </div>
    </div>
  );
}

function ChatView({
  name,
  messages,
  completed = false,
  scene,
}: {
  name: string;
  messages: DemoMessage[];
  completed?: boolean;
  scene: TimelineScene;
}) {
  const elapsed = useSceneElapsed(scene);
  const visibleMessages = completed
    ? messages
    : messages.filter((message) => elapsed >= message.delay);

  return (
    <div className="lyra-chat-card glass-card rounded-3xl p-4">
      <div className="lyra-chat-header flex items-center gap-3 border-b border-white/10 pb-4">
        <div className="grid size-9 place-items-center rounded-xl border border-violet-300/25 bg-white/10 font-mono text-xs text-violet-100">
          LY
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{name}</p>
          <p className="text-xs text-slate-500">Live identity chat</p>
        </div>
      </div>
      <div className="mt-4 space-y-2.5">
        {visibleMessages.map((message) => (
          <ChatBubble
            key={message.text}
            message={message}
            completed={completed}
          />
        ))}
      </div>
    </div>
  );
}

function ProfileView({
  name,
  description,
  keywords,
  mixing = false,
  hybrid = false,
  completed = false,
}: {
  name: string;
  description: string;
  keywords: string[];
  mixing?: boolean;
  hybrid?: boolean;
  completed?: boolean;
}) {
  return (
    <div className="lyra-profile-card rounded-3xl border border-white/10 bg-white/8 p-4">
      <div className="lyra-profile-head flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-sky-300/20 bg-sky-300/10 font-mono text-xs text-sky-100">
          LY
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-white">{name}</p>
            <Badge>{hybrid ? "Hybrid" : "Original"}</Badge>
          </div>
          <p className="mt-3 min-h-16 text-sm leading-6 text-slate-300">
            {completed ? (
              description
            ) : (
              <Typewriter text={description} delay={220} speed={30} />
            )}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {keywords.map((keyword, index) => (
          <span
            key={keyword}
            className="lyra-keyword-in"
            style={{ animationDelay: `${860 + index * 130}ms` }}
          >
            <Keyword>{keyword}</Keyword>
          </span>
        ))}
      </div>
      <button
        className={`lyra-profile-button relative mt-5 w-full overflow-hidden rounded-full border border-violet-300/40 bg-white px-5 py-2.5 text-sm font-medium text-black ${
          mixing ? "lyra-mix-click" : ""
        }`}
      >
        Mix
      </button>
    </div>
  );
}

function OgProfile({ mixing = false }: { mixing?: boolean }) {
  return (
    <ProfileView
      name="0G Memory Agent"
      description="Explains decentralized memory, provenance, and why evolving agents need portable identity records."
      keywords={["0G", "memory", "provenance"]}
      mixing={mixing}
      completed={mixing}
    />
  );
}

function ThalesProfile({
  mixing = false,
  completed = false,
}: {
  mixing?: boolean;
  completed?: boolean;
}) {
  return (
    <ProfileView
      name="Thales Agent"
      description="Reasons from first principles and connects ancient philosophy to modern systems."
      keywords={["philosophy", "thales", "reasoning"]}
      mixing={mixing}
      completed={completed || mixing}
    />
  );
}

function StableOgProfile() {
  return (
    <ProfileView
      name="0G Memory Agent"
      description="Explains decentralized memory, provenance, and why evolving agents need portable identity records."
      keywords={["0G", "memory", "provenance"]}
      completed
    />
  );
}

function SinglePanelStage({ children }: { children: React.ReactNode }) {
  return (
    <div className="lyra-single-panel-stage">
      {children}
    </div>
  );
}

function DualPanelStage({
  left,
  right,
  fading = false,
  pulsing = false,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  fading?: boolean;
  pulsing?: boolean;
}) {
  return (
    <div className="hero-dual-panels">
      <div className="hero-dual-panel">
        <IdentityFlowFrame fading={fading} pulsing={pulsing}>
          {left}
        </IdentityFlowFrame>
      </div>
      <div className="hero-dual-panel">
        <IdentityFlowFrame
          className="lyra-second-frame"
          fading={fading}
          pulsing={pulsing}
        >
          {right}
        </IdentityFlowFrame>
      </div>
    </div>
  );
}

function HybridView() {
  return (
    <div className="lyra-hybrid-enter">
      <p className="mb-3 text-xs uppercase tracking-[0.22em] text-slate-500">
        New Hybrid Identity
      </p>
      <ProfileView
        name="Proof Philosopher"
        description="A hybrid identity that combines verifiable memory with first-principles reasoning, preserving every evolution while questioning every assumption."
        keywords={[
          "Identity",
          "Memory",
          "0G",
          "Philosophy",
          "Reasoning",
          "Continuity",
          "Lineage",
        ]}
        hybrid
      />
      <p className="lyra-lineage-in mt-4 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-xs text-slate-400">
        An identity becomes trustworthy not because it never changes, but because every change can be proven.
      </p>
    </div>
  );
}

function EmptyPause() {
  return <div className="min-h-[520px] w-full" aria-hidden="true" />;
}

export function HeroCinematicDemo() {
  const reducedMotion = useReducedMotion();
  const [timelineIndex, setTimelineIndex] = useState(0);
  const activeScene = reducedMotion
    ? "hybridReveal"
    : timeline[timelineIndex]?.scene ?? "create0g";

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    const timer = window.setTimeout(() => {
      setTimelineIndex((current) => (current + 1) % timeline.length);
    }, timeline[timelineIndex]?.duration ?? 5000);

    return () => window.clearTimeout(timer);
  }, [reducedMotion, timelineIndex]);

  const content = useMemo(() => {
    switch (activeScene) {
      case "create0g":
        return (
          <SinglePanelStage>
            <IdentityFlowFrame mode="single">
            <CreateView
              topic="0G as the memory layer for evolving AI identities"
              description="An agent that explains why decentralized storage matters for living AI."
            />
            </IdentityFlowFrame>
          </SinglePanelStage>
        );
      case "chat0g":
        return (
          <SinglePanelStage>
            <IdentityFlowFrame mode="single">
            <ChatView
              name="0G Memory Agent"
              messages={ogMessages}
              scene={activeScene}
            />
            </IdentityFlowFrame>
          </SinglePanelStage>
        );
      case "profile0g":
        return (
          <SinglePanelStage>
            <IdentityFlowFrame mode="single">
              <OgProfile />
            </IdentityFlowFrame>
          </SinglePanelStage>
        );
      case "createThales":
        return (
          <DualPanelStage
            left={<StableOgProfile />}
            right={
              <CreateView
                topic="Thales and the origin of rational thinking"
                description="An agent shaped by early philosophy, observation, and first principles."
              />
            }
          />
        );
      case "chatThales":
        return (
          <DualPanelStage
            left={<StableOgProfile />}
            right={
              <ChatView
                name="Thales Agent"
                messages={thalesMessages}
                scene={activeScene}
              />
            }
          />
        );
      case "profileThales":
        return (
          <DualPanelStage left={<StableOgProfile />} right={<ThalesProfile />} />
        );
      case "mixClick":
        return (
          <DualPanelStage
            left={<OgProfile mixing />}
            right={<ThalesProfile mixing />}
            fading
            pulsing
          />
        );
      case "emptyPause":
        return <EmptyPause />;
      case "hybridReveal":
        return (
          <SinglePanelStage>
            <IdentityFlowFrame mode="single">
              <HybridView />
            </IdentityFlowFrame>
          </SinglePanelStage>
        );
      default:
        return null;
    }
  }, [activeScene]);

  return (
    <div className="relative mx-auto w-full lg:mx-0">
      <div key={activeScene} className="relative w-full">
        {content}
      </div>

      <style jsx global>{`
        .hero-dual-panels {
          --hero-demo-scale: min(1, calc((100vw - 32px) / 1080));
          display: grid !important;
          grid-template-columns: repeat(2, 520px) !important;
          gap: 40px !important;
          width: 1080px !important;
          max-width: none !important;
          margin-left: auto !important;
          margin-right: auto !important;
          align-items: stretch !important;
          transform: scale(var(--hero-demo-scale));
          transform-origin: center;
        }

        .hero-dual-panel {
          width: 520px !important;
          min-width: 0 !important;
          max-width: 520px !important;
        }

        .hero-dual-panel > * {
          width: 100% !important;
          min-width: 0 !important;
          max-width: none !important;
        }

        .hero-single-panel-frame {
          width: min(100%, 520px) !important;
          max-width: calc(100vw - 32px) !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }

        @media (max-width: 899px) {
          .hero-dual-panels {
            grid-template-columns: 1fr !important;
            width: min(100%, 540px) !important;
            max-width: calc(100vw - 32px) !important;
            gap: 24px !important;
            transform: none;
          }

          .hero-dual-panel {
            width: 100% !important;
            max-width: none !important;
          }
        }
      `}</style>

      <style jsx>{`
        .lyra-single-panel-stage {
          margin-inline: auto;
          max-width: calc(100vw - 32px);
          width: min(
            calc((100% - clamp(12px, 1.5vw, 24px)) / 2),
            538px
          );
        }

        @media (max-width: 899px) {
          .lyra-single-panel-stage {
            width: min(100%, 540px);
          }
        }

        .lyra-outer-frame {
          animation: lyraFrameIn 1000ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .lyra-second-frame {
          animation-delay: 260ms;
        }

        .lyra-panel-enter {
          animation: lyraPanelIn 900ms 160ms cubic-bezier(0.16, 1, 0.3, 1)
            both;
        }

        .lyra-hybrid-enter {
          animation: lyraHybridIn 1000ms 120ms cubic-bezier(0.16, 1, 0.3, 1)
            both;
        }

        .lyra-chat-bubble {
          animation: lyraBubbleIn 450ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .lyra-create-card,
        .lyra-chat-card {
          animation: lyraCardIn 900ms 250ms cubic-bezier(0.16, 1, 0.3, 1)
            both;
        }

        .lyra-create-field,
        .lyra-chat-header {
          animation: lyraStaggerIn 620ms 120ms cubic-bezier(0.16, 1, 0.3, 1)
            both;
        }

        .lyra-create-description {
          animation: lyraStaggerIn 640ms 220ms cubic-bezier(0.16, 1, 0.3, 1)
            both;
        }

        .lyra-create-action {
          animation: lyraButtonIn 660ms 340ms cubic-bezier(0.16, 1, 0.3, 1)
            both;
        }

        .lyra-profile-card {
          animation: lyraProfileIn 900ms 180ms cubic-bezier(0.16, 1, 0.3, 1)
            both;
        }

        .lyra-profile-head {
          animation: lyraStaggerIn 620ms 120ms cubic-bezier(0.16, 1, 0.3, 1)
            both;
        }

        .lyra-keyword-in {
          display: inline-flex;
          opacity: 0;
          animation: lyraStaggerIn 540ms cubic-bezier(0.16, 1, 0.3, 1)
            forwards;
        }

        .lyra-profile-button,
        .lyra-lineage-in {
          opacity: 0;
          animation: lyraButtonIn 680ms 1280ms cubic-bezier(0.16, 1, 0.3, 1)
            forwards;
        }

        .lyra-frame-fade-out {
          animation: lyraFrameIn 1000ms cubic-bezier(0.16, 1, 0.3, 1) both,
            lyraDualFadeOut 700ms 1500ms cubic-bezier(0.7, 0, 0.84, 0) both;
        }

        .lyra-frame-pulse {
          box-shadow: 0 24px 90px rgba(0, 0, 0, 0.38),
            0 0 46px rgba(125, 211, 252, 0.14);
        }

        .lyra-cursor {
          animation: lyraCursorBlink 900ms steps(2, start) infinite;
        }

        .lyra-create-click,
        .lyra-mix-click {
          animation: lyraButtonClick 2500ms ease-in-out infinite;
        }

        .lyra-create-click::after,
        .lyra-mix-click::after {
          content: "";
          position: absolute;
          inset: -40% -120%;
          background: linear-gradient(
            115deg,
            transparent 35%,
            rgba(255, 255, 255, 0.65) 50%,
            transparent 65%
          );
          animation: lyraLightSweep 2500ms ease-in-out infinite;
        }

        @keyframes lyraFrameIn {
          0% {
            opacity: 0;
            filter: blur(16px);
            transform: translateY(24px) scale(0.96);
            box-shadow: 0 0 0 rgba(125, 211, 252, 0);
          }
          68% {
            opacity: 1;
            filter: blur(0);
            transform: translateY(0) scale(1);
            box-shadow: 0 24px 90px rgba(0, 0, 0, 0.38),
              0 0 58px rgba(125, 211, 252, 0.13);
          }
          100% {
            opacity: 1;
            filter: blur(0);
            transform: translateY(0) scale(1);
            box-shadow: 0 24px 90px rgba(0, 0, 0, 0.38),
              0 0 44px rgba(125, 211, 252, 0.08);
          }
        }

        @keyframes lyraPanelIn {
          from {
            opacity: 0;
            filter: blur(12px);
            transform: translateY(18px) scale(0.97);
          }
          to {
            opacity: 1;
            filter: blur(0);
            transform: translateY(0) scale(1);
          }
        }

        @keyframes lyraCardIn {
          from {
            opacity: 0;
            filter: blur(12px);
            transform: translateY(18px) scale(0.97);
          }
          to {
            opacity: 1;
            filter: blur(0);
            transform: translateY(0) scale(1);
          }
        }

        @keyframes lyraHybridIn {
          from {
            opacity: 0;
            filter: blur(14px);
            transform: translateY(20px) scale(0.965);
          }
          to {
            opacity: 1;
            filter: blur(0);
            transform: translateY(0) scale(1);
          }
        }

        @keyframes lyraBubbleIn {
          from {
            opacity: 0;
            filter: blur(8px);
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            filter: blur(0);
            transform: translateY(0);
          }
        }

        @keyframes lyraStaggerIn {
          from {
            opacity: 0;
            filter: blur(6px);
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            filter: blur(0);
            transform: translateY(0);
          }
        }

        @keyframes lyraButtonIn {
          from {
            opacity: 0;
            filter: blur(6px);
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            filter: blur(0);
            transform: scale(1);
          }
        }

        @keyframes lyraProfileIn {
          from {
            opacity: 0;
            filter: blur(12px);
            transform: translateY(18px) scale(0.97);
          }
          to {
            opacity: 1;
            filter: blur(0);
            transform: translateY(0) scale(1);
          }
        }

        @keyframes lyraDualFadeOut {
          from {
            opacity: 1;
            filter: blur(0);
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            filter: blur(10px);
            transform: translateY(-8px) scale(0.985);
          }
        }

        @keyframes lyraCursorBlink {
          0%,
          45% {
            opacity: 1;
          }
          46%,
          100% {
            opacity: 0;
          }
        }

        @keyframes lyraButtonClick {
          0%,
          52%,
          100% {
            transform: scale(1);
            box-shadow: 0 0 22px rgba(139, 92, 246, 0.16);
          }
          62% {
            transform: scale(0.975);
            box-shadow: 0 0 46px rgba(125, 211, 252, 0.32);
          }
          72% {
            transform: scale(1.025);
            box-shadow: 0 0 52px rgba(139, 92, 246, 0.28);
          }
        }

        @keyframes lyraLightSweep {
          0%,
          52% {
            transform: translateX(-70%) rotate(8deg);
            opacity: 0;
          }
          62% {
            opacity: 0.9;
          }
          82%,
          100% {
            transform: translateX(70%) rotate(8deg);
            opacity: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .lyra-outer-frame,
          .lyra-panel-enter,
          .lyra-hybrid-enter,
          .lyra-frame-fade-out,
          .lyra-cursor,
          .lyra-create-click,
          .lyra-mix-click,
          .lyra-chat-bubble,
          .lyra-create-card,
          .lyra-create-field,
          .lyra-create-description,
          .lyra-create-action,
          .lyra-chat-card,
          .lyra-chat-header,
          .lyra-profile-card,
          .lyra-profile-head,
          .lyra-keyword-in,
          .lyra-profile-button,
          .lyra-lineage-in {
            animation: none;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
