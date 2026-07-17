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
interface Section {
  question: string;
  answer: string;
}

const strip = (s: string) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();

/** Split on a given opening/closing heading tag (h2/h3/h4). */
function splitByHeading(html: string, tag: string): Section[] {
  const out: Section[] = [];
  const open = new RegExp(`<${tag}[^>]*>`, "i");
  const close = new RegExp(`</${tag}>`, "i");
  const parts = html.split(open);
  for (const part of parts.slice(1)) {
    const closeIndex = part.search(close);
    if (closeIndex === -1) continue;
    const question = strip(part.slice(0, closeIndex));
    const answer = part.slice(closeIndex + `</${tag}>`.length).trim();
    if (question) out.push({ question, answer });
  }
  return out;
}

/**
 * Boundary split: treat every "question-like" block as the start of a new
 * accordion item. A block counts as a question when it is a bold-led paragraph
 * or a paragraph whose text ends with "?". Handles the common cases where an
 * admin typed questions in bold (not as headings) or as plain "…?" lines,
 * including a question and its answer sharing one paragraph.
 */
function splitByQuestionBlocks(html: string): Section[] {
  // Each top-level <p>…</p> (fallback: split on <br>) is a block.
  const blocks = html.match(/<p\b[^>]*>[\s\S]*?<\/p>/gi);
  if (!blocks || blocks.length < 2) return [];

  const isQuestion = (block: string) => {
    const inner = block.replace(/^<p[^>]*>/i, "").replace(/<\/p>$/i, "");
    const leadingBold = /^\s*(?:<strong>|<b>)([\s\S]*?)(?:<\/strong>|<\/b>)/i.exec(inner);
    if (leadingBold) {
      // Bold-led paragraph. Question = the bold text; anything after it in the
      // same paragraph is the first part of the answer.
      const rest = inner.slice(leadingBold[0].length);
      return { question: strip(leadingBold[1]), inlineAnswer: rest.trim() };
    }
    const text = strip(inner);
    if (text.endsWith("?")) return { question: text, inlineAnswer: "" };
    return null;
  };

  const out: Section[] = [];
  let current: (Section & { _inline?: string }) | null = null;
  for (const block of blocks) {
    const q = isQuestion(block);
    if (q) {
      if (current) out.push(current);
      current = {
        question: q.question,
        answer: q.inlineAnswer ? `<p>${q.inlineAnswer}</p>` : "",
      };
    } else if (current) {
      current.answer += block;
    }
  }
  if (current) out.push(current);
  return out.length >= 2 ? out : [];
}

/**
 * Split admin-authored FAQ HTML into question/answer pairs. Supports headings
 * (h2/h3/h4), bold-led question paragraphs, and plain "…?" question lines — so
 * it works regardless of how the FAQ was authored in the editor.
 */
function parseFaq(html: string): Section[] {
  for (const tag of ["h2", "h3", "h4"]) {
    const sections = splitByHeading(html, tag);
    if (sections.length >= 2) return sections;
  }
  const byBlocks = splitByQuestionBlocks(html);
  if (byBlocks.length >= 2) return byBlocks;
  for (const tag of ["h2", "h3", "h4"]) {
    const sections = splitByHeading(html, tag);
    if (sections.length === 1) return sections;
  }
  return [];
}
