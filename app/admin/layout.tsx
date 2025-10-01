"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminGuard } from "@/components/admin/admin-guard";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Productos",
    href: "/admin/products",
    icon: Package,
  },
  {
    name: "Órdenes",
    href: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    name: "Clientes",
    href: "/admin/customers",
    icon: Users,
  },
];

function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <LayoutDashboard className="h-6 w-6" />
          <span>Panel Admin</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1 py-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </ScrollArea>
      <div className="border-t p-4">
        <Link href="/">
          <Button variant="outline" className="w-full">
            Volver a la tienda
          </Button>
        </Link>
      </div>
    </div>
  );
}

function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <Sidebar />
      </SheetContent>
    </Sheet>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:w-64 md:flex-col border-r">
          <Sidebar />
        </aside>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile Header */}
          <header className="flex h-16 items-center gap-4 border-b bg-background px-6 md:hidden">
            <MobileSidebar />
            <div className="flex items-center gap-2 font-semibold">
              <LayoutDashboard className="h-5 w-5" />
              <span>Panel Admin</span>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-muted/40 p-6">
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
