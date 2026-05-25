"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BarChart3, Package, Shapes, Users, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type AdminShellProps = {
  children: ReactNode;
};

const navItems = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: Shapes },
  { href: "/admin/users", label: "Users", icon: Users },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 border-r bg-background px-4 py-6 lg:flex lg:flex-col">
          <div className="space-y-2 px-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Admin Panel
            </p>
            <h2 className="text-lg font-semibold text-foreground">Dalala Pet Shop</h2>
          </div>
          <Separator className="my-6" />
          <NavLinks />
          <div className="mt-auto rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
            Manage catalog, orders, and users from one place.
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <div className="flex h-full flex-col px-4 py-6">
                    <div className="space-y-2 px-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        Admin Panel
                      </p>
                      <h2 className="text-lg font-semibold text-foreground">
                        Dalala Pet Shop
                      </h2>
                    </div>
                    <Separator className="my-6" />
                    <NavLinks />
                  </div>
                </SheetContent>
              </Sheet>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Management Console
                </p>
                <h1 className="truncate text-lg font-semibold text-foreground">
                  Admin Dashboard
                </h1>
              </div>

              <div className="hidden items-center gap-2 sm:flex">
                <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                  Secure access
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
