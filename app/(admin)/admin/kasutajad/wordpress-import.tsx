"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { importWordpressUsers } from "../actions";

export function WordpressImport() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setResult(null);
    startTransition(async () => {
      const res = await importWordpressUsers(raw);
      if (!res.ok) {
        setResult("Andmete lugemine ebaõnnestus. Kontrolli formaati.");
        return;
      }
      setResult(
        `Imporditud: ${res.created} · vahele jäetud (juba olemas): ${res.skipped}` +
          (res.invalid ? ` · vigased read: ${res.invalid}` : "")
      );
      setRaw("");
      router.refresh();
    });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRaw(await file.text());
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4" />
        Impordi WordPressist
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Impordi WordPressi kasutajad">
        <div className="space-y-4 text-sm">
          <p className="text-muted">
            Kleebi CSV read kujul{" "}
            <code className="rounded bg-black/5 px-1 py-0.5 text-xs">
              user_login,user_email,user_pass,display_name
            </code>{" "}
            või JSON massiiv wp_users tabelist. Paroolid jäävad WordPressi
            räsidena ($P$… või $wp$…) ja töötavad sisselogimisel edasi —
            esimesel õnnestunud sisselogimisel uuendatakse räsi automaatselt.
          </p>
          <p className="text-xs text-muted">
            SQL päring WordPressis:{" "}
            <code className="rounded bg-black/5 px-1 py-0.5">
              SELECT user_login, user_email, user_pass, display_name FROM wp_users;
            </code>
          </p>
          <input
            type="file"
            accept=".csv,.txt,.json"
            onChange={onFile}
            className="block w-full text-xs text-muted file:mr-3 file:rounded-md file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-xs file:font-medium"
          />
          <Textarea
            rows={8}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={'jaan,jaan@example.com,"$P$B1234567890abcdefghijk",Jaan Kask'}
            className="font-mono text-xs"
          />
          {result && (
            <p className="rounded-md bg-success/10 p-2.5 text-sm text-success">{result}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Sulge
            </Button>
            <Button onClick={submit} disabled={pending || !raw.trim()}>
              {pending ? "Impordin…" : "Impordi"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
