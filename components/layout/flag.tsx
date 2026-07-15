import type { Locale } from "@/i18n/routing";

/**
 * Inline SVG flags. Emoji flags (🇪🇪 …) don't render on most desktop browsers
 * (Windows/Chrome show the two letters instead), so we draw them ourselves for
 * consistent display everywhere. 4:3 aspect, rounded, with a hairline border.
 */
export function Flag({ locale, className = "" }: { locale: Locale; className?: string }) {
  return (
    <span
      className={`inline-block shrink-0 overflow-hidden rounded-[2px] ring-1 ring-black/10 ${className}`}
      style={{ width: 20, height: 15, lineHeight: 0 }}
      aria-hidden
    >
      <svg viewBox="0 0 20 15" width="20" height="15" xmlns="http://www.w3.org/2000/svg">
        {FLAGS[locale]}
      </svg>
    </span>
  );
}

const FLAGS: Record<Locale, React.ReactNode> = {
  // Estonia — blue / black / white horizontal
  et: (
    <>
      <rect width="20" height="5" y="0" fill="#0072CE" />
      <rect width="20" height="5" y="5" fill="#000000" />
      <rect width="20" height="5" y="10" fill="#FFFFFF" />
    </>
  ),
  // United Kingdom — Union Jack
  en: (
    <>
      <rect width="20" height="15" fill="#012169" />
      <path d="M0,0 L20,15 M20,0 L0,15" stroke="#FFFFFF" strokeWidth="3" />
      <path d="M0,0 L20,15 M20,0 L0,15" stroke="#C8102E" strokeWidth="1.5" />
      <path d="M10,0 V15 M0,7.5 H20" stroke="#FFFFFF" strokeWidth="5" />
      <path d="M10,0 V15 M0,7.5 H20" stroke="#C8102E" strokeWidth="3" />
    </>
  ),
  // Russia — white / blue / red horizontal
  ru: (
    <>
      <rect width="20" height="5" y="0" fill="#FFFFFF" />
      <rect width="20" height="5" y="5" fill="#0039A6" />
      <rect width="20" height="5" y="10" fill="#D52B1E" />
    </>
  ),
  // Latvia — carmine / white / carmine (2:1:2)
  lv: (
    <>
      <rect width="20" height="15" fill="#9E3039" />
      <rect width="20" height="3" y="6" fill="#FFFFFF" />
    </>
  ),
  // Lithuania — yellow / green / red horizontal
  lt: (
    <>
      <rect width="20" height="5" y="0" fill="#FDB913" />
      <rect width="20" height="5" y="5" fill="#006A44" />
      <rect width="20" height="5" y="10" fill="#C1272D" />
    </>
  ),
};
