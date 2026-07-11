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


def test_recommend_zip_requires_auth() -> None:
    response = client.post(
        "/recommend/zip",
        data={"mood": ""},
        files={"file": ("export.zip", b"not-a-real-zip", "application/zip")},
    )

    assert response.status_code == 401


def test_auth_me_returns_username_for_valid_token() -> None:
    client.post("/auth/register", json={"username": "meuser", "password": "supersecret"})
    login = client.post("/auth/login", json={"username": "meuser", "password": "supersecret"})
    token = login.json()["token"]

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json()["username"] == "meuser"


def test_auth_me_rejects_missing_or_invalid_token() -> None:
    assert client.get("/auth/me").status_code == 401
    assert (
        client.get("/auth/me", headers={"Authorization": "Bearer nonsense"}).status_code
        == 401
    )
