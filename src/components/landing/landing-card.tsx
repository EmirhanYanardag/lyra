import { RevealBlock } from "@/components/landing/reveal-text";

type LandingCardProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

export function LandingCard({
  children,
  className = "",
  delay = 0,
}: LandingCardProps) {
  return (
    <RevealBlock delay={delay} className="h-full">
      <div
        className={`landing-glass-card group h-full p-6 ${className}`}
      >
        <div className="landing-glass-content h-full">{children}</div>
      </div>
    </RevealBlock>
  );
}
