import pytest

from backend.app import tmdb_client


def test_fetch_candidates_requires_api_key(monkeypatch) -> None:
    monkeypatch.delenv("TMDB_API_KEY", raising=False)

    with pytest.raises(tmdb_client.TmdbError):
        tmdb_client.fetch_candidates("funny")


def test_fetch_candidates_maps_genres_and_overview_to_tags(monkeypatch) -> None:
    monkeypatch.setenv("TMDB_API_KEY", "fake-key")
    calls: list[str] = []

    def fake_get_json(url: str) -> dict:
        calls.append(url)
        return {
            "results": [
                {
                    "title": "Fake Thriller",
                    "release_date": "2020-05-01",
                    "genre_ids": [53],  # Thriller -> psychological, dark
                    "overview": "A slow and quiet character study.",
                },
                {
                    "title": "No Year",
                    "release_date": "",
                    "genre_ids": [28],
                    "overview": "",
                },
                {
                    "title": "No Tags At All",
                    "release_date": "2019-01-01",
                    "genre_ids": [99],  # Documentary -> no mapped tags
                    "overview": "",
                },
            ]
        }

    monkeypatch.setattr(tmdb_client, "_get_json", fake_get_json)

    candidates = tmdb_client.fetch_candidates("funny", pages=1)

    assert len(candidates) == 1
    item = candidates[0]
    assert item["title"] == "Fake Thriller"
    assert item["year"] == 2020
    assert item["kind"] == "movie"
    assert {"psychological", "dark", "slow", "quiet", "melancholic", "intimate"} <= set(
        item["tags"]
    )
    assert "with_genres=35" in calls[0]  # "funny" mood biases toward Comedy


def test_get_json_wraps_network_errors(monkeypatch) -> None:
    def raise_url_error(*args, **kwargs):
        raise tmdb_client.URLError("boom")

    monkeypatch.setattr(tmdb_client.urllib.request, "urlopen", raise_url_error)

    with pytest.raises(tmdb_client.TmdbError):
        tmdb_client._get_json("https://api.themoviedb.org/3/discover/movie")
