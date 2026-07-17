import { Link, useLocation } from "wouter";

import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

const NAV_ITEMS = [
  { label: "Recommend", href: "/recommend" },
  { label: "Archive", href: "/history" },
  { label: "Profile", href: "/profile" },
];

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();

  const linkCls = (href: string) =>
    `hover:text-accent transition-colors ${location === href ? "text-accent" : ""}`;

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-background/70 backdrop-blur-xl border-b border-foreground/5">
      <Link to="/" className="font-mono text-xs tracking-widest font-medium uppercase">
        PeliPick <span className="text-accent">//</span> Cineclub
      </Link>

      <div className="flex gap-8 font-mono text-[10px] tracking-widest uppercase items-center">
        {isAuthenticated &&
          NAV_ITEMS.map((item) => (
            <Link key={item.href} to={item.href} className={linkCls(item.href)}>
              {item.label}
            </Link>
          ))}

        <ThemeToggle />

        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-muted-foreground normal-case tracking-normal">
              {user?.username}
            </span>
            <button
              onClick={() => logout()}
              className="px-3 py-2 border border-foreground/20 hover:bg-foreground hover:text-background transition-colors"
            >
              Salir
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="px-3 py-2 border border-foreground/20 hover:bg-foreground hover:text-background transition-colors"
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
