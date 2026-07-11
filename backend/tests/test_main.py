from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.llm_client import LlmError
from backend.app.tmdb_client import TmdbError

client = TestClient(app)

VALID_CSV = "Name,Rating,Review\nMad Max: Fury Road,1.5,too loud and empty"


def _auth_headers(username: str) -> dict[str, str]:
    client.post("/auth/register", json={"username": username, "password": "supersecret"})
    login = client.post("/auth/login", json={"username": username, "password": "supersecret"})
    return {"Authorization": f"Bearer {login.json()['token']}"}


def test_recommend_csv_rejects_malformed_csv() -> None:
    headers = _auth_headers("malformed")
    oversized_field = "a" * 200_000
    response = client.post(
        "/recommend/csv",
        headers=headers,
        json={"csv_content": f"Name,Rating\n{oversized_field},4.5"},
    )

    assert response.status_code == 400


def test_recommend_csv_rejects_csv_with_no_valid_rows() -> None:
    headers = _auth_headers("novalid")
    response = client.post(
        "/recommend/csv",
        headers=headers,
        json={"csv_content": "Name,Rating\nUnrated Movie,\n"},
    )

    assert response.status_code == 400


def test_recommend_csv_returns_picks_with_ids_for_valid_csv() -> None:
    headers = _auth_headers("validcsv")
    response = client.post("/recommend/csv", headers=headers, json={"csv_content": VALID_CSV})

    assert response.status_code == 200
    recommendations = response.json()["recommendations"]
    assert recommendations
    assert all(item["id"] is not None for item in recommendations)


def test_feedback_accepts_own_recommendation() -> None:
    headers = _auth_headers("feedbackok")
    picks = client.post(
        "/recommend/csv", headers=headers, json={"csv_content": VALID_CSV}
    ).json()["recommendations"]

    response = client.post(
        "/feedback",
        headers=headers,
        json={"recommendation_id": picks[0]["id"], "status": "interested"},
    )

    assert response.status_code == 201


def test_feedback_rejects_recommendation_from_another_user() -> None:
    headers_a = _auth_headers("owner")
    headers_b = _auth_headers("intruder")
    picks = client.post(
        "/recommend/csv", headers=headers_a, json={"csv_content": VALID_CSV}
    ).json()["recommendations"]

    response = client.post(
        "/feedback",
        headers=headers_b,
        json={"recommendation_id": picks[0]["id"], "status": "interested"},
    )

    assert response.status_code == 404


def test_recommend_csv_falls_back_to_mock_catalog_when_tmdb_fails(monkeypatch) -> None:
    monkeypatch.setenv("TMDB_API_KEY", "fake-key")

    def raise_tmdb_error(mood: str):
        raise TmdbError("boom")

    monkeypatch.setattr("backend.app.main.tmdb_client.fetch_candidates", raise_tmdb_error)

    headers = _auth_headers("tmdbfallback")
    response = client.post("/recommend/csv", headers=headers, json={"csv_content": VALID_CSV})

    assert response.status_code == 200
    assert response.json()["recommendations"]


def test_recommend_csv_carries_poster_and_overview_fields(monkeypatch) -> None:
    monkeypatch.setenv("TMDB_API_KEY", "fake-key")

    def fake_fetch_candidates(mood: str):
        return [
            {
                "title": "Custom Movie",
                "year": 2021,
                "kind": "movie",
                "tags": ["psychological", "dark"],
                "poster_path": "https://image.tmdb.org/t/p/w500/poster.jpg",
                "backdrop_path": "https://image.tmdb.org/t/p/w780/backdrop.jpg",
                "overview": "A moody thriller.",
                "vote_average": 7.4,
            }
        ]

    monkeypatch.setattr("backend.app.main.tmdb_client.fetch_candidates", fake_fetch_candidates)

    headers = _auth_headers("posterfields")
    response = client.post(
        "/recommend/csv",
        headers=headers,
        json={"csv_content": "Name,Rating,Review\nWhiplash,4.5,psychological and intense"},
    )

    assert response.status_code == 200
    item = response.json()["recommendations"][0]
    assert item["poster_path"] == "https://image.tmdb.org/t/p/w500/poster.jpg"
    assert item["backdrop_path"] == "https://image.tmdb.org/t/p/w780/backdrop.jpg"
    assert item["overview"] == "A moody thriller."
    assert item["vote_average"] == 7.4


def test_recommend_csv_uses_gemini_refinement_when_configured(monkeypatch) -> None:
    monkeypatch.setenv("GEMINI_API_KEY", "fake-key")

    def fake_refine(ratings, mood, heuristic):
        picked = heuristic.recommendations[0].model_copy(update={"why": "elegido por el agente"})
        return heuristic.model_copy(update={"taste_summary": "resumen del agente", "recommendations": [picked]})

    monkeypatch.setattr("backend.app.main.llm_client.refine_recommendations", fake_refine)

    headers = _auth_headers("geminiok")
    response = client.post("/recommend/csv", headers=headers, json={"csv_content": VALID_CSV})

    assert response.status_code == 200
    body = response.json()
    assert body["taste_summary"] == "resumen del agente"
    assert len(body["recommendations"]) == 1
    assert body["recommendations"][0]["why"] == "elegido por el agente"
    assert body["recommendations"][0]["id"] is not None


def test_recommend_csv_falls_back_to_heuristic_when_gemini_fails(monkeypatch) -> None:
    monkeypatch.setenv("GEMINI_API_KEY", "fake-key")

    def raise_llm_error(ratings, mood, heuristic):
        raise LlmError("boom")

    monkeypatch.setattr("backend.app.main.llm_client.refine_recommendations", raise_llm_error)

    headers = _auth_headers("geminifallback")
    response = client.post("/recommend/csv", headers=headers, json={"csv_content": VALID_CSV})

    assert response.status_code == 200
    assert response.json()["recommendations"]


def test_feedback_rejects_invalid_status() -> None:
    headers = _auth_headers("badstatus")
    picks = client.post(
        "/recommend/csv", headers=headers, json={"csv_content": VALID_CSV}
    ).json()["recommendations"]

    response = client.post(
        "/feedback",
        headers=headers,
        json={"recommendation_id": picks[0]["id"], "status": "bogus"},
    )

    assert response.status_code == 422
