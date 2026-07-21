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


def test_send_request_wraps_network_errors(monkeypatch) -> None:
    def raise_url_error(*args, **kwargs):
        raise mailer.URLError("boom")

    monkeypatch.setattr(mailer.urllib.request, "urlopen", raise_url_error)

    with pytest.raises(mailer.MailError):
        mailer._send_request(b"{}", "fake-key")
