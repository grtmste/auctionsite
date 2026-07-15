"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { updateUser } from "../actions";
import type { Role } from "@prisma/client";

export interface EditableUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  regCode: string;
  vatNo: string;
  personalId: string;
  address: string;
  role: Role;
  isSelf: boolean;
}

export function EditUserDialog({
  user,
  open,
  onClose,
}: {
  user: EditableUser;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: user.name === "—" ? "" : user.name,
    email: user.email,
    phone: user.phone,
    company: user.company,
    regCode: user.regCode,
    vatNo: user.vatNo,
    personalId: user.personalId,
    address: user.address,
    role: user.role,
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function randomPassword() {
    const pool = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let out = "";
    for (const b of crypto.getRandomValues(new Uint32Array(12))) out += pool[b % pool.length];
    set("password", out);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await updateUser({ id: user.id, ...form });
      if (!res.ok) {
        setError(
          res.error === "EMAIL_EXISTS"
            ? "Selle e-postiga on juba teine konto."
            : res.error === "SELF_DEMOTE"
              ? "Sa ei saa enda admini rolli eemaldada."
              : "Salvestamine ebaõnnestus.",
        );
        return;
      }
      onClose();
      router.refresh();
    });
  }

  const valid = form.name.trim() && /\S+@\S+\.\S+/.test(form.email) &&
    (form.password === "" || form.password.length >= 8);

  return (
    <Dialog open={open} onClose={onClose} title={`Muuda kasutajat`}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="eu-name">Nimi</Label>
          <Input id="eu-name" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="eu-email">E-post</Label>
          <Input
            id="eu-email"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="eu-phone">Telefon</Label>
            <Input id="eu-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="eu-personalId">Isikukood</Label>
            <Input
              id="eu-personalId"
              value={form.personalId}
              onChange={(e) => set("personalId", e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="eu-company">Ettevõte</Label>
          <Input
            id="eu-company"
            value={form.company}
            onChange={(e) => set("company", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="eu-regCode">Registrikood</Label>
            <Input
              id="eu-regCode"
              value={form.regCode}
              onChange={(e) => set("regCode", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="eu-vatNo">KMKR (VAT nr)</Label>
            <Input
              id="eu-vatNo"
              value={form.vatNo}
              onChange={(e) => set("vatNo", e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="eu-address">Aadress</Label>
          <Input
            id="eu-address"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="eu-role">Roll</Label>
          <Select
            id="eu-role"
            value={form.role}
            disabled={user.isSelf}
            onChange={(e) => set("role", e.target.value as Role)}
          >
            <option value="USER">Kasutaja</option>
            <option value="VENDOR">Müüja (kindlustusmaakler)</option>
            <option value="ADMIN">Admin</option>
          </Select>
          {user.isSelf && (
            <p className="mt-1 text-xs text-muted">Enda rolli ei saa muuta.</p>
          )}
        </div>
        <div>
          <Label htmlFor="eu-password">Uus parool</Label>
          <div className="flex gap-2">
            <Input
              id="eu-password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="Jäta tühjaks, et mitte muuta"
            />
            <Button type="button" variant="outline" onClick={randomPassword}>
              Genereeri
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted">
            Täida ainult siis, kui soovid parooli lähtestada (vähemalt 8 tähemärki).
          </p>
        </div>
        {error && (
          <p className="rounded-md bg-primary/10 p-2.5 text-sm text-primary">{error}</p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Tühista
          </Button>
          <Button onClick={submit} disabled={pending || !valid}>
            {pending ? "Salvestan…" : "Salvesta"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
