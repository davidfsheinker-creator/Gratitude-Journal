import { Link, useLocation } from "wouter";
import { ThemeToggle } from "./theme-toggle";
import { BookOpen, Calendar, PenLine } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col selection:bg-primary/20">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-2xl">
          <Link href="/" className="flex items-center gap-2 text-primary">
            <span className="font-serif text-2xl font-semibold tracking-tight">Grateful</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link href="/">
              <div className={`p-2 rounded-full transition-colors flex items-center justify-center ${location === "/" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}>
                <PenLine className="w-5 h-5" />
              </div>
            </Link>
            <Link href="/journal">
              <div className={`p-2 rounded-full transition-colors flex items-center justify-center ${location.startsWith("/journal") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}>
                <BookOpen className="w-5 h-5" />
              </div>
            </Link>
            <Link href="/week">
              <div className={`p-2 rounded-full transition-colors flex items-center justify-center ${location === "/week" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}>
                <Calendar className="w-5 h-5" />
              </div>
            </Link>
            <div className="w-px h-6 bg-border mx-1" />
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main className="flex-1 w-full max-w-2xl mx-auto p-4 sm:p-6 md:p-8 flex flex-col">
        {children}
      </main>
    </div>
  );
}
