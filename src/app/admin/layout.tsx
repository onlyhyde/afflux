import { TRPCProvider } from "@/components/providers/trpc-provider";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TRPCProvider>
      <div className="flex min-h-screen">
        <aside className="w-64 border-r bg-card p-6 flex flex-col gap-4">
          <h1 className="text-xl font-bold">Afflux Admin</h1>
          <nav className="flex flex-col gap-1 text-sm">
            <a href="/admin" className="rounded-md px-3 py-2 hover:bg-accent">
              Dashboard
            </a>
            <a href="/admin/tenants" className="rounded-md px-3 py-2 hover:bg-accent">
              Tenants
            </a>
            <a href="/admin/users" className="rounded-md px-3 py-2 hover:bg-accent">
              Users
            </a>
            <a href="/admin/creators" className="rounded-md px-3 py-2 hover:bg-accent">
              Creator DB
            </a>
            <a href="/admin/queues" className="rounded-md px-3 py-2 hover:bg-accent">
              Queues
            </a>
            <a href="/admin/logs" className="rounded-md px-3 py-2 hover:bg-accent">
              Activity Logs
            </a>
            <a href="/admin/webhooks" className="rounded-md px-3 py-2 hover:bg-accent">
              Webhooks
            </a>
          </nav>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </TRPCProvider>
  );
}
