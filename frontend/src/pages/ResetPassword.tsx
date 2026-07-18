import { FormEvent, useState } from "react";
import { useLocation } from "wouter";

import { PageTransition } from "@/components/PageTransition";
import { API_BASE_URL } from "@/hooks/useAuth";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") ?? "";
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail ?? "No pude cambiar tu contraseña.");
      }

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falló el cambio de contraseña.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageTransition>
      <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-12">
        <div className="w-full max-w-sm space-y-8">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              [Recuperación]
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter">
              {done ? "Contraseña actualizada" : "Elegí una nueva contraseña"}
            </h2>
          </div>

          {!token && !done && (
            <div className="p-4 border-2 border-destructive/50 font-mono text-xs text-destructive">
              Este link no tiene un token válido. Pedí uno nuevo desde el login.
            </div>
          )}

          {done ? (
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full py-4 bg-foreground text-background font-mono text-xs uppercase tracking-widest hover:bg-accent transition-colors"
            >
              Ir a entrar →
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Nueva password
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                  className="mt-2 w-full bg-transparent border-b-2 border-foreground py-3 font-mono focus:outline-none focus:border-accent"
                />
              </label>

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full py-4 bg-foreground text-background font-mono text-xs uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-60"
              >
                {loading ? "..." : "Cambiar contraseña →"}
              </button>

              {error ? (
                <div className="p-4 border-2 border-destructive/50 font-mono text-xs text-destructive">
                  {error}
                </div>
              ) : null}
            </form>
          )}
        </div>
      </main>
    </PageTransition>
  );
}
