from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_register_creates_user_and_returns_token() -> None:
    response = client.post(
        "/auth/register",
        json={"username": "mati", "password": "supersecret", "email": "mati@example.com"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["username"] == "mati"
    assert body["token"]


def test_register_rejects_malformed_email() -> None:
    response = client.post(
        "/auth/register",
        json={"username": "bademail", "password": "supersecret", "email": "not-an-email"},
    )

    assert response.status_code == 422


def test_register_rejects_duplicate_username() -> None:
    client.post(
        "/auth/register",
        json={"username": "dupe", "password": "supersecret", "email": "dupe@example.com"},
    )
    response = client.post(
        "/auth/register",
        json={"username": "dupe", "password": "othersecret", "email": "dupe2@example.com"},
    )

    assert response.status_code == 409


def test_login_succeeds_with_correct_password() -> None:
    client.post(
        "/auth/register",
        json={"username": "loginok", "password": "supersecret", "email": "loginok@example.com"},
    )
    response = client.post(
        "/auth/login", json={"username": "loginok", "password": "supersecret"}
    )

    assert response.status_code == 200
    assert response.json()["token"]


def test_login_rejects_wrong_password() -> None:
    client.post(
        "/auth/register",
        json={"username": "loginbad", "password": "supersecret", "email": "loginbad@example.com"},
    )
    response = client.post(
        "/auth/login", json={"username": "loginbad", "password": "wrongpassword"}
    )

    assert response.status_code == 401


def test_login_rejects_unknown_username() -> None:
    response = client.post(
        "/auth/login", json={"username": "ghost", "password": "whatever1"}
    )

    assert response.status_code == 401


def test_login_rate_limits_after_repeated_failures(monkeypatch) -> None:
    client.post(
        "/auth/register",
        json={"username": "ratelimit", "password": "supersecret", "email": "ratelimit@example.com"},
    )
    monkeypatch.setattr("backend.app.main.auth.now_ts", lambda: 1_000)

    assert (
        client.post(
            "/auth/login", json={"username": "ratelimit", "password": "wrongpassword"}
        ).status_code
        == 401
    )
    assert (
        client.post(
            "/auth/login", json={"username": "ratelimit", "password": "wrongpassword"}
        ).status_code
        == 401
    )

    locked = client.post(
        "/auth/login", json={"username": "ratelimit", "password": "wrongpassword"}
    )
    assert locked.status_code == 429
    assert "30s" in locked.json()["detail"]

    blocked = client.post(
        "/auth/login", json={"username": "ratelimit", "password": "supersecret"}
    )
    assert blocked.status_code == 429

    monkeypatch.setattr("backend.app.main.auth.now_ts", lambda: 1_031)
    unblocked = client.post(
        "/auth/login", json={"username": "ratelimit", "password": "supersecret"}
    )
    assert unblocked.status_code == 200


def test_recommend_zip_requires_auth() -> None:
    response = client.post(
        "/recommend/zip",
        data={"mood": ""},
        files={"file": ("export.zip", b"not-a-real-zip", "application/zip")},
    )

    assert response.status_code == 401


def test_auth_me_returns_username_for_valid_token() -> None:
    client.post(
        "/auth/register",
        json={"username": "meuser", "password": "supersecret", "email": "meuser@example.com"},
    )
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


def test_forgot_password_returns_token_and_reset_invalidates_old_sessions(monkeypatch) -> None:
    # PELIPICK_DEBUG exposes the reset token in the response so the flow can
    # be exercised end-to-end without a real email provider configured.
    monkeypatch.setenv("PELIPICK_DEBUG", "1")

    register = client.post(
        "/auth/register",
        json={"username": "resetuser", "password": "supersecret", "email": "resetuser@example.com"},
    )
    old_token = register.json()["token"]

    forgot = client.post("/auth/forgot-password", json={"username": "resetuser"})
    assert forgot.status_code == 200
    reset_token = forgot.json()["reset_token"]
    assert reset_token

    response = client.post(
        "/auth/reset-password",
        json={"token": reset_token, "password": "newersecret"},
    )
    assert response.status_code == 204

    assert (
        client.get("/auth/me", headers={"Authorization": f"Bearer {old_token}"}).status_code
        == 401
    )
    assert (
        client.post(
            "/auth/login", json={"username": "resetuser", "password": "supersecret"}
        ).status_code
        == 401
    )
    assert (
        client.post(
            "/auth/login", json={"username": "resetuser", "password": "newersecret"}
        ).status_code
        == 200
    )


def test_forgot_password_sends_email_when_mailer_configured(monkeypatch) -> None:
    client.post(
        "/auth/register",
        json={"username": "mailuser", "password": "supersecret", "email": "mailuser@example.com"},
    )

    sent = {}

    def fake_send(to_email: str, reset_token: str) -> None:
        sent["to_email"] = to_email
        sent["reset_token"] = reset_token

    monkeypatch.setattr("backend.app.main.mailer.is_configured", lambda: True)
    monkeypatch.setattr("backend.app.main.mailer.send_password_reset_email", fake_send)

    response = client.post("/auth/forgot-password", json={"username": "mailuser"})

    assert response.status_code == 200
    assert sent["to_email"] == "mailuser@example.com"
    assert sent["reset_token"]


def test_forgot_password_survives_mailer_failure(monkeypatch) -> None:
    client.post(
        "/auth/register",
        json={"username": "mailfail", "password": "supersecret", "email": "mailfail@example.com"},
    )

    from backend.app.mailer import MailError

    def fake_send(to_email: str, reset_token: str) -> None:
        raise MailError("resend is down")

    monkeypatch.setattr("backend.app.main.mailer.is_configured", lambda: True)
    monkeypatch.setattr("backend.app.main.mailer.send_password_reset_email", fake_send)

    response = client.post("/auth/forgot-password", json={"username": "mailfail"})

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "reset_token": None}


def test_forgot_password_is_generic_for_unknown_username() -> None:
    response = client.post("/auth/forgot-password", json={"username": "ghost"})

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "reset_token": None}


def test_forgot_password_hides_token_by_default_even_for_existing_user() -> None:
    # PELIPICK_DEBUG is unset here (conftest clears it) — this is the real
    # default behavior: no token in the response, existing user or not.
    client.post(
        "/auth/register",
        json={"username": "notexposed", "password": "supersecret", "email": "notexposed@example.com"},
    )

    response = client.post("/auth/forgot-password", json={"username": "notexposed"})

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "reset_token": None}


def test_reset_password_rejects_expired_token(monkeypatch) -> None:
    monkeypatch.setenv("PELIPICK_DEBUG", "1")
    client.post(
        "/auth/register",
        json={"username": "expired", "password": "supersecret", "email": "expired@example.com"},
    )
    monkeypatch.setattr("backend.app.main.auth.now_ts", lambda: 2_000)
    reset_token = client.post(
        "/auth/forgot-password", json={"username": "expired"}
    ).json()["reset_token"]

    monkeypatch.setattr(
        "backend.app.main.auth.now_ts",
        lambda: 2_000 + 3_600 + 1,
    )
    response = client.post(
        "/auth/reset-password",
        json={"token": reset_token, "password": "newersecret"},
    )

    assert response.status_code == 400
