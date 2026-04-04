"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/lib/i18n/routing";
import { Link } from "@/lib/i18n/routing";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  Send,
  Contact,
  BarChart3,
  FileVideo,
  Trophy,
  Settings,
} from "lucide-react";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { NotificationBell } from "@/components/layout/notification-bell";

const navItems = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "creators", href: "/creators", icon: Users },
  { key: "outreach", href: "/outreach", icon: Send },
  { key: "crm", href: "/crm", icon: Contact },
  { key: "analytics", href: "/analytics", icon: BarChart3 },
  { key: "content", href: "/content", icon: FileVideo },
  { key: "campaigns", href: "/campaigns", icon: Trophy },
  { key: "settings", href: "/settings", icon: Settings },
] as const;

export function AppSidebar() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <Link href="/dashboard" className="text-xl font-bold">
          Afflux
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.key)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <LocaleSwitcher />
          <NotificationBell />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
