import Link from "next/link";
import type { ReactNode } from "react";
import {
  getAgentCardSubtitle,
  getAgentCardSummary,
  getDisplayKeywords,
} from "@/lib/lyra/display-content";
import type { Agent } from "@/types";
import { cn } from "@/lib/utils/cn";

type AgentCardProps = {
  agent: Agent;
  showCloneButton?: boolean;
  showViewButton?: boolean;
  showChatButton?: boolean;
  cloneNode?: ReactNode;
  className?: string;
};

const typeStyles = {
  original: "lyra-chip",
  clone: "lyra-chip",
  mixed: "lyra-chip",
};

const typeLabels = {
  original: "Original",
  clone: "Clone",
  mixed: "Hybrid",
};

export function AgentCard({
  agent,
  showCloneButton,
  showViewButton,
  cloneNode,
  className,
}: AgentCardProps) {
  const cloneCount = agent.cloneCount ?? 0;
  const hybridCount = agent.hybridCount ?? 0;
  const summary = getAgentCardSummary(agent);
  const subtitle = getAgentCardSubtitle(agent);
  const keywords = getDisplayKeywords(agent);

  if (process.env.NODE_ENV === "development") {
    console.log("[LYRA metrics]", agent.name, cloneCount, hybridCount);
  }

  return (
    <article className={cn("glass-card rounded-2xl p-5", className)}>
      <div className="flex items-start gap-4">
        <PixelAvatar agent={agent} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-semibold text-white">
              {agent.name}
            </h3>
            <span
              className={cn("rounded-full px-2.5 py-1 text-xs capitalize", typeStyles[agent.type])}
            >
              {typeLabels[agent.type]}
            </span>
            {agent.storageHash && (
              <span className="lyra-chip rounded-full px-2.5 py-1 text-xs">
                0G
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-400">by @{agent.ownerUsername}</p>
          {subtitle && (
            <p className="lyra-label mt-1 text-xs tracking-[0.16em]">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <p className="mt-5 line-clamp-2 text-sm leading-6 text-slate-300">
        {summary}
      </p>
      <NetworkMetrics cloneCount={cloneCount} hybridCount={hybridCount} />

      <TagRow label="Keywords" tags={keywords} />

      {(showCloneButton || showViewButton || cloneNode) && (
        <div className="mt-5 flex flex-wrap gap-3">
          {showViewButton && (
            <Link
              href={`/agents/${agent.id}`}
            className="rounded-full border border-[var(--lyra-button-border)] bg-white/[0.045] px-4 py-2 text-sm text-[var(--lyra-button-text)] transition hover:border-[var(--lyra-button-hover-border)] hover:bg-[var(--lyra-button-hover-bg)]"
            >
              View
            </Link>
          )}
          {cloneNode}
          {showCloneButton && !cloneNode && (
            <Link
              href={`/agents/new?clone=${agent.id}`}
              className="lyra-accent-button rounded-full px-4 py-2 text-sm"
            >
              Clone
            </Link>
          )}
        </div>
      )}
    </article>
  );
}

function NetworkMetrics({
  cloneCount,
  hybridCount,
}: {
  cloneCount: number;
  hybridCount: number;
}) {
  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="lyra-label text-xs">
        Network
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <span className="lyra-chip rounded-full px-2.5 py-1 text-xs">
          {cloneCount} Clones
        </span>
        <span className="lyra-chip rounded-full px-2.5 py-1 text-xs">
          {hybridCount} Hybrids
        </span>
      </div>
    </div>
  );
}

function TagRow({
  label,
  tags,
}: {
  label: string;
  tags: string[];
}) {
  return (
    <div className="mt-4">
      <p className="lyra-label text-xs">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="lyra-chip rounded-full px-2.5 py-1 text-xs"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function PixelAvatar({ agent }: { agent: Agent }) {
  const [first, second, third] = agent.avatarConfig.palette;

  return (
    <div
      className="grid size-14 shrink-0 grid-cols-3 grid-rows-3 overflow-hidden rounded-xl border border-white/15"
      aria-label={`${agent.name} avatar`}
    >
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
