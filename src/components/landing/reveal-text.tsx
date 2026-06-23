"use client";

import { useEffect, useRef, useState } from "react";

type RevealBlockProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

export function RevealBlock({
  children,
  className = "",
  delay = 0,
}: RevealBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;

    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.14 },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`lyra-reveal-block ${isVisible ? "is-visible" : ""} ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
      <style jsx>{`
        .lyra-reveal-block {
          opacity: 0;
          filter: blur(12px);
          transform: translateY(18px) scale(0.985);
          transition:
            opacity 780ms cubic-bezier(0.16, 1, 0.3, 1),
            filter 780ms cubic-bezier(0.16, 1, 0.3, 1),
            transform 780ms cubic-bezier(0.16, 1, 0.3, 1);
          transition-delay: var(--reveal-delay);
        }

        .lyra-reveal-block.is-visible {
          opacity: 1;
          filter: blur(0);
          transform: translateY(0) scale(1);
        }

        @media (prefers-reduced-motion: reduce) {
          .lyra-reveal-block {
            opacity: 1;
            filter: none;
            transform: none;
            transition: opacity 200ms ease;
          }
        }
      `}</style>
    </div>
  );
}

type RevealTextProps = {
  text: string;
  as?: "h1" | "h2" | "p";
  className?: string;
  wordDelay?: number;
  delay?: number;
};

export function RevealText({
  text,
  as: Tag = "h2",
  className = "",
  wordDelay = 46,
  delay = 0,
}: RevealTextProps) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const words = text.split(" ");
  const setRevealNode = (node: HTMLElement | null) => {
    ref.current = node;
  };

  useEffect(() => {
    const node = ref.current;

    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -14% 0px", threshold: 0.18 },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={setRevealNode} className={className} aria-label={text}>
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className={`lyra-reveal-word ${isVisible ? "is-visible" : ""}`}
          style={
            {
              "--word-delay": `${delay + index * wordDelay}ms`,
            } as React.CSSProperties
          }
          aria-hidden="true"
        >
          {word}
          {index < words.length - 1 ? "\u00a0" : ""}
        </span>
      ))}
      <style jsx>{`
        .lyra-reveal-word {
          display: inline-block;
          opacity: 0;
          filter: blur(10px);
          transform: translateY(14px);
          transition:
            opacity 720ms cubic-bezier(0.16, 1, 0.3, 1),
            filter 720ms cubic-bezier(0.16, 1, 0.3, 1),
            transform 720ms cubic-bezier(0.16, 1, 0.3, 1);
          transition-delay: var(--word-delay);
        }

        .lyra-reveal-word.is-visible {
          opacity: 1;
          filter: blur(0);
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          .lyra-reveal-word {
            opacity: 1;
            filter: none;
            transform: none;
            animation: none;
          }
        }
      `}</style>
    </Tag>
  );
}

type RevealHeroTitleProps = {
  lines: string[];
  className?: string;
};

export function RevealHeroTitle({
  lines,
  className = "",
}: RevealHeroTitleProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const lineWordOffsets = lines.reduce<number[]>((offsets, line, index) => {
    const previousOffset = offsets[index - 1] ?? 0;
    const previousLineWordCount =
      index === 0 ? 0 : lines[index - 1].split(" ").length;

    return [...offsets, previousOffset + previousLineWordCount];
  }, []);

  useEffect(() => {
    const node = ref.current;

    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <h1 ref={ref} className={className}>
      {lines.map((line, lineIndex) => (
        <span key={line} className="hero-title-line">
          {line.split(" ").map((word, index, words) => {
            const delay = (lineWordOffsets[lineIndex] + index) * 55;

            return (
              <span
                key={`${line}-${word}-${index}`}
                className={`lyra-hero-word ${isVisible ? "is-visible" : ""}`}
                style={{ "--hero-word-delay": `${delay}ms` } as React.CSSProperties}
              >
                {word}
                {index < words.length - 1 ? "\u00a0" : ""}
              </span>
            );
          })}
        </span>
      ))}
      <style jsx>{`
        .lyra-hero-word {
          display: inline-block;
          opacity: 0;
          filter: blur(12px);
          transform: translateY(14px);
          transition:
            opacity 650ms cubic-bezier(0.16, 1, 0.3, 1),
            filter 650ms cubic-bezier(0.16, 1, 0.3, 1),
            transform 650ms cubic-bezier(0.16, 1, 0.3, 1);
          transition-delay: var(--hero-word-delay);
        }

        .lyra-hero-word.is-visible {
          opacity: 1;
          filter: blur(0);
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          .lyra-hero-word {
            opacity: 1;
            filter: none;
            transform: none;
            transition: none;
          }
        }
      `}</style>
    </h1>
  );
}
