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

  const sections = parseFaq(html);

  if (sections.length === 0) {
    return (
      <div
        className="rich-text rounded-lg border border-border bg-surface p-6 shadow-sm md:p-8"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {sections.map((section, index) => (
        <div
          key={index}
          className={cn(
            "overflow-hidden rounded-lg border bg-surface shadow-sm transition-colors",
            open === index ? "border-primary/50" : "border-border",
          )}
        >
          <button
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium cursor-pointer hover:bg-surface-hover"
            onClick={() => setOpen(open === index ? null : index)}
            aria-expanded={open === index}
          >
            <span className={cn(open === index && "text-primary")}>
              {section.question}
            </span>
            <ChevronDown
              className={cn(
                "h-5 w-5 shrink-0 text-muted transition-transform duration-300",
                open === index && "rotate-180 text-primary",
              )}
            />
          </button>
          {open === index && (
            <div
              className="rich-text border-t border-border px-5 py-4 animate-[fade-in_0.25s_ease]"
              dangerouslySetInnerHTML={{ __html: section.answer }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Split admin-authored FAQ HTML into question/answer pairs. Supports the
 * seeded format (<h3>Question</h3> + answer) but also content imported from
 * elsewhere that may use <h2>/<h4> headings or bold-paragraph questions.
 */
function parseFaq(html: string): { question: string; answer: string }[] {
  const byHeading = (tag: string) => {
    const out: { question: string; answer: string }[] = [];
    const open = new RegExp(`<${tag}[^>]*>`, "i");
    const close = new RegExp(`</${tag}>`, "i");
    const parts = html.split(open);
    for (const part of parts.slice(1)) {
      const closeIndex = part.search(close);
      if (closeIndex === -1) continue;
      const question = part.slice(0, closeIndex).replace(/<[^>]+>/g, "").trim();
      const answer = part.slice(closeIndex + `</${tag}>`.length).trim();
      if (question) out.push({ question, answer });
    }
    return out;
  };

  // Prefer whichever heading level actually structures the document.
  for (const tag of ["h2", "h3", "h4"]) {
    const sections = byHeading(tag);
    if (sections.length >= 2) return sections;
  }

  // Fallback: paragraphs that begin with a bold question.
  const boldQ =
    /<p[^>]*>\s*(?:<strong>|<b>)(.*?)(?:<\/strong>|<\/b>)\s*<\/p>/gi;
  const matches = [...html.matchAll(boldQ)];
  if (matches.length >= 2) {
    const out: { question: string; answer: string }[] = [];
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index! + matches[i][0].length;
      const end = i + 1 < matches.length ? matches[i + 1].index! : html.length;
      out.push({
        question: matches[i][1].replace(/<[^>]+>/g, "").trim(),
        answer: html.slice(start, end).trim(),
      });
    }
    return out;
  }

  // Single heading still deserves an accordion.
  for (const tag of ["h2", "h3", "h4"]) {
    const sections = byHeading(tag);
    if (sections.length === 1) return sections;
  }
  return [];
}
