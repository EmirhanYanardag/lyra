"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { shortenHash } from "@/lib/0g/links";
import { buildAgentDnaCapsule } from "@/lib/lyra/dna-capsule";
import { getAgentMemoryProfile } from "@/lib/lyra/memory";
import { cn } from "@/lib/utils/cn";
import type {
  Agent,
  AgentLineage,
  OgProvenance,
  UserProfile,
} from "@/types";

type DnaCapsuleViewerProps = {
  agent: Agent;
  lineageRows: AgentLineage[];
  parentAgents: Agent[];
  ownerProfile: UserProfile;
  provenance?: OgProvenance;
  buttonClassName?: string;
};

export function DnaCapsuleViewer({
  agent,
  lineageRows,
  parentAgents,
  ownerProfile,
  provenance,
  buttonClassName,
}: DnaCapsuleViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<"human" | "raw">("human");
  const latestVersion = provenance?.versions?.at(-1);
  const previousRootHash = getPreviousRootHash(provenance);
  const rootHash = provenance?.rootHash;
  const txHash = provenance?.txHash;
  const memory = getAgentMemoryProfile(agent);
  const capsule = useMemo(
    () =>
      buildAgentDnaCapsule({
        agent,
        ownerProfile,
        lineageRows,
        parentAgents,
        versionNumber: latestVersion?.version ?? 1,
        previousRootHash,
        versionHistory: provenance?.versions ?? [],
        storageMode: provenance?.mode ?? "preview",
        publishedAt: provenance?.publishedAt,
      }),
    [agent, lineageRows, latestVersion?.version, ownerProfile, parentAgents, provenance, previousRootHash],
  );
  const rawJson = JSON.stringify(capsule, null, 2);

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        onClick={() => setIsOpen(true)}
        className={buttonClassName}
      >
        View DNA Capsule
      </Button>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <section className="max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-white/15 bg-zinc-950 shadow-2xl">
            <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="lyra-label text-sm">
                    Agent DNA Capsule
                  </p>
                  <span className="lyra-chip rounded-full px-2.5 py-1 text-xs">
                    {provenance ? "Agent DNA stored on 0G" : "Local Preview"}
                  </span>
                </div>
                <h2 className="mt-3 text-2xl font-semibold text-white">
                  {agent.name}
                </h2>
                {!provenance && (
                  <p className="mt-2 text-sm text-slate-400">
                    Publish to 0G to make this capsule persistent.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-[var(--lyra-button-border)] bg-white/[0.045] px-4 py-2 text-sm text-[var(--lyra-button-text)] transition hover:border-[var(--lyra-button-hover-border)] hover:bg-[var(--lyra-button-hover-bg)]"
              >
                Close
              </button>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-white/10 p-4">
              <TabButton active={tab === "human"} onClick={() => setTab("human")}>
                Human View
              </TabButton>
              <TabButton active={tab === "raw"} onClick={() => setTab("raw")}>
                Raw JSON
              </TabButton>
              <ActionButton onClick={() => void copyText(rawJson)}>Copy JSON</ActionButton>
              {rootHash && (
                <ActionButton onClick={() => void copyText(rootHash)}>
                  Copy Root Hash
                </ActionButton>
              )}
              {txHash && (
                <ActionButton onClick={() => void copyText(txHash)}>
                  Copy TX Hash
                </ActionButton>
              )}
              <ActionButton onClick={() => downloadJson(rawJson, agent.id)}>
                Download DNA JSON
              </ActionButton>
            </div>

            <div className="max-h-[62vh] overflow-y-auto p-5">
              {tab === "human" ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <CapsuleSection
                    title="Protocol"
                    rows={[
                      ["Network", "0G Galileo Testnet"],
                      ["Published At", provenance?.publishedAt ?? "Local preview"],
                    ]}
                  />
                  <CapsuleSection
                    title="0G Provenance"
                    rows={[
                      ["Mode", provenance?.mode ?? "preview"],
                      ["Root Hash", provenance?.rootHash ?? "not published"],
                      ["TX Hash", provenance?.txHash ?? "pending"],
                      [
                        "Capsule Size",
                        provenance?.sizeBytes ? `${provenance.sizeBytes} bytes` : "preview",
                      ],
                    ]}
                  />
                  <CapsuleSection
                    title="Agent Identity"
                    rows={[
                      ["ID", agent.id],
                      ["Name", agent.name],
                      ["Type", agent.type === "mixed" ? "hybrid" : agent.type],
                      ["Topic", agent.topic],
                      ["Summary", agent.summary],
                      ["Keywords", agent.keywords.join(", ") || "none"],
                      ["Traits", agent.personalityTraits.join(", ") || "none"],
                    ]}
                  />
                  <CapsuleSection
                    title="Memory Profile"
                    rows={[
                      ["Identity Summary", memory.identitySummary],
                      ["Worldview", memory.worldview],
                      ["Communication Style", memory.communicationStyle],
                      ["Learned Topics", memory.learnedTopics.join(", ") || "none"],
                      ["Recent Influences", memory.recentInfluences.join(", ") || "none"],
                      ["Evolution Log", memory.evolutionLog.join(" | ") || "none"],
                    ]}
                  />
                </div>
              ) : (
                <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-xs leading-6 text-slate-200">
                  {rawJson}
                </pre>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function CapsuleSection({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, string]>;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <div className="mt-3 space-y-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <p className="lyra-label text-xs">
              {label}
            </p>
            <p className="mt-1 break-words text-sm leading-6 text-slate-200">
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-sm transition",
        active
          ? "border-[var(--lyra-selected-border)] bg-[var(--lyra-selected-bg)] text-[var(--lyra-text-main)]"
          : "border-[var(--lyra-inner-border)] text-[var(--lyra-text-muted)] hover:border-[var(--lyra-button-hover-border)] hover:bg-[var(--lyra-button-hover-bg)] hover:text-[var(--lyra-button-text)]",
      )}
    >
      {children}
    </button>
  );
}

function ActionButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-[var(--lyra-button-border)] bg-white/[0.045] px-4 py-2 text-sm text-[var(--lyra-button-text)] transition hover:border-[var(--lyra-button-hover-border)] hover:bg-[var(--lyra-button-hover-bg)]"
    >
      {children}
    </button>
  );
}

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

function downloadJson(json: string, agentId: string) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `lyra-agent-${shortenHash(agentId)}-dna.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function getPreviousRootHash(provenance?: OgProvenance) {
  const versions = provenance?.versions ?? [];

  if (versions.length >= 2) {
    return versions[versions.length - 2]?.rootHash;
  }

  return undefined;
}
