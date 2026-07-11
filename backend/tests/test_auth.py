from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_register_creates_user_and_returns_token() -> None:
    response = client.post(
        "/auth/register", json={"username": "mati", "password": "supersecret"}
    )

    assert response.status_code == 201
    body = response.json()
    assert body["username"] == "mati"
    assert body["token"]


def test_register_rejects_duplicate_username() -> None:
    client.post("/auth/register", json={"username": "dupe", "password": "supersecret"})
    response = client.post(
        "/auth/register", json={"username": "dupe", "password": "othersecret"}
    )

    assert response.status_code == 409


def test_login_succeeds_with_correct_password() -> None:
    client.post("/auth/register", json={"username": "loginok", "password": "supersecret"})
    response = client.post(
        "/auth/login", json={"username": "loginok", "password": "supersecret"}
    )

    assert response.status_code == 200
    assert response.json()["token"]


def test_login_rejects_wrong_password() -> None:
    client.post("/auth/register", json={"username": "loginbad", "password": "supersecret"})
    response = client.post(
        "/auth/login", json={"username": "loginbad", "password": "wrongpassword"}
    )

    assert response.status_code == 401


def test_login_rejects_unknown_username() -> None:
    response = client.post(
        "/auth/login", json={"username": "ghost", "password": "whatever1"}
    )

    assert response.status_code == 401


def test_recommend_csv_requires_auth() -> None:
    response = client.post(
        "/recommend/csv",
        json={"csv_content": "Name,Rating,Review\nPerfect Blue,4.5,dark"},
    )

    assert response.status_code == 401
