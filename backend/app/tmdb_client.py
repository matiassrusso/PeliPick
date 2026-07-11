import json
import os
import urllib.parse
import urllib.request
from pathlib import Path
from urllib.error import URLError

from .recommender import positive_tags_from_text

ENV_FILE = Path(__file__).resolve().parent.parent / ".env"
DISCOVER_URL = "https://api.themoviedb.org/3/discover/movie"
REQUEST_TIMEOUT = 5

# TMDb's movie genre ids are stable, publicly documented constants, so we
# hardcode the id -> our tag vocabulary mapping instead of fetching and
# caching /genre/movie/list. Coarse on purpose: real nuance comes from the
# overview text scan below, and eventually from the LLM agent.
GENRE_ID_TAG_MAP: dict[int, list[str]] = {
    28: ["action", "kinetic", "blockbuster"],  # Action
    12: ["kinetic", "blockbuster"],  # Adventure
    16: ["stylized"],  # Animation
    35: ["funny", "light"],  # Comedy
    80: ["dark", "psychological"],  # Crime
    99: [],  # Documentary
    18: ["character"],  # Drama
    10751: ["light"],  # Family
    14: ["stylized"],  # Fantasy
    36: ["character"],  # History
    27: ["dark"],  # Horror
    10402: ["light"],  # Music
    9648: ["mysterious", "psychological"],  # Mystery
    10749: ["romantic", "intimate"],  # Romance
    878: ["stylized", "mysterious"],  # Science Fiction
    10770: [],  # TV Movie
    53: ["psychological", "dark"],  # Thriller
    10752: ["dark"],  # War
    37: ["character"],  # Western
}

# Only moods with a clean genre correspondence bias the discover query.
# "slow" has no honest TMDb genre match, so it's left unfiltered and the
# tag-scoring step in recommend() does the work instead.
MOOD_GENRE_ID_MAP: dict[str, int] = {
    "funny": 35,
    "romance": 10749,
    "action": 28,
    "psychological": 53,
}


class TmdbError(Exception):
    pass


def _load_env_file() -> None:
    if not ENV_FILE.exists():
        return
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip())


_load_env_file()


def is_configured() -> bool:
    return bool(os.environ.get("TMDB_API_KEY"))


def _get_json(url: str) -> dict:
    try:
        with urllib.request.urlopen(url, timeout=REQUEST_TIMEOUT) as response:
            return json.loads(response.read())
    except (URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise TmdbError(f"No pude consultar TMDb: {exc}") from exc


def _map_result(raw: dict) -> dict | None:
    title = (raw.get("title") or "").strip()
    release_date = raw.get("release_date") or ""
    if not title or len(release_date) < 4:
        return None

    try:
        year = int(release_date[:4])
    except ValueError:
        return None

    tags: set[str] = set()
    for genre_id in raw.get("genre_ids", []):
        tags.update(GENRE_ID_TAG_MAP.get(genre_id, []))
    tags.update(positive_tags_from_text(raw.get("overview") or ""))

    if not tags:
        return None

    return {"title": title, "year": year, "kind": "movie", "tags": sorted(tags)}


def fetch_candidates(mood: str, pages: int = 2) -> list[dict]:
    api_key = os.environ.get("TMDB_API_KEY")
    if not api_key:
        raise TmdbError("TMDB_API_KEY no configurada.")

    genre_id = MOOD_GENRE_ID_MAP.get(mood.strip().lower())

    candidates: list[dict] = []
    for page in range(1, pages + 1):
        params = {
            "api_key": api_key,
            "language": "en-US",
            "sort_by": "popularity.desc",
            "vote_count.gte": 200,
            "include_adult": "false",
            "page": page,
        }
        if genre_id:
            params["with_genres"] = genre_id

        url = f"{DISCOVER_URL}?{urllib.parse.urlencode(params)}"
        data = _get_json(url)

        for raw in data.get("results", []):
            mapped = _map_result(raw)
            if mapped:
                candidates.append(mapped)

    return candidates
