import { motion, useScroll, useTransform } from "framer-motion";
import { Film } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

import { PageTransition } from "@/components/PageTransition";
import { API_BASE_URL, useAuth } from "@/hooks/useAuth";

type Recommendation = {
  id: number;
  title: string;
  year: number;
  kind: string;
  why: string;
  match_score: number;
  poster_path: string | null;
  backdrop_path: string | null;
};

type RecommendationSession = {
  id: number;
  recommendations: Recommendation[];
};

const STEPS = [
  {
    number: "01",
    title: "Subí tu export de Letterboxd",
    desc: "Settings → Data → Export en Letterboxd. Subí tu ratings.csv o reviews.csv acá.",
  },
  {
    number: "02",
    title: "Leemos tus ratings y reviews",
    desc: "Buscamos patrones de tono, ritmo y sensibilidad en lo que venís premiando o rechazando.",
  },
  {
    number: "03",
    title: "Recibís picks con razón",
    desc: "Cada recomendación viene con una explicación basada en tu propio historial, no en un ranking genérico.",
  },
];

const MARQUEE_DIRECTORS = [
  "Tarkovsky", "Wong Kar-wai", "Chantal Akerman", "Bela Tarr", "Lynne Ramsay",
  "Apichatpong", "Kelly Reichardt", "Hong Sang-soo", "Claire Denis", "Kiyoshi Kurosawa",
];

export default function Home() {
  const { isAuthenticated, token } = useAuth();
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, -80]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0.3]);
  const [latestSession, setLatestSession] = useState<RecommendationSession | null>(null);

  const ctaHref = isAuthenticated ? "/recommend" : "/login";
  const ctaLabel = isAuthenticated ? "Ir a mis recomendaciones" : "Empezar gratis";

  useEffect(() => {
    if (!token) {
      setLatestSession(null);
      return;
    }

    let cancelled = false;
    fetch(`${API_BASE_URL}/history`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { sessions: RecommendationSession[] } | null) => {
        if (!cancelled) setLatestSession(body?.sessions[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setLatestSession(null);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const currentPicks = latestSession?.recommendations.slice(0, 3) ?? [];

  return (
    <PageTransition>
      {/* Hero — cinematic, layered */}
      <section className="relative overflow-hidden border-b-2 border-foreground min-h-[92vh] flex items-end pb-16 pt-24">
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="orb bg-accent size-[42vw] top-[-8vw] left-[-6vw]" />
          <div className="orb bg-foreground/40 dark:bg-accent/50 size-[35vw] bottom-[-10vw] right-[-8vw]" style={{ animationDelay: "-6s" }} />
          <div className="orb bg-accent/40 size-[22vw] top-[30%] right-[20%]" style={{ animationDelay: "-12s" }} />
          <div className="grain-layer" />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="max-w-7xl mx-auto px-6 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-10 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground"
          >
            <span className="size-2 bg-accent rounded-full animate-pulse" />
            <span>Basado en tu historial de Letterboxd</span>
          </motion.div>

          <h1 className="text-[15vw] md:text-[11vw] font-black tracking-tighter leading-[0.85] uppercase mb-10">
            {["Pelis que", "te", "conocen."].map((word, i) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 80, rotateX: -60 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.9, delay: 0.1 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                className={`inline-block mr-6 origin-bottom ${i === 1 ? "text-accent italic font-serif normal-case tracking-normal" : ""}`}
                style={{ transformStyle: "preserve-3d" }}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="max-w-md font-mono text-xs uppercase leading-relaxed text-muted-foreground"
            >
              [Teoría] Subí tu export de Letterboxd. Leemos tus ratings, tus reviews, tus
              patrones. Después recomendamos con explicaciones basadas en tu gusto real,
              no en un ranking genérico.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="flex flex-col items-start md:items-end gap-3"
            >
              <span className="font-mono text-[10px] uppercase text-muted-foreground">
                Sync con Letterboxd →
              </span>
              <Link
                href={ctaHref}
                className="group relative overflow-hidden px-10 py-4 bg-foreground text-background font-mono text-xs uppercase tracking-widest transition-transform hover:-translate-y-0.5"
              >
                <span className="relative z-10">{ctaLabel}</span>
                <span className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <span className="relative z-10 ml-2 inline-block group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Marquee — directors ticker */}
      <div className="border-b-2 border-foreground bg-foreground text-background py-5 overflow-hidden">
        <div className="flex gap-16 whitespace-nowrap animate-marquee font-serif italic text-2xl md:text-3xl">
          {[...MARQUEE_DIRECTORS, ...MARQUEE_DIRECTORS].map((name, i) => (
            <span key={i} className="flex items-center gap-16">
              {name}
              <span className="text-accent">✦</span>
            </span>
          ))}
        </div>
      </div>

      {currentPicks.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-24 border-b-2 border-foreground">
          <div className="flex items-baseline gap-4 mb-10">
            <span className="font-mono text-xs px-2 py-1 border border-foreground/20">[Current picks]</span>
            <div className="h-px flex-grow bg-foreground/10" />
            <Link
              href="/history"
              className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              Ver todo →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentPicks.map((rec) => (
              <article key={rec.id}>
                <div className="mb-4 relative overflow-hidden">
                  {rec.poster_path ?? rec.backdrop_path ? (
                    <img
                      src={rec.poster_path ?? rec.backdrop_path ?? undefined}
                      alt={rec.title}
                      className="w-full aspect-[2/3] object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-secondary flex items-center justify-center">
                      <Film className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-accent text-accent-foreground font-mono text-xs font-bold">
                    {rec.match_score}%
                  </div>
                </div>
                <h3 className="text-lg font-black uppercase tracking-tighter leading-none mb-1">{rec.title}</h3>
                <p className="font-mono text-[10px] text-muted-foreground mb-2">
                  {rec.year}
                  {rec.kind === "series" ? " · Serie" : ""}
                </p>
                <p className="font-serif text-sm italic leading-snug">&ldquo;{rec.why}&rdquo;</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <div id="how-it-works" className="max-w-7xl mx-auto px-6">
        {/* Methodology */}
        <section className="py-24 grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-4">
            <motion.h2
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-5xl font-black uppercase tracking-tighter mb-4"
            >
              La metodología
            </motion.h2>
            <p className="font-mono text-xs uppercase leading-relaxed text-muted-foreground">
              Detrás de cada elección hay un patrón rastreable en tu historial — nunca un
              ranking global.
            </p>
          </div>
          <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="space-y-4"
              >
                <div className="font-mono text-xl font-bold text-accent">[{step.number}]</div>
                <h4 className="text-sm font-bold uppercase tracking-widest">{step.title}</h4>
                <p className="text-sm leading-relaxed text-foreground/80">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 border-t-2 border-foreground text-center">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6">
            ¿Lista tu próxima{" "}
            <span className="text-accent italic font-serif normal-case tracking-normal">peli?</span>
          </h2>
          <p className="font-mono text-xs uppercase text-muted-foreground mb-10 max-w-xl mx-auto">
            Subí tu historial y recibí recomendaciones personalizadas en menos de un minuto.
          </p>
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 px-10 py-4 bg-accent text-accent-foreground font-mono text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
          >
            {ctaLabel} →
          </Link>
        </section>
      </div>
    </PageTransition>
  );
}
