import { AlertCircle, ArrowRight, Loader2, LogIn } from "lucide-react";
import { FormEvent, useState } from "react";
import { useLocation } from "wouter";

import { Navbar } from "@/components/Navbar";
import { PageTransition } from "@/components/PageTransition";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const { login, register } = useAuth();
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await register(username, password);
      }
      navigate("/recommend");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falló la autenticación.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageTransition className="min-h-screen bg-background film-grain">
      <Navbar />

      <div className="min-h-screen flex items-center justify-center pt-16 px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
              <LogIn className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-serif mb-2" style={{ fontFamily: "'Instrument Serif', serif" }}>
              {mode === "login" ? "Entrá a tu cuenta" : "Creá tu cuenta"}
            </h1>
            <p className="text-muted-foreground text-sm">
              Necesitamos un usuario para guardar tu historial y tus recomendaciones.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm text-muted-foreground mb-1.5 block">Usuario</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                minLength={3}
                required
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors duration-200"
              />
            </label>

            <label className="block">
              <span className="text-sm text-muted-foreground mb-1.5 block">Contraseña</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors duration-200"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-xl font-medium hover:bg-primary/90 transition-all duration-200 active:scale-95 disabled:opacity-60 amber-glow"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Entrar" : "Crear cuenta"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 py-2"
            >
              {mode === "login" ? "¿No tenés cuenta? Registrate" : "¿Ya tenés cuenta? Entrá"}
            </button>
          </form>

          {error ? (
            <div className="mt-4 p-4 rounded-xl border border-destructive/30 bg-destructive/5 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : null}
        </div>
      </div>
    </PageTransition>
  );
}
