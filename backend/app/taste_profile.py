"""Aggregates a user's watched-titles history into a visual taste profile
(genre weights, decade counts, favorite directors/actors) by matching each
title against TMDb.
"""

from . import tmdb_client

# ponytail: matching + credits are one TMDb request each, and a real
# Letterboxd export can run into the hundreds of titles — cap both stages so
# a profile load stays fast. Raise these if a slower-but-fuller profile is
# worth the wait.
MAX_TITLES_TO_MATCH = 150
MAX_TITLES_FOR_CREDITS = 50
TOP_GENRES = 8
TOP_DECADES = 10
TOP_PEOPLE = 8


def build_taste_profile(watched_items: list[dict]) -> dict:
    total_count = len(watched_items)
    # highest-rated first: within the cap, prioritize the titles that most
    # define this user's taste, not just the most recently imported ones
    ranked = sorted(watched_items, key=lambda item: item["rating"], reverse=True)
    candidates = ranked[:MAX_TITLES_TO_MATCH]

    matches: list[tuple[dict, dict]] = []
    for item in candidates:
        try:
            match = tmdb_client.search_title(item["title"])
        except tmdb_client.TmdbError:
            match = None
        if match:
            matches.append((item, match))

    genre_weight: dict[str, float] = {}
    decade_count: dict[int, int] = {}
    for item, match in matches:
        for genre in match["genres"]:
            genre_weight[genre] = genre_weight.get(genre, 0.0) + item["rating"]
        decade = (match["year"] // 10) * 10
        decade_count[decade] = decade_count.get(decade, 0) + 1

    director_count: dict[str, int] = {}
    actor_count: dict[str, int] = {}
    for item, match in matches[:MAX_TITLES_FOR_CREDITS]:
        try:
            credits = tmdb_client.fetch_taste_credits(match["tmdb_id"], kind=match["kind"])
        except tmdb_client.TmdbError:
            continue
        if credits["director"]:
            director_count[credits["director"]] = director_count.get(credits["director"], 0) + 1
        for actor in credits["actors"]:
            actor_count[actor] = actor_count.get(actor, 0) + 1

    return {
        "matched_count": len(matches),
        "total_count": total_count,
        "genre_breakdown": [
            {"genre": genre, "weight": weight}
            for genre, weight in sorted(
                genre_weight.items(), key=lambda kv: kv[1], reverse=True
            )[:TOP_GENRES]
        ],
        "decade_breakdown": [
            {"decade": decade, "count": count}
            for decade, count in sorted(decade_count.items())[-TOP_DECADES:]
        ],
        "top_directors": [
            {"name": name, "count": count}
            for name, count in sorted(
                director_count.items(), key=lambda kv: kv[1], reverse=True
            )[:TOP_PEOPLE]
        ],
        "top_actors": [
            {"name": name, "count": count}
            for name, count in sorted(
                actor_count.items(), key=lambda kv: kv[1], reverse=True
            )[:TOP_PEOPLE]
        ],
    }
