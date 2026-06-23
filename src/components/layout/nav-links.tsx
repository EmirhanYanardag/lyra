"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const appNavItems = [
  { label: "My Agents", href: "/agents", match: ["/agents"] },
  { label: "Explore", href: "/explore", match: ["/explore"] },
  { label: "Mix", href: "/mix", match: ["/mix"] },
  { label: "Profile", href: "/profile", match: ["/profile"] },
];

export function NavLinks() {
  const pathname = usePathname();

  function isActive(match: string[]) {
    if (pathname?.startsWith("/agents")) {
      return match.includes("/agents");
    }

    return match.some((item) => pathname === item || pathname?.startsWith(`${item}/`));
  }

  return (
    <nav className="app-navbar-fixed">
      <div className="app-navbar-shell border border-white/10 bg-[rgba(18,20,28,0.35)] px-2.5 py-2 shadow-[0_8px_28px_rgba(0,0,0,0.12)]">
        <div className="flex h-10 items-center justify-between gap-4">
          <Link
            href="/"
            aria-label="Back to landing"
            className="shrink-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/favicon.png"
              alt=""
              className="block size-8 object-contain sm:size-[34px]"
            />
          </Link>

          <div className="flex min-w-0 flex-1 items-center justify-evenly gap-2 font-mono">
            {appNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                data-active={isActive(item.match)}
                className="app-nav-link whitespace-nowrap px-2 py-1.5 text-[11px] text-[var(--lyra-text-muted)] transition-colors duration-200 hover:text-[var(--lyra-text-main)] data-[active=true]:text-[var(--lyra-text-main)] sm:px-3 sm:text-xs"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .app-navbar-fixed {
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

        .app-navbar-shell {
          -webkit-backdrop-filter: blur(26px) saturate(150%);
          backdrop-filter: blur(26px) saturate(150%);
          border-radius: 999px;
          height: 56px;
          pointer-events: auto;
          width: min(720px, calc(100vw - 32px));
        }

        .app-nav-link {
          position: relative;
        }

        .app-nav-link::after {
          background: rgba(143, 134, 201, 0.85);
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

        .app-nav-link:hover::after {
          opacity: 0.45;
          transform: scaleX(0.52);
        }

        .app-nav-link[data-active="true"]::after {
          opacity: 1;
          transform: scaleX(1);
        }
      `}</style>
    </nav>
  );
}
