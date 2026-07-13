"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DownloadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { importRomuContent } from "../actions";
import type { RomuImportResult } from "@/lib/romu-import";

export function RomuImport({ translationAvailable }: { translationAvailable: boolean }) {
  const router = useRouter();
  const [translate, setTranslate] = useState(translationAvailable);
  const [result, setResult] = useState<RomuImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    setResult(null);
    setError(null);
    startTransition(async () => {
      try {
        const res = await importRomuContent(translate);
        setResult(res);
        router.refresh();
      } catch {
        setError("Import ebaõnnestus. Proovi uuesti.");
      }
    });
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h2 className="mb-1 font-semibold">Impordi sisu romu.ee-st</h2>
      <p className="mb-4 text-sm text-muted">
        Toob praeguselt romu.ee lehelt üle sisulehed (Reeglid, Teenused, KKK,
        Privaatsuspoliitika) sõna-sõnalt ning logo ja kindlustuspartnerite
        logod. Olemasolev sisu kirjutatakse üle.
      </p>

      <label className="mb-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={translate}
          disabled={!translationAvailable}
          onChange={(e) => setTranslate(e.target.checked)}
          className="h-4 w-4 accent-[#E8830C]"
        />
        Tõlgi sisu automaatselt keeltesse EN, RU, LV, LT
        {!translationAvailable && (
          <span className="text-xs text-muted">(vajab ANTHROPIC_API_KEY seadistust)</span>
        )}
      </label>

      <Button onClick={run} disabled={pending}>
        <DownloadCloud className="h-4 w-4" />
        {pending ? "Impordin… (võib võtta mõne minuti)" : "Impordi romu.ee-st"}
      </Button>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      {result && (
        <div className="mt-4 space-y-2 rounded-md border border-border bg-background p-3 text-sm">
          <p className="font-medium">Tulemus:</p>
          <ul className="list-inside list-disc text-muted">
            {Object.entries(result.pages).map(([slug, status]) => (
              <li key={slug}>
                /{slug}: {status}
              </li>
            ))}
            {Object.keys(result.media).length > 0 && (
              <li>Logod: {Object.keys(result.media).join(", ")}</li>
            )}
            {result.translated.length > 0 && (
              <li>Tõlgitud: {result.translated.join(", ")}</li>
            )}
          </ul>
          {result.errors.length > 0 && (
            <ul className="list-inside list-disc text-danger">
              {result.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
