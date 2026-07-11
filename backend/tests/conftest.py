import os

import pytest


@pytest.fixture(autouse=True)
def isolated_db(tmp_path):
    os.environ["PELIPICK_DB_PATH"] = str(tmp_path / "test.db")
    yield
    os.environ.pop("PELIPICK_DB_PATH", None)


@pytest.fixture(autouse=True)
def no_real_tmdb(monkeypatch):
    # backend/.env may hold a real TMDB_API_KEY on dev machines; tests must
    # not depend on live network calls or non-deterministic TMDb results.
    monkeypatch.delenv("TMDB_API_KEY", raising=False)
