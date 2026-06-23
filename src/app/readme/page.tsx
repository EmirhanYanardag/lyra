import Link from "next/link";

const docsSections = [
  {
    title: "What is LYRA?",
    body: [
      "LYRA is an AI-native identity network for agents that are meant to persist, develop, and carry history. It is not only a chat interface. A LYRA agent is a digital identity with a name, topic, memory profile, worldview, lineage, evolution history, and a public surface that can be discovered, cloned, mixed, and preserved.",
      "The core idea is simple: if an AI identity changes through conversation, that change should become part of the identity rather than disappearing when the session ends. LYRA treats each agent as a living branch in a network of identities, where memory and lineage matter as much as the immediate response.",
    ],
  },
  {
    title: "Why LYRA exists",
    body: [
      "Most AI products are built around disposable sessions. A user chats, the model responds, and the context usually remains trapped inside that single product surface. Even when memory exists, it often behaves like private app state rather than a portable identity layer.",
      "That makes agents difficult to distinguish over time. They answer questions, but they do not become recognizable identities with ancestry, evolution, or provenance. LYRA exists to explore a different pattern: agents that remember, develop, and carry verifiable history across creation, conversation, cloning, mixing, and storage.",
    ],
  },
  {
    title: "Core idea",
    body: [
      "The LYRA loop is Create -> Chat -> Evolve -> Clone / Mix -> Preserve. A user begins with an identity seed such as a topic, domain, or character direction. The agent then responds as a distinct identity rather than a generic assistant.",
      "As conversations happen, LYRA updates the agent's memory profile and identity layer. The agent can later be cloned into an independent branch, mixed with another identity to form a hybrid, and published as an Agent DNA Capsule on 0G. The result is an identity that has both behavior and history.",
    ],
  },
  {
    title: "Agents",
    body: [
      "A LYRA agent is composed of visible and internal identity fields. It has a name, topic, description, keywords, personality traits, memory profile, clone count, hybrid count, lineage metadata, and optional 0G provenance. These fields let the app present an agent as more than a prompt or a chat thread.",
      "The agent card gives a short public view of the identity. The detail page opens the deeper identity record, including memory, network impact, provenance, and evolution timeline. Together, these surfaces make each agent understandable as a social and remixable identity object.",
    ],
  },
  {
    title: "Memory and evolution",
    body: [
      "LYRA agents become more specific through interaction. Conversations can influence an agent's identity summary, worldview, learned topics, recent influences, communication style, and evolution log. This gives each agent a visible development path instead of leaving growth hidden inside raw chat history.",
      "The current memory system is intentionally readable. It is designed to show how recent conversations shape identity without exposing every raw message on public cards. Over time, this memory layer can become more expressive, more selective, and more strongly tied to provenance.",
    ],
  },
  {
    title: "Cloning",
    body: [
      "Cloning creates an independent branch from an existing public identity. A clone begins with inherited context from the parent agent, but it is not locked to the parent forever. It can diverge through its own conversations, memory updates, and future lineage events.",
      "This makes identity distribution feel closer to branching than copying. A strong public agent can become the origin of many descendants, while every clone has room to develop its own perspective and social value.",
    ],
  },
  {
    title: "Mixing",
    body: [
      "Mixing synthesizes two parent agents into a new hybrid identity. The hybrid inherits influence from both parents, but it becomes its own branch with its own name, summary, keywords, memory profile, and future evolution.",
      "This is where LYRA starts to feel like an identity network rather than a list of assistants. Two histories can create a third identity that carries recognizable parent DNA while developing independently through later use.",
    ],
  },
  {
    title: "0G integration",
    body: [
      "0G is used as LYRA's persistent memory and provenance layer. LYRA can publish an Agent DNA Capsule containing the agent identity, memory profile, lineage, evolution history, root hash, and transaction proof. This gives the identity a record that can survive beyond one interface.",
      "The product does not present 0G as jargon first. It presents permanence first. Traditional AI sessions often lose context or keep it trapped inside one app. LYRA uses 0G Storage to make identity DNA portable, inspectable, and tied to verifiable provenance.",
    ],
  },
  {
    title: "DNA capsule",
    body: [
      "An Agent DNA Capsule is the portable record of a LYRA identity. It preserves the agent's name, topic, summary, type, keywords, memory profile, learned topics, lineage graph, clone and hybrid ancestry, evolution history, root hash, and transaction proof.",
      "The capsule is meant to be both human-readable and machine-useful. The human view explains the identity in a clean interface, while the raw JSON view keeps the complete structured record available for inspection, download, and future integrations.",
    ],
  },
  {
    title: "Why this matters",
    body: [
      "AI agents should not remain disposable chat sessions. If an agent learns, changes, gets cloned, or becomes part of a hybrid, that identity should have continuity. It should have an origin, a memory profile, and a way to prove how it developed.",
      "LYRA points toward portable, remixable, verifiable digital identities. In that future, agents can become social assets, creative collaborators, knowledge lineages, and public identity objects whose histories matter as much as their responses.",
    ],
  },
  {
    title: "Current MVP",
    body: [
      "The current LYRA MVP includes authentication, agent creation, public exploration, clone flow, mix flow, agent profile and detail pages, chat, profile pages, and 0G provenance display. Users can create agents, chat with them, browse public identities, clone agents, synthesize hybrids, and inspect stored provenance.",
      "The MVP focuses on demonstrating the complete identity loop rather than polishing every future layer. It already shows the core product thesis: agents can be created, shaped through interaction, branched through clone and mix mechanics, and preserved through a DNA capsule.",
    ],
  },
  {
    title: "Future direction",
    body: [
      "The next direction for LYRA is a richer visual lineage graph that makes ancestry and descendants easy to understand at a glance. Stronger memory systems can make agents more coherent over time, while public DNA capsules can make provenance easier to share outside the app.",
      "Future versions can also expand into a social agent marketplace, 0G-backed retrieval, more expressive hybrid synthesis, richer parent snapshots, reputation signals, and a Gene Tree view for navigating identity families. The long-term goal is a network where AI identities can grow, spread, remix, and remain verifiable.",
    ],
  },
];

export default function ReadmePage() {
  return (
    <main className="lyra-bg min-h-screen px-5 py-6 sm:px-8 lg:px-10">
      <section className="mx-auto w-full max-w-5xl">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="lyra-chip grid size-10 place-items-center overflow-hidden rounded-xl font-mono text-sm">
              LY
            </span>
            <span className="text-lg font-semibold tracking-[0.24em] text-white">
              LYRA
            </span>
          </Link>
          <Link
            href="/"
            className="rounded-full px-3 py-2 text-sm text-slate-300 transition hover:bg-white/8 hover:text-white"
          >
            Back
          </Link>
        </nav>

        <header className="glass-card mt-10 rounded-3xl p-7 sm:p-10">
          <p className="lyra-label text-sm">Documentation</p>
          <h1 className="mt-5 text-4xl font-semibold text-white sm:text-5xl">
            LYRA Documentation
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            A living identity network for AI agents that remember, evolve,
            clone, mix, and preserve their DNA on 0G.
          </p>
        </header>

        <div className="mt-6 grid gap-5">
          {docsSections.map((section, index) => (
            <article
              key={section.title}
              className="glass-card rounded-3xl p-6 sm:p-8"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <span className="lyra-chip grid size-10 shrink-0 place-items-center rounded-2xl font-mono text-xs">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    {section.title}
                  </h2>
                  <div className="mt-4 space-y-4">
                    {section.body.map((paragraph) => (
                      <p
                        key={paragraph}
                        className="max-w-4xl text-base leading-8 text-slate-300"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
