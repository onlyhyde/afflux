"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { trpc } from "@/lib/trpc/client";
import { UserPlus, Check, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AddToListDialogProps {
  creatorId: string;
}

export function AddToListDialog({ creatorId }: AddToListDialogProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [newListName, setNewListName] = useState("");

  const { data: lists } = trpc.creatorList.list.useQuery(undefined, {
    enabled: open,
  });

  const addMember = trpc.creatorList.addMember.useMutation({
    onSuccess: () => setOpen(false),
  });

  const createList = trpc.creatorList.create.useMutation({
    onSuccess: (newList) => {
      if (newList) {
        addMember.mutate({ listId: newList.id, creatorId });
      }
      setNewListName("");
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" title={t("creators.addToList")}>
          <UserPlus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <p className="text-xs font-medium text-muted-foreground px-2 py-1">
          {t("creators.addToList")}
        </p>
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
          {(lists ?? []).map(({ list }) => (
            <Button
              key={list.id}
              variant="ghost"
              size="sm"
              className="justify-start text-xs h-8"
              onClick={() => addMember.mutate({ listId: list.id, creatorId })}
              disabled={addMember.isPending}
            >
              {list.name}
            </Button>
          ))}
        </div>
        <div className="flex gap-1 mt-2 border-t pt-2">
          <Input
            placeholder="New list..."
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            className="h-7 text-xs"
          />
          <Button
            size="sm"
            className="h-7 px-2"
            disabled={!newListName || createList.isPending}
            onClick={() => createList.mutate({ name: newListName })}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
