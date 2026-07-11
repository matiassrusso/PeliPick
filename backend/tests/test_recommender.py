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
