import { Link, useLocation } from "wouter";
import { ThemeToggle } from "./theme-toggle";
import { BookOpen, CalendarDays, PenLine, Star, LayoutGrid, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useQueryClient } from "@tanstack/react-query";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const queryClient = useQueryClient();

  function handleLogout() {
    queryClient.clear();
    logout();
  }

  const navItems = [
    { href: "/", icon: PenLine, label: "Today", active: location === "/" },
    { href: "/journal", icon: BookOpen, label: "Journal", active: location.startsWith("/journal") },
    { href: "/favorites", icon: Star, label: "Favorites", active: location === "/favorites" },
    { href: "/week", icon: LayoutGrid, label: "Week", active: location === "/week" },
    { href: "/calendar", icon: CalendarDays, label: "Calendar", active: location === "/calendar" },
    { href: "/settings", icon: Settings, label: "Settings", active: location === "/settings" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col selection:bg-primary/20">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-2xl">
          <Link href="/" className="flex items-center gap-2 text-primary">
            <span className="font-serif text-2xl font-semibold tracking-tight">Grateful</span>
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map(({ href, icon: Icon, label, active }) => (
              <Link key={href} href={href}>
                <div
                  title={label}
                  className={`p-2 rounded-full transition-colors flex items-center justify-center ${
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </Link>
            ))}
            <div className="w-px h-6 bg-border mx-1" />
            <ThemeToggle />
            {user && (
              <button
                onClick={handleLogout}
                title={`Sign out (${user.email})`}
                className="p-2 rounded-full transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 w-full max-w-2xl mx-auto p-4 sm:p-6 md:p-8 flex flex-col">
        {children}
      </main>
    </div>
  );
}
