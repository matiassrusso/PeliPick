import { Compass, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

import { Navbar } from "@/components/Navbar";
import { PageTransition } from "@/components/PageTransition";
import { API_BASE_URL, useAuth } from "@/hooks/useAuth";

type GenreWeight = { genre: string; weight: number };
type DecadeCount = { decade: number; count: number };
type PersonCount = { name: string; count: number };

type TasteProfile = {
  matched_count: number;
  total_count: number;
  genre_breakdown: GenreWeight[];
  decade_breakdown: DecadeCount[];
  top_directors: PersonCount[];
  top_actors: PersonCount[];
};

const RADAR_SIZE = 320;
const RADAR_CENTER = RADAR_SIZE / 2;
const RADAR_RADIUS = 110;

function GenreRadar({ genres }: { genres: GenreWeight[] }) {
  const axisCount = genres.length;
  const maxWeight = Math.max(...genres.map((g) => g.weight), 1);

  const pointFor = (index: number, fraction: number) => {
    const angle = (Math.PI * 2 * index) / axisCount - Math.PI / 2;
    return {
      x: RADAR_CENTER + Math.cos(angle) * RADAR_RADIUS * fraction,
      y: RADAR_CENTER + Math.sin(angle) * RADAR_RADIUS * fraction,
    };
  };

  const dataPoints = genres.map((g, i) => pointFor(i, g.weight / maxWeight));
  const dataPath = `${dataPoints.map((p) => `${p.x},${p.y}`).join(" ")}`;

  return (
    <svg viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`} className="w-full max-w-md mx-auto">
      {[0.33, 0.66, 1].map((ring) => (
        <polygon
          key={ring}
          points={genres.map((_, i) => {
            const p = pointFor(i, ring);
            return `${p.x},${p.y}`;
          }).join(" ")}
          fill="none"
          stroke="var(--border)"
          strokeWidth={1}
        />
      ))}

      {genres.map((_, i) => {
        const edge = pointFor(i, 1);
        return (
          <line
            key={i}
            x1={RADAR_CENTER}
            y1={RADAR_CENTER}
            x2={edge.x}
            y2={edge.y}
            stroke="var(--border)"
            strokeWidth={1}
          />
        );
      })}

      <polygon points={dataPath} fill="var(--primary)" fillOpacity={0.25} stroke="var(--primary)" strokeWidth={2} />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="var(--primary)" />
      ))}

      {genres.map((g, i) => {
        const label = pointFor(i, 1.28);
        const anchor = Math.abs(label.x - RADAR_CENTER) < 4 ? "middle" : label.x > RADAR_CENTER ? "start" : "end";
        return (
          <text
            key={g.genre}
            x={label.x}
            y={label.y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize={12}
            fill="var(--muted-foreground)"
          >
            {g.genre}
          </text>
        );
      })}
    </svg>
  );
}

function DecadeHeatmap({ decades }: { decades: DecadeCount[] }) {
  const maxCount = Math.max(...decades.map((d) => d.count), 1);

  return (
    <div className="flex flex-wrap gap-3">
      {decades.map((d) => {
        const pct = Math.round((d.count / maxCount) * 100);
        return (
          <div
            key={d.decade}
            className="rounded-xl border border-border px-4 py-3 text-center min-w-[84px]"
            style={{ backgroundColor: `color-mix(in oklch, var(--primary) ${Math.max(pct, 12)}%, transparent)` }}
          >
            <p className="text-sm font-medium">{d.decade}s</p>
            <p className="text-xs text-muted-foreground">{d.count}</p>
          </div>
        );
      })}
    </div>
  );
}

function PeopleList({ people }: { people: PersonCount[] }) {
  const maxCount = Math.max(...people.map((p) => p.count), 1);

  return (
    <ul className="space-y-2">
      {people.map((p) => (
        <li key={p.name} className="flex items-center gap-3">
          <span className="text-sm w-32 shrink-0 truncate" title={p.name}>
            {p.name}
          </span>
          <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${(p.count / maxCount) * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground w-6 text-right">{p.count}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Profile() {
  const { isAuthenticated, loading: authLoading, token } = useAuth();
  const [, navigate] = useLocation();
  const [profile, setProfile] = useState<TasteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    fetch(`${API_BASE_URL}/profile/taste`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.detail ?? "No pude armar tu perfil de gusto.");
        }
        return response.json();
      })
      .then((body: TasteProfile) => {
        if (!cancelled) setProfile(body);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "No pude armar tu perfil de gusto.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasProfile = profile && profile.matched_count > 0;

  return (
    <PageTransition className="min-h-screen bg-background film-grain">
      <Navbar />

      <div className="pt-24 pb-16">
        <div className="container max-w-5xl">
          <div className="mb-10">
            <p className="text-primary text-sm uppercase tracking-widest mb-3 font-medium">
              Tu archivo
            </p>
            <h1
              className="text-4xl md:text-5xl font-serif mb-4"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Perfil de <em className="text-gradient not-italic">gusto</em>
            </h1>
            <p className="text-muted-foreground leading-relaxed max-w-2xl">
              Géneros, décadas y nombres que se repiten en lo que ya viste, armado a partir de
              tu historial cruzado contra TMDb.
            </p>
          </div>

          {loading && (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Cruzando tu historial con TMDb...</p>
            </div>
          )}

          {!loading && error && (
            <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-sm text-destructive">
              {error}
            </div>
          )}

          {!loading && !error && !hasProfile && (
            <div className="p-8 rounded-2xl border border-border bg-card/40 text-center">
              <Compass className="w-8 h-8 text-primary mx-auto mb-4" />
              <h2
                className="text-2xl font-serif mb-2"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                Todavía no hay suficiente para armar tu perfil
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                Subí tu export de Letterboxd desde la pantalla de recomendaciones para que
                podamos cruzarlo con TMDb.
              </p>
              <button
                onClick={() => navigate("/recommend")}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Ir a recomendar
              </button>
            </div>
          )}

          {!loading && !error && hasProfile && profile && (
            <div className="space-y-8">
              {profile.matched_count < profile.total_count && (
                <p className="text-xs text-muted-foreground">
                  Matcheamos {profile.matched_count} de {profile.total_count} títulos vistos
                  contra TMDb (priorizando los mejor puntuados).
                </p>
              )}

              {profile.genre_breakdown.length > 0 && (
                <section className="rounded-2xl border border-border bg-card/40 p-6">
                  <h2
                    className="text-2xl font-serif mb-1"
                    style={{ fontFamily: "'Instrument Serif', serif" }}
                  >
                    Géneros
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Pesado por cómo puntuaste cada título, no solo por cuántos viste.
                  </p>
                  <GenreRadar genres={profile.genre_breakdown} />
                </section>
              )}

              {profile.decade_breakdown.length > 0 && (
                <section className="rounded-2xl border border-border bg-card/40 p-6">
                  <h2
                    className="text-2xl font-serif mb-1"
                    style={{ fontFamily: "'Instrument Serif', serif" }}
                  >
                    Décadas
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    De qué época son las películas y series que más viste.
                  </p>
                  <DecadeHeatmap decades={profile.decade_breakdown} />
                </section>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                {profile.top_directors.length > 0 && (
                  <section className="rounded-2xl border border-border bg-card/40 p-6">
                    <h2
                      className="text-2xl font-serif mb-4"
                      style={{ fontFamily: "'Instrument Serif', serif" }}
                    >
                      Directores
                    </h2>
                    <PeopleList people={profile.top_directors} />
                  </section>
                )}

                {profile.top_actors.length > 0 && (
                  <section className="rounded-2xl border border-border bg-card/40 p-6">
                    <h2
                      className="text-2xl font-serif mb-4"
                      style={{ fontFamily: "'Instrument Serif', serif" }}
                    >
                      Actores
                    </h2>
                    <PeopleList people={profile.top_actors} />
                  </section>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
