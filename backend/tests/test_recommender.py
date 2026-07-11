from backend.app.models import RatedItem
from backend.app.recommender import recommend


def test_recommend_filters_seen_titles_and_prefers_matching_mood() -> None:
    response = recommend(
        ratings=[
            RatedItem(title="Whiplash", rating=4.5, review="psychological and intense"),
            RatedItem(title="Mad Max: Fury Road", rating=1.5, review="too loud"),
        ],
        mood="psychological",
    )

    assert all(item.title != "Mad Max: Fury Road" for item in response.recommendations)
    assert response.recommendations
    assert response.recommendations[0].title in {"Perfect Blue", "Burning"}


def test_recommend_uses_custom_catalog_when_provided() -> None:
    custom_catalog = [
        {"title": "Custom Movie", "year": 2021, "kind": "movie", "tags": ["psychological", "dark"]},
    ]

    response = recommend(
        ratings=[RatedItem(title="Whiplash", rating=4.5, review="psychological and intense")],
        mood="",
        catalog=custom_catalog,
    )

    assert [item.title for item in response.recommendations] == ["Custom Movie"]
