"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { getClientProfile } from "@/lib/lyra/client-agents";

const navItems = [
  { label: "Intro", href: "#hero", sectionId: "hero" },
  { label: "Vision", href: "#vision", sectionId: "vision" },
  { label: "Identities", href: "#identities", sectionId: "identities" },
  { label: "Flow", href: "#flow", sectionId: "flow" },
  { label: "0G", href: "#og", sectionId: "og" },
  { label: "Impact", href: "#impact", sectionId: "impact" },
  { label: "Journey", href: "#journey", sectionId: "journey" },
  { label: "FAQ", href: "#faq", sectionId: "faq" },
];

type LandingNavbarProps = {
  githubHref: string;
};

export function LandingNavbar({ githubHref }: LandingNavbarProps) {
  const { user, supabase } = useSupabaseUser();
  const [activeSection, setActiveSection] = useState("hero");
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);

  function handleSectionClick(
    event: MouseEvent<HTMLAnchorElement>,
    sectionId: string,
  ) {
    const section = document.getElementById(sectionId);

    if (!section) {
      return;
    }

    event.preventDefault();
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.pushState(null, "", `#${sectionId}`);
    setActiveSection(sectionId);
  }

  function handleMobileSectionClick(
    event: MouseEvent<HTMLAnchorElement>,
    sectionId: string,
  ) {
    handleSectionClick(event, sectionId);
    setIsMobileMenuOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadDisplayName() {
      if (!user) {
        setDisplayName(null);
        return;
      }

      const fallbackName =
        getMetadataUsername(user.user_metadata) ??
        user.email?.split("@")[0] ??
        "profile";

      try {
        const profile = await getClientProfile(supabase, user.id);

        if (isMounted) {
          setDisplayName(profile?.username ?? fallbackName);
        }
      } catch {
        if (isMounted) {
          setDisplayName(fallbackName);
        }
      }
    }

    void loadDisplayName();

    return () => {
      isMounted = false;
    };
  }, [supabase, user]);

  useEffect(() => {
    let raf = 0;

    const updateActiveSection = () => {
      const sections = navItems
        .map((item) => document.getElementById(item.sectionId))
        .filter((section): section is HTMLElement => Boolean(section));

      const activationY = window.innerHeight * 0.35;
      let nextActive = "hero";

      for (const section of sections) {
        const rect = section.getBoundingClientRect();

        if (rect.top <= activationY) {
          nextActive = section.id;
        }

        if (rect.top <= activationY && rect.bottom > activationY) {
          nextActive = section.id;
        }
      }

      setActiveSection(nextActive);
    };

    const onScroll = () => {
      if (raf !== 0) {
        return;
      }

      raf = window.requestAnimationFrame(() => {
        updateActiveSection();
        raf = 0;
      });
    };

    updateActiveSection();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (raf !== 0) {
        window.cancelAnimationFrame(raf);
      }

      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (
        navRef.current &&
        event.target instanceof Node &&
        !navRef.current.contains(event.target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMobileMenuOpen]);

  return (
    <nav ref={navRef} className="landing-navbar-fixed">
      <div
        className={`landing-navbar-shell animate-[landingNavIn_700ms_150ms_cubic-bezier(0.16,1,0.3,1)_both] border px-2.5 py-2 shadow-[0_8px_28px_rgba(0,0,0,0.12)] transition-all duration-300 ${
          isScrolled
            ? "border-white/10 bg-[rgba(18,20,28,0.42)]"
            : "border-white/8 bg-[rgba(18,20,28,0.35)]"
        }`}
      >
      <div className="flex h-10 items-center justify-between gap-3">
        <Link href="/" className="flex shrink-0 items-center gap-3 pl-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/favicon.png"
            alt=""
            className="block size-8 object-contain sm:size-[34px]"
          />
          <span className="hidden font-mono text-sm font-bold tracking-[0.2em] text-white sm:inline">
            LYRA
          </span>
        </Link>

        <div className="hidden items-center gap-1 font-mono min-[900px]:flex">
          {navItems.map((item) => {
            const isActive = activeSection === item.sectionId;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(event) => handleSectionClick(event, item.sectionId)}
                data-active={isActive}
                className="landing-nav-link px-2.5 py-1.5 text-xs text-slate-300/78 transition-colors duration-200 hover:text-white data-[active=true]:text-white"
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/readme"
            className="landing-nav-link px-2.5 py-1.5 text-xs text-slate-300/78 transition-colors duration-200 hover:text-white"
          >
            Docs
          </Link>
          <a
            href="https://x.com/lyra_0g"
            target="_blank"
            rel="noopener noreferrer"
            className="landing-nav-link px-2.5 py-1.5 text-xs text-slate-300/78 transition-colors duration-200 hover:text-white"
          >
            X
          </a>
          <a
            href={githubHref}
            target="_blank"
            rel="noopener noreferrer"
            className="landing-nav-link px-2.5 py-1.5 text-xs text-slate-300/78 transition-colors duration-200 hover:text-white"
          >
            GitHub
          </a>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {user ? (
            <Link
              href="/profile"
              className="landing-nav-auth-link inline-flex px-2.5 py-1.5 text-xs font-medium text-white transition-colors duration-200 hover:text-white"
            >
              @{displayName ?? user.email?.split("@")[0] ?? "profile"}
            </Link>
          ) : (
            <>
              <div className="hidden sm:block">
                <Link
                  href="/auth?mode=signin"
                  className="landing-nav-auth-link inline-flex px-2.5 py-1.5 text-xs font-medium text-slate-300/78 transition-colors duration-200 hover:text-white"
                >
                  Sign In
                </Link>
              </div>
              <Link
                href="/auth?mode=signup"
                className="landing-nav-auth-link inline-flex px-2.5 py-1.5 text-xs font-medium text-white transition-colors duration-200 hover:text-white"
              >
                Sign Up
              </Link>
            </>
          )}
          <button
            type="button"
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle landing navigation"
            onClick={() => setIsMobileMenuOpen((value) => !value)}
            className="landing-nav-auth-link inline-flex px-2.5 py-1.5 font-mono text-xs font-medium text-slate-300/78 transition-colors duration-200 hover:text-white min-[900px]:hidden"
          >
            Menu
          </button>
        </div>
      </div>
      </div>

      {isMobileMenuOpen && (
        <div className="landing-mobile-menu-panel">
          <div className="grid gap-1">
            {navItems.map((item) => {
              const isActive = activeSection === item.sectionId;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(event) =>
                    handleMobileSectionClick(event, item.sectionId)
                  }
                  data-active={isActive}
                  className="landing-nav-link px-3 py-2 text-sm text-slate-300/78 transition-colors duration-200 hover:text-white data-[active=true]:text-white"
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/readme"
              onClick={() => setIsMobileMenuOpen(false)}
              className="landing-nav-link px-3 py-2 text-sm text-slate-300/78 transition-colors duration-200 hover:text-white"
            >
              Docs
            </Link>
            <a
              href="https://x.com/lyra_0g"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMobileMenuOpen(false)}
              className="landing-nav-link px-3 py-2 text-sm text-slate-300/78 transition-colors duration-200 hover:text-white"
            >
              X
            </a>
            <a
              href={githubHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMobileMenuOpen(false)}
              className="landing-nav-link px-3 py-2 text-sm text-slate-300/78 transition-colors duration-200 hover:text-white"
            >
              GitHub
            </a>
          </div>
        </div>
      )}

      <style jsx global>{`
        .landing-navbar-fixed {
          display: flex;
          justify-content: center;
          left: 0;
          pointer-events: none;
          position: fixed;
          right: 0;
          top: 18px;
          width: 100vw;
          z-index: 1000;
        }

        .landing-navbar-shell {
          -webkit-backdrop-filter: blur(26px) saturate(150%);
          backdrop-filter: blur(26px) saturate(150%);
          border-radius: 999px;
          height: 56px;
          pointer-events: auto;
          width: min(1180px, calc(100vw - 32px));
        }

        .landing-mobile-menu-panel {
          -webkit-backdrop-filter: blur(26px) saturate(150%);
          backdrop-filter: blur(26px) saturate(150%);
          background: rgba(18, 20, 28, 0.46);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.22);
          left: 50%;
          max-height: calc(100vh - 96px);
          overflow-y: auto;
          padding: 0.75rem;
          pointer-events: auto;
          position: fixed;
          top: 84px;
          transform: translateX(-50%);
          width: min(420px, calc(100vw - 32px));
        }

        @media (min-width: 900px) {
          .landing-mobile-menu-panel {
            display: none;
          }
        }

        @keyframes landingNavIn {
          from {
            opacity: 0;
            filter: blur(12px);
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            filter: blur(0);
            transform: translateY(0);
          }
        }

        .landing-nav-link {
          position: relative;
        }

        .landing-nav-link::after {
          background: rgba(255, 255, 255, 0.85);
          bottom: -8px;
          content: "";
          height: 1px;
          left: 0;
          opacity: 0;
          position: absolute;
          right: 0;
          transform: scaleX(0);
          transform-origin: center;
          transition:
            transform 220ms ease,
            opacity 220ms ease;
        }

        .landing-nav-link:hover::after {
          opacity: 0.45;
          transform: scaleX(0.52);
        }

        .landing-nav-link[data-active="true"]::after {
          opacity: 1;
          transform: scaleX(1);
        }
      `}</style>
    </nav>
  );
}

function getMetadataUsername(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || !("username" in metadata)) {
    return null;
  }

  const username = metadata.username;
  return typeof username === "string" && username.trim() ? username : null;
}
