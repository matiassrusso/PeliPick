# Butaca

*[Leer en español](README.es.md)*

A movie/series recommendation engine built around your actual taste, not generic averages. Import your full [Letterboxd](https://letterboxd.com) export (or rate a handful of movies by hand if you don't use Letterboxd), and it recommends picks with an explained "why" per movie, scored against your real rating history.

**Live:** [butaca.xyz](https://butaca.xyz)

## Why

Most recommendation engines optimize for "people who liked X also liked Y" at a population level. Butaca instead builds a taste profile from a single user's actual ratings, reviews, likes, rewatches, and favorites, then scores candidates against that profile directly, with an AI agent that explains each pick in plain language instead of a black-box percentage.

## What it does

1. Sign up, then import your taste: upload your full Letterboxd `.zip` export, import by username (recent history via RSS), or skip Letterboxd entirely and rate a handful of movies by hand / search for titles outside the catalog
2. Pick a mood — full profile, recently watched, or specific genres — and whether you want movies, series, or both
3. The backend combines your ratings, reviews, likes, rewatches, and favorites into a taste profile, pulls real candidates from TMDb, and scores them
4. An AI agent (NVIDIA NIM) refines the ranking and reasoning on top of a heuristic baseline, so you get results instantly and better explanations moments later
5. Get up to 6 picks with poster, match %, and a specific reason tied to your own history — not a template
6. Give feedback per pick (interested / not interested / already watched) to improve future scoring, or add it to your watchlist

Other things it handles: real auth with password reset and email verification by mail, revisitable recommendation history, a "where to watch" lookup per pick, and account deletion.

## Tech stack

- **Backend:** FastAPI, SQLite (local) / PostgreSQL (production, Neon), TMDb API for the catalog, NVIDIA NIM for the AI agent, Resend for transactional email
- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Deploy:** Vercel (frontend), Render (backend)

## Running it locally

### Backend

```powershell
cd backend
py -m pip install -r requirements.txt
py -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8001
```

Needs `TMDB_API_KEY` and `NVIDIA_API_KEY` (both have free tiers) in `backend/.env` — see [tmdb-setup.md](docs/tmdb-setup.md) and [nvidia-setup.md](docs/nvidia-setup.md). `RESEND_API_KEY` is optional; without it, password reset/verification tokens are only returned in the API response with `BUTACA_DEBUG=1`.

### Frontend

```powershell
cd frontend
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1 --port 4173
```

## Docs

- [Product & MVP scope](docs/product-mvp.md)
- [Architecture](docs/architecture.md)
- [Letterboxd zip import format](docs/letterboxd-zip-format.md)
- [API reference](docs/api.md)
- [MVP status / build log](docs/mvp-status.md)
- [Backend entrypoint](backend/app/main.py) · [Frontend entrypoint](frontend/src/App.tsx)

## Status

Active, deployed, backed by a real test suite (180+ backend tests). Solo project, built end to end (product scope, backend, frontend, deploy) as part of a data science / software portfolio.
