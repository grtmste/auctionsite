"use client";

import { useTransition } from "react";
import { BadgeCheck, Ban, ShieldCheck, Shield, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
                {user.role === "ADMIN" ? (
                  <Badge variant="default">Admin</Badge>
                ) : (
                  <Badge variant="muted">Kasutaja</Badge>
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
                        title={user.role === "ADMIN" ? "Muuda kasutajaks" : "Muuda adminiks"}
                        disabled={pending}
                        onClick={() =>
                          startTransition(() =>
                            setUserRole(
                              user.id,
                              user.role === "ADMIN" ? "USER" : "ADMIN"
                            ).then(() => {})
                          )
                        }
                      >
                        {user.role === "ADMIN" ? (
                          <ShieldCheck className="h-4 w-4 text-primary" />
                        ) : (
                          <Shield className="h-4 w-4" />
                        )}
                      </Button>
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
