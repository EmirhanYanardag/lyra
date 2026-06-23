import { RevealBlock, RevealText } from "@/components/landing/reveal-text";

type SectionHeadingProps = {
  eyebrow?: string;
  heading: string;
  subtext?: string;
  className?: string;
};

export function SectionHeading({
  eyebrow,
  heading,
  subtext,
  className = "",
}: SectionHeadingProps) {
  return (
    <div className={`max-w-3xl ${className}`}>
      {eyebrow ? (
        <RevealBlock>
          <p className="font-eyebrow text-sm text-slate-300/65">{eyebrow}</p>
        </RevealBlock>
      ) : null}
      <RevealText
        text={heading}
        className={`${eyebrow ? "mt-4" : ""} font-heading text-3xl text-white sm:text-4xl lg:text-5xl`}
      />
      {subtext ? (
        <RevealBlock delay={160}>
          <p className="font-body-clean mt-5 text-base leading-8 text-slate-300 sm:text-lg">
            {subtext}
          </p>
        </RevealBlock>
      ) : null}
    </div>
  );
}
