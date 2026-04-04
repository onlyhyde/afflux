"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const AVAILABLE_VARIABLES = [
  { key: "creator_name", label: "Creator Name" },
  { key: "product_name", label: "Product Name" },
  { key: "commission_rate", label: "Commission Rate" },
  { key: "brand_name", label: "Brand Name" },
  { key: "shop_url", label: "Shop URL" },
];

interface TemplateEditorProps {
  onClose: () => void;
}

export function TemplateEditor({ onClose }: TemplateEditorProps) {
  const t = useTranslations();
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("tiktok_dm");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  function insertVariable(key: string) {
    setBody((prev) => prev + `{{${key}}}`);
  }

  function handleSave() {
    // TODO: Call tRPC mutation
    onClose();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("outreach.createTemplate")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Template Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Beauty Creator Initial DM"
            />
          </div>
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
        </div>

        {channel === "email" && (
          <div className="flex flex-col gap-2">
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Partnership opportunity with {{brand_name}}"
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label>Message Body</Label>
          <div className="flex flex-wrap gap-1 mb-2">
            {AVAILABLE_VARIABLES.map((v) => (
              <Badge
                key={v.key}
                variant="outline"
                className="cursor-pointer hover:bg-accent"
                onClick={() => insertVariable(v.key)}
              >
                {`{{${v.key}}}`}
              </Badge>
            ))}
          </div>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`Hi {{creator_name}},\n\nI love your content about...\n\nWe'd like to offer you a {{commission_rate}}% commission on our {{product_name}}.`}
            rows={8}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave}>{t("common.save")}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
