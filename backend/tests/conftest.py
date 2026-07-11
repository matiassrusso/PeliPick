import os

import pytest


@pytest.fixture(autouse=True)
def isolated_db(tmp_path):
    os.environ["PELIPICK_DB_PATH"] = str(tmp_path / "test.db")
    yield
    os.environ.pop("PELIPICK_DB_PATH", None)
