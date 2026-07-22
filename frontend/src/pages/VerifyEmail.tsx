import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

import { PageTransition } from "@/components/PageTransition";
import { API_BASE_URL } from "@/hooks/useAuth";

type Status = "verifying" | "done" | "error";

export default function VerifyEmail() {
  const [, navigate] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") ?? "";
  const [status, setStatus] = useState<Status>(token ? "verifying" : "error");
  const [error, setError] = useState(token ? "" : "Este link no tiene un token válido.");
  // StrictMode double-invokes effects in dev; the token is single-use, so the
  // second call would 400 and flip a real success to error
  const ran = useRef(false);

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;

    fetch(`${API_BASE_URL}/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.detail ?? "No pude verificar tu email.");
        }
        setStatus("done");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Falló la verificación.");
        setStatus("error");
      });
  }, [token]);

  return (
    <PageTransition>
      <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-12">
        <div className="w-full max-w-sm space-y-8">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              [Verificación de email]
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter">
              {status === "done" ? "Email confirmado" : status === "error" ? "No se pudo verificar" : "Verificando…"}
            </h2>
          </div>

          {status === "verifying" && (
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Un segundo…
            </p>
          )}

          {status === "error" && (
            <div className="p-4 border-2 border-destructive/50 font-mono text-xs text-destructive">
              {error} Pedí uno nuevo desde el banner en la app.
            </div>
          )}

          {status !== "verifying" && (
            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-full py-4 bg-foreground text-background font-mono text-xs uppercase tracking-widest hover:bg-accent transition-colors"
            >
              Ir al inicio →
            </button>
          )}
        </div>
      </main>
    </PageTransition>
  );
}
