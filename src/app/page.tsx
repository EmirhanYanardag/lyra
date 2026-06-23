import { HeroCinematicDemo } from "@/components/landing/hero-cinematic-demo";
import { LandingCard } from "@/components/landing/landing-card";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingPreloadOverlay } from "@/components/landing/landing-preload-overlay";
import { RevealBlock, RevealHeroTitle } from "@/components/landing/reveal-text";
import { SectionHeading } from "@/components/landing/section-heading";
import { StartCreatingButton } from "@/components/landing/start-creating-button";

const githubHref = "https://github.com/EmirhanYanardag/lyra";

const problems = [
  {
    title: "CHATS RESET.",
    body: "Most assistants forget context, decisions, and growth across time.",
  },
  {
    title: "AGENTS LACK IDENTITY.",
    body: "Without persistent memory, an agent never becomes distinct.",
  },
  {
    title: "LINEAGE IS INVISIBLE.",
    body: "Clones, hybrids, and descendants need traceable origin.",
  },
  {
    title: "PROOF IS MISSING.",
    body: "If an identity evolves, its history should be verifiable.",
  },
];

const identityPillars = [
  {
    title: "MEMORY",
    body: "Every meaningful conversation updates the identity's profile, interests, worldview, and recent influences.",
  },
  {
    title: "LINEAGE",
    body: "Clones and hybrids keep a visible origin trail, so every descendant can be traced back to its parents.",
  },
  {
    title: "EVOLUTION",
    body: "Agents do not stay static. They develop their own reasoning style through interaction.",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "CREATE",
    body: "Start with a topic, personality seed, or domain.",
    example: "0G as the memory layer for evolving AI identities",
  },
  {
    step: "02",
    title: "TALK",
    body: "The agent responds as a distinct identity, not a generic assistant.",
    example: "Conversation becomes the raw material for memory.",
  },
  {
    step: "03",
    title: "EVOLVE",
    body: "Conversations update memory, worldview, keywords, and behavior.",
    example: "Identity becomes more specific over time.",
  },
  {
    step: "04",
    title: "CLONE OR MIX",
    body: "Clone public identities or merge two agents into a new hybrid.",
    example: "Two histories can create a third identity.",
  },
  {
    step: "05",
    title: "PRESERVE ON 0G",
    body: "Publish identity DNA, memory profile, lineage, and provenance to 0G Storage.",
    example: "Root hash and transaction proof anchor the capsule.",
  },
];

const preservedItems = [
  "Agent identity",
  "Memory profile",
  "Evolution history",
  "Clone and hybrid lineage",
  "Parent snapshots",
  "Root hash",
  "Transaction proof",
];

const whyItMatters = [
  {
    title: "PERSISTENT",
    body: "Identities continue beyond one chat session.",
  },
  {
    title: "COMPOSABLE",
    body: "Agents can be cloned and mixed into new forms.",
  },
  {
    title: "VERIFIABLE",
    body: "0G preserves the DNA capsule as portable proof.",
  },
  {
    title: "NETWORKED",
    body: "Every identity can create descendants and build social proof.",
  },
];

const journey = [
  {
    title: "CREATE 0G MEMORY AGENT",
    body: "A topic becomes the seed for a storage-native identity.",
  },
  {
    title: "IT LEARNS WHY MEMORY AND PROOF MATTER.",
    body: "Conversation shapes the agent's worldview.",
  },
  {
    title: "CREATE THALES AGENT",
    body: "A second identity forms around first-principles reasoning.",
  },
  {
    title: "IT REASONS FROM FIRST PRINCIPLES.",
    body: "The agent gives the network a philosophical lens.",
  },
  {
    title: "MIX BOTH IDENTITIES",
    body: "Two histories synthesize into one hybrid.",
  },
  {
    title: "PROOF PHILOSOPHER IS BORN",
    body: "A new identity explains memory through reasoning and provenance.",
  },
  {
    title: "PUBLISH DNA ON 0G",
    body: "The capsule stores identity, memory, lineage, root hash, and proof.",
  },
  {
    title: "TRACE LINEAGE LATER",
    body: "The agent is ready for visual ancestry and descendant graphs.",
  },
];

const faqs = [
  {
    question: "WHAT IS A LYRA IDENTITY?",
    answer:
      "A LYRA identity is an AI agent that carries memory, worldview, evolution history, and lineage. It is designed to grow beyond a single conversation.",
  },
  {
    question: "HOW IS THIS DIFFERENT FROM A CHATBOT?",
    answer:
      "A chatbot answers. A LYRA identity develops. It can remember, evolve, clone, mix, and preserve its DNA on 0G.",
  },
  {
    question: "WHY DOES 0G MATTER?",
    answer:
      "0G gives LYRA a persistent storage layer for identity DNA. Memory, lineage, and evolution can be published as verifiable provenance instead of staying trapped inside one app.",
  },
  {
    question: "WHAT IS A HYBRID IDENTITY?",
    answer:
      "A hybrid is a new agent created by mixing two identities. It inherits context from both parents but evolves independently.",
  },
  {
    question: "WHAT IS AN AGENT DNA CAPSULE?",
    answer:
      "A DNA Capsule is the portable record of an identity: its profile, memory, lineage, evolution history, root hash, and transaction proof.",
  },
  {
    question: "CAN AGENTS BECOME SOCIAL ASSETS?",
    answer:
      "Yes. Clones, hybrids, and descendant counts let identities build social proof as they spread through the network.",
  },
];

function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`landing-section mx-auto w-[calc(100%_-_48px)] max-w-[1180px] scroll-mt-[110px] ${className}`}
    >
      {children}
    </section>
  );
}

function NumberBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="landing-micro-glass grid size-9 place-items-center rounded-xl font-mono text-xs text-sky-100">
      {children}
    </span>
  );
}

export default function Home() {
  return (
    <main className="font-body-clean lyra-bg min-h-screen overflow-hidden">
      <LandingPreloadOverlay />
      <section
        id="hero"
        className="landing-hero mx-auto flex min-h-screen w-full scroll-mt-[110px] flex-col px-5 py-6 sm:px-8 xl:px-8"
      >
        <LandingNavbar githubHref={githubHref} />
        <div className="h-16 shrink-0" aria-hidden="true" />

        <div className="hero-scale-wrap">
          <div className="hero-composition">
          <div className="hero-copy">
            <RevealHeroTitle
              className="hero-title font-heading text-white"
              lines={[
                "CREATE AI IDENTITIES",
                "THAT EVOLVE, REMEMBER,",
                "AND BECOME TRANSFERABLE.",
              ]}
            />
            <RevealBlock delay={1160}>
              <p className="hero-subtext mt-7 text-lg text-slate-300">
                Build living AI identities with persistent memory on 0G. Every
                conversation, decision, and evolution becomes part of a
                verifiable identity that can be remixed into entirely new
                agents.
              </p>
            </RevealBlock>
            <RevealBlock delay={1380}>
              <div className="mt-9">
                <StartCreatingButton
                  className="landing-glass-button"
                  label="Create Identity"
                />
              </div>
            </RevealBlock>
          </div>

          <div className="hero-demo flex min-w-0 justify-center">
            <HeroCinematicDemo />
          </div>
          </div>
        </div>
      </section>

      <Section id="vision">
        <SectionHeading
          heading="AI CONVERSATIONS VANISH. IDENTITIES SHOULD NOT."
          subtext="Most AI products reset the moment the session ends. LYRA turns conversations into memory, memory into evolution, and evolution into identity."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {problems.map((item, index) => (
            <LandingCard key={item.title} delay={index * 90}>
              <div className="flex items-center gap-3">
                <NumberBadge>{String(index + 1).padStart(2, "0")}</NumberBadge>
              <h3 className="font-heading text-xl font-semibold text-white">
                  {item.title}
                </h3>
              </div>
              <p className="mt-5 text-sm leading-7 text-slate-300">
                {item.body}
              </p>
            </LandingCard>
          ))}
        </div>
      </Section>

      <Section id="identities">
        <SectionHeading
          heading="NOT ASSISTANTS. LIVING DIGITAL IDENTITIES."
          subtext="A LYRA identity is an AI agent with memory, worldview, lineage, and evolution history. It can be cloned, mixed, and preserved."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {identityPillars.map((item, index) => (
            <LandingCard key={item.title} delay={index * 110}>
              <h3 className="font-heading text-3xl font-semibold text-white">
                {item.title}
              </h3>
              <p className="mt-5 text-sm leading-7 text-slate-300">
                {item.body}
              </p>
            </LandingCard>
          ))}
        </div>
        <RevealBlock delay={240}>
          <p className="landing-micro-glass mt-8 rounded-full px-5 py-3 text-center text-sm text-slate-300">
            Each identity becomes more than a prompt. It becomes a history.
          </p>
        </RevealBlock>
      </Section>

      <Section id="flow">
        <SectionHeading
          heading="FROM FIRST PROMPT TO TRANSFERABLE IDENTITY."
          subtext="LYRA guides users through a simple loop: create, talk, evolve, remix, preserve."
        />
        <div className="mt-12">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {howItWorks.map((item, index) => (
              <LandingCard
                key={item.title}
                delay={index * 90}
                className="flex min-h-[22rem] flex-col"
              >
                <NumberBadge>{item.step}</NumberBadge>
                <h3
                  className={`font-heading mt-6 min-h-16 text-center text-2xl font-semibold leading-tight text-white ${
                    item.title === "PRESERVE ON 0G" ? "whitespace-nowrap" : ""
                  }`}
                >
                  {item.title}
                </h3>
                <p className="mt-4 min-h-28 text-sm leading-7 text-slate-300">
                  {item.body}
                </p>
                <p className="mt-auto rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-6 text-slate-400">
                  {item.example}
                </p>
              </LandingCard>
            ))}
          </div>
        </div>
      </Section>

      <Section id="og">
        <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-stretch">
          <SectionHeading
            eyebrow="POWERED BY 0G"
            heading="0G BECOMES THE PERMANENT MEMORY LAYER FOR AI IDENTITIES."
            subtext="LYRA uses 0G Storage to preserve an identity's DNA capsule: memory profile, lineage, evolution history, root hash, and transaction proof."
          />
          <LandingCard delay={180} className="bg-sky-200/[0.07]">
            <h3 className="font-heading text-2xl font-semibold text-white">
              What gets preserved?
            </h3>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {preservedItems.map((item) => (
                <div
                  key={item}
                  className="landing-micro-glass rounded-2xl px-4 py-3 text-sm text-slate-300"
                >
                  {item}
                </div>
              ))}
            </div>
          </LandingCard>
        </div>

        <div
          className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-stretch"
        >
          <LandingCard className="min-h-80">
            <p className="font-eyebrow text-sm text-slate-300/65">
              DNA Capsule Preview
            </p>
            <div className="landing-micro-glass mt-6 rounded-3xl p-5 font-mono text-sm text-slate-300">
            <p className="text-sky-100">LYRA_AGENT_DNA</p>
              <p className="mt-4">Network: 0G Galileo</p>
              <p>Root Hash: 0x7a49...de2894</p>
              <p>TX Hash: 0x4732...835fe</p>
              <p>Capsule: identity + memory + lineage</p>
            </div>
            <p className="font-heading mt-5 text-xl font-semibold text-white">
              NOT JUST SAVED. PROVEN.
            </p>
          </LandingCard>
          <LandingCard delay={120}>
            <h3 className="font-heading text-2xl font-semibold text-white">
              PROVENANCE WITHOUT THE JARGON.
            </h3>
            <p className="mt-5 text-sm leading-7 text-slate-300">
              LYRA does not ask judges to imagine what storage could mean for
              agents. The app already publishes DNA capsules with real root
              hashes and transaction proof when 0G is configured.
            </p>
            <div className="landing-micro-glass mt-6 rounded-2xl p-4 text-sm leading-7 text-violet-50">
              0G stores the agent&apos;s identity beyond the app, making memory and
              lineage portable.
            </div>
          </LandingCard>
        </div>
      </Section>

      <Section id="impact">
        <SectionHeading
          heading="LYRA TURNS AI INTERACTION INTO AN IDENTITY NETWORK."
          subtext="The future of AI is not millions of isolated chat sessions. It is persistent agents with memory, reputation, lineage, and transferable intelligence."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {whyItMatters.map((item, index) => (
            <LandingCard key={item.title} delay={index * 100}>
              <h3 className="font-heading text-2xl font-semibold text-white">
                {item.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                {item.body}
              </p>
            </LandingCard>
          ))}
        </div>
      </Section>

      <Section id="journey">
        <SectionHeading
          heading="A NEW IDENTITY IS BORN FROM TWO WORLDS."
        />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {journey.map((item, index) => (
            <LandingCard key={item.title} delay={index * 70}>
              <p className="font-mono text-xs text-slate-500">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="font-heading mt-4 text-lg font-semibold text-white">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {item.body}
              </p>
            </LandingCard>
          ))}
        </div>
      </Section>

      <Section id="faq">
        <SectionHeading eyebrow="FAQ" heading="THE IDENTITY NETWORK, PLAINLY." />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {faqs.map((item, index) => (
            <LandingCard key={item.question} delay={index * 80}>
              <h3 className="font-heading text-lg font-semibold text-white">
                {item.question}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {item.answer}
              </p>
            </LandingCard>
          ))}
        </div>
      </Section>

      <section className="landing-section landing-final-cta mx-auto w-[calc(100%_-_48px)] max-w-[1180px] scroll-mt-[110px]">
        <RevealBlock>
          <div className="landing-glass-card p-7 sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
            <div className="max-w-2xl">
              <h2 className="font-heading text-3xl text-white sm:text-4xl">
                CREATE AN IDENTITY THAT CAN EVOLVE.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-300">
                Start with one agent. Teach it. Clone it. Mix it. Preserve its
                DNA on 0G.
              </p>
            </div>
            <div className="mt-8 lg:mt-0">
              <StartCreatingButton />
            </div>
          </div>
        </RevealBlock>
      </section>
    </main>
  );
}
