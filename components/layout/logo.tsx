/* eslint-disable @next/next/no-img-element */

/**
 * romu.ee wordmark: orange lowercase text with a tire as the "o".
 * When the real logo file has been imported from romu.ee (settings key
 * `logo_url`), that image is shown instead of the recreated wordmark.
 */
export function Logo({
  className = "",
  imageUrl,
}: {
  className?: string;
  imageUrl?: string | null;
}) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt="romu.ee"
        className={`h-10 w-auto ${className}`}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-baseline font-heading text-3xl font-extrabold lowercase leading-none text-primary ${className}`}
    >
      r
      <Tire />
      mu<span>.ee</span>
    </span>
  );
}

/** Small tire graphic standing in for the "o" */
function Tire() {
  return (
    <svg
      viewBox="0 0 40 40"
      className="mx-[1px] h-[0.82em] w-[0.82em] self-center"
      aria-hidden
    >
      {/* tread */}
      <circle cx="20" cy="20" r="18" fill="none" stroke="#3f3f46" strokeWidth="7" />
      <circle
        cx="20"
        cy="20"
        r="18"
        fill="none"
        stroke="#18181b"
        strokeWidth="7"
        strokeDasharray="3.5 4"
      />
      {/* sidewall */}
      <circle cx="20" cy="20" r="11.5" fill="none" stroke="#52525b" strokeWidth="4" />
    </svg>
  );
}
