import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Auth, { AuthSession } from "./Auth";

type Recommendation = {
  id: number;
  title: string;
  year: number;
  kind: string;
  why: string;
  match_score: number;
  tags: string[];
};

type RecommendResponse = {
  taste_summary: string;
  recommendations: Recommendation[];
};

type FeedbackStatus = "interested" | "not_interested" | "seen" | "error";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8001";
const AUTH_STORAGE_KEY = "pelipick_auth";
const starterCsv = `Name,Rating,Review
La La Land,4.5,romance with style and emotional rhythm
Enemy,4.0,psychological and weird in a good way
Transformers,1.5,too loud and empty`;
const workflowSteps = [
  {
    title: "Leemos tu historial",
    body: "Tomamos ratings y reviews, no solo géneros sueltos o popularidad.",
  },
  {
    title: "Armamos tu mapa",
    body: "Buscamos tono, ritmo, riesgo, sensibilidad y cosas que venís castigando.",
  },
  {
    title: "Te damos picks útiles",
    body: "No una lista infinita: unos pocos títulos con razón concreta para hoy.",
  },
];
const tasteSignals = [
  "Ritmo",
  "Oscuridad",
  "Rareza",
  "Intimidad",
  "Humor",
  "Mainstream vs autoral",
];
const feedbackOptions: { status: "interested" | "not_interested" | "seen"; label: string }[] = [
  { status: "interested", label: "Me interesa" },
  { status: "not_interested", label: "No me interesa" },
  { status: "seen", label: "Ya la vi" },
];

export default function App() {
  const [auth, setAuth] = useState<AuthSession | null>(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as AuthSession) : null;
  });
  const [mood, setMood] = useState("psychological");
  const [csvContent, setCsvContent] = useState(starterCsv);
  const [importedCount, setImportedCount] = useState(() => countRows(starterCsv));
  const [result, setResult] = useState<RecommendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [feedbackState, setFeedbackState] = useState<Record<number, FeedbackStatus>>({});

  useEffect(() => {
    if (auth) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [auth]);

  async function handleLogout() {
    if (auth) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
      }).catch(() => undefined);
    }
    setAuth(null);
    setResult(null);
    setFeedbackState({});
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const text = await file.text();
    setCsvContent(text);
    setImportedCount(countRows(text));
    setResult(null);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!auth) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/recommend/csv`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          mood,
          csv_content: csvContent,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(body?.detail ?? "No pude hablar con el backend.");
      }

      const data = (await response.json()) as RecommendResponse;
      if (!data.recommendations.length) {
        throw new Error("No pude leer ratings válidos de ese CSV.");
      }

      setResult(data);
      setFeedbackState({});
      setImportedCount(countRows(csvContent));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falló la recomendación.");
    } finally {
      setLoading(false);
    }
  }

  async function submitFeedback(
    recommendationId: number,
    status: "interested" | "not_interested" | "seen",
  ) {
    if (!auth) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ recommendation_id: recommendationId, status }),
      });

      if (!response.ok) {
        throw new Error();
      }

      setFeedbackState((prev) => ({ ...prev, [recommendationId]: status }));
    } catch {
      setFeedbackState((prev) => ({ ...prev, [recommendationId]: "error" }));
    }
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Taste engine para cinéfilos cansados del algoritmo obvio</p>
          <h1>Subí tu historial y te digo qué ver con criterio.</h1>
          <p className="lede">
            Ya no uso un historial hardcodeado: podés pegar o subir un CSV simple estilo export de
            Letterboxd para probar el flujo real.
          </p>
        </div>

        <aside className="hero-note">
          <span className="hero-note-label">Qué debería sentirse acá</span>
          <p>
            "No me tiró cinco títulos random. Entendió que me gusta lo psicológico, pero no el
            ruido vacío."
          </p>
        </aside>
      </section>

      <section className="workflow">
        {workflowSteps.map((step, index) => (
          <article className="workflow-card" key={step.title}>
            <span className="workflow-index">0{index + 1}</span>
            <h2>{step.title}</h2>
            <p>{step.body}</p>
          </article>
        ))}
      </section>

      {!auth ? (
        <Auth apiBaseUrl={API_BASE_URL} onAuthenticated={setAuth} />
      ) : (
        <>
          <div className="import-badge">
            Sesión: {auth.username}{" "}
            <button type="button" onClick={handleLogout}>
              Salir
            </button>
          </div>

          <section className="panel">
            <div className="panel-copy">
              <h2>Cargá tu historial</h2>
              <p>
                El backend acepta columnas tipo <code>Name</code>, <code>Rating</code> y{" "}
                <code>Review</code>. Si después cambian nombres de columnas, lo extendemos.
              </p>
              <div className="import-badge">{importedCount} filas detectadas</div>
              <ul className="panel-notes">
                <li>Primero importa por CSV simple, no por scraping.</li>
                <li>Hoy el objetivo es validar calidad del pick, no automatización total.</li>
                <li>Si tu export tiene columnas raras, lo endurecemos en la próxima pasada.</li>
              </ul>
            </div>

            <form className="taste-form" onSubmit={handleSubmit}>
              <label>
                Qué querés hoy
                <select value={mood} onChange={(event) => setMood(event.target.value)}>
                  <option value="psychological">Algo psicológico</option>
                  <option value="romance">Algo romántico</option>
                  <option value="funny">Algo liviano</option>
                  <option value="action">Algo con energía</option>
                  <option value="slow">Algo calmo</option>
                </select>
              </label>

              <label>
                CSV de ratings
                <input type="file" accept=".csv,text/csv" onChange={handleFileChange} />
              </label>

              <label>
                O pegalo acá
                <textarea
                  rows={8}
                  value={csvContent}
                  onChange={(event) => {
                    setCsvContent(event.target.value);
                    setImportedCount(countRows(event.target.value));
                  }}
                />
              </label>

              <button type="submit" disabled={loading}>
                {loading ? "Pensando..." : "Dame picks"}
              </button>
            </form>
          </section>
        </>
      )}

      <section className="sample-block">
        <h3>Formato esperado</h3>
        <div className="sample-grid">
          <article className="sample-card">
            <strong>CSV mínimo</strong>
            <p>
              <code>Name,Rating,Review</code>
              <br />
              <code>Perfect Blue,4.5,psychological and dark</code>
            </p>
          </article>
          <article className="sample-card">
            <strong>Ratings aceptados</strong>
            <p>Soporta `4.5` y también formato de estrellas tipo `★★★★½`.</p>
          </article>
          <article className="sample-card">
            <strong>Limitación actual</strong>
            <p>No parsea todavía exportes raros ni múltiples archivos de Letterboxd.</p>
          </article>
        </div>
      </section>

      <section className="signals">
        <div className="results-header">
          <h2>Qué señales queremos entender</h2>
          <p>
            La gracia del producto no es adivinar tu género favorito. Es captar el tipo de
            sensibilidad que venís premiando o rechazando.
          </p>
        </div>
        <ul className="signal-row">
          {tasteSignals.map((signal) => (
            <li key={signal}>{signal}</li>
          ))}
        </ul>
      </section>

      {error ? <p className="error-banner">{error}</p> : null}

      {result ? (
        <section className="results">
          <div className="results-header">
            <h2>Tu mapa de gusto</h2>
            <p>{result.taste_summary}</p>
          </div>

          <div className="recommendation-grid">
            {result.recommendations.map((item) => (
              <article className="recommendation-card" key={item.id}>
                <div className="card-topline">
                  <span>{item.kind === "series" ? "Serie" : "Película"}</span>
                  <span>{item.match_score}% match</span>
                </div>
                <h3>
                  {item.title} <em>({item.year})</em>
                </h3>
                <p>{item.why}</p>
                <ul className="tag-row">
                  {item.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>

                {feedbackState[item.id] && feedbackState[item.id] !== "error" ? (
                  <p className="card-topline">Gracias, guardamos tu feedback.</p>
                ) : (
                  <div className="panel-notes">
                    {feedbackOptions.map((option) => (
                      <button
                        key={option.status}
                        type="button"
                        onClick={() => submitFeedback(item.id, option.status)}
                      >
                        {option.label}
                      </button>
                    ))}
                    {feedbackState[item.id] === "error" ? (
                      <span className="card-topline">No se pudo guardar, probá de nuevo.</span>
                    ) : null}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function countRows(content: string): number {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.length > 1 ? lines.length - 1 : 0;
}
