import pytest

from backend.app import llm_client
from backend.app.models import RatedItem, Recommendation, RecommendResponse

HEURISTIC = RecommendResponse(
    taste_summary="resumen heurístico",
    recommendations=[
        Recommendation(
            title="Fake Thriller", year=2020, kind="movie", why="heurística",
            match_score=70, tags=["dark", "psychological"],
        ),
        Recommendation(
            title="Fake Comedy", year=2019, kind="movie", why="heurística",
            match_score=60, tags=["funny", "light"],
        ),
    ],
)


def test_refine_requires_api_key(monkeypatch) -> None:
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    with pytest.raises(llm_client.LlmError):
        llm_client.refine_recommendations([], "funny", HEURISTIC)


def test_refine_requires_candidates(monkeypatch) -> None:
    monkeypatch.setenv("GEMINI_API_KEY", "fake-key")

    with pytest.raises(llm_client.LlmError):
        llm_client.refine_recommendations([], "funny", RecommendResponse(taste_summary="", recommendations=[]))


def test_refine_reorders_and_overrides_why(monkeypatch) -> None:
    monkeypatch.setenv("GEMINI_API_KEY", "fake-key")

    def fake_call_gemini(prompt: str, api_key: str) -> dict:
        return {
            "taste_summary": "resumen del agente",
            "picks": [
                {"title": "Fake Comedy", "why": "porque te reís poco últimamente"},
                {"title": "Fake Thriller", "why": "porque te gusta lo oscuro"},
            ],
        }

    monkeypatch.setattr(llm_client, "_call_gemini", fake_call_gemini)

    ratings = [RatedItem(title="Old Movie", rating=4.5, review="genial")]
    result = llm_client.refine_recommendations(ratings, "funny", HEURISTIC)

    assert result.taste_summary == "Resumen del agente"
    assert [r.title for r in result.recommendations] == ["Fake Comedy", "Fake Thriller"]
    assert result.recommendations[0].why == "Porque te reís poco últimamente"
    # fields not touched by the LLM (score, tags) survive untouched
    assert result.recommendations[0].match_score == 60
    assert result.recommendations[0].tags == ["funny", "light"]


def test_refine_ignores_titles_outside_the_candidate_list(monkeypatch) -> None:
    monkeypatch.setenv("GEMINI_API_KEY", "fake-key")

    def fake_call_gemini(prompt: str, api_key: str) -> dict:
        return {"taste_summary": "x", "picks": [{"title": "Made Up Movie", "why": "no existe"}]}

    monkeypatch.setattr(llm_client, "_call_gemini", fake_call_gemini)

    with pytest.raises(llm_client.LlmError):
        llm_client.refine_recommendations([], "funny", HEURISTIC)


def test_call_gemini_wraps_network_errors(monkeypatch) -> None:
    def raise_url_error(*args, **kwargs):
        raise llm_client.URLError("boom")

    monkeypatch.setattr(llm_client.urllib.request, "urlopen", raise_url_error)

    with pytest.raises(llm_client.LlmError):
        llm_client._call_gemini("prompt", "fake-key")


def test_build_taste_digest_handles_empty_history() -> None:
    assert llm_client._build_taste_digest([]) == "Sin historial todavía."


def test_build_taste_digest_names_patterns_and_standout_titles() -> None:
    ratings = [
        RatedItem(title="Loved Dark One", rating=5, review="a dark and psychological ride"),
        RatedItem(title="Loved Dark Two", rating=4.5, review="another dark, quiet story"),
        RatedItem(title="Hated It", rating=1, review="boring and empty"),
    ]

    digest = llm_client._build_taste_digest(ratings)

    assert "3 títulos puntuados" in digest
    assert "promedio 3.5/5" in digest
    assert "tono oscuro" in digest  # "dark" -> TAG_PHRASES
    assert "Loved Dark One" in digest and "Loved Dark Two" in digest
    assert "Le encantaron especialmente" in digest
    assert "Hated It" in digest and "No le gustaron" in digest


def test_build_prompt_includes_digest_and_grounding_instructions() -> None:
    ratings = [RatedItem(title="Old Movie", rating=5, review="dark and psychological")]

    prompt = llm_client._build_prompt(ratings, "funny", HEURISTIC)

    assert "Perfil de gusto detectado:" in prompt
    assert "Old Movie" in prompt
    assert "nombre un patrón concreto" in prompt
    assert "Fake Thriller" in prompt and "Fake Comedy" in prompt
