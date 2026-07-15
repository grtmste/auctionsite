"use client";

import { useTransition } from "react";
import { BadgeCheck, Ban, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { setUserRole, verifyUser, setUserDisabled } from "../actions";
import type { Role } from "@prisma/client";

const ROLE_LABELS: Record<Role, string> = {
  USER: "Kasutaja",
  VENDOR: "Müüja",
  ADMIN: "Admin",
};

const ROLE_VARIANTS: Record<Role, "default" | "muted" | "success"> = {
  USER: "muted",
  VENDOR: "success",
  ADMIN: "default",
};

interface Row {
  id: string;
  name: string;
  email: string;
  registered: string;
  role: Role;
  verified: boolean;
  disabled: boolean;
  bidCount: number;
  isSelf: boolean;
}

export function UsersTable({ users }: { users: Row[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-lg border border-border bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nimi</TableHead>
            <TableHead>E-post</TableHead>
            <TableHead>Registreeritud</TableHead>
            <TableHead>Roll</TableHead>
            <TableHead>Kinnitatud</TableHead>
            <TableHead>Pakkumisi</TableHead>
            <TableHead className="text-right">Tegevused</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className={user.disabled ? "opacity-50" : ""}>
              <TableCell className="font-medium">
                {user.name}
                {user.disabled && (
                  <Badge variant="destructive" className="ml-2">
                    Blokeeritud
                  </Badge>
                )}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell className="text-muted">{user.registered}</TableCell>
              <TableCell>
                {user.isSelf ? (
                  <Badge variant={ROLE_VARIANTS[user.role]}>{ROLE_LABELS[user.role]}</Badge>
                ) : (
                  <Select
                    value={user.role}
                    disabled={pending}
                    className="h-8 w-28 py-0 text-sm"
                    onChange={(e) =>
                      startTransition(() =>
                        setUserRole(user.id, e.target.value as Role).then(() => {}),
                      )
                    }
                  >
                    <option value="USER">Kasutaja</option>
                    <option value="VENDOR">Müüja</option>
                    <option value="ADMIN">Admin</option>
                  </Select>
                )}
              </TableCell>
              <TableCell>
                {user.verified ? (
                  <BadgeCheck className="h-5 w-5 text-success" />
                ) : (
                  <span className="text-xs text-muted">Kinnitamata</span>
                )}
              </TableCell>
              <TableCell>{user.bidCount}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  {!user.verified && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Kinnita konto käsitsi"
                      disabled={pending}
                      onClick={() => startTransition(() => verifyUser(user.id).then(() => {}))}
                    >
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    </Button>
                  )}
                  {!user.isSelf && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={user.disabled ? "Aktiveeri konto" : "Blokeeri konto"}
                        disabled={pending}
                        onClick={() =>
                          startTransition(() =>
                            setUserDisabled(user.id, !user.disabled).then(() => {})
                          )
                        }
                      >
                        <Ban
                          className={
                            user.disabled ? "h-4 w-4 text-success" : "h-4 w-4 text-primary"
                          }
                        />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
