"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc/client";

interface CampaignCreateFormProps {
  onClose: () => void;
  onCreated: () => void;
}

export function CampaignCreateForm({ onClose, onCreated }: CampaignCreateFormProps) {
  const t = useTranslations();
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("tiktok_dm");

  const { data: templates } = trpc.outreach.listTemplates.useQuery({
    channel: channel as "tiktok_dm" | "tiktok_invite" | "email",
  });
  const { data: lists } = trpc.creatorList.list.useQuery();

  const [templateId, setTemplateId] = useState("");
  const [listId, setListId] = useState("");

  const createCampaign = trpc.outreach.createCampaign.useMutation({
    onSuccess: () => {
      onCreated();
      onClose();
    },
  });

  function handleCreate() {
    if (!name) return;
    createCampaign.mutate({
      name,
      templateId: templateId || undefined,
      targetListId: listId || undefined,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Campaign</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>Campaign Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Beauty Creators Q2"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Channel</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tiktok_dm">TikTok DM</SelectItem>
                <SelectItem value="tiktok_invite">TikTok Invite</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {(templates ?? []).map((tmpl) => (
                  <SelectItem key={tmpl.id} value={tmpl.id}>
                    {tmpl.name} ({tmpl.locale})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Target Creator List</Label>
          <Select value={listId} onValueChange={setListId}>
            <SelectTrigger>
              <SelectValue placeholder="Select creator list" />
            </SelectTrigger>
            <SelectContent>
              {(lists ?? []).map(({ list }) => (
                <SelectItem key={list.id} value={list.id}>
                  {list.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleCreate} disabled={!name || createCampaign.isPending}>
            {createCampaign.isPending ? t("common.loading") : t("common.create")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
