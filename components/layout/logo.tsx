/** Text-based wordmark in the style of the romu.ee logo */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-heading text-2xl font-bold tracking-wide text-foreground ${className}`}
    >
      auto<span className="text-primary">oksjonid</span>
      <span className="text-muted">.ee</span>
    </span>
  );
}
