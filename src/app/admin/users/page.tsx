"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc/client";

export default function AdminUsersPage() {
  const { data, isLoading } = trpc.admin.listUsers.useQuery({ page: 1, pageSize: 50 });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Users</h1>
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Last Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
