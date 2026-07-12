"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Crown, Pencil, Phone, Plus, Trash2, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime, toInitials } from "@/lib/utils";
import { savePhoneBid, deletePhoneBid, closePhoneAuction } from "../actions";
import type { PhoneBidStatus } from "@prisma/client";

const STATUS_LABELS: Record<PhoneBidStatus, string> = {
  CONTACTED: "Kontakteeritud",
  CONFIRMED: "Kinnitatud",
  DECLINED: "Loobus",
  NO_ANSWER: "Ei vastanud",
};

const STATUS_VARIANTS: Record<
  PhoneBidStatus,
  "success" | "warning" | "muted" | "destructive"
> = {
  CONTACTED: "warning",
  CONFIRMED: "success",
  DECLINED: "destructive",
  NO_ANSWER: "muted",
};

interface TopBidder {
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  amount: number;
}

interface PhoneBidRow {
  id: string;
  bidderName: string;
  bidderPhone: string | null;
  bidderUserId: string | null;
  amount: number;
  status: PhoneBidStatus;
  notes: string | null;
  recordedBy: string;
  createdAt: string;
}

interface PhoneAuctionModuleProps {
  auction: {
    id: string;
    title: string;
    currentBid: number | null;
    startingPrice: number;
    reservePrice: number | null;
    phoneAuctionEnd: string | null;
  };
  topBidders: TopBidder[];
  phoneBids: PhoneBidRow[];
}

interface EditorState {
  id?: string;
  bidderName: string;
  bidderPhone: string;
  bidderUserId: string;
  amount: string;
  status: PhoneBidStatus;
  notes: string;
}

const EMPTY_EDITOR: EditorState = {
  bidderName: "",
  bidderPhone: "",
  bidderUserId: "",
  amount: "",
  status: "CONTACTED",
  notes: "",
};

export function PhoneAuctionModule({
  auction,
  topBidders,
  phoneBids,
}: PhoneAuctionModuleProps) {
  const router = useRouter();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [closeConfirm, setCloseConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const confirmed = phoneBids.filter((bid) => bid.status === "CONFIRMED");
  const winner = confirmed.reduce<PhoneBidRow | null>(
    (best, bid) => (best === null || bid.amount > best.amount ? bid : best),
    null
  );
  const reserveNote =
    winner && auction.reservePrice && winner.amount < auction.reservePrice;

  function submitEditor(e: React.FormEvent) {
    e.preventDefault();
    if (!editor) return;
    setError(null);
    const amount = Number(editor.amount.replace(",", "."));
    if (!editor.bidderName.trim() || !Number.isFinite(amount) || amount <= 0) {
      setError("Nimi ja korrektne summa on kohustuslikud");
      return;
    }
    startTransition(async () => {
      await savePhoneBid({
        id: editor.id,
        auctionId: auction.id,
        bidderName: editor.bidderName.trim(),
        bidderPhone: editor.bidderPhone.trim() || null,
        bidderUserId: editor.bidderUserId || null,
        amount,
        status: editor.status,
        notes: editor.notes.trim() || null,
      });
      setEditor(null);
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deletePhoneBid(id);
      router.refresh();
    });
  }

  function close() {
    startTransition(async () => {
      await closePhoneAuction(auction.id);
      setCloseConfirm(false);
      router.refresh();
    });
  }

  const linkedUser = (userId: string | null) =>
    userId ? topBidders.find((bidder) => bidder.userId === userId) : undefined;

  return (
    <div className="min-w-0 flex-1 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{auction.title}</h2>
          <p className="mt-1 text-sm text-muted">
            Parim online-pakkumine:{" "}
            <span className="font-semibold text-foreground">
              {formatCurrency(auction.currentBid ?? auction.startingPrice)}
            </span>
            {auction.reservePrice != null && (
              <>
                {" · "}Reservhind:{" "}
                <span className="font-semibold text-warning">
                  {formatCurrency(auction.reservePrice)}
                </span>
              </>
            )}
            {auction.phoneAuctionEnd && (
              <>
                {" · "}Lõpeb: {formatDateTime(auction.phoneAuctionEnd)}
              </>
            )}
          </p>
        </div>
        <Button variant="destructive" onClick={() => setCloseConfirm(true)}>
          Lõpeta telefonoksjon
        </Button>
      </div>

      {/* Winner card */}
      {winner && (
        <div className="rounded-lg border border-success/50 bg-success/10 p-5">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-success" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-success">
                Parim kinnitatud pakkumine
              </p>
              <p className="text-lg font-bold">
                {winner.bidderName}
                {winner.bidderPhone && (
                  <span className="ml-2 text-sm font-normal text-muted">
                    {winner.bidderPhone}
                  </span>
                )}
              </p>
            </div>
            <p className="ml-auto font-heading text-3xl font-bold text-success">
              {formatCurrency(winner.amount)}
            </p>
          </div>
          {reserveNote && (
            <p className="mt-3 text-sm text-warning">
              NB! Pakkumine on alla reservhinna — sulgemisel märgitakse oksjon
              mitteõnnestunuks (Lõppenud, mitte Müüdud).
            </p>
          )}
        </div>
      )}

      {/* Top online bidders */}
      <div className="rounded-lg border border-border bg-surface">
        <h3 className="flex items-center gap-2 border-b border-border px-5 py-3 font-semibold">
          <Crown className="h-4 w-4 text-warning" />
          Parimad online-pakkujad (helistamise järjekord)
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Nimi</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Parim online-pakkumine</TableHead>
              <TableHead className="text-right">Tegevus</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topBidders.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted">
                  Online-pakkumisi ei olnud
                </TableCell>
              </TableRow>
            )}
            {topBidders.map((bidder, index) => (
              <TableRow key={bidder.userId}>
                <TableCell className="font-bold text-muted">{index + 1}.</TableCell>
                <TableCell>
                  <span className="font-medium">{bidder.name}</span>{" "}
                  <span className="text-xs text-muted">({toInitials(bidder.name)})</span>
                </TableCell>
                <TableCell>
                  {bidder.phone ? (
                    <a
                      href={`tel:${bidder.phone.replace(/\s/g, "")}`}
                      className="inline-flex items-center gap-1.5 text-primary-hover hover:underline"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {bidder.phone}
                    </a>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </TableCell>
                <TableCell className="font-semibold">
                  {formatCurrency(bidder.amount)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setEditor({
                        ...EMPTY_EDITOR,
                        bidderName: bidder.name,
                        bidderPhone: bidder.phone ?? "",
                        bidderUserId: bidder.userId,
                      })
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Lisa telefonipakkumine
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Phone bid log */}
      <div className="rounded-lg border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="font-semibold">Telefonipakkumiste logi</h3>
          <Button size="sm" onClick={() => setEditor({ ...EMPTY_EDITOR })}>
            <Plus className="h-4 w-4" />
            Lisa pakkumine
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pakkuja</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Seotud kasutaja</TableHead>
              <TableHead>Summa</TableHead>
              <TableHead>Staatus</TableHead>
              <TableHead>Märkmed</TableHead>
              <TableHead>Aeg</TableHead>
              <TableHead>Sisestas</TableHead>
              <TableHead className="text-right">Tegevused</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {phoneBids.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-muted">
                  Telefonipakkumisi pole veel sisestatud
                </TableCell>
              </TableRow>
            )}
            {phoneBids.map((bid) => (
              <TableRow key={bid.id}>
                <TableCell className="font-medium">{bid.bidderName}</TableCell>
                <TableCell>{bid.bidderPhone ?? "—"}</TableCell>
                <TableCell className="text-muted">
                  {linkedUser(bid.bidderUserId)?.email ?? "—"}
                </TableCell>
                <TableCell className="font-semibold">
                  {formatCurrency(bid.amount)}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[bid.status]}>
                    {STATUS_LABELS[bid.status]}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-40 truncate text-muted" title={bid.notes ?? ""}>
                  {bid.notes ?? "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted">
                  {formatDateTime(bid.createdAt)}
                </TableCell>
                <TableCell className="text-muted">{bid.recordedBy}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Muuda"
                      onClick={() =>
                        setEditor({
                          id: bid.id,
                          bidderName: bid.bidderName,
                          bidderPhone: bid.bidderPhone ?? "",
                          bidderUserId: bid.bidderUserId ?? "",
                          amount: String(bid.amount),
                          status: bid.status,
                          notes: bid.notes ?? "",
                        })
                      }
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Kustuta"
                      disabled={pending}
                      onClick={() => remove(bid.id)}
                    >
                      <Trash2 className="h-4 w-4 text-primary" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add / edit phone bid modal */}
      <Dialog
        open={editor !== null}
        onClose={() => setEditor(null)}
        title={editor?.id ? "Muuda telefonipakkumist" : "Lisa telefonipakkumine"}
      >
        {editor && (
          <form onSubmit={submitEditor} className="space-y-4">
            <div>
              <Label htmlFor="pb-name">Pakkuja nimi *</Label>
              <Input
                id="pb-name"
                value={editor.bidderName}
                onChange={(e) => setEditor({ ...editor, bidderName: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="pb-phone">Telefon</Label>
                <Input
                  id="pb-phone"
                  value={editor.bidderPhone}
                  onChange={(e) => setEditor({ ...editor, bidderPhone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="pb-amount">Summa (€) *</Label>
                <Input
                  id="pb-amount"
                  inputMode="decimal"
                  value={editor.amount}
                  onChange={(e) => setEditor({ ...editor, amount: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="pb-user">Seotud kasutaja (valikuline)</Label>
              <Select
                id="pb-user"
                value={editor.bidderUserId}
                onChange={(e) => setEditor({ ...editor, bidderUserId: e.target.value })}
              >
                <option value="">— pole seotud —</option>
                {topBidders.map((bidder) => (
                  <option key={bidder.userId} value={bidder.userId}>
                    {bidder.name} ({bidder.email})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="pb-status">Staatus</Label>
              <Select
                id="pb-status"
                value={editor.status}
                onChange={(e) =>
                  setEditor({ ...editor, status: e.target.value as PhoneBidStatus })
                }
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="pb-notes">Märkmed</Label>
              <Textarea
                id="pb-notes"
                rows={3}
                value={editor.notes}
                onChange={(e) => setEditor({ ...editor, notes: e.target.value })}
              />
            </div>
            {error && <p className="text-sm text-primary-hover">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditor(null)}>
                Tühista
              </Button>
              <Button type="submit" disabled={pending}>
                Salvesta
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* Close confirmation */}
      <Dialog
        open={closeConfirm}
        onClose={() => setCloseConfirm(false)}
        title="Lõpeta telefonoksjon"
      >
        <p className="text-sm text-muted">
          {winner ? (
            <>
              Oksjon suletakse võidupakkumisega{" "}
              <strong className="text-success">{formatCurrency(winner.amount)}</strong>{" "}
              ({winner.bidderName}).{" "}
              {reserveNote
                ? "Pakkumine on alla reservhinna, seega märgitakse oksjon Lõppenuks."
                : "Oksjon märgitakse Müüduks ja avalik leht uueneb kohe."}
            </>
          ) : (
            "Kinnitatud telefonipakkumisi ei ole — oksjon märgitakse Lõppenuks ilma võitjata."
          )}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setCloseConfirm(false)}>
            Tühista
          </Button>
          <Button variant="destructive" onClick={close} disabled={pending}>
            Lõpeta oksjon
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
