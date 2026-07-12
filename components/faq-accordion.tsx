"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Renders admin-authored FAQ HTML as an accordion. The content uses
 * <h3>Question</h3> followed by answer markup.
 */
export function FaqAccordion({ html }: { html: string }) {
  const [open, setOpen] = useState<number | null>(0);

  const sections: { question: string; answer: string }[] = [];
  const parts = html.split(/<h3[^>]*>/i);
  for (const part of parts.slice(1)) {
    const closeIndex = part.search(/<\/h3>/i);
    if (closeIndex === -1) continue;
    sections.push({
      question: part.slice(0, closeIndex).replace(/<[^>]+>/g, ""),
      answer: part.slice(closeIndex + 5),
    });
  }

  if (sections.length === 0) {
    return <div className="rich-text" dangerouslySetInnerHTML={{ __html: html }} />;
  }

  return (
    <div className="space-y-3">
      {sections.map((section, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-lg border border-border bg-surface"
        >
          <button
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium cursor-pointer hover:bg-surface-hover"
            onClick={() => setOpen(open === index ? null : index)}
            aria-expanded={open === index}
          >
            {section.question}
            <ChevronDown
              className={cn(
                "h-5 w-5 shrink-0 text-muted transition-transform",
                open === index && "rotate-180"
              )}
            />
          </button>
          {open === index && (
            <div
              className="rich-text border-t border-border px-5 py-4"
              dangerouslySetInnerHTML={{ __html: section.answer }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
