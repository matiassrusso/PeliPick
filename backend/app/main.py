import sqlite3

from fastapi import Depends, FastAPI, File, Form, HTTPException, Header, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from . import catalog, db, letterboxd_zip, llm_client, tmdb_client
from .auth import create_token, get_current_user, hash_password, verify_password
from .models import (
    AuthResponse,
    FeedbackRequest,
    RecommendRequest,
    RecommendResponse,
    UserCredentials,
)
from .recommender import recommend

MAX_ZIP_SIZE = 20 * 1024 * 1024  # 20MB — real Letterboxd exports run in the tens of KB

app = FastAPI(title="PeliPick API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/auth/register", response_model=AuthResponse, status_code=201)
def register(payload: UserCredentials) -> AuthResponse:
    if db.get_user_by_username(payload.username) is not None:
        raise HTTPException(status_code=409, detail="Ese usuario ya existe.")

    password_hash, password_salt = hash_password(payload.password)
    user_id = db.create_user(payload.username, password_hash, password_salt)
    token = create_token()
    db.create_session(token, user_id)
    return AuthResponse(token=token, username=payload.username)


@app.post("/auth/login", response_model=AuthResponse)
def login(payload: UserCredentials) -> AuthResponse:
    user = db.get_user_by_username(payload.username)
    if user is None or not verify_password(
        payload.password, user["password_hash"], user["password_salt"]
    ):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos.")

    token = create_token()
    db.create_session(token, user["id"])
    return AuthResponse(token=token, username=user["username"])


@app.get("/auth/me")
def me(user: sqlite3.Row = Depends(get_current_user)) -> dict[str, str]:
    return {"username": user["username"]}


@app.post("/auth/logout", status_code=204)
def logout(authorization: str | None = Header(default=None)) -> None:
    if authorization and authorization.startswith("Bearer "):
        db.delete_session(authorization.removeprefix("Bearer ").strip())


@app.post("/recommend", response_model=RecommendResponse)
def recommend_titles(payload: RecommendRequest) -> RecommendResponse:
    return recommend(payload.ratings, payload.mood)


@app.post("/recommend/zip", response_model=RecommendResponse)
async def recommend_titles_from_zip(
    mood: str = Form(""),
    file: UploadFile = File(...),
    user: sqlite3.Row = Depends(get_current_user),
) -> RecommendResponse:
    if not (file.filename or "").lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="Subí el .zip que exporta Letterboxd.")

    data = await file.read()
    if len(data) > MAX_ZIP_SIZE:
        raise HTTPException(status_code=400, detail="Ese zip es demasiado grande.")

    try:
        ratings, extra_seen = letterboxd_zip.parse_letterboxd_zip(data)
    except letterboxd_zip.ZipParseError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not ratings:
        raise HTTPException(
            status_code=400,
            detail="No encontré ratings ni reviews usables en ese zip.",
        )

    candidates = catalog.CATALOG
    if tmdb_client.is_configured():
        try:
            candidates = tmdb_client.fetch_candidates(mood)
        except tmdb_client.TmdbError:
            candidates = catalog.CATALOG

    response = recommend(ratings, mood, catalog=candidates, also_seen=frozenset(extra_seen))

    if llm_client.is_configured():
        try:
            response = llm_client.refine_recommendations(ratings, mood, response)
        except llm_client.LlmError:
            pass

    db.save_rated_items(
        user["id"], [(item.title, item.rating, item.review) for item in ratings]
    )
    inserted_ids = db.save_recommendations(
        user["id"],
        mood,
        [item.model_dump() for item in response.recommendations],
    )
    for item, new_id in zip(response.recommendations, inserted_ids):
        item.id = new_id

    return response


@app.post("/feedback", status_code=201)
def submit_feedback(
    payload: FeedbackRequest, user: sqlite3.Row = Depends(get_current_user)
) -> dict[str, str]:
    recommendation = db.get_recommendation(payload.recommendation_id, user["id"])
    if recommendation is None:
        raise HTTPException(status_code=404, detail="Recomendación no encontrada.")

    db.save_feedback(user["id"], payload.recommendation_id, payload.status)
    return {"status": "ok"}
