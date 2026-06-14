/**
 * Watermark footer — shared across Chat and Auth screens.
 * Adapts to light / dark mode automatically.
 */
export default function Watermark({ className = "" }) {
  return (
    <div
      className={`flex items-center justify-center gap-1.5 py-1 px-4
        bg-white dark:bg-zinc-950
        border-t border-border
        select-none pointer-events-none
        ${className}`}
    >
      <span className="text-[10px] text-foreground/40 dark:text-zinc-500">
        © {new Date().getFullYear()}
      </span>
      <span className="text-[10px] font-bold tracking-wide text-yellow-500 dark:text-yellow-400">
        ADHEESH NEGI
      </span>
      <span className="text-[10px] text-foreground/30 dark:text-zinc-600">·</span>
      <span className="text-[10px] text-foreground/40 dark:text-zinc-500">
        All Rights Reserved
      </span>
    </div>
  );
}
