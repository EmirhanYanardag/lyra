import { getAgentMemoryProfile } from "@/lib/lyra/memory";
import type { Agent, AgentLineage, OgProvenance } from "@/types";

type EvolutionTimelineProps = {
  agent: Agent;
  lineageRows: AgentLineage[];
  ogProvenance?: OgProvenance;
};

type TimelineEvent = {
  title: string;
  description: string;
  timestamp?: string;
};

export function EvolutionTimeline({
  agent,
  lineageRows,
  ogProvenance,
}: EvolutionTimelineProps) {
  const events = buildTimelineEvents(agent, lineageRows, ogProvenance);

  return (
    <section className="glass-card mt-6 rounded-2xl p-6">
      <p className="lyra-label text-sm">
        Evolution Timeline
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-white">
        Persistent identity layer
      </h2>
      <div className="mt-6 space-y-0">
        {events.map((event, index) => (
          <div key={`${event.title}-${index}`} className="relative grid grid-cols-[28px_1fr] gap-4">
            <div className="flex flex-col items-center">
              <span className="mt-1 size-3 rounded-full border border-[var(--lyra-selected-border)] bg-[var(--lyra-accent)] shadow-[0_0_18px_rgba(143,134,201,0.28)]" />
              {index < events.length - 1 && (
                <span className="mt-2 h-full min-h-12 w-px bg-white/10" />
              )}
            </div>
            <div className="pb-5">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-white">{event.title}</h3>
                  {event.timestamp && (
                    <span className="text-xs text-[var(--lyra-text-soft)]">
                      {formatDate(event.timestamp)}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {event.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function buildTimelineEvents(
  agent: Agent,
  lineageRows: AgentLineage[],
  ogProvenance?: OgProvenance,
): TimelineEvent[] {
  const memory = getAgentMemoryProfile(agent);
  const events: TimelineEvent[] = [
    {
      title: "Agent Created",
      description: `Created as a ${agent.type === "mixed" ? "hybrid" : agent.type} identity shaped by ${agent.topic}.`,
      timestamp: agent.createdAt,
    },
  ];

  if (agent.type === "clone") {
    const cloneRow = lineageRows.find((row) => row.relationType === "clone");
    events.push({
      title: "Cloned From Parent",
      description: `Created as an independent branch from ${cloneRow?.parentSnapshotName ?? "a parent agent"}. Lineage preserved at ${cloneRow?.percentage ?? 100}%.`,
      timestamp: cloneRow?.createdAt,
    });
  }

  if (agent.type === "mixed") {
    events.push({
      title: "Mixed From Parents",
      description: `Synthesized from ${lineageRows.length || 2} parent identities. The hybrid can now develop its own worldview.`,
      timestamp: lineageRows[0]?.createdAt,
    });
  }

  for (const entry of memory.evolutionLog.slice(0, 6)) {
    events.push({
      title: "Memory Evolved",
      description: normalizeEvolutionEntry(entry),
    });
  }

  const versions = ogProvenance?.versions ?? [];

  if (versions.length > 0) {
    for (const version of versions) {
      events.push({
        title:
          version.version === 1 ? "Published to 0G" : "Republished to 0G",
        description:
          "Agent DNA Capsule preserved identity, memory, and lineage on 0G Storage.",
        timestamp: version.publishedAt,
      });
    }
  } else if (ogProvenance?.rootHash) {
    events.push({
      title: "Published to 0G",
      description:
        "Agent DNA, memory profile, and lineage history were stored as a persistent 0G capsule.",
      timestamp: ogProvenance.publishedAt,
    });
  }

  return events;
}

function normalizeEvolutionEntry(entry: string) {
  const lower = entry.toLowerCase();
  const messyWords = lower
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 4)
    .slice(0, 3);

  if (/(agree|more|through|developed through)/.test(lower) && messyWords.length > 0) {
    return `Expanded memory around ${messyWords.join(", ")} through recent conversation.`;
  }

  if (/(hybrid|mixed)/.test(lower)) {
    return "Integrated a new discussion into its independent hybrid worldview.";
  }

  if (/(clone|diverging)/.test(lower)) {
    return "Updated the clone's personal stance and moved further from its parent branch.";
  }

  if (entry.length > 120) {
    return "Updated personal stance through recent conversation.";
  }

  return entry;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
