"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createUser } from "../actions";

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  phone2: "",
  company: "",
  regCode: "",
  vatNo: "",
  personalId: "",
  address: "",
  role: "VENDOR" as "USER" | "VENDOR" | "ADMIN",
  password: "",
};

/** Admin-side account creation, used mainly for insurance-broker vendors. */
export function CreateUserDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function randomPassword() {
    const pool = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let out = "";
    const bytes = crypto.getRandomValues(new Uint32Array(12));
    for (const b of bytes) out += pool[b % pool.length];
    set("password", out);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createUser(form);
      if (!res.ok) {
        setError(
          res.error === "EMAIL_EXISTS"
            ? "Selle e-postiga konto on juba olemas."
            : "Konto loomine ebaõnnestus.",
        );
        return;
      }
      setForm(EMPTY);
      setOpen(false);
      router.refresh();
    });
  }

  const valid =
    form.name.trim() && /\S+@\S+\.\S+/.test(form.email) && form.password.length >= 8;

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4" />
        Uus konto
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Loo uus konto">
        <div className="space-y-4">
          <div>
            <Label htmlFor="cu-name">Nimi</Label>
            <Input
              id="cu-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="cu-email">E-post</Label>
            <Input
              id="cu-email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cu-phone">Telefon 1</Label>
              <Input
                id="cu-phone"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="cu-phone2">Telefon 2</Label>
              <Input
                id="cu-phone2"
                value={form.phone2}
                onChange={(e) => set("phone2", e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="cu-personalId">Isikukood</Label>
            <Input
              id="cu-personalId"
              value={form.personalId}
              onChange={(e) => set("personalId", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="cu-company">Ettevõte</Label>
            <Input
              id="cu-company"
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cu-regCode">Registrikood</Label>
              <Input
                id="cu-regCode"
                value={form.regCode}
                onChange={(e) => set("regCode", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="cu-vatNo">KMKR (VAT nr)</Label>
              <Input
                id="cu-vatNo"
                value={form.vatNo}
                onChange={(e) => set("vatNo", e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="cu-address">Aadress</Label>
            <Input
              id="cu-address"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="cu-role">Roll</Label>
            <Select
              id="cu-role"
              value={form.role}
              onChange={(e) => set("role", e.target.value as typeof form.role)}
            >
              <option value="USER">Kasutaja</option>
              <option value="VENDOR">Müüja (kindlustusmaakler)</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="cu-password">Parool</Label>
            <div className="flex gap-2">
              <Input
                id="cu-password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Vähemalt 8 tähemärki"
              />
              <Button type="button" variant="outline" onClick={randomPassword}>
                Genereeri
              </Button>
            </div>
            <p className="mt-1 text-xs text-muted">
              Edasta parool kasutajale turvaliselt. Konto on kohe kinnitatud.
            </p>
          </div>
          {error && (
            <p className="rounded-md bg-primary/10 p-2.5 text-sm text-primary">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Tühista
            </Button>
            <Button onClick={submit} disabled={pending || !valid}>
              {pending ? "Loon…" : "Loo konto"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
