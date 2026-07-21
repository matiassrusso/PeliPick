import json

import pytest

from backend.app import mailer


def test_is_configured_requires_api_key(monkeypatch) -> None:
    monkeypatch.delenv("RESEND_API_KEY", raising=False)
    assert mailer.is_configured() is False

    monkeypatch.setenv("RESEND_API_KEY", "fake-key")
    assert mailer.is_configured() is True


def test_send_password_reset_email_requires_api_key(monkeypatch) -> None:
    monkeypatch.delenv("RESEND_API_KEY", raising=False)

    with pytest.raises(mailer.MailError):
        mailer.send_password_reset_email("user@example.com", "sometoken")


def test_send_password_reset_email_builds_expected_request(monkeypatch) -> None:
    monkeypatch.setenv("RESEND_API_KEY", "fake-key")
    monkeypatch.setenv("BUTACA_RESET_URL", "https://pelipick.vercel.app/reset-password")
    captured = {}

    def fake_send_request(body: bytes, api_key: str) -> None:
        captured["body"] = json.loads(body)
        captured["api_key"] = api_key

    monkeypatch.setattr(mailer, "_send_request", fake_send_request)

    mailer.send_password_reset_email("user@example.com", "sometoken")

    assert captured["api_key"] == "fake-key"
    assert captured["body"]["to"] == ["user@example.com"]
    assert "sometoken" in captured["body"]["html"]
    assert "https://pelipick.vercel.app/reset-password?token=sometoken" in captured["body"]["html"]


def test_send_request_sets_user_agent(monkeypatch) -> None:
    # Sin User-Agent propio, Cloudflare corta la API de Resend con 403 "error
    # code: 1010" — se rompe solo en producción, nunca en los tests mockeados.
    captured = {}

    def fake_urlopen(request, timeout=None):
        captured["headers"] = request.headers
        raise mailer.URLError("stop here")

    monkeypatch.setattr(mailer.urllib.request, "urlopen", fake_urlopen)

    with pytest.raises(mailer.MailError):
        mailer._send_request(b"{}", "fake-key")

    # urllib capitaliza los nombres de header al guardarlos.
    assert captured["headers"].get("User-agent") == mailer.USER_AGENT


def test_send_request_surfaces_http_error_body(monkeypatch) -> None:
    import io

    def raise_http_error(*args, **kwargs):
        raise mailer.HTTPError(
            mailer.RESEND_URL, 403, "Forbidden", {}, io.BytesIO(b"error code: 1010")
        )

    monkeypatch.setattr(mailer.urllib.request, "urlopen", raise_http_error)

    with pytest.raises(mailer.MailError, match="1010"):
        mailer._send_request(b"{}", "fake-key")


def test_send_request_wraps_network_errors(monkeypatch) -> None:
    def raise_url_error(*args, **kwargs):
        raise mailer.URLError("boom")

    monkeypatch.setattr(mailer.urllib.request, "urlopen", raise_url_error)

    with pytest.raises(mailer.MailError):
        mailer._send_request(b"{}", "fake-key")
