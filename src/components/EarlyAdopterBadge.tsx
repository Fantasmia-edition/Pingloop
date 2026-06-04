export default function EarlyAdopterBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200 dark:border-amber-700/50 ${className}`}
      title="Membre fondateur de PingLoop"
    >
      ⚡ Early adopter
    </span>
  );
}
