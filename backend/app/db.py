import json
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path

DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent / "pelipick.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rated_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    rating REAL NOT NULL,
    review TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS recommendations_served (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    year INTEGER NOT NULL,
    kind TEXT NOT NULL,
    why TEXT NOT NULL,
    match_score INTEGER NOT NULL,
    tags TEXT NOT NULL,
    mood TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    recommendation_id INTEGER NOT NULL REFERENCES recommendations_served(id),
    status TEXT NOT NULL CHECK (status IN ('interested', 'not_interested', 'seen')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
"""


def _db_path() -> str:
    return os.environ.get("PELIPICK_DB_PATH", str(DEFAULT_DB_PATH))


@contextmanager
def get_connection():
    conn = sqlite3.connect(_db_path())
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript(SCHEMA)
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def create_user(username: str, password_hash: str, password_salt: str) -> int:
    with get_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO users (username, password_hash, password_salt) VALUES (?, ?, ?)",
            (username, password_hash, password_salt),
        )
        return cursor.lastrowid


def get_user_by_username(username: str) -> sqlite3.Row | None:
    with get_connection() as conn:
        return conn.execute(
            "SELECT * FROM users WHERE username = ?", (username,)
        ).fetchone()


def create_session(token: str, user_id: int) -> None:
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO sessions (token, user_id) VALUES (?, ?)", (token, user_id)
        )


def get_user_by_token(token: str) -> sqlite3.Row | None:
    with get_connection() as conn:
        return conn.execute(
            """
            SELECT users.* FROM sessions
            JOIN users ON users.id = sessions.user_id
            WHERE sessions.token = ?
            """,
            (token,),
        ).fetchone()


def delete_session(token: str) -> None:
    with get_connection() as conn:
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))


def save_rated_items(user_id: int, items: list[tuple[str, float, str]]) -> None:
    if not items:
        return
    with get_connection() as conn:
        conn.executemany(
            "INSERT INTO rated_items (user_id, title, rating, review) VALUES (?, ?, ?, ?)",
            [(user_id, title, rating, review) for title, rating, review in items],
        )


def save_recommendations(
    user_id: int,
    mood: str,
    items: list[tuple[str, int, str, str, int, list[str]]],
) -> list[int]:
    ids: list[int] = []
    with get_connection() as conn:
        for title, year, kind, why, match_score, tags in items:
            cursor = conn.execute(
                """
                INSERT INTO recommendations_served
                    (user_id, title, year, kind, why, match_score, tags, mood)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (user_id, title, year, kind, why, match_score, json.dumps(tags), mood),
            )
            ids.append(cursor.lastrowid)
    return ids


def get_recommendation(recommendation_id: int, user_id: int) -> sqlite3.Row | None:
    with get_connection() as conn:
        return conn.execute(
            "SELECT * FROM recommendations_served WHERE id = ? AND user_id = ?",
            (recommendation_id, user_id),
        ).fetchone()


def save_feedback(user_id: int, recommendation_id: int, status: str) -> None:
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO feedback (user_id, recommendation_id, status) VALUES (?, ?, ?)",
            (user_id, recommendation_id, status),
        )
