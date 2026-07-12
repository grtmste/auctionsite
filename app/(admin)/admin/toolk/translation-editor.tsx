"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { saveTranslation, savePageContent } from "../actions";

const LANGS = ["et", "en", "ru", "lv", "lt"] as const;
const PAGE_LABELS: Record<string, string> = {
  reeglid: "Reeglid",
  kkk: "KKK",
  privaatsuspoliitika: "Privaatsuspoliitika",
  teenused: "Teenused",
};

interface TranslationEditorProps {
  defaults: Record<string, string>; // key -> Estonian file default
  overrides: Record<string, Record<string, string>>; // key -> lang -> value
  pageContents: Record<string, Record<string, string>>; // slug -> lang -> html
}

export function TranslationEditor({
  defaults,
  overrides: initialOverrides,
  pageContents: initialPages,
}: TranslationEditorProps) {
  const [language, setLanguage] = useState<string>("et");
  const [filter, setFilter] = useState("");
  const [overrides, setOverrides] = useState(initialOverrides);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const [pages, setPages] = useState(initialPages);
  const [activeSlug, setActiveSlug] = useState("reeglid");
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const keys = useMemo(() => {
    const all = Object.keys(defaults).sort();
    if (!filter.trim()) return all;
    const q = filter.toLowerCase();
    return all.filter(
      (key) =>
        key.toLowerCase().includes(q) ||
        (defaults[key] ?? "").toLowerCase().includes(q)
    );
  }, [defaults, filter]);

  function currentValue(key: string): string {
    if (drafts[key] !== undefined) return drafts[key];
    return overrides[key]?.[language] ?? "";
  }

  function save(key: string) {
    const value = drafts[key];
    if (value === undefined) return;
    startTransition(async () => {
      await saveTranslation(key, language, value);
      setOverrides((prev) => ({
        ...prev,
        [key]: { ...(prev[key] ?? {}), [language]: value },
      }));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 2000);
    });
  }

  function savePage() {
    setPageMessage(null);
    startTransition(async () => {
      await savePageContent(activeSlug, pages[activeSlug]);
      setPageMessage("Salvestatud!");
    });
  }

  return (
    <Tabs defaultValue="strings">
      <TabsList>
        <TabsTrigger value="strings">UI tõlked</TabsTrigger>
        <TabsTrigger value="pages">Sisulehed</TabsTrigger>
      </TabsList>

      {/* --- UI string translations --- */}
      <TabsContent value="strings">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              placeholder="Otsi võtit või teksti…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full sm:w-40"
          >
            {LANGS.map((lang) => (
              <option key={lang} value={lang}>
                {lang.toUpperCase()}
              </option>
            ))}
          </Select>
        </div>

        <p className="mb-3 text-xs text-muted">
          Tühjaks jäetud väli kasutab vaikimisi tõlkefaili väärtust. Salvestatud
          väärtus kirjutab tõlkefaili üle.
        </p>

        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-header">
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="w-1/4 px-4 py-3 font-medium">Võti</th>
                  <th className="w-1/3 px-4 py-3 font-medium">Vaikimisi (ET)</th>
                  <th className="px-4 py-3 font-medium">
                    Tõlge ({language.toUpperCase()})
                  </th>
                </tr>
              </thead>
              <tbody>
                {keys.map((key) => (
                  <tr key={key} className="border-t border-border">
                    <td className="px-4 py-2 font-mono text-xs text-muted">{key}</td>
                    <td className="px-4 py-2 text-muted">{defaults[key]}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={currentValue(key)}
                          placeholder={language === "et" ? defaults[key] : ""}
                          onChange={(e) =>
                            setDrafts((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          className="h-8 text-xs"
                        />
                        {drafts[key] !== undefined ? (
                          <Button size="sm" onClick={() => save(key)} disabled={pending}>
                            Salvesta
                          </Button>
                        ) : savedKey === key ? (
                          <Check className="h-4 w-4 shrink-0 text-success" />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </TabsContent>

      {/* --- Content pages --- */}
      <TabsContent value="pages">
        <div className="mb-4 flex items-center gap-3">
          <Select
            value={activeSlug}
            onChange={(e) => {
              setActiveSlug(e.target.value);
              setPageMessage(null);
            }}
            className="w-64"
          >
            {Object.entries(PAGE_LABELS).map(([slug, label]) => (
              <option key={slug} value={slug}>
                {label} (/{slug})
              </option>
            ))}
          </Select>
        </div>

        {activeSlug === "kkk" && (
          <p className="mb-3 rounded-md border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
            KKK lehel kuvatakse iga &quot;Pealkiri 3&quot; (H3) küsimusena, millele
            järgnev tekst on vastus (akordion).
          </p>
        )}

        <Tabs defaultValue="et" key={activeSlug}>
          <TabsList>
            {LANGS.map((lang) => (
              <TabsTrigger key={lang} value={lang}>
                {lang.toUpperCase()}
              </TabsTrigger>
            ))}
          </TabsList>
          {LANGS.map((lang) => (
            <TabsContent key={lang} value={lang}>
              <RichTextEditor
                value={pages[activeSlug]?.[lang] ?? ""}
                onChange={(html) =>
                  setPages((prev) => ({
                    ...prev,
                    [activeSlug]: { ...prev[activeSlug], [lang]: html },
                  }))
                }
              />
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-4 flex items-center gap-3">
          <Button onClick={savePage} disabled={pending}>
            Salvesta leht
          </Button>
          {pageMessage && <span className="text-sm text-success">{pageMessage}</span>}
        </div>
      </TabsContent>
    </Tabs>
  );
}
