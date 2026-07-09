import { Navigation } from "lucide-react";

/**
 * PatchPilot mark: an iris-gradient tile with an abstract navigation glyph
 * (piloting / direction). Deliberately geometric rather than literal.
 */
export default function Logo({
  size = 36,
  className = ""
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-gradient-to-br from-iris-400 via-iris-500 to-iris-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(12,14,22,0.25)] ${className}`}
      style={{ width: size, height: size }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_20%_0%,rgba(255,255,255,0.45),transparent_55%)]"
      />
      <Navigation
        size={size * 0.48}
        strokeWidth={2}
        className="relative -rotate-[8deg] fill-white text-white drop-shadow-[0_1px_1px_rgba(12,14,22,0.25)]"
      />
    </span>
  );
}
