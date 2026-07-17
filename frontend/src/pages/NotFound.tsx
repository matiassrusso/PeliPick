import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <h1 className="text-7xl font-black uppercase tracking-tighter mb-4">
          40<span className="text-accent italic font-serif normal-case tracking-normal">4</span>
        </h1>
        <h2 className="font-mono text-xs uppercase tracking-widest mb-4">Esta página no existe</h2>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          Puede que se haya movido o que el link esté roto.
        </p>
        <button
          onClick={() => setLocation("/")}
          className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background font-mono text-xs uppercase tracking-widest hover:bg-accent transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
