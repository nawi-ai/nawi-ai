import Link from "next/link";

import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "sun";

const variants: Record<Variant, string> = {
  primary: "bg-leaf text-white hover:bg-[#2c684a]",
  secondary: "border border-line bg-surface text-ink hover:bg-leaf-soft",
  ghost: "text-leaf hover:bg-leaf-soft",
  sun: "bg-sun text-ink hover:bg-[#f3c85a]",
};

const base =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-base font-extrabold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

export function Button({
  href,
  variant = "primary",
  className,
  children,
  ...props
}: {
  href?: string;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const classes = cn(base, variants[variant], className);
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
