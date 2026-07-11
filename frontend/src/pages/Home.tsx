import { motion } from "framer-motion";
import { ArrowRight, Film, Sparkles, Star, Upload } from "lucide-react";
import { Link } from "wouter";

import { Navbar } from "@/components/Navbar";
import { PageTransition } from "@/components/PageTransition";
import { useAuth } from "@/hooks/useAuth";

const HERO_POSTERS = [
  { id: 1, title: "Mulholland Drive", color: "#1a0a2e", angle: -15, z: -60, x: -280, y: 40 },
  { id: 2, title: "2001: A Space Odyssey", color: "#0a1a2e", angle: 8, z: -40, x: -140, y: -20 },
  { id: 3, title: "Parasite", color: "#1a2e0a", angle: -5, z: 0, x: 0, y: 0 },
  { id: 4, title: "Blade Runner 2049", color: "#2e1a0a", angle: 12, z: -40, x: 140, y: 20 },
  { id: 5, title: "The Godfather", color: "#2e0a0a", angle: -10, z: -60, x: 280, y: -40 },
];

const STEPS = [
  {
    icon: Upload,
    number: "01",
    title: "Subí tu export de Letterboxd",
    desc: "Settings → Data → Export en Letterboxd. Subí tu ratings.csv o reviews.csv acá.",
  },
  {
    icon: Film,
    number: "02",
    title: "Leemos tus ratings y reviews",
    desc: "Buscamos patrones de tono, ritmo y sensibilidad en lo que venís premiando o rechazando.",
  },
  {
    icon: Sparkles,
    number: "03",
    title: "Recibís picks con razón",
    desc: "Cada recomendación viene con una explicación basada en tu propio historial, no en un ranking genérico.",
  },
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  const ctaHref = isAuthenticated ? "/recommend" : "/login";
  const ctaLabel = isAuthenticated ? "Ir a mis recomendaciones" : "Empezar gratis";

  return (
    <PageTransition className="film-grain min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 80% 50% at 50% -20%, oklch(0.72 0.14 55 / 0.08), transparent)" }}
        />

        <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: "1200px" }}>
          {HERO_POSTERS.map((poster, i) => (
            <motion.div
              key={poster.id}
              className="absolute"
              style={{ x: poster.x, y: poster.y, rotateY: poster.angle, z: poster.z, transformStyle: "preserve-3d" }}
              initial={{ opacity: 0, scale: 0.8, y: poster.y + 40 }}
              animate={{ opacity: 0.35, scale: 1, y: poster.y }}
              transition={{ delay: i * 0.1, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
              whileHover={{ opacity: 0.6, scale: 1.05, transition: { duration: 0.2 } }}
            >
              <div
                className="w-28 h-44 md:w-36 md:h-56 rounded-lg border border-white/5 shadow-2xl float-poster"
                style={{
                  background: `linear-gradient(135deg, ${poster.color} 0%, oklch(0.08 0.005 260) 100%)`,
                  animationDelay: `${i * 0.8}s`,
                  boxShadow: "0 25px 60px oklch(0 0 0 / 0.6), inset 0 1px 0 oklch(1 0 0 / 0.05)",
                }}
              >
                <div className="w-full h-full flex items-end p-3">
                  <span className="text-white/20 text-xs font-mono leading-tight">{poster.title}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto px-6 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm mb-8"
          >
            <Star className="w-3.5 h-3.5 fill-primary" />
            <span>Basado en tu historial de Letterboxd</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            className="text-5xl md:text-7xl lg:text-8xl font-serif mb-6 leading-none tracking-tight"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Pelis que <em className="text-gradient not-italic">te conocen</em>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-light"
          >
            Subí tu export de Letterboxd. Leemos tus ratings, tus reviews, tus patrones. Después
            recomendamos con explicaciones basadas en <em className="text-foreground/80">tu gusto real</em>,
            no en un ranking genérico.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href={ctaHref}
              className="group flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-xl text-base font-medium hover:bg-primary/90 transition-all duration-200 active:scale-95 amber-glow"
            >
              {ctaLabel}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            <a
              href="#how-it-works"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 px-4 py-3.5"
            >
              Ver cómo funciona
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="flex items-center justify-center gap-10 mt-16"
          >
            {[
              { value: "1M+", label: "Pelis en catálogo" },
              { value: "100%", label: "Personalizado" },
              { value: "0", label: "Picks genéricos" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div
                  className="text-3xl font-serif text-foreground/80 mb-0.5"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  {stat.value}
                </div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-5 h-8 rounded-full border border-border flex items-start justify-center pt-1.5"
          >
            <div className="w-1 h-1.5 rounded-full bg-muted-foreground" />
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-32 relative">
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 60% 40% at 50% 50%, oklch(0.72 0.14 55 / 0.04), transparent)" }}
        />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <p className="text-primary text-sm uppercase tracking-widest mb-4 font-medium">El proceso</p>
            <h2 className="text-4xl md:text-5xl font-serif" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Tres pasos a tu próxima <em className="text-gradient not-italic">obsesión</em>
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: i * 0.15, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                className="p-8 rounded-2xl border border-border bg-card/50 hover:border-primary/30 transition-all duration-300 card-glow group"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                    <step.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-4xl font-serif text-muted-foreground/30">{step.number}</span>
                </div>
                <h3 className="text-xl font-serif mb-3" style={{ fontFamily: "'Instrument Serif', serif" }}>
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%, oklch(0.72 0.14 55 / 0.06), transparent)" }}
        />
        <div className="container relative text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 className="text-4xl md:text-6xl font-serif mb-6" style={{ fontFamily: "'Instrument Serif', serif" }}>
              ¿Lista tu próxima <em className="text-gradient not-italic">peli?</em>
            </h2>
            <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
              Subí tu CSV y recibí recomendaciones personalizadas en menos de un minuto.
            </p>
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-10 py-4 rounded-xl text-base font-medium hover:bg-primary/90 transition-all duration-200 active:scale-95 amber-glow"
            >
              {ctaLabel}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Film className="w-4 h-4 text-primary" />
            <span>
              <span className="font-serif" style={{ fontFamily: "'Instrument Serif', serif" }}>
                PeliPick
              </span>{" "}
              — para el que mira con criterio
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Datos de películas por{" "}
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/70 hover:text-primary transition-colors"
            >
              TMDB
            </a>
          </p>
        </div>
      </footer>
    </PageTransition>
  );
}
