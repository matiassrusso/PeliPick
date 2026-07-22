"""Curated seed titles for onboarding a user who has no Letterboxd export.

They rate ~10-15 of these recognizable films and that's enough for
_finish_recommend to build a real taste profile (genre/decade/people).

Hardcoded on purpose (public stable constants, same call as the hardcoded
genre-id maps): a curated recognizable set beats /movie/popular, which sorts
by TMDb site clicks and skews to whatever released this week. Each entry is
title + year only — the poster/tmdb_id get resolved against TMDb at request
time via the existing search_title (cached 24h), so nothing here rots.

Kept unambiguous on purpose: search_title takes results[0] (TMDb popularity
order), so a bare remake-prone title ("Dune", "The Lion King") could resolve
to the wrong film's poster. Titles here are either single-canonical-film or
disambiguated (full "Dune: Part Two").
"""

# Wide on decade (1972-2024) and genre (crime, sci-fi, horror, drama,
# animation, romance, war, comedy, thriller) so the resulting profile isn't
# flattened into one taste. year is for display; kind is movie for all.
ONBOARDING_TITLES: list[dict] = [
    {"title": "The Godfather", "year": 1972},
    {"title": "Jaws", "year": 1975},
    {"title": "Alien", "year": 1979},
    {"title": "The Shining", "year": 1980},
    {"title": "Blade Runner", "year": 1982},
    {"title": "Back to the Future", "year": 1985},
    {"title": "Die Hard", "year": 1988},
    {"title": "The Silence of the Lambs", "year": 1991},
    {"title": "Terminator 2: Judgment Day", "year": 1991},
    {"title": "Jurassic Park", "year": 1993},
    {"title": "Pulp Fiction", "year": 1994},
    {"title": "The Shawshank Redemption", "year": 1994},
    {"title": "Forrest Gump", "year": 1994},
    {"title": "Toy Story", "year": 1995},
    {"title": "Titanic", "year": 1997},
    {"title": "The Matrix", "year": 1999},
    {"title": "Fight Club", "year": 1999},
    {"title": "Gladiator", "year": 2000},
    {"title": "Spirited Away", "year": 2001},
    {"title": "The Lord of the Rings: The Fellowship of the Ring", "year": 2001},
    {"title": "Amélie", "year": 2001},
    {"title": "City of God", "year": 2002},
    {"title": "Eternal Sunshine of the Spotless Mind", "year": 2004},
    {"title": "Ratatouille", "year": 2007},
    {"title": "The Dark Knight", "year": 2008},
    {"title": "Inglourious Basterds", "year": 2009},
    {"title": "Inception", "year": 2010},
    {"title": "The Social Network", "year": 2010},
    {"title": "Django Unchained", "year": 2012},
    {"title": "Interstellar", "year": 2014},
    {"title": "Whiplash", "year": 2014},
    {"title": "Mad Max: Fury Road", "year": 2015},
    {"title": "La La Land", "year": 2016},
    {"title": "Get Out", "year": 2017},
    {"title": "Parasite", "year": 2019},
    {"title": "Joker", "year": 2019},
    {"title": "Everything Everywhere All at Once", "year": 2022},
    {"title": "Oppenheimer", "year": 2023},
    {"title": "Dune: Part Two", "year": 2024},
]
