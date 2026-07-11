from fastapi.testclient import TestClient

from backend.app.main import app

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
