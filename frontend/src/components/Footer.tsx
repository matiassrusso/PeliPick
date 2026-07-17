export function Footer() {
  return (
    <footer className="bg-foreground text-background mt-24 px-6 py-12">
      <div className="container flex flex-col md:flex-row justify-between items-start gap-12">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest opacity-70">
          <span>PeliPick</span>
          <span className="opacity-40">—</span>
          <span>para el que mira con criterio</span>
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
