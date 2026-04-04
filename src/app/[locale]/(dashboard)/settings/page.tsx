"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { UserPlus } from "lucide-react";

export default function SettingsPage() {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">{t("nav.settings")}</h1>

      <Tabs defaultValue="general" className="flex flex-col gap-4">
        <TabsList className="w-fit">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <TenantSettings />
        </TabsContent>

        <TabsContent value="team">
          <TeamSettings />
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Stripe integration coming soon.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TenantSettings() {
  const { data: tenant, isLoading } = trpc.settings.getTenant.useQuery();

  if (isLoading) return <Skeleton className="h-48" />;
  if (!tenant) return <p className="text-muted-foreground">Not logged in</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Settings</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium">{tenant.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Plan</p>
            <Badge variant="secondary">{tenant.plan}</Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Locale</p>
            <p className="font-medium">{tenant.locale}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Currency</p>
            <p className="font-medium">{tenant.currency}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Timezone</p>
            <p className="font-medium">{tenant.timezone}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamSettings() {
  const { data: members, isLoading } = trpc.settings.listMembers.useQuery();

  if (isLoading) return <Skeleton className="h-48" />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Team Members</CardTitle>
        <Button size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Invite
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {(members ?? []).map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
              <Badge variant="outline">{member.role}</Badge>
            </div>
          ))}
          {(members ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No team members yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
