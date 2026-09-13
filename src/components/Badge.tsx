import { ReactNode } from "react";

type BadgeVariant = "tag" | "pill" | "solid" | "outline";

interface BadgeProps {
  children: ReactNode;
  icon?: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  tag: "rounded-md bg-navy/80 backdrop-blur-sm text-white border border-white/10",
  pill: "rounded-full bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-navy-100",
  solid: "rounded-md bg-lime text-navy",
  outline: "rounded-md border border-gray-200 dark:border-navy-600 text-gray-600 dark:text-navy-100/80 bg-white/70 dark:bg-navy-800",
};

export default function Badge({ children, icon, variant = "pill", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 leading-normal ${VARIANT_STYLES[variant]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}
