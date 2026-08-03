import { useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { LayoutGrid, Menu, UploadCloud } from "lucide-react";
import { cn } from "../shared/lib/cn.js";
import { Brand } from "../shared/ui/brand.js";
import { Button } from "../shared/ui/button.js";
import { Sheet, SheetContent } from "../shared/ui/sheet.js";
import { UserMenu } from "./components/UserMenu.js";
import { NotificationToggle } from "./components/NotificationToggle.js";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/upload", label: "Subir video", icon: UploadCloud },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              isActive && "bg-accent text-foreground",
            )
          }
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden w-56 flex-col gap-1 border-r border-border bg-card/40 p-3 md:flex">
        <Brand size="sm" className="mb-4 px-2 py-1" />
        <NavLinks />
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left">
          <Brand size="sm" className="mb-4 px-2 py-1" />
          <NavLinks onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-12 items-center justify-between gap-2 border-b border-border px-3 sm:px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileNavOpen(true)}
              title="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Brand size="sm" className="md:hidden" />
          </div>
          <div className="flex items-center gap-1">
            <NotificationToggle />
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
