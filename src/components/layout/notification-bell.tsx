"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export function NotificationBell() {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);

  const { data: unreadCount } = trpc.notification.getUnreadCount.useQuery(
    undefined,
    { refetchInterval: 30000 } // Poll every 30s
  );

  const { data: notifications, isLoading } = trpc.notification.list.useQuery(
    { page: 1, pageSize: 10 },
    { enabled: open }
  );

  const markAllAsRead = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      // Invalidate cache would go here with utils
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {(unreadCount ?? 0) > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-destructive">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {(unreadCount ?? 0) > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 text-xs"
              onClick={() => markAllAsRead.mutate()}
            >
              <Check className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-72">
          {isLoading && (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              {t("loading")}
            </div>
          )}
          {!isLoading && (notifications ?? []).length === 0 && (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              No notifications
            </div>
          )}
          {!isLoading &&
            (notifications ?? []).map((notif) => (
              <div
                key={notif.id}
                className={`border-b px-4 py-3 text-sm ${
                  !notif.isRead ? "bg-accent/30" : ""
                }`}
              >
                <p className="font-medium">{notif.title}</p>
                {notif.body && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {notif.body}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(notif.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
