import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";

const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    "border border-[var(--lyra-button-border)] bg-[rgba(255,255,255,0.075)] text-[var(--lyra-button-text)] shadow-[0_8px_26px_rgba(0,0,0,0.16)] hover:border-[var(--lyra-button-hover-border)] hover:bg-[var(--lyra-button-hover-bg)]",
  secondary:
    "border border-[var(--lyra-button-border)] bg-white/[0.045] text-[var(--lyra-button-text)] hover:border-[var(--lyra-button-hover-border)] hover:bg-[var(--lyra-button-hover-bg)]",
  ghost:
    "border border-transparent text-[var(--lyra-text-muted)] hover:bg-[var(--lyra-button-bg)] hover:text-[var(--lyra-text-main)]",
};

type BaseProps = {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
};

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement>;

type LinkButtonProps = BaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium transition",
        buttonStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  children,
  className,
  variant = "primary",
  href,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium transition",
        buttonStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
