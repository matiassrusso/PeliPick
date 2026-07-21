import { useEffect, useState } from "react";

import { API_BASE_URL } from "@/hooks/useAuth";

type CatalogStats = { movies: number; series: number; genres: number };

const compactNumber = new Intl.NumberFormat("en", { notation: "compact" });

export function Footer() {
  const [stats, setStats] = useState<CatalogStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/catalog/stats`)
      .then((response) => (response.ok ? response.json() : null))
      .then((body: CatalogStats | null) => {
        if (!cancelled) setStats(body);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <footer className="bg-foreground text-background mt-24 px-6 py-12">
      <div className="container flex flex-col md:flex-row justify-between items-start gap-12">
        <div className="space-y-8">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest opacity-70">
            <span>Butaca</span>
            <span className="opacity-40">—</span>
            <span>para el que mira con criterio</span>
          </div>

          {stats && (
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest opacity-50 mb-3">
                Catalog statistics
              </div>
              <div className="flex gap-10">
                <div>
                  <div className="text-2xl font-black">{compactNumber.format(stats.movies)}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest opacity-50">Películas</div>
                </div>
                <div>
                  <div className="text-2xl font-black">{compactNumber.format(stats.series)}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest opacity-50">Series</div>
                </div>
                <div>
                  <div className="text-2xl font-black">{stats.genres}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest opacity-50">Géneros</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="text-right space-y-3">
          <div className="font-serif italic text-lg opacity-80 max-w-sm">
            "Cinema is a matter of what's in the frame and what's out."
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest opacity-40">
            — Martin Scorsese
          </div>
          <p className="font-mono text-[10px] uppercase tracking-widest opacity-50">
            Datos de películas por{" "}
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-100 transition-opacity"
            >
              TMDB
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
