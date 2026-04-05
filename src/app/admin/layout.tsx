"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { TRPCProvider } from "@/components/providers/trpc-provider";
import {
  LayoutDashboard,
  Building2,
  Users,
  Database,
  ListChecks,
  ScrollText,
  Webhook,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/tenants", label: "Tenants", icon: Building2 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/creators", label: "Creator DB", icon: Database },
  { href: "/admin/queues", label: "Queues", icon: ListChecks },
  { href: "/admin/logs", label: "Activity Logs", icon: ScrollText },
  { href: "/admin/webhooks", label: "Webhooks", icon: Webhook },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <TRPCProvider>
      <div className="flex min-h-screen">
        <aside className="w-64 border-r bg-card p-6 flex flex-col gap-4">
          <h1 className="text-xl font-bold">Afflux Admin</h1>
          <nav className="flex flex-col gap-1 text-sm">
            {NAV_ITEMS.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 transition-colors ${
                    isActive
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </TRPCProvider>
  );
}
