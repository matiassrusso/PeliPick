import { FormEvent, useState } from "react";

export type AuthSession = {
  token: string;
  username: string;
};

type AuthProps = {
  apiBaseUrl: string;
  onAuthenticated: (session: AuthSession) => void;
};

export default function Auth({ apiBaseUrl, onAuthenticated }: AuthProps) {
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
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const body = (await response.json().catch(() => null)) as
        | { token?: string; username?: string; detail?: string }
        | null;

      if (!response.ok || !body?.token) {
        throw new Error(body?.detail ?? "No pude autenticarte.");
      }

      onAuthenticated({ token: body.token, username: body.username ?? username });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falló la autenticación.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel-copy">
        <h2>{mode === "login" ? "Entrá a tu cuenta" : "Creá tu cuenta"}</h2>
        <p>
          Necesitamos un usuario para guardar tu historial, tus recomendaciones y tu
          feedback.
        </p>
      </div>

      <form className="taste-form" onSubmit={handleSubmit}>
        <label>
          Usuario
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            minLength={3}
            required
          />
        </label>

        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Un momento..." : mode === "login" ? "Entrar" : "Crear cuenta"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
          }}
        >
          {mode === "login" ? "¿No tenés cuenta? Registrate" : "¿Ya tenés cuenta? Entrá"}
        </button>
      </form>

      {error ? <p className="error-banner">{error}</p> : null}
    </section>
  );
}
