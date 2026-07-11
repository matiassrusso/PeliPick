import { Film, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background film-grain px-6">
      <div className="w-full max-w-md text-center p-8 rounded-2xl border border-border bg-card/50">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
          <Film className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-5xl font-serif mb-2" style={{ fontFamily: "'Instrument Serif', serif" }}>
          404
        </h1>
        <h2 className="text-lg font-medium mb-4">Esta página no existe</h2>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Puede que se haya movido o que el link esté roto.
        </p>
        <button
          onClick={() => setLocation("/")}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-all duration-200 active:scale-95"
        >
          <Home className="w-4 h-4" />
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
