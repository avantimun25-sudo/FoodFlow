import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  UtensilsCrossed,
  LogOut,
  ChefHat,
  Star,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

interface RestaurantLayoutProps {
  children: ReactNode;
}

export default function RestaurantLayout({ children }: RestaurantLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { href: "/restaurant/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/restaurant/orders", label: "Orders", icon: ShoppingBag },
    { href: "/restaurant/customers", label: "Customers", icon: Users },
    { href: "/restaurant/menu", label: "Menu", icon: UtensilsCrossed },
  ];

  const restaurantName = user?.restaurantName ?? "My Restaurant";
  const initials = restaurantName.slice(0, 2).toUpperCase();

  const pageTitle = navItems.find((i) => i.href === location)?.label ?? "Dashboard";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside className="w-72 hidden md:flex flex-col border-r border-orange-500/10 relative z-10 h-screen sticky top-0 flex-shrink-0 bg-card">

        <div className="h-20 flex items-center px-6 border-b border-orange-500/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)" }}>
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">Restaurant</p>
              <p className="text-xs font-semibold" style={{ color: "#f97316" }}>Portal</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <p className="px-4 text-xs font-semibold uppercase tracking-wider mb-4 text-orange-500/60">
            Navigation
          </p>
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "font-semibold bg-orange-500/15 text-orange-500 border border-orange-500/25"
                    : "font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-orange-500/10">
          <div className="rounded-2xl p-4 flex items-center gap-3 border border-orange-500/15 bg-orange-500/8">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)" }}>
              <span className="font-bold text-white text-sm">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{restaurantName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-orange-500/10 text-muted-foreground hover:text-foreground"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={logout}
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[128px] pointer-events-none"
          style={{ background: "rgba(249,115,22,0.05)" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[128px] pointer-events-none"
          style={{ background: "rgba(239,68,68,0.04)" }} />

        <header className="h-20 flex items-center justify-between px-8 border-b border-orange-500/10 sticky top-0 z-20 backdrop-blur-md bg-background/80">
          <div>
            <h2 className="text-xl font-bold text-foreground">{pageTitle}</h2>
            <p className="text-xs text-orange-500/70">{restaurantName}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium"
              style={{ borderColor: "rgba(249,115,22,0.2)", color: "#f97316", background: "rgba(249,115,22,0.08)" }}>
              <Star className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
              Live
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 z-10 relative">
          {children}
        </div>
      </main>
    </div>
  );
}
