"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { UserPlus, CreditCard } from "lucide-react";

export default function SettingsPage() {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">{t("nav.settings")}</h1>

      <Tabs defaultValue="general" className="flex flex-col gap-4">
        <TabsList className="w-fit">
          <TabsTrigger value="general">{t("settings.general")}</TabsTrigger>
          <TabsTrigger value="team">{t("settings.team")}</TabsTrigger>
          <TabsTrigger value="billing">{t("settings.billing")}</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <TenantSettings />
        </TabsContent>

        <TabsContent value="team">
          <TeamSettings />
        </TabsContent>

        <TabsContent value="billing">
          <BillingSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TenantSettings() {
  const t = useTranslations();
  const { data: tenant, isLoading } = trpc.settings.getTenant.useQuery();

  if (isLoading) return <Skeleton className="h-48" />;
  if (!tenant) return <p className="text-muted-foreground">{t("settings.notLoggedIn")}</p>;

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
  const t = useTranslations();
  const { data: members, isLoading } = trpc.settings.listMembers.useQuery();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const utils = trpc.useUtils();

  const inviteMember = trpc.settings.inviteMember.useMutation({
    onSuccess: () => {
      setShowInvite(false);
      setInviteEmail("");
      utils.settings.listMembers.invalidate();
    },
  });

  if (isLoading) return <Skeleton className="h-48" />;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Team Members</CardTitle>
          <Button size="sm" onClick={() => setShowInvite(!showInvite)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite
          </Button>
        </CardHeader>
        <CardContent>
          {showInvite && (
            <div className="mb-4 flex gap-2 items-end rounded-lg border p-3">
              <div className="flex-1">
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="teammate@company.com"
                  className="h-9"
                />
              </div>
              <div className="w-32">
                <Label className="text-xs">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                size="sm"
                className="h-9"
                onClick={() => inviteMember.mutate({ email: inviteEmail, role: inviteRole as "admin" | "manager" | "viewer" })}
                disabled={!inviteEmail || inviteMember.isPending}
              >
                {inviteMember.isPending ? "..." : "Send"}
              </Button>
            </div>
          )}
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
    </div>
  );
}

function BillingSettings() {
  const t = useTranslations();
  const { data, isLoading } = trpc.billing.getCurrentPlan.useQuery();

  if (isLoading) return <Skeleton className="h-48" />;
  if (!data) return <p className="text-muted-foreground">{t("settings.notLoggedIn")}</p>;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Badge className="text-lg px-4 py-1">{data.plan}</Badge>
            {data.subscription && (
              <span className="text-sm text-muted-foreground">
                Status: {data.subscription.status}
              </span>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-3 text-sm">
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground">DM / month</p>
              <p className="font-mono font-bold">
                {data.limits.dmPerMonth === Infinity ? "Unlimited" : data.limits.dmPerMonth.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground">Email / month</p>
              <p className="font-mono font-bold">
                {data.limits.emailPerMonth === Infinity ? "Unlimited" : data.limits.emailPerMonth.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground">AI Match / month</p>
              <p className="font-mono font-bold">
                {data.limits.aiMatchPerMonth === Infinity ? "Unlimited" : data.limits.aiMatchPerMonth.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground">CRM Creators</p>
              <p className="font-mono font-bold">
                {data.limits.crmCreators === Infinity ? "Unlimited" : data.limits.crmCreators.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground">Team Members</p>
              <p className="font-mono font-bold">
                {data.limits.teamMembers === Infinity ? "Unlimited" : data.limits.teamMembers}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground">API Access</p>
              <p className="font-mono font-bold">{data.limits.apiAccess ? "Yes" : "No"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
